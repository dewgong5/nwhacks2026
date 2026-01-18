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

function generateInitialInstruments(): Record<string, MarketInstrument> {
  const instruments: Record<string, MarketInstrument> = {};
  const STARTING_PRICE = 100;
  
  // S&P 500 Index - start at 100, will be updated by WebSocket
  instruments['SP500'] = {
    id: 'SP500',
    kind: 'index',
    label: 'S&P 500',
    price: STARTING_PRICE,
    previousPrice: STARTING_PRICE,
    changePercent: 0,
    range: { low: STARTING_PRICE, high: STARTING_PRICE },
  };
  
  // Sectors - start at 100, will be updated by WebSocket
  const sectorIds = Object.keys(SECTOR_CONFIG) as SectorId[];
  sectorIds.forEach((sectorId) => {
    const { label } = SECTOR_CONFIG[sectorId];
    
    instruments[`SECTOR_${sectorId}`] = {
      id: `SECTOR_${sectorId}`,
      kind: 'sector',
      label,
      price: STARTING_PRICE,
      previousPrice: STARTING_PRICE,
      changePercent: 0,
      range: { low: STARTING_PRICE, high: STARTING_PRICE },
    };
  });
  
  return instruments;
}

export function createInitialState(): MarketStore {
  const instruments = generateInitialInstruments();
  const tickHistory: Record<string, TickData[]> = {};
  
  // Initialize empty tick history for all instruments - no dummy data
  // Prices start at 100 and will be updated when first WebSocket tick arrives
  Object.values(instruments).forEach((instrument) => {
    tickHistory[instrument.id] = [];
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
      maxTicks: 5,
    },
    agentActivities: [],
    agentPortfolios: {},
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
            // Use provided open/high/low/close/volume from payload if available, otherwise use defaults
            open: (payload as any).open !== undefined ? (payload as any).open : instrument.price,
            high: (payload as any).high !== undefined ? (payload as any).high : payload.range.high,
            low: (payload as any).low !== undefined ? (payload as any).low : payload.range.low,
            close: (payload as any).close !== undefined ? (payload as any).close : payload.price,
            volume: (payload as any).volume !== undefined ? (payload as any).volume : Math.floor(Math.random() * 1000000) + 100000,
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
            // Use provided open/high/low/close/volume from payload if available, otherwise use defaults
            open: (payload as any).open !== undefined ? (payload as any).open : instrument.price,
            high: (payload as any).high !== undefined ? (payload as any).high : payload.range.high,
            low: (payload as any).low !== undefined ? (payload as any).low : payload.range.low,
            close: (payload as any).close !== undefined ? (payload as any).close : payload.price,
            volume: (payload as any).volume !== undefined ? (payload as any).volume : Math.floor(Math.random() * 500000) + 50000,
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
          // Deduplicate: Check if this activity already exists (by ID or by content + timestamp)
          const isDuplicate = state.agentActivities.some(
            existing => 
              existing.id === event.payload.id || 
              (existing.summary === event.payload.summary && 
               Math.abs(existing.timestamp - event.payload.timestamp) < 1000) // Same within 1 second
          );
          
          if (isDuplicate) {
            console.log('⚠️ Duplicate agent activity ignored:', {
              id: event.payload.id,
              summary: event.payload.summary,
              timestamp: event.payload.timestamp,
              existingCount: state.agentActivities.length
            });
            return state; // Don't add duplicate
          }
          
          // Add new activity to the front, keep ALL activities (no limit)
          // This ensures the log persists throughout the entire simulation
          const newActivities = [event.payload, ...state.agentActivities];
          console.log('✅ Added new agent activity:', {
            id: event.payload.id,
            agentName: event.payload.agentName,
            summary: event.payload.summary,
            totalActivities: newActivities.length
          });
          
          return {
            ...state,
            agentActivities: newActivities,
          };
        }
        
        case 'SIMULATION_COMPLETE': {
          console.log('🏆 Storing simulation results:', event.payload);
          return {
            ...state,
            simStatus: {
              ...state.simStatus,
              running: false,  // Stop the simulation
            },
            simulationResults: {
              marketIndex: event.payload.marketIndex,
              leaderboard: event.payload.leaderboard,
            },
          };
        }
        
        case 'PORTFOLIO_UPDATE': {
          return {
            ...state,
            agentPortfolios: event.payload,
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
      // Reset clears everything including activities for a fresh start
      // Activities will accumulate during a single simulation run (day 0 to day 100)
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

export const selectAgentActivities = (state: MarketStore, count?: number): AgentActivityPayload[] => 
  count !== undefined ? state.agentActivities.slice(0, count) : state.agentActivities;

export const selectAgentPortfolios = (state: MarketStore) => state.agentPortfolios;

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
