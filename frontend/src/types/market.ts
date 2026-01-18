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
}

export type MarketEvent =
  | { type: 'INDEX_TICK'; payload: IndexTickPayload }
  | { type: 'SECTOR_TICK'; payload: SectorTickPayload }
  | { type: 'SIM_STATUS'; payload: SimStatusPayload }
  | { type: 'AGENT_ACTIVITY'; payload: AgentActivityPayload };

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
  
  // Subscriptions (for future WebSocket)
  subscribedInstruments: Set<string>;
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
