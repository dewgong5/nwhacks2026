// ============================================
// MarketMind - Market Provider Component
// Wraps the app with market state context
// ============================================

import { useReducer, ReactNode, createContext, useContext } from 'react';
import { 
  MarketContext, 
  marketReducer, 
  createInitialState 
} from './marketStore';
import { useMarketEventStream } from '@/hooks/useMarketEventStream';

interface MarketProviderProps {
  children: ReactNode;
}

// Context for simulation controls
interface SimulationControlsContextValue {
  isConnected: boolean;
  isSimulationStarted: boolean;
  startSimulation: (customAgent?: { name: string; prompt: string }) => boolean;
}

const SimulationControlsContext = createContext<SimulationControlsContextValue | null>(null);

export function useSimulationControls() {
  const context = useContext(SimulationControlsContext);
  if (!context) {
    throw new Error('useSimulationControls must be used within MarketProvider');
  }
  return context;
}

export function MarketProvider({ children }: MarketProviderProps) {
  const [state, dispatch] = useReducer(marketReducer, null, createInitialState);
  
  // Connect to event stream and get simulation controls
  const { isConnected, isSimulationStarted, startSimulation } = useMarketEventStream(state, dispatch);
  
  return (
    <MarketContext.Provider value={{ state, dispatch }}>
      <SimulationControlsContext.Provider value={{ isConnected, isSimulationStarted, startSimulation }}>
        {children}
      </SimulationControlsContext.Provider>
    </MarketContext.Provider>
  );
}
