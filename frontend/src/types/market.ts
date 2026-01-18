// ============================================
// MarketMind - Market Abstraction Types
// WebSocket-ready, event-driven architecture
// ============================================

import { SimulationSpeed } from './trading';

// ============================================
// MARKET INSTRUMENTS
// ============================================

export type InstrumentKind = 'index' | 'sector';

export interface MarketInstrument {
  id: string;                    // "SP500", "SECTOR_TECH"
  kind: InstrumentKind;
  label: string;
  price: number;
  previousPrice: number;
  changePercent: number;
  range: {
    low: number;
    high: number;
  };
}

// S&P 500 Sector definitions
export type SectorId = 
  | 'TECH' 
  | 'HEALTH' 
  | 'FINANCE' 
  | 'ENERGY' 
  | 'CONSUMER_DISC' 
  | 'CONSUMER_STAPLES' 
  | 'INDUSTRIALS' 
  | 'MATERIALS' 
  | 'UTILITIES' 
  | 'REAL_ESTATE' 
  | 'COMM_SERVICES';

export const SECTOR_CONFIG: Record<SectorId, { label: string; weight: number }> = {
  TECH: { label: 'Technology', weight: 0.28 },
  HEALTH: { label: 'Health Care', weight: 0.13 },
  FINANCE: { label: 'Financials', weight: 0.13 },
  ENERGY: { label: 'Energy', weight: 0.04 },
  CONSUMER_DISC: { label: 'Cons. Dscrtnry', weight: 0.10 },
  CONSUMER_STAPLES: { label: 'Cons. Stpls', weight: 0.07 },
  INDUSTRIALS: { label: 'Industrials', weight: 0.09 },
  MATERIALS: { label: 'Materials', weight: 0.03 },
  UTILITIES: { label: 'Utilities', weight: 0.03 },
  REAL_ESTATE: { label: 'Real Estate', weight: 0.03 },
  COMM_SERVICES: { label: 'Communication Services', weight: 0.07 },
};

// ============================================
// MARKET EVENTS (WebSocket-ready)
// ============================================

export interface IndexTickPayload {
  price: number;
  previousPrice: number;
  changePercent: number;
  range: { low: number; high: number };
  timestamp: number;
}

export interface SectorTickPayload {
  sectorId: SectorId;
  price: number;
  previousPrice: number;
  changePercent: number;
  range: { low: number; high: number };
  timestamp: number;
}

export interface SimStatusPayload {
  running: boolean;
  speed: SimulationSpeed;
  tickCount: number;
}

export interface AgentActivityPayload {
  id: string;
  timestamp: number;
  agentType: 'institutional' | 'retail' | 'quant' | 'hft';
  agentName: string;
  action: 'increased' | 'decreased' | 'entered' | 'exited' | 'rebalanced';
  target: string; // Sector name or "overall market"
  summary: string; // Human-readable summary
  isNews?: boolean; // True if this is a news event (special styling)
  sentiment?: 'positive' | 'negative'; // For news events
}

// Agent portfolio value (real-time during simulation)
export interface AgentPortfolioValue {
  value: number;
  pnl: number;
  pnl_pct: number;
}

// Stock mover (gainer or loser)
export interface StockMover {
  ticker: string;
  price: number;
  change: number;  // percent change
}

// Agent result for end-of-simulation leaderboard
export interface AgentResult {
  id: string;
  name: string;
  type: 'quant' | 'institutional' | 'retail' | 'custom' | 'unknown';
  start_value: number;
  final_value: number;
  pnl: number;
  pnl_pct: number;
  rank: number;
}

export interface SimulationCompletePayload {
  marketIndex: number;
  leaderboard: AgentResult[];
}

export interface TopMoversPayload {
  gainers: StockMover[];
  losers: StockMover[];
}

export type MarketEvent =
  | { type: 'INDEX_TICK'; payload: IndexTickPayload }
  | { type: 'SECTOR_TICK'; payload: SectorTickPayload }
  | { type: 'SIM_STATUS'; payload: SimStatusPayload }
  | { type: 'AGENT_ACTIVITY'; payload: AgentActivityPayload }
  | { type: 'SIMULATION_COMPLETE'; payload: SimulationCompletePayload }
  | { type: 'PORTFOLIO_UPDATE'; payload: Record<string, AgentPortfolioValue> }
  | { type: 'TOP_MOVERS_UPDATE'; payload: TopMoversPayload };

// ============================================
// MARKET STORE STATE
// ============================================

export interface TickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStore {
  // Instruments
  instruments: Record<string, MarketInstrument>;
  tickHistory: Record<string, TickData[]>;
  
  // Active selection
  activeInstrumentId: string;
  
  // Simulation state
  simStatus: {
    running: boolean;
    speed: SimulationSpeed;
    tickCount: number;
    maxTicks: number;
  };
  
  // Agent activity feed
  agentActivities: AgentActivityPayload[];
  
  // Real-time agent portfolio values
  agentPortfolios: Record<string, AgentPortfolioValue>;
  
  // Top movers (gainers and losers)
  topMovers: {
    gainers: StockMover[];
    losers: StockMover[];
  };
  
  // Subscriptions (for future WebSocket)
  subscribedInstruments: Set<string>;
  
  // End-of-simulation results
  simulationResults?: {
    marketIndex: number;
    leaderboard: AgentResult[];
  };
}

// ============================================
// STORE ACTIONS
// ============================================

export type MarketAction =
  | { type: 'APPLY_EVENT'; event: MarketEvent }
  | { type: 'SET_ACTIVE_INSTRUMENT'; instrumentId: string }
  | { type: 'SIM_TOGGLE_PLAY' }
  | { type: 'SIM_SET_SPEED'; speed: SimulationSpeed }
  | { type: 'SIM_RESET' }
  | { type: 'SIM_SEEK'; tick: number }
  | { type: 'SUBSCRIBE'; instrumentId: string }
  | { type: 'UNSUBSCRIBE'; instrumentId: string };
