// ============================================
// MarketMind - Mock Event Stream Hook
// Simulates WebSocket events with dummy data
// Ready to swap for real WebSocket connection
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { 
  MarketStore, 
  MarketAction, 
  MarketEvent,
  SECTOR_CONFIG,
  SectorId,
  AgentActivityPayload,
} from '@/types/market';
import { SimulationSpeed } from '@/types/trading';

const SPEED_INTERVALS: Record<SimulationSpeed, number> = {
  slow: 2000,
  normal: 1000,
  fast: 400,
};

const AGENT_NAMES: Record<string, string[]> = {
  institutional: ['BlackRock Alpha', 'Vanguard Fund', 'DeepValue Capital', 'SteadyEddie'],
  retail: ['YOLO Trader', 'DiamondHands', 'MoonShot', 'SwingKing'],
  quant: ['Alpha Quant', 'StatArb Pro', 'QuantumEdge', 'SigmaTrader'],
  hft: ['Velocity HFT', 'NanoSecond', 'FlashTrade', 'SpeedDemon'],
};

const ACTIONS: AgentActivityPayload['action'][] = [
  'increased', 'decreased', 'entered', 'exited', 'rebalanced'
];

function generateAgentActivity(sectorLabels: string[]): AgentActivityPayload {
  const agentTypes = Object.keys(AGENT_NAMES) as Array<keyof typeof AGENT_NAMES>;
  const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
  const names = AGENT_NAMES[agentType];
  const agentName = names[Math.floor(Math.random() * names.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const target = sectorLabels[Math.floor(Math.random() * sectorLabels.length)];
  
  const summaryTemplates: Record<typeof action, string[]> = {
    increased: [
      `${agentName} increased exposure to ${target}`,
      `${agentName} added to ${target} positions`,
    ],
    decreased: [
      `${agentName} reduced ${target} holdings`,
      `${agentName} trimmed ${target} exposure`,
    ],
    entered: [
      `${agentName} opened new positions in ${target}`,
      `${agentName} entered ${target} sector`,
    ],
    exited: [
      `${agentName} closed all ${target} positions`,
      `${agentName} exited ${target} completely`,
    ],
    rebalanced: [
      `${agentName} rebalanced ${target} allocation`,
      `${agentName} adjusted ${target} weighting`,
    ],
  };
  
  const templates = summaryTemplates[action];
  const summary = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    agentType: agentType as AgentActivityPayload['agentType'],
    agentName,
    action,
    target,
    summary,
  };
}

export function useMarketEventStream(
  state: MarketStore,
  dispatch: React.Dispatch<MarketAction>
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate a market tick event
  const generateTick = useCallback(() => {
    const events: MarketEvent[] = [];
    const timestamp = Date.now();
    
    // Only generate for subscribed instruments
    state.subscribedInstruments.forEach((instrumentId) => {
      const instrument = state.instruments[instrumentId];
      if (!instrument) return;
      
      const volatility = instrument.kind === 'index' ? 0.003 : 0.012;
      const change = (Math.random() - 0.48) * volatility * instrument.price;
      const newPrice = instrument.price + change;
      
      // Calculate new range
      const history = state.tickHistory[instrumentId] || [];
      const recentLow = Math.min(...history.slice(-20).map(t => t.low), instrument.range.low);
      const recentHigh = Math.max(...history.slice(-20).map(t => t.high), instrument.range.high);
      
      const tickLow = Math.min(instrument.price, newPrice) * (1 - Math.random() * volatility * 0.3);
      const tickHigh = Math.max(instrument.price, newPrice) * (1 + Math.random() * volatility * 0.3);
      
      const firstPrice = history[0]?.close || instrument.price;
      const changePercent = ((newPrice - firstPrice) / firstPrice) * 100;
      
      if (instrumentId === 'SP500') {
        events.push({
          type: 'INDEX_TICK',
          payload: {
            price: newPrice,
            previousPrice: instrument.price,
            changePercent,
            range: { 
              low: Math.min(recentLow, tickLow), 
              high: Math.max(recentHigh, tickHigh) 
            },
            timestamp,
          },
        });
      } else if (instrumentId.startsWith('SECTOR_')) {
        const sectorId = instrumentId.replace('SECTOR_', '') as SectorId;
        events.push({
          type: 'SECTOR_TICK',
          payload: {
            sectorId,
            price: newPrice,
            previousPrice: instrument.price,
            changePercent,
            range: { 
              low: Math.min(recentLow, tickLow), 
              high: Math.max(recentHigh, tickHigh) 
            },
            timestamp,
          },
        });
      }
    });
    
    // Apply all events
    events.forEach((event) => {
      dispatch({ type: 'APPLY_EVENT', event });
    });
    
    // Update tick count
    dispatch({
      type: 'APPLY_EVENT',
      event: {
        type: 'SIM_STATUS',
        payload: {
          running: state.simStatus.running,
          speed: state.simStatus.speed,
          tickCount: Math.min(state.simStatus.tickCount + 1, state.simStatus.maxTicks),
        },
      },
    });
  }, [state.subscribedInstruments, state.instruments, state.tickHistory, state.simStatus, dispatch]);
  
  // Main simulation loop
  useEffect(() => {
    if (state.simStatus.running) {
      intervalRef.current = setInterval(generateTick, SPEED_INTERVALS[state.simStatus.speed]);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.simStatus.running, state.simStatus.speed, generateTick]);
  
  // Agent activity generation (less frequent)
  useEffect(() => {
    if (state.simStatus.running) {
      const sectorLabels = Object.values(SECTOR_CONFIG).map(s => s.label);
      
      activityIntervalRef.current = setInterval(() => {
        // 40% chance to generate activity each interval
        if (Math.random() < 0.4) {
          const activity = generateAgentActivity(sectorLabels);
          dispatch({
            type: 'APPLY_EVENT',
            event: { type: 'AGENT_ACTIVITY', payload: activity },
          });
        }
      }, 3000);
    }
    
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
    };
  }, [state.simStatus.running, dispatch]);
}
