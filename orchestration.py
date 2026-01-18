"""
Simulation Orchestrator Module

Manages tick-based market simulation flow:
- Collects agent orders
- Validates orders against agent portfolios
- Routes orders to Market Cores
- Logs tick results for replay/analysis
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Protocol
from copy import deepcopy

# =============================================================================
# Data Models
# =============================================================================

class Side(Enum):
    """Order side: buy or sell."""
    BUY = "buy"
    SELL = "sell"


@dataclass
class Order:
    """Represents a single order submitted by an agent."""
    agent_id: str
    stock_id: str
    side: Side
    price: float
    size: int
    tick: int


@dataclass
class Trade:
    """Represents an executed trade between two parties."""
    buyer_id: str
    seller_id: str
    stock_id: str
    price: float
    size: int
    tick: int


@dataclass
class AgentPortfolio:
    """Tracks an agent's cash and stock positions."""
    agent_id: str
    cash: float
    positions: dict[str, int] = field(default_factory=dict)  # stock_id -> quantity


@dataclass
class TickLog:
    """Complete log of a single simulation tick."""
    tick: int
    orders: list[Order]
    trades: list[Trade]
    last_prices: dict[str, float]  # stock_id -> price
    agent_snapshots: dict[str, AgentPortfolio]  # agent_id -> portfolio copy


# =============================================================================
# Market Core Protocol
# =============================================================================

class MarketCore(Protocol):
    """
    Interface that each stock's market core must implement.
    The orchestrator calls these methods to route orders and execute trades.
    """
    
    def submit_order(self, order: Order) -> None:
        """Submit an order to the order book."""
        ...
    
    def execute(self) -> list[Trade]:
        """Match orders and return list of executed trades."""
        ...
    
    def get_last_price(self) -> float:
        """Return the last traded price for this stock."""
        ...


# =============================================================================
# Simulation Orchestrator
# =============================================================================

class SimulationOrchestrator:
    """
    Central controller for the market simulation.
    
    Responsibilities:
    - Register stocks and agents
    - Collect and validate orders from agents
    - Route orders to Market Cores each tick
    - Update agent portfolios based on executed trades
    - Log all tick data for replay/analysis
    """
    
    def __init__(self):
        self._tick: int = 0
        self._market_cores: dict[str, MarketCore] = {}
        self._agent_portfolios: dict[str, AgentPortfolio] = {}
        self._pending_orders: list[Order] = []
        self._tick_logs: list[TickLog] = []
    
    # -------------------------------------------------------------------------
    # Registration
    # -------------------------------------------------------------------------
    
    def register_stock(self, stock_id: str, market_core: MarketCore) -> None:
        if stock_id in self._market_cores:
            raise ValueError(f"Stock '{stock_id}' is already registered")
        self._market_cores[stock_id] = market_core
    
    def register_agent(self, agent_id: str, initial_cash: float) -> None:
        if agent_id in self._agent_portfolios:
            raise ValueError(f"Agent '{agent_id}' is already registered")
        self._agent_portfolios[agent_id] = AgentPortfolio(
            agent_id=agent_id,
            cash=initial_cash,
            positions={}
        )
    
    # -------------------------------------------------------------------------
    # Order Submission
    # -------------------------------------------------------------------------
    
    def submit_order(
        self,
        agent_id: str,
        stock_id: str,
        side: Side,
        price: float,
        size: int
    ) -> bool:
        """
        Submit an order for the current tick.
        Returns True if accepted, False if rejected.
        """
        if agent_id not in self._agent_portfolios:
            return False
        if stock_id not in self._market_cores:
            return False
        if price <= 0 or size <= 0:
            return False
        
        order = Order(
            agent_id=agent_id,
            stock_id=stock_id,
            side=side,
            price=price,
            size=size,
            tick=self._tick
        )
        self._pending_orders.append(order)
        return True
    
    # -------------------------------------------------------------------------
    # Tick Execution
    # -------------------------------------------------------------------------
    
    def run_tick(self) -> TickLog:
        """
        Process all pending orders and advance the simulation by one tick.
        """
        # Validate orders
        valid_orders = [o for o in self._pending_orders if self._validate_order(o)]
        
        # Group by stock and submit to MarketCores
        orders_by_stock: dict[str, list[Order]] = {}
        for order in valid_orders:
            orders_by_stock.setdefault(order.stock_id, []).append(order)
            self._market_cores[order.stock_id].submit_order(order)
        
        # Execute trades on each MarketCore
        all_trades: list[Trade] = []
        for market_core in self._market_cores.values():
            trades = market_core.execute()
            all_trades.extend(trades)
        
        # Update agent portfolios
        for trade in all_trades:
            self._apply_trade(trade)
        
        # Create tick log
        last_prices = {sid: mc.get_last_price() for sid, mc in self._market_cores.items()}
        agent_snapshots = {aid: deepcopy(p) for aid, p in self._agent_portfolios.items()}
        tick_log = TickLog(
            tick=self._tick,
            orders=list(self._pending_orders),
            trades=all_trades,
            last_prices=last_prices,
            agent_snapshots=agent_snapshots
        )
        self._tick_logs.append(tick_log)
        
        # Clear orders, increment tick
        self._pending_orders.clear()
        self._tick += 1
        
        return tick_log
    
    def _validate_order(self, order: Order) -> bool:
        portfolio = self._agent_portfolios[order.agent_id]
        if order.side == Side.BUY:
            return portfolio.cash >= order.price * order.size
        else:  # SELL
            return portfolio.positions.get(order.stock_id, 0) >= order.size
    
    def _apply_trade(self, trade: Trade) -> None:
        trade_value = trade.price * trade.size
        
        buyer = self._agent_portfolios[trade.buyer_id]
        buyer.cash -= trade_value
        buyer.positions[trade.stock_id] = buyer.positions.get(trade.stock_id, 0) + trade.size
        
        seller = self._agent_portfolios[trade.seller_id]
        seller.cash += trade_value
        seller.positions[trade.stock_id] = seller.positions.get(trade.stock_id, 0) - trade.size
        if seller.positions.get(trade.stock_id, 0) == 0:
            seller.positions.pop(trade.stock_id, None)
    
    # -------------------------------------------------------------------------
    # Getters
    # -------------------------------------------------------------------------
    
    def get_snapshot(self) -> dict[str, float]:
        return {sid: mc.get_last_price() for sid, mc in self._market_cores.items()}
    
    def get_agent_portfolio(self, agent_id: str) -> AgentPortfolio | None:
        p = self._agent_portfolios.get(agent_id)
        return deepcopy(p) if p else None
    
    def get_logs(self) -> list[TickLog]:
        return list(self._tick_logs)
    
    @property
    def tick(self) -> int:
        return self._tick
    
    @property
    def stocks(self) -> list[str]:
        return list(self._market_cores.keys())
    
    @property
    def agents(self) -> list[str]:
        return list(self._agent_portfolios.keys())
