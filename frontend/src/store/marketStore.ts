// ============================================
// MarketMind - Centralized Market Store
// Single source of truth for all market state
// ============================================

import { createContext, useContext } from 'react';
import { 
  MarketStore, 
  MarketAction, 
  MarketInstrument, 
  TickData,
  SECTOR_CONFIG,
  SectorId,
  AgentActivityPayload
} from '@/types/market';
import { SimulationSpeed } from '@/types/trading';

// ============================================
// INITIAL STATE GENERATORS
// ============================================

function generateInitialPrice(basePrice: number, variance: number = 0.1): number {
  return basePrice * (1 + (Math.random() - 0.5) * variance);
}

function generateInitialInstruments(): Record<string, MarketInstrument> {
  const instruments: Record<string, MarketInstrument> = {};
  
  // S&P 500 Index
  const indexPrice = generateInitialPrice(4500, 0.05);
  instruments['SP500'] = {
    id: 'SP500',
    kind: 'index',
    label: 'S&P 500',
    price: indexPrice,
    previousPrice: indexPrice,
    changePercent: 0,
    range: { low: indexPrice * 0.995, high: indexPrice * 1.005 },
  };
  
  // Sectors
  const sectorIds = Object.keys(SECTOR_CONFIG) as SectorId[];
  sectorIds.forEach((sectorId) => {
    const { label } = SECTOR_CONFIG[sectorId];
    const basePrice = 100 + Math.random() * 50;
    const price = generateInitialPrice(basePrice, 0.03);
    
    instruments[`SECTOR_${sectorId}`] = {
      id: `SECTOR_${sectorId}`,
      kind: 'sector',
      label,
      price,
      previousPrice: price,
      changePercent: 0,
      range: { low: price * 0.99, high: price * 1.01 },
    };
  });
  
  return instruments;
}

function generateInitialTickHistory(instrument: MarketInstrument, count: number = 30): TickData[] {
  const history: TickData[] = [];
  let price = instrument.price * 0.98; // Start slightly lower
  const volatility = instrument.kind === 'index' ? 0.005 : 0.015;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.3);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.3);
    
    history.push({
      timestamp: Date.now() - (count - i) * 1000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000) + 100000,
    });
    
    price = close;
  }
  
  return history;
}

export function createInitialState(): MarketStore {
  const instruments = generateInitialInstruments();
  const tickHistory: Record<string, TickData[]> = {};
  
  // Generate tick history for all instruments
  Object.values(instruments).forEach((instrument) => {
    tickHistory[instrument.id] = generateInitialTickHistory(instrument);
  });
  
  // Update prices to match final tick
  Object.keys(instruments).forEach((id) => {
    const lastTick = tickHistory[id][tickHistory[id].length - 1];
    instruments[id].price = lastTick.close;
    instruments[id].range = {
      low: Math.min(...tickHistory[id].map(t => t.low)),
      high: Math.max(...tickHistory[id].map(t => t.high)),
    };
  });
  
  // All instruments subscribed by default
  const subscribedInstruments = new Set(Object.keys(instruments));
  
  return {
    instruments,
    tickHistory,
    activeInstrumentId: 'SP500',
    simStatus: {
      running: true,
      speed: 'normal',
      tickCount: 0,
      maxTicks: 100,
    },
    agentActivities: [],
    subscribedInstruments,
  };
}

// ============================================
// REDUCER
// ============================================

export function marketReducer(state: MarketStore, action: MarketAction): MarketStore {
  switch (action.type) {
    case 'APPLY_EVENT': {
      const { event } = action;
      
      switch (event.type) {
        case 'INDEX_TICK': {
          const { payload } = event;
          const instrumentId = 'SP500';
          const instrument = state.instruments[instrumentId];
          
          if (!instrument) return state;
          
          const newTick: TickData = {
            timestamp: payload.timestamp,
            open: instrument.price,
            high: payload.range.high,
            low: payload.range.low,
            close: payload.price,
            volume: Math.floor(Math.random() * 1000000) + 100000,
          };
          
          return {
            ...state,
            instruments: {
              ...state.instruments,
              [instrumentId]: {
                ...instrument,
                previousPrice: instrument.price,
                price: payload.price,
                changePercent: payload.changePercent,
                range: payload.range,
              },
            },
            tickHistory: {
              ...state.tickHistory,
              [instrumentId]: [...state.tickHistory[instrumentId].slice(-99), newTick],
            },
          };
        }
        
        case 'SECTOR_TICK': {
          const { payload } = event;
          const instrumentId = `SECTOR_${payload.sectorId}`;
          const instrument = state.instruments[instrumentId];
          
          if (!instrument) return state;
          
          const newTick: TickData = {
            timestamp: payload.timestamp,
            open: instrument.price,
            high: payload.range.high,
            low: payload.range.low,
            close: payload.price,
            volume: Math.floor(Math.random() * 500000) + 50000,
          };
          
          return {
            ...state,
            instruments: {
              ...state.instruments,
              [instrumentId]: {
                ...instrument,
                previousPrice: instrument.price,
                price: payload.price,
                changePercent: payload.changePercent,
                range: payload.range,
              },
            },
            tickHistory: {
              ...state.tickHistory,
              [instrumentId]: [...state.tickHistory[instrumentId].slice(-99), newTick],
            },
          };
        }
        
        case 'SIM_STATUS': {
          return {
            ...state,
            simStatus: {
              ...state.simStatus,
              running: event.payload.running,
              speed: event.payload.speed,
              tickCount: event.payload.tickCount,
            },
          };
        }
        
        case 'AGENT_ACTIVITY': {
          return {
            ...state,
            agentActivities: [event.payload, ...state.agentActivities].slice(0, 50),
          };
        }
      }
      
      return state;
    }
    
    case 'SET_ACTIVE_INSTRUMENT': {
      if (!state.instruments[action.instrumentId]) return state;
      return {
        ...state,
        activeInstrumentId: action.instrumentId,
      };
    }
    
    case 'SIM_TOGGLE_PLAY': {
      return {
        ...state,
        simStatus: {
          ...state.simStatus,
          running: !state.simStatus.running,
        },
      };
    }
    
    case 'SIM_SET_SPEED': {
      return {
        ...state,
        simStatus: {
          ...state.simStatus,
          speed: action.speed,
        },
      };
    }
    
    case 'SIM_RESET': {
      return createInitialState();
    }
    
    case 'SIM_SEEK': {
      return {
        ...state,
        simStatus: {
          ...state.simStatus,
          tickCount: Math.min(action.tick, state.simStatus.maxTicks),
        },
      };
    }
    
    case 'SUBSCRIBE': {
      const newSet = new Set(state.subscribedInstruments);
      newSet.add(action.instrumentId);
      return {
        ...state,
        subscribedInstruments: newSet,
      };
    }
    
    case 'UNSUBSCRIBE': {
      const newSet = new Set(state.subscribedInstruments);
      newSet.delete(action.instrumentId);
      return {
        ...state,
        subscribedInstruments: newSet,
      };
    }
    
    default:
      return state;
  }
}

// ============================================
// SELECTORS
// ============================================

export const selectActiveInstrument = (state: MarketStore): MarketInstrument | null => 
  state.instruments[state.activeInstrumentId] || null;

export const selectActiveTickHistory = (state: MarketStore): TickData[] => 
  state.tickHistory[state.activeInstrumentId] || [];

export const selectIndex = (state: MarketStore): MarketInstrument | null => 
  state.instruments['SP500'] || null;

export const selectSectors = (state: MarketStore): MarketInstrument[] => 
  Object.values(state.instruments).filter(i => i.kind === 'sector');

export const selectSortedSectors = (state: MarketStore): MarketInstrument[] => 
  selectSectors(state).sort((a, b) => b.changePercent - a.changePercent);

export const selectTopPerformers = (state: MarketStore, count: number = 3): MarketInstrument[] => 
  selectSortedSectors(state).slice(0, count);

export const selectBottomPerformers = (state: MarketStore, count: number = 3): MarketInstrument[] => 
  selectSortedSectors(state).slice(-count).reverse();

export const selectAgentActivities = (state: MarketStore, count: number = 10): AgentActivityPayload[] => 
  state.agentActivities.slice(0, count);

export const selectIsRunning = (state: MarketStore): boolean => 
  state.simStatus.running;

export const selectSpeed = (state: MarketStore): SimulationSpeed => 
  state.simStatus.speed;

// ============================================
// CONTEXT
// ============================================

interface MarketContextValue {
  state: MarketStore;
  dispatch: React.Dispatch<MarketAction>;
}

export const MarketContext = createContext<MarketContextValue | null>(null);

export function useMarketStore() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarketStore must be used within MarketProvider');
  }
  return context;
}
