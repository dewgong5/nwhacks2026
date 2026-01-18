"""
Demo: Three LLM agents trade stocks - Quant, Fundamental, and Retail.
"""

import csv
from orchestration import SimulationOrchestrator, Side
from order_book import create_order_books
from agents import create_agent


def load_stocks(csv_path="stocks.csv"):
    """Load stocks from CSV file with historical prices."""
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


def run_simulation():
    print("\n" + "=" * 80)
    print("  MARKET SIMULATION: Quant vs Fundamental vs Retail")
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
    
    # Setup orchestrator with 0.05% random noise
    orchestrator = SimulationOrchestrator()
    order_books = create_order_books(tickers, initial_prices, price_impact=0.003, volatility=0.0005)
    
    for ticker, book in order_books.items():
        orchestrator.register_stock(ticker, book)
    
    # Register agents
    orchestrator.register_agent("quant", initial_cash=500000.0)
    orchestrator.register_agent("fundamental", initial_cash=500000.0)
    orchestrator.register_agent("retail", initial_cash=50000.0)
    orchestrator.register_agent("market_maker", initial_cash=10000000.0)
    
    # Give starting shares
    for ticker in tickers:
        orchestrator._agent_portfolios["quant"].positions[ticker] = 100
        orchestrator._agent_portfolios["fundamental"].positions[ticker] = 100
        orchestrator._agent_portfolios["retail"].positions[ticker] = 20
        orchestrator._agent_portfolios["market_maker"].positions[ticker] = 1000
    
    # Create LLM agents
    print("\nCreating agents...")
    MODEL = "google/gemini-2.0-flash-001"
    
    quant = create_agent("quant", orchestrator, "quant_institutional", MODEL, stock_history)
    fundamental = create_agent("fundamental", orchestrator, "fundamental_institutional", MODEL, stock_history)
    retail = create_agent("retail", orchestrator, "retail_trader", MODEL, stock_history)
    
    print(f"  🤖 Quant: Momentum trading, $500k")
    print(f"  📊 Fundamental: Value investing, $500k")
    print(f"  👤 Retail: FOMO trading, $50k")
    
    # Calculate starting values
    start_values = {}
    for agent_id in ["quant", "fundamental", "retail"]:
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
        
        # Each agent decides
        for agent, name, emoji in [(quant, "QUANT", "🤖"), (fundamental, "FUNDAMENTAL", "📊"), (retail, "RETAIL", "👤")]:
            print(f"\n[{emoji} {name} thinking...]")
            actions = agent.decide(tick)
            
            trades = [a for a in actions if a["tool"].get("tool") in ["buy", "sell"]]
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
    for agent_id, emoji in [("quant", "🤖"), ("fundamental", "📊"), ("retail", "👤")]:
        p = orchestrator.get_agent_portfolio(agent_id)
        total = p.cash + sum(p.positions.get(t, 0) * order_books[t].get_last_price() for t in tickers)
        pnl = total - start_values[agent_id]
        pnl_pct = (pnl / start_values[agent_id]) * 100
        
        print(f"\n{emoji} {agent_id.upper()}:")
        print(f"  Cash: ${p.cash:,.2f}")
        print(f"  TOTAL: ${total:,.2f}")
        print(f"  P&L: ${pnl:+,.2f} ({pnl_pct:+.2f}%)")
        results.append((agent_id, pnl_pct))
    
    print("\n" + "=" * 80)
    winner = max(results, key=lambda x: x[1])
    loser = min(results, key=lambda x: x[1])
    print(f"🏆 WINNER: {winner[0].upper()} ({winner[1]:+.2f}%)")
    print(f"💀 LOSER: {loser[0].upper()} ({loser[1]:+.2f}%)")


if __name__ == "__main__":
    run_simulation()
