"""
Demo: Wall Street Simulator - Institutions vs Retail vs YOUR Custom Agent!
"""

import csv
from orchestration import SimulationOrchestrator, Side
from order_book import create_order_books
from agents import create_agent, DumbRetailHolder, DumbRetailDaytrader
from custom_agent import create_custom_agent, EXAMPLE_STRATEGIES


# =============================================================================
# 🎮 CUSTOMIZE YOUR AGENT HERE! 🎮
# =============================================================================
# Write your own trading strategy or use one of the examples:
# - EXAMPLE_STRATEGIES["contrarian"]
# - EXAMPLE_STRATEGIES["momentum"] 
# - EXAMPLE_STRATEGIES["value_hunter"]
# - EXAMPLE_STRATEGIES["sector_rotator"]
# - EXAMPLE_STRATEGIES["yolo"]

MY_STRATEGY = """
I am a SMART CONTRARIAN. I look for overreactions in the market.
- When a stock drops MORE than 5% below its historical average, I BUY (oversold)
- When a stock rises MORE than 5% above its historical average, I SELL (overbought)
- I use medium position sizes (10-20 shares)
- I'm patient and wait for clear opportunities
- I diversify across multiple stocks
"""

# Set to True to enable your custom agent in the simulation
ENABLE_CUSTOM_AGENT = True
CUSTOM_AGENT_CASH = 100000.0  # Starting cash for your agent
CUSTOM_AGENT_SHARES = 50     # Starting shares per stock


def load_stocks(csv_path="stocks_sp500.csv"):
    """Load stocks from CSV file (S&P 500 data with 12 monthly prices)."""
    from pathlib import Path
    
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


def run_simulation():
    print("\n" + "=" * 80)
    print("  🏛️  WALL STREET SIMULATOR: Institutions vs Retail  🏛️")
    print("=" * 80)
    
    # Load all 30 stocks
    stock_data = load_stocks()
    tickers = [s["ticker"] for s in stock_data]
    initial_prices = {s["ticker"]: s["current_price"] for s in stock_data}
    stock_history = {s["ticker"]: s["history"] for s in stock_data}
    
    print(f"\nStocks in play:")
    for s in stock_data:
        hist = s["history"]
        avg = sum(hist) / len(hist)
        trend = "📈 UP" if s["current_price"] > avg else "📉 DOWN"
        pct = ((s["current_price"] - hist[0]) / hist[0]) * 100
        print(f"  {s['ticker']}: ${s['current_price']:.2f} ({pct:+.1f}%) {trend}")
    
    # Setup orchestrator: price impact + 2% volatility for bigger swings
    orchestrator = SimulationOrchestrator()
    order_books = create_order_books(tickers, initial_prices, price_impact=0.0075, volatility=0.02)
    
    for ticker, book in order_books.items():
        orchestrator.register_stock(ticker, book)
    
    # Register agents
    # Quant hedge funds (the smart money)
    orchestrator.register_agent("citadel", initial_cash=1000000.0)
    orchestrator.register_agent("jane_street", initial_cash=1000000.0)
    # Fundamental asset managers (patient money)
    orchestrator.register_agent("blackrock", initial_cash=2000000.0)
    orchestrator.register_agent("vanguard", initial_cash=2000000.0)
    # Retail traders (dumb money)
    orchestrator.register_agent("retail_holder_1", initial_cash=50000.0)
    orchestrator.register_agent("retail_holder_2", initial_cash=50000.0)
    orchestrator.register_agent("retail_holder_3", initial_cash=50000.0)
    orchestrator.register_agent("retail_holder_4", initial_cash=50000.0)
    orchestrator.register_agent("retail_daytrader", initial_cash=50000.0)
    # Custom agent (YOUR agent!)
    if ENABLE_CUSTOM_AGENT:
        orchestrator.register_agent("my_agent", initial_cash=CUSTOM_AGENT_CASH)
    # Market maker
    orchestrator.register_agent("market_maker", initial_cash=10000000.0)
    
    # Give starting shares
    for ticker in tickers:
        # Quants - big positions
        orchestrator._agent_portfolios["citadel"].positions[ticker] = 200
        orchestrator._agent_portfolios["jane_street"].positions[ticker] = 200
        # Fundamentals - medium positions
        orchestrator._agent_portfolios["blackrock"].positions[ticker] = 100
        orchestrator._agent_portfolios["vanguard"].positions[ticker] = 100
        # Retail - tiny positions
        orchestrator._agent_portfolios["retail_holder_1"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_holder_2"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_holder_3"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_holder_4"].positions[ticker] = 10
        orchestrator._agent_portfolios["retail_daytrader"].positions[ticker] = 10
        # Custom agent
        if ENABLE_CUSTOM_AGENT:
            orchestrator._agent_portfolios["my_agent"].positions[ticker] = CUSTOM_AGENT_SHARES
        # Market maker
        orchestrator._agent_portfolios["market_maker"].positions[ticker] = 2000
    
    # Create agents
    print("\nCreating agents...")
    MODEL = "google/gemini-2.0-flash-001"
    
    # LLM agents (institutional)
    citadel = create_agent("citadel", orchestrator, "quant_institutional", MODEL, stock_history)
    jane_street = create_agent("jane_street", orchestrator, "quant_institutional", MODEL, stock_history)
    blackrock = create_agent("blackrock", orchestrator, "fundamental_institutional", MODEL, stock_history)
    vanguard = create_agent("vanguard", orchestrator, "fundamental_institutional", MODEL, stock_history)
    
    # Dumb retail agents
    retail_holder_1 = DumbRetailHolder("retail_holder_1", orchestrator, stock_history)
    retail_holder_2 = DumbRetailHolder("retail_holder_2", orchestrator, stock_history)
    retail_holder_3 = DumbRetailHolder("retail_holder_3", orchestrator, stock_history)
    retail_holder_4 = DumbRetailHolder("retail_holder_4", orchestrator, stock_history)
    retail_daytrader = DumbRetailDaytrader("retail_daytrader", orchestrator, stock_history)
    
    # Custom agent (YOUR agent!)
    my_agent = None
    if ENABLE_CUSTOM_AGENT:
        my_agent = create_custom_agent("my_agent", orchestrator, MY_STRATEGY, MODEL, stock_history)
    
    print(f"  🏦 CITADEL & JANE STREET: Quant algos, $1M each")
    print(f"  📊 BLACKROCK & VANGUARD: Patient value investors, $2M each")
    print(f"  👤 RETAIL_HOLDER x4: Conservative dumb retail, $50k each")
    print(f"  🎰 RETAIL_DAYTRADER: Aggressive dumb retail, $50k")
    if ENABLE_CUSTOM_AGENT:
        print(f"  🎮 MY_AGENT: YOUR custom strategy, ${CUSTOM_AGENT_CASH:,.0f}")
    
    # Calculate starting values
    all_agents = ["citadel", "jane_street", "blackrock", "vanguard",
                  "retail_holder_1", "retail_holder_2", "retail_holder_3", "retail_holder_4", "retail_daytrader"]
    if ENABLE_CUSTOM_AGENT:
        all_agents.append("my_agent")
    start_values = {}
    for agent_id in all_agents:
        p = orchestrator.get_agent_portfolio(agent_id)
        total = p.cash + sum(p.positions.get(t, 0) * initial_prices[t] for t in tickers)
        start_values[agent_id] = total
    
    SPREAD_PCT = 0.002
    MM_SIZE = 100
    
    # Run simulation
    for tick in range(5):
        print("\n" + "=" * 80)
        print(f"TICK {tick}")
        print("=" * 80)
        
        # Market Maker posts quotes
        for ticker in tickers:
            last_price = order_books[ticker].get_last_price()
            spread = last_price * SPREAD_PCT
            orchestrator.submit_order("market_maker", ticker, Side.BUY, round(last_price - spread/2, 2), MM_SIZE)
            orchestrator.submit_order("market_maker", ticker, Side.SELL, round(last_price + spread/2, 2), MM_SIZE)
        
        # LLM agents decide (institutional)
        llm_agents = [
            (citadel, "CITADEL", "🏦"), (jane_street, "JANE STREET", "🏦"),
            (blackrock, "BLACKROCK", "📊"), (vanguard, "VANGUARD", "📊")
        ]
        for agent, name, emoji in llm_agents:
            print(f"\n[{emoji} {name} thinking...]")
            actions = agent.decide(tick)
            
            trades = [a for a in actions if a.get("tool", {}).get("tool") in ["buy", "sell"]]
            if trades:
                for action in trades:
                    tool = action["tool"].get("tool")
                    args = action["tool"].get("args", {})
                    result = action["result"]
                    print(f"  {tool.upper()} {args.get('ticker')} x{args.get('size')} -> {result.get('message', result)}")
            else:
                print("  (no trades)")
        
        # Dumb retail agents decide
        retail_agents = [
            (retail_holder_1, "RETAIL_1", "👤"), (retail_holder_2, "RETAIL_2", "👤"),
            (retail_holder_3, "RETAIL_3", "👤"), (retail_holder_4, "RETAIL_4", "👤"),
            (retail_daytrader, "DAYTRADER", "🎰")
        ]
        for agent, name, emoji in retail_agents:
            print(f"\n[{emoji} {name} trading...]")
            actions = agent.decide(tick)
            if actions:
                for action in actions:
                    print(f"  {action.get('action', action)}")
            else:
                print("  (holding)")
        
        # Custom agent decides (YOUR agent!)
        if ENABLE_CUSTOM_AGENT and my_agent:
            print(f"\n[🎮 MY_AGENT thinking...]")
            actions = my_agent.decide(tick)
            trades = [a for a in actions if a.get("tool", {}).get("tool") in ["buy", "sell"]]
            if trades:
                for action in trades:
                    tool = action["tool"].get("tool")
                    args = action["tool"].get("args", {})
                    result = action["result"]
                    print(f"  {tool.upper()} {args.get('ticker')} x{args.get('size')} -> {result.get('message', result)}")
            else:
                print("  (no trades)")
        
        # Execute tick
        tick_log = orchestrator.run_tick()
        
        print(f"\n📈 Trades executed: {len(tick_log.trades)}")
        
        print("\n💰 Prices:")
        for ticker in tickers:
            old = initial_prices[ticker]
            new = order_books[ticker].get_last_price()
            change = ((new - old) / old) * 100
            print(f"  {ticker}: ${new:.2f} ({change:+.1f}%)")
    
    # Final results
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    
    results = []
    agent_emojis = {
        "citadel": "🏦", "jane_street": "🏦",
        "blackrock": "📊", "vanguard": "📊",
        "retail_holder_1": "👤", "retail_holder_2": "👤",
        "retail_holder_3": "👤", "retail_holder_4": "👤",
        "retail_daytrader": "🎰",
        "my_agent": "🎮"
    }
    
    for agent_id in all_agents:
        p = orchestrator.get_agent_portfolio(agent_id)
        total = p.cash + sum(p.positions.get(t, 0) * order_books[t].get_last_price() for t in tickers)
        pnl = total - start_values[agent_id]
        pnl_pct = (pnl / start_values[agent_id]) * 100
        emoji = agent_emojis[agent_id]
        
        print(f"\n{emoji} {agent_id.upper()}:")
        print(f"  Cash: ${p.cash:,.2f}")
        print(f"  TOTAL: ${total:,.2f}")
        print(f"  P&L: ${pnl:+,.2f} ({pnl_pct:+.2f}%)")
        results.append((agent_id, pnl_pct))
    
    print("\n" + "=" * 80)
    results.sort(key=lambda x: x[1], reverse=True)
    print("🏆 LEADERBOARD:")
    for i, (agent_id, pnl_pct) in enumerate(results):
        emoji = agent_emojis[agent_id]
        rank = "🥇" if i == 0 else "🥈" if i == 1 else "🥉" if i == 2 else "  "
        print(f"  {rank} {emoji} {agent_id.upper()}: {pnl_pct:+.2f}%")


if __name__ == "__main__":
    run_simulation()
