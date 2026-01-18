"""
Test file for the simulation orchestrator and order book.
Run with: python test_simulation.py
"""

from orchestration import SimulationOrchestrator, Side
from order_book import OrderBook, create_order_books


def test_basic_trade():
    """Test a simple buy/sell match."""
    print("=" * 60)
    print("TEST 1: Basic Trade")
    print("=" * 60)
    
    orchestrator = SimulationOrchestrator()
    book = OrderBook("AAPL", initial_price=100.0)
    
    orchestrator.register_stock("AAPL", book)
    orchestrator.register_agent("alice", initial_cash=10000.0)
    orchestrator.register_agent("bob", initial_cash=10000.0)
    
    orchestrator._agent_portfolios["bob"].positions["AAPL"] = 100
    
    orchestrator.submit_order("alice", "AAPL", Side.BUY, price=150.0, size=10)
    orchestrator.submit_order("bob", "AAPL", Side.SELL, price=145.0, size=10)
    
    tick_log = orchestrator.run_tick()
    
    print(f"Trades executed: {len(tick_log.trades)}")
    if tick_log.trades:
        trade = tick_log.trades[0]
        print(f"  {trade.buyer_id} bought {trade.size} from {trade.seller_id} @ ${trade.price}")
    print(f"Last price: ${tick_log.last_prices['AAPL']:.2f}")
    print()


def test_price_impact():
    """Test that buying pushes price up."""
    print("=" * 60)
    print("TEST 2: Price Impact")
    print("=" * 60)
    
    orchestrator = SimulationOrchestrator()
    book = OrderBook("TEST", initial_price=100.0, price_impact=0.01, volatility=0)  # 1% impact, no noise
    
    orchestrator.register_stock("TEST", book)
    orchestrator.register_agent("buyer", initial_cash=100000.0)
    orchestrator.register_agent("seller", initial_cash=10000.0)
    
    orchestrator._agent_portfolios["seller"].positions["TEST"] = 1000
    
    print(f"Initial price: ${book.get_last_price():.2f}")
    
    # Buy 20 shares - should push price up by 20%
    orchestrator.submit_order("buyer", "TEST", Side.BUY, price=110.0, size=20)
    orchestrator.submit_order("seller", "TEST", Side.SELL, price=100.0, size=20)
    
    orchestrator.run_tick()
    print(f"After buying 20 shares: ${book.get_last_price():.2f}")
    print()


def test_random_volatility():
    """Test that prices move with random noise."""
    print("=" * 60)
    print("TEST 3: Random Volatility")
    print("=" * 60)
    
    orchestrator = SimulationOrchestrator()
    book = OrderBook("VOL", initial_price=100.0, price_impact=0, volatility=0.02)  # 2% volatility
    
    orchestrator.register_stock("VOL", book)
    orchestrator.register_agent("observer", initial_cash=10000.0)
    
    print(f"Initial price: ${book.get_last_price():.2f}")
    
    # Run 5 ticks with no trading - price should still move
    for i in range(20):
        orchestrator.run_tick()
        print(f"Tick {i}: ${book.get_last_price():.2f}")
    print()


if __name__ == "__main__":
    test_basic_trade()
    test_price_impact()
    test_random_volatility()
    print("All tests completed!")
