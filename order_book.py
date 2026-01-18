"""
Order Book Module

Implements a price-time priority order book for a single stock.
Each stock gets its own OrderBook instance.
"""

from __future__ import annotations
import heapq
import random
from dataclasses import dataclass
from orchestration import Order, Trade, Side


@dataclass
class BookEntry:
    """An order sitting in the book, waiting to be matched."""
    price: float
    sequence: int
    size: int
    agent_id: str


class OrderBook:
    """
    Order book for a single stock using price-time priority matching.
    Implements the MarketCore protocol required by SimulationOrchestrator.
    """
    
    def __init__(self, stock_id: str, initial_price: float = 100.0, price_impact: float = 0.002, volatility: float = 0.0005):
        self.stock_id = stock_id
        self._last_price = initial_price
        self._sequence = 0
        self._price_impact = price_impact  # How much price moves per share traded
        self._volatility = volatility  # Random noise (0.0005 = 0.05%)
        
        # Heaps for price-time priority
        self._bids: list[tuple[float, int, int, str]] = []
        self._asks: list[tuple[float, int, int, str]] = []
        self._pending: list[Order] = []
    
    def submit_order(self, order: Order) -> None:
        """Queue an order for execution this tick."""
        self._pending.append(order)
    
    def execute(self) -> list[Trade]:
        """Process all pending orders and match them against the book."""
        trades: list[Trade] = []
        
        # Calculate net pressure
        net_pressure = 0
        for order in self._pending:
            if order.side == Side.BUY:
                net_pressure += order.size
            else:
                net_pressure -= order.size
        
        # Add all pending orders to the book
        for order in self._pending:
            self._sequence += 1
            if order.side == Side.BUY:
                heapq.heappush(self._bids, (-order.price, self._sequence, order.size, order.agent_id))
            else:
                heapq.heappush(self._asks, (order.price, self._sequence, order.size, order.agent_id))
        
        self._pending.clear()
        
        # Match orders
        while self._bids and self._asks:
            best_bid = self._bids[0]
            best_ask = self._asks[0]
            
            bid_price = -best_bid[0]
            ask_price = best_ask[0]
            
            if bid_price < ask_price:
                break
            
            heapq.heappop(self._bids)
            heapq.heappop(self._asks)
            
            bid_size = best_bid[2]
            ask_size = best_ask[2]
            bid_agent = best_bid[3]
            ask_agent = best_ask[3]
            
            if best_bid[1] < best_ask[1]:
                trade_price = bid_price
            else:
                trade_price = ask_price
            
            trade_size = min(bid_size, ask_size)
            
            trade = Trade(
                buyer_id=bid_agent,
                seller_id=ask_agent,
                stock_id=self.stock_id,
                price=trade_price,
                size=trade_size,
                tick=0
            )
            trades.append(trade)
            
            self._last_price = trade_price
            
            if bid_size > trade_size:
                heapq.heappush(self._bids, (-bid_price, best_bid[1], bid_size - trade_size, bid_agent))
            if ask_size > trade_size:
                heapq.heappush(self._asks, (ask_price, best_ask[1], ask_size - trade_size, ask_agent))
        
        # Apply price impact
        if net_pressure != 0:
            impact = net_pressure * self._price_impact
            self._last_price = self._last_price * (1 + impact)
        
        # Apply random market noise (volatility)
        if self._volatility > 0:
            noise = random.uniform(-self._volatility, self._volatility)
            self._last_price = self._last_price * (1 + noise)
        
        return trades
    
    def get_last_price(self) -> float:
        return self._last_price
    
    def get_best_bid(self) -> float | None:
        return -self._bids[0][0] if self._bids else None
    
    def get_best_ask(self) -> float | None:
        return self._asks[0][0] if self._asks else None
    
    def get_spread(self) -> float | None:
        bid = self.get_best_bid()
        ask = self.get_best_ask()
        if bid is not None and ask is not None:
            return ask - bid
        return None
    
    def get_depth(self) -> dict[str, int]:
        return {
            "bids": sum(entry[2] for entry in self._bids),
            "asks": sum(entry[2] for entry in self._asks)
        }
    
    def clear_book(self) -> None:
        self._bids.clear()
        self._asks.clear()
        self._pending.clear()


def create_order_books(
    stock_ids: list[str],
    initial_prices: dict[str, float] | None = None,
    price_impact: float = 0.002,
    volatility: float = 0.0005  # 0.05% random noise
) -> dict[str, OrderBook]:
    """Create OrderBook instances for multiple stocks."""
    initial_prices = initial_prices or {}
    return {
        stock_id: OrderBook(stock_id, initial_prices.get(stock_id, 100.0), price_impact, volatility)
        for stock_id in stock_ids
    }
