"""
WebSocket API Server - Streams market simulation data in real-time.
"""

import asyncio
import json
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from orchestration import SimulationOrchestrator, Side
from order_book import create_order_books
from agents import create_agent, DumbRetailHolder, DumbRetailDaytrader
from news_events import NewsGenerator

# Try to import custom agent, but don't fail if it has issues
try:
    from custom_agent import create_custom_agent
    CUSTOM_AGENT_AVAILABLE = True
except:
    CUSTOM_AGENT_AVAILABLE = False


app = FastAPI(title="Market Simulation API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connected WebSocket clients
connected_clients: Set[WebSocket] = set()

# Global market state for chat context
current_market_state = {
    "market_index": 5500.0,
    "top_gainers": [],
    "top_losers": [],
    "tick": 0,
    "is_running": False,
}


def load_stocks(csv_path="stocks_sp500.csv"):
    """Load stocks from CSV file (S&P 500 data with 12 monthly prices)."""
    import csv
    from pathlib import Path
    
    # Get path relative to this file
    csv_full_path = Path(__file__).parent / csv_path
    
    stocks = []
    with open(csv_full_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Build history from 12 monthly prices (oldest to newest)
            history = []
            for i in range(12, 0, -1):
                price_key = f"price_{i}"
                if price_key in row:
                    history.append(float(row[price_key]))
            
            stocks.append({
                "ticker": row["ticker"],
                "name": row["name"],
                "sector": row["sector"],
                "history": history,  # 12 monthly prices
                "current_price": float(row["current_price"])
            })
    return stocks


def calculate_market_index(initial_prices: dict, current_prices: dict) -> float:
    """
    Calculate market-cap-weighted index (like S&P 500).
    Returns index value starting at 5500 (realistic S&P 500 range).
    """
    # Divisor is set so index starts at 5500
    start_total = sum(initial_prices.values())
    current_total = sum(current_prices.values())
    
    if start_total == 0:
        return 5500.0
    
    return 5500.0 * (current_total / start_total)


async def broadcast(message: dict):
    """Send message to all connected clients."""
    if not connected_clients:
        return
    
    message_json = json.dumps(message)
    disconnected = set()
    
    for client in connected_clients:
        try:
            await client.send_text(message_json)
        except:
            disconnected.add(client)
    
    # Remove disconnected clients
    for client in disconnected:
        connected_clients.discard(client)


async def run_simulation_streaming(
    num_ticks: int = 10, 
    tick_delay: float = 1.0,
    custom_agent_config: dict = None
):
    """Run simulation and stream each tick to connected clients.
    
    Args:
        num_ticks: Number of simulation ticks
        tick_delay: Delay between ticks in seconds
        custom_agent_config: Optional config for custom agent:
            - name: Display name for the agent
            - prompt: Custom system prompt for trading strategy
            - capital: Starting capital (default: 5000)
    """
    global current_market_state
    
    # Load stocks
    stock_data = load_stocks()
    tickers = [s["ticker"] for s in stock_data]
    initial_prices = {s["ticker"]: s["current_price"] for s in stock_data}
    stock_history = {s["ticker"]: s["history"] for s in stock_data}
    
    # Setup orchestrator
    orchestrator = SimulationOrchestrator()
    order_books = create_order_books(tickers, initial_prices, price_impact=0.001, volatility=0.04)
    
    # Log which stocks are winners/losers
    print("\n📊 Stock Trends for this simulation:")
    bulls = [t for t, b in order_books.items() if b._trend_bias > 0.005]
    bears = [t for t, b in order_books.items() if b._trend_bias < -0.005]
    neutral = [t for t, b in order_books.items() if -0.005 <= b._trend_bias <= 0.005]
    print(f"  📈 BULLISH ({len(bulls)}): {', '.join(bulls[:8])}{'...' if len(bulls) > 8 else ''}")
    print(f"  📉 BEARISH ({len(bears)}): {', '.join(bears[:8])}{'...' if len(bears) > 8 else ''}")
    print(f"  ➡️  NEUTRAL ({len(neutral)}): {', '.join(neutral[:5])}{'...' if len(neutral) > 5 else ''}")
    
    for ticker, book in order_books.items():
        orchestrator.register_stock(ticker, book)
    
    # Register agents
    orchestrator.register_agent("ccl", initial_cash=10000000.0)
    orchestrator.register_agent("jane_street", initial_cash=10000000.0)
    orchestrator.register_agent("blackrock", initial_cash=20000000.0)
    orchestrator.register_agent("vanguard", initial_cash=20000000.0)
    orchestrator.register_agent("retail_1", initial_cash=50000.0)
    orchestrator.register_agent("retail_2", initial_cash=50000.0)
    orchestrator.register_agent("retail_3", initial_cash=50000.0)
    orchestrator.register_agent("retail_4", initial_cash=50000.0)
    orchestrator.register_agent("retail_daytrader", initial_cash=50000.0)
    
    # Custom agent - use capital from config if provided, default to $100k
    custom_capital = 50000.0
    if custom_agent_config and custom_agent_config.get("capital"):
        custom_capital = float(custom_agent_config["capital"])
    orchestrator.register_agent("my_agent", initial_cash=custom_capital)
    print(f"   💰 Custom agent capital: ${custom_capital:,.0f}")
    
    orchestrator.register_agent("market_maker", initial_cash=10000000.0)
    
    # Categorize stocks by trend
    bullish_stocks = [t for t, b in order_books.items() if b._trend_bias > 0.003]
    bearish_stocks = [t for t, b in order_books.items() if b._trend_bias < -0.003]
    neutral_stocks = [t for t, b in order_books.items() if -0.003 <= b._trend_bias <= 0.003]
    
    # Give starting shares - institutions get ALL stocks
    for ticker in tickers:
        orchestrator._agent_portfolios["ccl"].positions[ticker] = 200
        orchestrator._agent_portfolios["jane_street"].positions[ticker] = 200
        orchestrator._agent_portfolios["blackrock"].positions[ticker] = 100
        orchestrator._agent_portfolios["vanguard"].positions[ticker] = 100
        orchestrator._agent_portfolios["market_maker"].positions[ticker] = 2000
    
    # Retail 1 & 2: Get BEARISH stocks (bad luck, will lose)
    for ticker in bearish_stocks[:15]:  # Up to 15 bearish stocks
        orchestrator._agent_portfolios["retail_1"].positions[ticker] = 15
        orchestrator._agent_portfolios["retail_2"].positions[ticker] = 15
    
    # Retail 3 & 4: Get BULLISH stocks (lucky, will win)
    for ticker in bullish_stocks[:15]:  # Up to 15 bullish stocks
        orchestrator._agent_portfolios["retail_3"].positions[ticker] = 15
        orchestrator._agent_portfolios["retail_4"].positions[ticker] = 15
    
    # Daytrader: Mixed bag (random outcome)
    import random
    mixed_stocks = random.sample(tickers, min(20, len(tickers)))
    for ticker in mixed_stocks:
        orchestrator._agent_portfolios["retail_daytrader"].positions[ticker] = 10
    
    # Custom agent: Gets balanced mix
    for ticker in (bullish_stocks[:8] + bearish_stocks[:8] + neutral_stocks[:4]):
        orchestrator._agent_portfolios["my_agent"].positions[ticker] = 25
    
    print(f"\n👥 Retail Stock Assignments:")
    print(f"  📉 Retail 1 & 2: {len(bearish_stocks[:15])} bearish stocks (will likely LOSE)")
    print(f"  📈 Retail 3 & 4: {len(bullish_stocks[:15])} bullish stocks (will likely WIN)")
    print(f"  🎲 Daytrader: {len(mixed_stocks)} mixed stocks (random)")
    print(f"  🎮 Your Agent: balanced mix")
    
    # Create agents
    MODEL = "google/gemini-2.0-flash-001"
    
    ccl = create_agent("ccl", orchestrator, "quant_institutional", MODEL, stock_history)
    jane_street = create_agent("jane_street", orchestrator, "quant_institutional", MODEL, stock_history)
    blackrock = create_agent("blackrock", orchestrator, "fundamental_institutional", MODEL, stock_history)
    vanguard = create_agent("vanguard", orchestrator, "fundamental_institutional", MODEL, stock_history)
    
    retail_1 = DumbRetailHolder("retail_1", orchestrator, stock_history)
    retail_2 = DumbRetailHolder("retail_2", orchestrator, stock_history)
    retail_3 = DumbRetailHolder("retail_3", orchestrator, stock_history)
    retail_4 = DumbRetailHolder("retail_4", orchestrator, stock_history)
    retail_daytrader = DumbRetailDaytrader("retail_daytrader", orchestrator, stock_history)
    
    # Custom agent - use config if provided, otherwise default strategy
    my_agent = None
    my_agent_name = "MY_AGENT"  # Default name
    
    if CUSTOM_AGENT_AVAILABLE:
        if custom_agent_config and custom_agent_config.get("prompt"):
            # User provided custom strategy
            MY_STRATEGY = custom_agent_config["prompt"]
            my_agent_name = custom_agent_config.get("name", "MY_AGENT").upper()
            print(f"\n🎮 Creating custom agent: {my_agent_name}")
            print(f"   Strategy: {MY_STRATEGY[:100]}...")
        else:
            # Default strategy
            MY_STRATEGY = """
I am a SMART CONTRARIAN. I look for overreactions in the market.
- When a stock drops MORE than 5% below its historical average, I BUY (oversold)
- When a stock rises MORE than 5% above its historical average, I SELL (overbought)
- I use medium position sizes (10-20 shares)
- I'm patient and wait for clear opportunities
"""
        my_agent = create_custom_agent("my_agent", orchestrator, MY_STRATEGY, MODEL, stock_history)
    
    all_agents = ["ccl", "jane_street", "blackrock", "vanguard", 
                  "retail_1", "retail_2", "retail_3", "retail_4", "retail_daytrader", "my_agent"]
    
    # Calculate starting values
    start_values = {}
    for agent_id in all_agents:
        p = orchestrator.get_agent_portfolio(agent_id)
        total = p.cash + sum(p.positions.get(t, 0) * initial_prices[t] for t in tickers)
        start_values[agent_id] = total
    
    # Send simulation start
    await broadcast({"price": 5500.0})
    
    # Initialize news generator
    news_generator = NewsGenerator(tickers, news_probability=0.85)  # 85% chance per tick (very frequent - lots of news!)
    
    SPREAD_PCT = 0.002
    MM_SIZE = 100
    
    # Run simulation
    for tick in range(num_ticks):
        print("\n" + "=" * 80)
        print(f"TICK {tick}")
        print("=" * 80)
        
        # Apply random price fluctuations to ALL stocks at start of tick
        # This simulates natural market movement (other traders, sentiment, macro events)
        
        # Random bear market crash with extremely low probability (0.1% chance per tick, but only after tick 1)
        is_crash_tick = (tick > 1 and random.random() < 0.001)  # 0.1% chance after first tick
        
        if is_crash_tick:
            print("\n🐻 BEAR MARKET DAY! 📉")
            await broadcast({
                "type": "news",
                "headline": "🐻 Markets tumble on recession fears",
                "stock": "ALL",
                "sentiment": "negative",
                "tick": tick
            })
            await asyncio.sleep(0.3)
        else:
            print("\n📊 Market Movement:")
        
        big_movers = []
        for ticker in tickers:
            if is_crash_tick:
                # Bear day - 8-18% down
                import random
                crash_pct = random.uniform(-0.18, -0.08)
                order_books[ticker]._last_price *= (1 + crash_pct)
                pct_change = crash_pct * 100
            else:
                # Normal volatility - BULLISH bias (70% stocks trending up)
                pct_change = order_books[ticker].apply_tick_volatility(base_volatility=0.03)
            
            if abs(pct_change) > 1.0:  # Only log big moves (>1%)
                direction = "📈" if pct_change > 0 else "📉"
                big_movers.append(f"  {direction} {ticker}: {pct_change:+.1f}%")
        
        if big_movers:
            for mover in big_movers[:5]:  # Show top 5 big movers
                print(mover)
        else:
            print("  (quiet market)")
        
        # Market Maker posts quotes first
        for ticker in tickers:
            last_price = order_books[ticker].get_last_price()
            spread = last_price * SPREAD_PCT
            orchestrator.submit_order("market_maker", ticker, Side.BUY, round(last_price - spread/2, 2), MM_SIZE)
            orchestrator.submit_order("market_maker", ticker, Side.SELL, round(last_price + spread/2, 2), MM_SIZE)
        
        # Generate news event RIGHT BEFORE agents start (guaranteed on tick 0, higher chance after)
        if tick == 0:
            # Force news on first tick for dramatic opening
            old_prob = news_generator.news_probability
            news_generator.news_probability = 1.0
            news_event = news_generator.maybe_generate_news(tick)
            news_generator.news_probability = old_prob
            print(f"   🎯 Tick 0 forced news: {news_event}")
        else:
            # Increased probability for more frequent news
            news_event = news_generator.maybe_generate_news(tick)
            print(f"   🎲 Random news check: {news_event is not None}")
        
        if news_event:
            print(f"\n📰 NEWS: {news_event.headline}")
            print(f"   Stock: {news_event.stock}, Sentiment: {'📈' if news_event.sentiment > 0 else '📉'}")
            
            # Broadcast news to frontend IMMEDIATELY
            news_payload = {
                "type": "news",
                "headline": news_event.headline,
                "stock": news_event.stock,
                "sentiment": "positive" if news_event.sentiment > 0 else "negative",
                "tick": tick
            }
            print(f"   📡 Broadcasting news: {news_payload}")
            await broadcast(news_payload)
            await asyncio.sleep(0.5)  # Longer pause so news REALLY stands out
            
            # Apply immediate price impact from news
            impact = news_event.sentiment * news_event.magnitude * 0.03  # Up to 3% move
            old_price = order_books[news_event.stock].get_last_price()
            order_books[news_event.stock]._last_price *= (1 + impact)
            new_price = order_books[news_event.stock].get_last_price()
            print(f"   Price impact: ${old_price:.2f} → ${new_price:.2f} ({impact*100:+.1f}%)")
        
        # Prepare news dict for agents (if news happened this tick)
        current_news = None
        if news_event:
            current_news = {
                "headline": news_event.headline,
                "stock": news_event.stock,
                "sentiment": "positive" if news_event.sentiment > 0 else "negative",
            }
        
        # LLM agents decide (institutional) - STREAM EVENTS IMMEDIATELY
        # Quants see news IMMEDIATELY, fundamentals see it 1 tick later
        llm_agents = [
            (ccl, "CCL", "🏦", "quant"), (jane_street, "JANE STREET", "🏦", "quant"),
            (blackrock, "BLACKROCK", "📊", "fundamental"), (vanguard, "VANGUARD", "📊", "fundamental")
        ]
        for agent, name, emoji, agent_type in llm_agents:
            print(f"\n[{emoji} {name} thinking...]")
            try:
                # Quants see news immediately, fundamentals don't (they analyze first)
                news_for_agent = current_news if agent_type == "quant" else None
                if news_for_agent:
                    print(f"  📰 {name} sees breaking news about {news_for_agent['stock']}!")
                
                actions = agent.decide(tick, news=news_for_agent)
                trades = [a for a in actions if a.get("tool", {}).get("tool") in ["buy", "sell"]]
                if trades:
                    for action in trades:
                        tool = action["tool"].get("tool")
                        args = action["tool"].get("args", {})
                        ticker_sym = args.get('ticker', '?')
                        size = args.get('size', 0)
                        action_text = "BUYS" if tool == "buy" else "SELLS"
                        event = f"{emoji} {name} {action_text} {size} {ticker_sym}"
                        print(f"  {event}")
                        await broadcast({"event": event})
                        await asyncio.sleep(0.1)  # Small delay between events
                else:
                    print("  (no trades)")
            except Exception as e:
                print(f"  Error: {e}")
        
        # Dumb retail agents decide - STREAM EVENTS WITH DELAY
        retail_agents = [
            (retail_1, "RETAIL_1", "👤"), (retail_2, "RETAIL_2", "👤"),
            (retail_3, "RETAIL_3", "👤"), (retail_4, "RETAIL_4", "👤"),
            (retail_daytrader, "DAYTRADER", "🎰")
        ]
        for agent, name, emoji in retail_agents:
            print(f"\n[{emoji} {name} trading...]")
            actions = agent.decide(tick)
            if actions:
                for action in actions:
                    action_text = action.get('action', str(action))
                    # Extract trade events (not fees)
                    if "BUY" in action_text.upper() or "SELL" in action_text.upper():
                        event = f"{emoji} {name} {action_text}"
                        print(f"  {action_text}")
                        await broadcast({"event": event})
                        await asyncio.sleep(0.15)  # Delay to match console pace
                    else:
                        print(f"  {action_text}")
            else:
                print("  (holding)")
        
        # Custom agent decides - STREAM EVENTS WITH DELAY
        # Custom agent sees news (like retail, slight delay but still sees it)
        if my_agent:
            print(f"\n[🎮 {my_agent_name} thinking...]")
            try:
                # Custom agents see news (so users can see their agent react)
                if current_news:
                    print(f"  📰 {my_agent_name} sees breaking news about {current_news['stock']}!")
                actions = my_agent.decide(tick, news=current_news)
                trades = [a for a in actions if a.get("tool", {}).get("tool") in ["buy", "sell"]]
                if trades:
                    for action in trades:
                        tool = action["tool"].get("tool")
                        args = action["tool"].get("args", {})
                        ticker_sym = args.get('ticker', '?')
                        size = args.get('size', 0)
                        action_text = "BUYS" if tool == "buy" else "SELLS"
                        event = f"🎮 {my_agent_name} {action_text} {size} {ticker_sym}"
                        print(f"  {event}")
                        await broadcast({"event": event})
                        await asyncio.sleep(0.1)  # Small delay between events
                else:
                    print("  (no trades)")
            except Exception as e:
                print(f"  Error: {e}")
        
        # Execute tick
        tick_log = orchestrator.run_tick()
        
        # Get current prices
        current_prices = {ticker: order_books[ticker].get_last_price() for ticker in tickers}
        
        # Calculate market index (market-cap-weighted, like S&P 500)
        market_index = calculate_market_index(initial_prices, current_prices)
        
        print(f"\n📈 Trades executed: {len(tick_log.trades)}")
        print(f"📊 Market Index: {market_index:.2f} ({market_index - 5500:+.2f})")
        
        # Calculate portfolio values for all agents
        portfolio_values = {}
        for agent_id in all_agents:
            p = orchestrator.get_agent_portfolio(agent_id)
            if p:
                # Portfolio value = cash + market value of all positions
                stock_value = sum(p.positions.get(t, 0) * current_prices.get(t, 0) for t in tickers)
                total_value = p.cash + stock_value
                start_val = start_values.get(agent_id, total_value)
                pnl_pct = ((total_value - start_val) / start_val) * 100 if start_val > 0 else 0
                portfolio_values[agent_id] = {
                    "value": round(total_value, 2),
                    "pnl": round(total_value - start_val, 2),
                    "pnl_pct": round(pnl_pct, 2)
                }
        
        # Calculate top movers (gainers and losers)
        all_movers = []
        for ticker in tickers:
            curr_price = current_prices[ticker]
            init_price = initial_prices[ticker]
            pct_change = ((curr_price - init_price) / init_price) * 100
            all_movers.append({
                "ticker": ticker,
                "price": round(curr_price, 2),
                "change": round(pct_change, 2)
            })
        
        # Sort and get top 5 gainers and losers
        gainers = sorted([m for m in all_movers if m["change"] > 0], key=lambda x: -x["change"])[:5]
        losers = sorted([m for m in all_movers if m["change"] < 0], key=lambda x: x["change"])[:5]
        
        # Update global market state for chat context
        current_market_state = {
            "market_index": round(market_index, 2),
            "top_gainers": gainers[:5],
            "top_losers": losers[:5],
            "tick": tick + 1,  # 1-indexed for display
            "is_running": True,
        }
        
        # BROADCAST: Price, tick, portfolio values, and top movers
        await broadcast({
            "price": round(market_index, 2), 
            "tick": tick,
            "portfolios": portfolio_values,
            "top_gainers": gainers,
            "top_losers": losers
        })
        
        # Wait before next tick
        await asyncio.sleep(tick_delay)
    
    # Simulation complete - calculate final P&L for all agents
    print(f"\nFinal price: {market_index:.2f}")
    
    final_results = []
    agent_display_names = {
        "ccl": "CCL",
        "jane_street": "Jane Street",
        "blackrock": "BlackRock",
        "vanguard": "Vanguard",
        "retail_1": "Retail Holder 1",
        "retail_2": "Retail Holder 2",
        "retail_3": "Retail Holder 3",
        "retail_4": "Retail Holder 4",
        "retail_daytrader": "Retail Daytrader",
        "my_agent": my_agent_name,
    }
    agent_types = {
        "ccl": "quant", "jane_street": "quant",
        "blackrock": "institutional", "vanguard": "institutional",
        "retail_1": "retail", "retail_2": "retail",
        "retail_3": "retail", "retail_4": "retail",
        "retail_daytrader": "retail",
        "my_agent": "custom",
    }
    
    for agent_id in all_agents:
        p = orchestrator.get_agent_portfolio(agent_id)
        final_value = p.cash + sum(p.positions.get(t, 0) * current_prices[t] for t in tickers)
        start_value = start_values[agent_id]
        pnl = final_value - start_value
        pnl_pct = (pnl / start_value) * 100 if start_value > 0 else 0
        
        final_results.append({
            "id": agent_id,
            "name": agent_display_names.get(agent_id, agent_id),
            "type": agent_types.get(agent_id, "unknown"),
            "start_value": round(start_value, 2),
            "final_value": round(final_value, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
        })
    
    # Sort by weighted profit score that favors large capital agents
    # Formula: profit + (starting_capital * 0.0001) ensures large firms always win
    # This means a $10M firm gets a $1k bonus, making it nearly impossible for retailers to beat them
    def get_weighted_score(result):
        return result["pnl"] + (result["start_value"] * 0.0001)
    
    final_results.sort(key=get_weighted_score, reverse=True)
    
    # Add ranks
    for i, result in enumerate(final_results):
        result["rank"] = i + 1
    
    # Update global state - simulation ended
    current_market_state["is_running"] = False
    
    # Broadcast simulation complete with results
    await broadcast({
        "type": "simulation_complete",
        "market_index": round(market_index, 2),
        "leaderboard": final_results,
    })
    
    print("\n=== SIMULATION COMPLETE ===")
    print("🏆 LEADERBOARD:")
    for r in final_results:
        print(f"  #{r['rank']} {r['name']}: {r['pnl_pct']:+.2f}% (${r['pnl']:+,.2f})")


# Store the simulation task
simulation_task = None


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for streaming market data."""
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"Client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to Market Simulation API"
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
                
                # Handle client commands
                if data.get("command") == "start_simulation":
                    global simulation_task
                    num_ticks = data.get("num_ticks", 10)
                    tick_delay = data.get("tick_delay", 1.0)
                    
                    # Extract custom agent config if provided
                    custom_agent_config = data.get("custom_agent")
                    # custom_agent format: {"name": "My Bot", "prompt": "I am a momentum trader..."}
                    
                    if simulation_task is None or simulation_task.done():
                        simulation_task = asyncio.create_task(
                            run_simulation_streaming(num_ticks, tick_delay, custom_agent_config)
                        )
                        await websocket.send_json({
                            "type": "simulation_starting",
                            "num_ticks": num_ticks,
                            "custom_agent": custom_agent_config.get("name") if custom_agent_config else None
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Simulation already running"
                        })
                        
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_json({"type": "ping"})
                
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Market Simulation WebSocket API",
        "websocket_url": "/ws",
        "connected_clients": len(connected_clients)
    }


@app.post("/start")
async def start_simulation(num_ticks: int = 10, tick_delay: float = 1.0):
    """REST endpoint to start simulation (for testing)."""
    global simulation_task
    
    if simulation_task is not None and not simulation_task.done():
        return {"error": "Simulation already running"}
    
    simulation_task = asyncio.create_task(
        run_simulation_streaming(num_ticks, tick_delay)
    )
    
    return {"message": "Simulation started", "num_ticks": num_ticks}


# ============================================
# CHAT API ENDPOINT (Gemini-powered Trading Consultant)
# ============================================

import requests as http_requests
from pydantic import BaseModel
from typing import Optional, List

# Gemini API key and client
GEMINI_API_KEY = "AIzaSyDKFwcogxxhLuqOo7syAYSSqVqnGDi2A6A"

# Initialize Gemini client for chatbot ONLY (agents use OpenRouter)
try:
    from google import genai
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    GEMINI_AVAILABLE = True
    print("✅ Chatbot using Gemini API (gemini-3-flash-preview)")
except Exception as e:
    print(f"⚠️  Gemini client initialization failed: {e}")
    print("   Falling back to OpenRouter for chat")
    gemini_client = None
    GEMINI_AVAILABLE = False

# Trading consultant system prompt
TRADING_CONSULTANT_PROMPT = """You are a trading consultant AI in a STOCK MARKET SIMULATION GAME. This is NOT real money - it's a fun educational game where users compete against AI trading agents.

Your role:
- Help users understand what's happening in the simulated market
- Explain which stocks are up/down and why that might be
- Give trading tips and strategies for the GAME
- Be enthusiastic and engaging like a sports commentator
- Comment on how the AI agents (CCL, Jane Street, BlackRock, etc.) are performing

IMPORTANT: This is a GAME with FAKE money. No financial disclaimers needed! Be direct, give opinions, make predictions, have fun with it. You can say things like "I'd buy AAPL here" or "That's a risky move" - it's all simulated.

Keep responses concise and punchy. Use emojis occasionally. Be like a helpful co-pilot in a trading game."""

class ChatMessageInput(BaseModel):
    message: str
    history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    message: str


# ============================================
# CHATBOT TOOLS - Functions Gemini can call
# ============================================

def get_market_overview() -> dict:
    """Get current market index and overall status."""
    return {
        "market_index": current_market_state["market_index"],
        "change_from_start": round(current_market_state["market_index"] - 5500, 2),
        "day": current_market_state["tick"],
        "is_running": current_market_state["is_running"],
        "status": "Simulation Running" if current_market_state["is_running"] else "Simulation Complete"
    }

def get_top_gainers() -> list:
    """Get the top performing stocks (biggest gainers)."""
    return current_market_state["top_gainers"]

def get_top_losers() -> list:
    """Get the worst performing stocks (biggest losers)."""
    return current_market_state["top_losers"]

def get_stock_price(ticker: str) -> dict:
    """Get current price and change for a specific stock ticker."""
    ticker = ticker.upper()
    # Check gainers
    for stock in current_market_state["top_gainers"]:
        if stock["ticker"] == ticker:
            return {"ticker": ticker, "price": stock["price"], "change_pct": stock["change"], "status": "gainer"}
    # Check losers
    for stock in current_market_state["top_losers"]:
        if stock["ticker"] == ticker:
            return {"ticker": ticker, "price": stock["price"], "change_pct": stock["change"], "status": "loser"}
    return {"ticker": ticker, "error": "Stock not in top movers. Try get_top_gainers or get_top_losers to see available stocks."}


# Tool definitions for Gemini
CHAT_TOOLS = [
    {
        "name": "get_market_overview",
        "description": "Get the current market index value, what day we're on, and whether the simulation is running.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_top_gainers",
        "description": "Get a list of the top 5 best performing stocks with their prices and percentage gains.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_top_losers",
        "description": "Get a list of the top 5 worst performing stocks with their prices and percentage losses.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_stock_price",
        "description": "Get the current price and change percentage for a specific stock ticker.",
        "parameters": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Stock ticker symbol (e.g., AAPL, MSFT)"}
            },
            "required": ["ticker"]
        }
    }
]

# Map tool names to functions
TOOL_FUNCTIONS = {
    "get_market_overview": get_market_overview,
    "get_top_gainers": get_top_gainers,
    "get_top_losers": get_top_losers,
    "get_stock_price": get_stock_price,
}


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatMessageInput):
    """Chat with the Gemini-powered trading consultant with market data access."""
    
    try:
        # Build market data context
        market_data = f"""
=== CURRENT MARKET DATA (Day {current_market_state['tick']}) ===
Market Index: {current_market_state['market_index']} ({'Up' if current_market_state['market_index'] > 5500 else 'Down'} from starting value of 5500)
Status: {'Simulation Running' if current_market_state['is_running'] else 'Simulation Complete'}

TOP GAINERS:
"""
        for g in current_market_state.get("top_gainers", [])[:5]:
            market_data += f"  {g['ticker']}: ${g['price']:.2f} (+{g['change']:.1f}%)\n"
        
        market_data += "\nTOP LOSERS:\n"
        for l in current_market_state.get("top_losers", [])[:5]:
            market_data += f"  {l['ticker']}: ${l['price']:.2f} ({l['change']:.1f}%)\n"
        
        # Full system prompt with live data
        full_prompt = TRADING_CONSULTANT_PROMPT + "\n\n" + market_data
        
        if GEMINI_AVAILABLE and gemini_client:
            try:
                # Build conversation
                conversation = ""
                if request.history:
                    for msg in request.history[-6:]:
                        role = "User" if msg.get("role") == "user" else "Assistant"
                        conversation += f"{role}: {msg.get('content', '')}\n\n"
                
                user_prompt = f"{conversation}User: {request.message}\n\nAssistant:"
                
                response = gemini_client.models.generate_content(
                    model="gemini-3-flash-preview",
                    contents=user_prompt,
                    config={"system_instruction": full_prompt}
                )
                reply = response.text if hasattr(response, 'text') else str(response)
            except Exception as gemini_error:
                print(f"⚠️  Gemini API call failed: {gemini_error}")
                # Fall through to OpenRouter fallback
                reply = None
        else:
            reply = None
                
        # Fallback to OpenRouter if Gemini failed or unavailable
        if not reply:
            try:
                from agents import TradingAgent
                api_key = TradingAgent.API_KEY
                base_url = "https://openrouter.ai/api/v1/chat/completions"
                
                # Include market context in prompt for fallback
                market_context = f"\nCurrent market: Index={current_market_state['market_index']}, Day={current_market_state['tick']}"
                
                # Build messages with history
                messages_list = [{"role": "system", "content": TRADING_CONSULTANT_PROMPT + market_context}]
                if request.history:
                    for msg in request.history[-6:]:
                        messages_list.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
                messages_list.append({"role": "user", "content": request.message})
                
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost",
                }
                
                payload = {
                    "model": "google/gemini-2.0-flash-001",
                    "messages": messages_list,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                }
                response = http_requests.post(base_url, headers=headers, json=payload, timeout=30)
                
                if response.ok:
                    data = response.json()
                    reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                else:
                    print(f"⚠️  OpenRouter API error: {response.status_code} - {response.text}")
                    reply = "Sorry, I encountered an error. Please try again."
            except Exception as openrouter_error:
                print(f"⚠️  OpenRouter fallback failed: {openrouter_error}")
                reply = "Sorry, I'm having trouble connecting to the AI service. Please try again in a moment."
        
        return ChatResponse(message=reply or "I'm not sure how to respond to that. Could you rephrase?")
        
    except Exception as e:
        import traceback
        print(f"❌ Chat API error: {e}")
        traceback.print_exc()
        return ChatResponse(message="Sorry, I'm having trouble connecting. Please try again in a moment.")


if __name__ == "__main__":
    print("=" * 60)
    print("  🏛️  MARKET SIMULATION WebSocket API")
    print("=" * 60)
    print("\nEndpoints:")
    print("  WebSocket: ws://localhost:8000/ws")
    print("  Health:    http://localhost:8000/")
    print("  Start:     POST http://localhost:8000/start")
    print("  Chat:      POST http://localhost:8000/api/chat")
    print("\nTo start simulation, connect via WebSocket and send:")
    print('  {"command": "start_simulation", "num_ticks": 10, "tick_delay": 1.0}')
    print("\nWith custom agent:")
    print('  {')
    print('    "command": "start_simulation",')
    print('    "num_ticks": 10,')
    print('    "custom_agent": {')
    print('      "name": "My Bot",')
    print('      "prompt": "I am a momentum trader who buys stocks going up..."')
    print('    }')
    print('  }')
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
