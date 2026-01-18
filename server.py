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


def load_stocks(csv_path="stocks.csv"):
    """Load stocks from CSV file."""
    import csv
    stocks = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            stocks.append({
                "ticker": row["ticker"],
                "name": row["name"],
                "sector": row["sector"],
                "history": [
                    float(row["price_5"]),
                    float(row["price_4"]),
                    float(row["price_3"]),
                    float(row["price_2"]),
                    float(row["price_1"]),
                ],
                "current_price": float(row["current_price"])
            })
    return stocks


def calculate_market_index(initial_prices: dict, current_prices: dict) -> float:
    """
    Calculate price-weighted market index (like Dow Jones).
    Returns index value starting at 100.
    """
    # Divisor is set so index starts at 100
    start_total = sum(initial_prices.values())
    current_total = sum(current_prices.values())
    
    if start_total == 0:
        return 100.0
    
    return 100.0 * (current_total / start_total)


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


async def run_simulation_streaming(num_ticks: int = 20, tick_delay: float = 1.0):
    """Run simulation and stream each tick to connected clients."""
    
    # Load stocks
    stock_data = load_stocks()
    tickers = [s["ticker"] for s in stock_data]
    initial_prices = {s["ticker"]: s["current_price"] for s in stock_data}
    stock_history = {s["ticker"]: s["history"] for s in stock_data}
    
    # Setup orchestrator
    orchestrator = SimulationOrchestrator()
    order_books = create_order_books(tickers, initial_prices, price_impact=0.0075, volatility=0.02)
    
    for ticker, book in order_books.items():
        orchestrator.register_stock(ticker, book)
    
    # Register agents
    orchestrator.register_agent("citadel", initial_cash=1000000.0)
    orchestrator.register_agent("jane_street", initial_cash=1000000.0)
    orchestrator.register_agent("blackrock", initial_cash=2000000.0)
    orchestrator.register_agent("vanguard", initial_cash=2000000.0)
    orchestrator.register_agent("retail_1", initial_cash=50000.0)
    orchestrator.register_agent("retail_2", initial_cash=50000.0)
    orchestrator.register_agent("retail_3", initial_cash=50000.0)
    orchestrator.register_agent("retail_4", initial_cash=50000.0)
    orchestrator.register_agent("retail_daytrader", initial_cash=50000.0)
    orchestrator.register_agent("my_agent", initial_cash=100000.0)  # Custom agent
    orchestrator.register_agent("market_maker", initial_cash=10000000.0)
    
    # Give starting shares
    for ticker in tickers:
        orchestrator._agent_portfolios["citadel"].positions[ticker] = 200
        orchestrator._agent_portfolios["jane_street"].positions[ticker] = 200
        orchestrator._agent_portfolios["blackrock"].positions[ticker] = 100
        orchestrator._agent_portfolios["vanguard"].positions[ticker] = 100
        orchestrator._agent_portfolios["retail_1"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_2"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_3"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_4"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_daytrader"].positions[ticker] = 10
        orchestrator._agent_portfolios["my_agent"].positions[ticker] = 50  # Custom agent
        orchestrator._agent_portfolios["market_maker"].positions[ticker] = 2000
    
    # Create agents
    MODEL = "google/gemini-2.0-flash-001"
    
    citadel = create_agent("citadel", orchestrator, "quant_institutional", MODEL, stock_history)
    jane_street = create_agent("jane_street", orchestrator, "quant_institutional", MODEL, stock_history)
    blackrock = create_agent("blackrock", orchestrator, "fundamental_institutional", MODEL, stock_history)
    vanguard = create_agent("vanguard", orchestrator, "fundamental_institutional", MODEL, stock_history)
    
    retail_1 = DumbRetailHolder("retail_1", orchestrator, stock_history)
    retail_2 = DumbRetailHolder("retail_2", orchestrator, stock_history)
    retail_3 = DumbRetailHolder("retail_3", orchestrator, stock_history)
    retail_4 = DumbRetailHolder("retail_4", orchestrator, stock_history)
    retail_daytrader = DumbRetailDaytrader("retail_daytrader", orchestrator, stock_history)
    
    # Custom agent
    my_agent = None
    if CUSTOM_AGENT_AVAILABLE:
        MY_STRATEGY = """
I am a SMART CONTRARIAN. I look for overreactions in the market.
- When a stock drops MORE than 5% below its historical average, I BUY (oversold)
- When a stock rises MORE than 5% above its historical average, I SELL (overbought)
- I use medium position sizes (10-20 shares)
- I'm patient and wait for clear opportunities
"""
        my_agent = create_custom_agent("my_agent", orchestrator, MY_STRATEGY, MODEL, stock_history)
    
    all_agents = ["citadel", "jane_street", "blackrock", "vanguard", 
                  "retail_1", "retail_2", "retail_3", "retail_4", "retail_daytrader", "my_agent"]
    
    # Calculate starting values
    start_values = {}
    for agent_id in all_agents:
        p = orchestrator.get_agent_portfolio(agent_id)
        total = p.cash + sum(p.positions.get(t, 0) * initial_prices[t] for t in tickers)
        start_values[agent_id] = total
    
    # Send simulation start
    await broadcast({"price": 100.0})
    
    SPREAD_PCT = 0.002
    MM_SIZE = 100
    
    # Run simulation
    for tick in range(num_ticks):
        print("\n" + "=" * 80)
        print(f"TICK {tick}")
        print("=" * 80)
        
        # Market Maker posts quotes
        for ticker in tickers:
            last_price = order_books[ticker].get_last_price()
            spread = last_price * SPREAD_PCT
            orchestrator.submit_order("market_maker", ticker, Side.BUY, round(last_price - spread/2, 2), MM_SIZE)
            orchestrator.submit_order("market_maker", ticker, Side.SELL, round(last_price + spread/2, 2), MM_SIZE)
        
        # LLM agents decide (institutional) - STREAM EVENTS IMMEDIATELY
        llm_agents = [
            (citadel, "CITADEL", "🏦"), (jane_street, "JANE STREET", "🏦"),
            (blackrock, "BLACKROCK", "📊"), (vanguard, "VANGUARD", "📊")
        ]
        for agent, name, emoji in llm_agents:
            print(f"\n[{emoji} {name} thinking...]")
            try:
                actions = agent.decide(tick)
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
                        await broadcast({"event": event})  # SEND IMMEDIATELY
                else:
                    print("  (no trades)")
            except Exception as e:
                print(f"  Error: {e}")
        
        # Dumb retail agents decide - STREAM EVENTS IMMEDIATELY
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
                        await broadcast({"event": event})  # SEND IMMEDIATELY
                    else:
                        print(f"  {action_text}")
            else:
                print("  (holding)")
        
        # Custom agent decides - STREAM EVENTS IMMEDIATELY
        if my_agent:
            print(f"\n[🎮 MY_AGENT thinking...]")
            try:
                actions = my_agent.decide(tick)
                trades = [a for a in actions if a.get("tool", {}).get("tool") in ["buy", "sell"]]
                if trades:
                    for action in trades:
                        tool = action["tool"].get("tool")
                        args = action["tool"].get("args", {})
                        ticker_sym = args.get('ticker', '?')
                        size = args.get('size', 0)
                        action_text = "BUYS" if tool == "buy" else "SELLS"
                        event = f"🎮 MY_AGENT {action_text} {size} {ticker_sym}"
                        print(f"  {event}")
                        await broadcast({"event": event})  # SEND IMMEDIATELY
                else:
                    print("  (no trades)")
            except Exception as e:
                print(f"  Error: {e}")
        
        # Execute tick
        tick_log = orchestrator.run_tick()
        
        # Get current prices
        current_prices = {ticker: order_books[ticker].get_last_price() for ticker in tickers}
        
        # Calculate market index (price-weighted, like Dow)
        market_index = calculate_market_index(initial_prices, current_prices)
        
        print(f"\n📈 Trades executed: {len(tick_log.trades)}")
        print(f"📊 Market Index: {market_index:.2f} ({market_index - 100:+.2f}%)")
        
        # BROADCAST: Price after all events
        await broadcast({"price": round(market_index, 2)})
        
        # Wait before next tick
        await asyncio.sleep(tick_delay)
    
    # Simulation complete
    print(f"\nFinal price: {market_index:.2f}")
    
    print("\n=== SIMULATION COMPLETE ===")


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
                    num_ticks = data.get("num_ticks", 20)
                    tick_delay = data.get("tick_delay", 1.0)
                    
                    if simulation_task is None or simulation_task.done():
                        simulation_task = asyncio.create_task(
                            run_simulation_streaming(num_ticks, tick_delay)
                        )
                        await websocket.send_json({
                            "type": "simulation_starting",
                            "num_ticks": num_ticks
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
async def start_simulation(num_ticks: int = 20, tick_delay: float = 1.0):
    """REST endpoint to start simulation (for testing)."""
    global simulation_task
    
    if simulation_task is not None and not simulation_task.done():
        return {"error": "Simulation already running"}
    
    simulation_task = asyncio.create_task(
        run_simulation_streaming(num_ticks, tick_delay)
    )
    
    return {"message": "Simulation started", "num_ticks": num_ticks}


if __name__ == "__main__":
    print("=" * 60)
    print("  🏛️  MARKET SIMULATION WebSocket API")
    print("=" * 60)
    print("\nEndpoints:")
    print("  WebSocket: ws://localhost:8000/ws")
    print("  Health:    http://localhost:8000/")
    print("  Start:     POST http://localhost:8000/start")
    print("\nTo start simulation, connect via WebSocket and send:")
    print('  {"command": "start_simulation", "num_ticks": 20, "tick_delay": 1.0}')
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
