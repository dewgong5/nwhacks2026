// ============================================
// MarketMind - Market Provider Component
// Wraps the app with market state context
// ============================================

import { useReducer, ReactNode, useEffect } from 'react';
import { 
  MarketContext, 
  marketReducer, 
  createInitialState 
} from './marketStore';
import { useMarketEventStream } from '@/hooks/useMarketEventStream';

interface MarketProviderProps {
  children: ReactNode;
}

export function MarketProvider({ children }: MarketProviderProps) {
  const [state, dispatch] = useReducer(marketReducer, null, createInitialState);
  
  // Connect to event stream (mock for now, WebSocket-ready)
  useMarketEventStream(state, dispatch);
  
  return (
    <MarketContext.Provider value={{ state, dispatch }}>
      {children}
    </MarketContext.Provider>
  );
}
