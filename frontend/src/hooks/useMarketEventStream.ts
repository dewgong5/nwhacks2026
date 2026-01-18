// ============================================
// MarketMind - WebSocket Event Stream Hook
// Connects to WebSocket server for real-time price data
// NO MOCK DATA - Only uses WebSocket data
// ============================================

import { useEffect, useRef, useState } from 'react';
import { 
  MarketStore, 
  MarketAction, 
  MarketEvent,
  SectorId,
  AgentActivityPayload,
} from '@/types/market';

const WS_URL = 'ws://localhost:8000/ws';

// Mock data generation removed - only WebSocket data is used

/**
 * Parse incoming WebSocket message and convert to MarketEvent format
 * Filters between price events and agent activity events
 * 
 * Expected message formats:
 * 
 * AGENT ACTIVITY:
 *   { event: "agent_activity", agent_name: "...", action: "...", ... }
 *   { type: "agent_activity", agentName: "...", action: "...", ... }
 *   { event_type: "agent_activity", ... }
 * 
 * PRICE/TICK:
 *   { price: 100, instrumentId: "SP500", ... }
 *   { tick: 1, prices: { "SP500": 100, ... } }
 *   { type: "INDEX_TICK", payload: {...} }
 */
function parseWebSocketMessage(data: string, state: MarketStore, isRecursive: boolean = false): MarketEvent[] {
  try {
    const message = JSON.parse(data);
    const events: MarketEvent[] = [];
    const timestamp = Date.now();
    let hasPriceUpdate = false; // Track if we've processed a price update in this message

    // Log incoming message for debugging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Received WebSocket message:', message);
    console.log('📥 Message keys:', Object.keys(message));
    console.log('📥 Has "event" field?', message.event !== undefined);
    console.log('📥 Event value:', message.event);
    console.log('📥 Event type:', typeof message.event);
    console.log('📥 Has "price" field?', message.price !== undefined);
    console.log('📥 Has "type" field?', message.type !== undefined);
    console.log('📥 Type value:', message.type);

    // ============================================
    // FILTER: Check for simulation_complete event
    // Format: {"type": "simulation_complete", "market_index": 100, "leaderboard": [...]}
    // ============================================
    if (message.type === 'simulation_complete') {
      console.log('🏆 Simulation complete!', message);
      events.push({
        type: 'SIMULATION_COMPLETE',
        payload: {
          marketIndex: message.market_index,
          leaderboard: message.leaderboard || [],
        }
      });
      return events;
    }

    // ============================================
    // FILTER: Check for news event
    // Format: {"type": "news", "headline": "...", "stock": "AAPL", "sentiment": "positive"}
    // ============================================
    console.log('🔍 Checking for news - message.type:', message.type, 'is news?:', message.type === 'news');
    if (message.type === 'news') {
      console.log('📰📰📰 NEWS EVENT RECEIVED! 📰📰📰', message);
      events.push({
        type: 'AGENT_ACTIVITY',
        payload: {
          id: `news-${timestamp}-${Math.random()}`,
          timestamp,
          agentType: 'institutional' as const, // News gets special styling
          agentName: '📰 BREAKING NEWS',
          action: 'entered' as const,
          target: message.stock,
          summary: message.headline,
          isNews: true, // Special flag for distinct styling
          sentiment: message.sentiment,
        }
      });
      return events;
    }

    // ============================================
    // FILTER: Check if this is an agent activity event
    // Priority: Check for agent activity FIRST before price events
    // Format: {"event": "🏦 CITADEL BUYS 30 AAPL"}
    // ============================================
    
    // Check if message has "event" field with a string (agent activity message)
    // This should catch: {"event": "🏦 CITADEL BUYS 30 AAPL"}
    const hasEventField = message.event !== undefined;
    const isEventString = typeof message.event === 'string';
    const hasNoPrice = message.price === undefined;
    
    console.log('🔍 Agent Activity Filter Check:', {
      hasEventField,
      isEventString,
      hasNoPrice,
      eventValue: message.event,
      willMatch: hasEventField && isEventString && hasNoPrice
    });
    
    if (hasEventField && isEventString && hasNoPrice) {
      console.log('✅ MATCHED: Agent activity event detected!');
      console.log('📝 Event string to parse:', message.event);
      // Parse the event string to extract agent information
      const eventString = message.event.trim();
      
      // Map emojis to agent types
      const emojiToAgentType: Record<string, AgentActivityPayload['agentType']> = {
        '🏦': 'institutional',
        '📊': 'institutional',
        '👤': 'retail',
        '🎰': 'retail',
        '🎮': 'retail',
        '🤖': 'quant',
        '⚡': 'hft',
      };
      
      // Extract emoji and determine agent type
      const emoji = eventString.match(/^[\u{1F300}-\u{1F9FF}]/u)?.[0] || '';
      const agentType = emojiToAgentType[emoji] || 'institutional';
      
      // Remove emoji from string for parsing
      const textWithoutEmoji = eventString.replace(/^[\u{1F300}-\u{1F9FF}]/u, '').trim();
      
      // Parse agent name (first words before action)
      const actionKeywords = ['BUYS', 'SELLS', 'BUY', 'SELL', 'DIP', 'FALLING KNIFE'];
      let agentName = '';
      let actionText = '';
      let target = '';
      
      for (const keyword of actionKeywords) {
        const index = textWithoutEmoji.indexOf(keyword);
        if (index !== -1) {
          agentName = textWithoutEmoji.substring(0, index).trim();
          actionText = keyword;
          
          // Extract target (ticker/sector) - usually after the action
          const afterAction = textWithoutEmoji.substring(index + keyword.length).trim();
          // Look for ticker pattern (uppercase letters/numbers) or sector name
          const tickerMatch = afterAction.match(/([A-Z][A-Z0-9]+)/);
          if (tickerMatch) {
            target = tickerMatch[1];
          } else {
            // Try to extract sector or other target
            const words = afterAction.split(/\s+/);
            target = words[0] || 'market';
          }
          break;
        }
      }
      
      // If no action keyword found, try to extract from common patterns
      if (!agentName) {
        const parts = textWithoutEmoji.split(/\s+/);
        agentName = parts[0] || 'Agent';
        if (parts.length > 1) {
          actionText = parts[1] || 'acted';
          target = parts[parts.length - 1] || 'market';
        }
      }
      
      // Map action text to action type
      const actionMap: Record<string, AgentActivityPayload['action']> = {
        'BUYS': 'increased',
        'BUY': 'increased',
        'SELLS': 'decreased',
        'SELL': 'decreased',
        'DIP': 'entered',
        'FALLING KNIFE': 'entered',
      };
      
      const action = actionMap[actionText.toUpperCase()] || 'rebalanced';
      
      // Create activity payload with unique ID based on content + timestamp
      // This ensures each unique event gets a unique ID, preventing duplicates
      const uniqueId = message.id || message.activity_id || message.activityId || 
        `${eventString}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      
      const activityPayload: AgentActivityPayload = {
        id: uniqueId,
        timestamp: message.timestamp || timestamp,
        agentType: agentType,
        agentName: agentName || 'Agent',
        action: action,
        target: target || 'market',
        summary: eventString, // Use the full event string as summary
      };
      
      events.push({
        type: 'AGENT_ACTIVITY',
        payload: activityPayload,
      });
      
      console.log('✅ Parsed agent activity event:', activityPayload);
      return events;
    }
    
    // Also check for structured agent activity format (backward compatibility)
    const hasAgentFields = 
      message.agent_name !== undefined || 
      message.agentName !== undefined ||
      message.agent_type !== undefined ||
      message.agentType !== undefined;
    
    const hasPriceField = message.price !== undefined || message.prices !== undefined;
    
    const isStructuredAgentActivity = 
      message.event === 'agent_activity' || 
      message.event === 'agent' ||
      message.type === 'agent_activity' || 
      message.type === 'AGENT_ACTIVITY' ||
      message.type === 'agent' ||
      message.event_type === 'agent_activity' ||
      message.eventType === 'agent_activity' ||
      (hasAgentFields && !hasPriceField);
    
    if (isStructuredAgentActivity) {
      // Handle structured agent activity event
      const activityPayload: AgentActivityPayload = {
        id: message.id || message.activity_id || message.activityId || crypto.randomUUID(),
        timestamp: message.timestamp || timestamp,
        agentType: (message.agent_type || message.agentType || 'institutional') as AgentActivityPayload['agentType'],
        agentName: message.agent_name || message.agentName || 'Agent',
        action: (message.action || 'rebalanced') as AgentActivityPayload['action'],
        target: message.target || message.sector || 'overall market',
        summary: message.summary || message.message || message.content || `${message.agent_name || message.agentName || 'Agent'} ${message.action || 'acted'} on ${message.target || message.sector || 'market'}`,
      };
      
      events.push({
        type: 'AGENT_ACTIVITY',
        payload: activityPayload,
      });
      
      console.log('✅ Parsed structured agent activity event:', activityPayload);
      return events;
    }

    // ============================================
    // FILTER: Check if this is a price/tick event
    // Only process if NOT an agent activity (already filtered above)
    // ============================================
    // Handle different possible message formats from the backend
    // Format 1: Direct MarketEvent format
    if (message.type && message.payload) {
      // If it's already a MarketEvent, return it
      if (message.type === 'AGENT_ACTIVITY') {
        return [message as MarketEvent];
      }
      // Otherwise, it's a price event (INDEX_TICK, SECTOR_TICK, etc.)
      hasPriceUpdate = true;
      return [message as MarketEvent];
    }

    // Format 1.5: Tick data with prices object {tick: number, prices: {instrumentId: price}}
    // Also supports: {tick: number, prices: {instrumentId: {price, open, high, low, close, volume}}}
    if (message.tick !== undefined && message.prices && typeof message.prices === 'object') {
      hasPriceUpdate = true;
      // Update simulation status with tick number (if provided) or increment
      if (typeof message.tick === 'number') {
        events.push({
          type: 'SIM_STATUS',
          payload: {
            running: true,
            speed: state.simStatus.speed,
            tickCount: message.tick,
          },
        });
      }
      
      Object.entries(message.prices).forEach(([instrumentId, priceData]: [string, any]) => {
        const instrument = state.instruments[instrumentId];
        if (!instrument) {
          // Try to find by partial match (e.g., "SP500" vs "SP_500")
          const foundId = Object.keys(state.instruments).find(id => 
            id.toLowerCase().includes(instrumentId.toLowerCase()) || 
            instrumentId.toLowerCase().includes(id.toLowerCase())
          );
          if (foundId) {
            const foundInstrument = state.instruments[foundId];
            if (foundInstrument) {
              // Handle both simple price number and full tick object
              const isFullTick = typeof priceData === 'object' && priceData !== null;
              const newPrice = isFullTick ? Number(priceData.price || priceData.close) : Number(priceData);
              const previousPrice = foundInstrument.price;
              const history = state.tickHistory[foundId] || [];
              const firstPrice = history[0]?.close || foundInstrument.price;
              const changePercent = ((newPrice - firstPrice) / firstPrice) * 100;
              
              // Use provided range or generate cosmetic range
              const range = isFullTick && priceData.high && priceData.low
                ? { low: Number(priceData.low), high: Number(priceData.high) }
                : { low: newPrice * 0.995, high: newPrice * 1.005 };
              
              if (foundId === 'SP500') {
                events.push({
                  type: 'INDEX_TICK',
                  payload: { 
                    price: newPrice, 
                    previousPrice, 
                    changePercent, 
                    range, 
                    timestamp: isFullTick ? (priceData.timestamp || timestamp) : timestamp,
                  },
                });
              } else if (foundId.startsWith('SECTOR_')) {
                const sectorId = foundId.replace('SECTOR_', '') as SectorId;
                events.push({
                  type: 'SECTOR_TICK',
                  payload: { 
                    sectorId, 
                    price: newPrice, 
                    previousPrice, 
                    changePercent, 
                    range, 
                    timestamp: isFullTick ? (priceData.timestamp || timestamp) : timestamp,
                  },
                });
              }
            }
          }
          return;
        }
        
        // Handle both simple price number and full tick object
        const isFullTick = typeof priceData === 'object' && priceData !== null;
        const newPrice = isFullTick ? Number(priceData.price || priceData.close) : Number(priceData);
        const previousPrice = instrument.price;
        const history = state.tickHistory[instrumentId] || [];
        const firstPrice = history[0]?.close || instrument.price;
        const changePercent = ((newPrice - firstPrice) / firstPrice) * 100;
        
        // Use provided range or generate cosmetic range
        const range = isFullTick && priceData.high && priceData.low
          ? { low: Number(priceData.low), high: Number(priceData.high) }
          : { low: newPrice * 0.995, high: newPrice * 1.005 };
        
        if (instrumentId === 'SP500') {
          events.push({
            type: 'INDEX_TICK',
            payload: { 
              price: newPrice, 
              previousPrice, 
              changePercent, 
              range, 
              timestamp: isFullTick ? (priceData.timestamp || timestamp) : timestamp,
            },
          });
        } else if (instrumentId.startsWith('SECTOR_')) {
          const sectorId = instrumentId.replace('SECTOR_', '') as SectorId;
          events.push({
            type: 'SECTOR_TICK',
            payload: { 
              sectorId, 
              price: newPrice, 
              previousPrice, 
              changePercent, 
              range, 
              timestamp: isFullTick ? (priceData.timestamp || timestamp) : timestamp,
            },
          });
        }
      });
      return events;
    }

    // Format 2: Price update with instrument ID (various field names)
    // Supports: {instrumentId: "SP500", price: 100, open: 99, high: 101, low: 98, close: 100, volume: 1000, tick: 5, timestamp: ...}
    // Only process if NOT an agent activity
    const instrumentId = message.instrumentId || message.instrument_id || message.symbol || message.id;
    if (message.price !== undefined && instrumentId && message.event !== 'agent_activity' && message.type !== 'agent_activity') {
      hasPriceUpdate = true;
      // Update simulation status with tick number if provided, otherwise increment
      if (typeof message.tick === 'number') {
        events.push({
          type: 'SIM_STATUS',
          payload: {
            running: true,
            speed: state.simStatus.speed,
            tickCount: message.tick,
          },
        });
      }
      const instrument = state.instruments[instrumentId];
      if (!instrument) return events;

      const newPrice = Number(message.price);
      const previousPrice = instrument.price;
      const history = state.tickHistory[instrumentId] || [];
      const firstPrice = history[0]?.close || instrument.price;
      const changePercent = ((newPrice - firstPrice) / firstPrice) * 100;

      // Use provided range (high/low) or generate cosmetic range
      const range = (message.high !== undefined && message.low !== undefined)
        ? { low: Number(message.low), high: Number(message.high) }
        : { low: newPrice * 0.995, high: newPrice * 1.005 };

      // Build payload with optional fields
      const basePayload = {
        price: newPrice,
        previousPrice,
        changePercent,
        range,
        timestamp: message.timestamp || timestamp,
        // Include OHLCV if provided (will be used by reducer)
        ...(message.open !== undefined && { open: Number(message.open) }),
        ...(message.high !== undefined && { high: Number(message.high) }),
        ...(message.low !== undefined && { low: Number(message.low) }),
        ...(message.close !== undefined && { close: Number(message.close) }),
        ...(message.volume !== undefined && { volume: Number(message.volume) }),
      };

      if (instrumentId === 'SP500') {
        events.push({
          type: 'INDEX_TICK',
          payload: basePayload as any,
        });
      } else if (instrumentId.startsWith('SECTOR_')) {
        const sectorId = instrumentId.replace('SECTOR_', '') as SectorId;
        events.push({
          type: 'SECTOR_TICK',
          payload: { ...basePayload, sectorId } as any,
        });
      }
    }

    // Format 3: Array of events (mixed price and agent activity)
    if (Array.isArray(message)) {
      message.forEach((item: any) => {
        // Filter: Check if it's an agent activity
        const hasAgentFields = item.agent_name !== undefined || item.agentName !== undefined || item.agent_type !== undefined || item.agentType !== undefined;
        const hasPriceField = item.price !== undefined || item.prices !== undefined;
        
        if (item.event === 'agent_activity' || item.event === 'agent' || item.type === 'agent_activity' || item.type === 'AGENT_ACTIVITY' || item.event_type === 'agent_activity' || (hasAgentFields && !hasPriceField)) {
          // Agent activity - don't mark as price update
          const activityPayload: AgentActivityPayload = {
            id: item.id || item.activity_id || item.activityId || crypto.randomUUID(),
            timestamp: item.timestamp || timestamp,
            agentType: (item.agent_type || item.agentType || 'institutional') as AgentActivityPayload['agentType'],
            agentName: item.agent_name || item.agentName || 'Agent',
            action: (item.action || 'rebalanced') as AgentActivityPayload['action'],
            target: item.target || item.sector || 'overall market',
            summary: item.summary || item.message || item.content || `${item.agent_name || item.agentName || 'Agent'} ${item.action || 'acted'} on ${item.target || item.sector || 'market'}`,
          };
          events.push({
            type: 'AGENT_ACTIVITY',
            payload: activityPayload,
          });
          console.log('✅ Parsed agent activity from array:', activityPayload);
        } 
        // Filter: Check if it's a price event
        else if (item.price !== undefined || item.instrumentId || item.instrument_id || item.prices) {
          hasPriceUpdate = true; // Mark that we have a price update in this array
          const parsed = parseWebSocketMessage(JSON.stringify(item), state, true); // Recursive call
          events.push(...parsed);
        }
      });
      return events;
    }

    // Format 4: Simple price update (assume SP500 if no instrument specified)
    // Supports: {price: 100, tick: 5, open: 99, high: 101, low: 98, close: 100, volume: 1000, timestamp: ...}
    // Only process if it's not an agent activity (already filtered above)
    if (message.price !== undefined && !message.instrumentId && message.event !== 'agent_activity' && message.type !== 'agent_activity') {
      hasPriceUpdate = true;
      // Update simulation status with tick number if provided, otherwise increment
      if (typeof message.tick === 'number') {
        events.push({
          type: 'SIM_STATUS',
          payload: {
            running: true,
            speed: state.simStatus.speed,
            tickCount: message.tick,
          },
        });
      }
      
      const instrument = state.instruments['SP500'];
      if (instrument) {
        const newPrice = Number(message.price);
        const previousPrice = instrument.price;
        const history = state.tickHistory['SP500'] || [];
        const firstPrice = history[0]?.close || instrument.price;
        const changePercent = ((newPrice - firstPrice) / firstPrice) * 100;

        // Use provided range (high/low) or generate cosmetic range
        const range = (message.high !== undefined && message.low !== undefined)
          ? { low: Number(message.low), high: Number(message.high) }
          : { low: newPrice * 0.995, high: newPrice * 1.005 };

        // Build payload with optional fields
        const basePayload = {
          price: newPrice,
          previousPrice,
          changePercent,
          range,
          timestamp: message.timestamp || timestamp,
          // Include OHLCV if provided (will be used by reducer)
          ...(message.open !== undefined && { open: Number(message.open) }),
          ...(message.high !== undefined && { high: Number(message.high) }),
          ...(message.low !== undefined && { low: Number(message.low) }),
          ...(message.close !== undefined && { close: Number(message.close) }),
          ...(message.volume !== undefined && { volume: Number(message.volume) }),
        };

        events.push({
          type: 'INDEX_TICK',
          payload: basePayload as any,
        });
        
        // Check for portfolio values in the message
        if (message.portfolios && typeof message.portfolios === 'object') {
          console.log('💰 Portfolio update received:', message.portfolios);
          events.push({
            type: 'PORTFOLIO_UPDATE',
            payload: message.portfolios,
          });
        }
        
        // Check for top movers (gainers and losers)
        if (message.top_gainers || message.top_losers) {
          console.log('📊 Top movers received:', { gainers: message.top_gainers?.length, losers: message.top_losers?.length });
          events.push({
            type: 'TOP_MOVERS_UPDATE',
            payload: {
              gainers: message.top_gainers || [],
              losers: message.top_losers || [],
            },
          });
        }
      }
    }

    // If we processed a price update and didn't explicitly set a tick number, increment the day counter
    // Only do this at the top level (not in recursive calls) to avoid double increments
    if (!isRecursive && hasPriceUpdate && !events.some(e => e.type === 'SIM_STATUS')) {
      const newTickCount = Math.min(state.simStatus.tickCount + 1, state.simStatus.maxTicks);
      events.push({
        type: 'SIM_STATUS',
        payload: {
          running: state.simStatus.running,
          speed: state.simStatus.speed,
          tickCount: newTickCount,
        },
      });
      console.log('📈 Incremented day counter:', newTickCount);
    }

    return events;
  } catch (error) {
    console.error('Error parsing WebSocket message:', error, data);
    return [];
  }
}

// Custom agent config for starting simulation
interface CustomAgentConfig {
  name: string;
  prompt: string;
  capital?: number;
}

export function useMarketEventStream(
  state: MarketStore,
  dispatch: React.Dispatch<MarketAction>
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [simulationStarted, setSimulationStarted] = useState(false);
  
  // Keep refs updated
  useEffect(() => {
    stateRef.current = state;
    dispatchRef.current = dispatch;
  }, [state, dispatch]);
  
  // Function to start simulation with custom agent config
  const startSimulation = (customAgent?: CustomAgentConfig) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot start simulation');
      return false;
    }
    
    if (simulationStarted) {
      console.warn('Simulation already started');
      return false;
    }
    
    const startCommand: any = {
      command: "start_simulation",
      num_ticks: 5,
      tick_delay: 1.0
    };
    
    if (customAgent && customAgent.prompt) {
      startCommand.custom_agent = {
        name: customAgent.name,
        prompt: customAgent.prompt,
        capital: customAgent.capital || 100000
      };
      console.log('🎮 Starting with custom agent:', customAgent.name, 'Capital:', customAgent.capital);
    }
    
    wsRef.current.send(JSON.stringify(startCommand));
    console.log('Sent start simulation command:', startCommand);
    setSimulationStarted(true);
    return true;
  };
  
  // WebSocket connection
  useEffect(() => {
    const connect = () => {
      try {
        console.log('Connecting to WebSocket:', WS_URL);
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected');
          reconnectAttemptsRef.current = 0;
          setIsWebSocketConnected(true);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          
          // Don't auto-start - wait for user to create trader profile
          console.log('WebSocket ready. Waiting for user to start simulation...');
        };

        wsRef.current.onmessage = (event) => {
          try {
            // Log raw WebSocket message
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📨 RAW WebSocket Message Received:');
            console.log('Data:', event.data);
            console.log('Type:', typeof event.data);
            console.log('Timestamp:', new Date().toISOString());
            
            // Try to parse and log parsed JSON
            let parsedData;
            try {
              parsedData = JSON.parse(event.data);
              console.log('✅ Parsed JSON:', parsedData);
              console.log('Keys:', Object.keys(parsedData));
            } catch (parseError) {
              console.warn('⚠️ Failed to parse as JSON:', parseError);
              console.log('Raw string:', event.data);
            }
            
            // Use ref to get latest state
            const events = parseWebSocketMessage(event.data, stateRef.current);
            
            if (events.length > 0) {
              console.log(`✅ Parsed ${events.length} market event(s):`, events);
              events.forEach((marketEvent, index) => {
                console.log(`  Event ${index + 1}:`, {
                  type: marketEvent.type,
                  payload: marketEvent.payload,
                });
                if (marketEvent.type === 'AGENT_ACTIVITY') {
                  console.log('🤖 AGENT_ACTIVITY Details:', marketEvent.payload);
                }
                dispatchRef.current({ type: 'APPLY_EVENT', event: marketEvent });
              });
            } else {
            // Only warn if it's not a status message (connected, error, etc.)
            if (parsedData && (parsedData.type === 'connected' || parsedData.type === 'error' || parsedData.type === 'status')) {
              console.log('ℹ️ Status message (not an event):', parsedData);
            } else {
              console.warn('⚠️ No events parsed from message');
              console.log('Original message:', event.data);
              console.log('Parsed data:', parsedData);
              console.log('Why? Check if message has "event" field or "price" field');
            }
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          } catch (error) {
            console.error('❌ Error handling WebSocket message:', error);
            console.error('Message data:', event.data);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.error('Failed to connect to:', WS_URL);
        };

        wsRef.current.onclose = (event) => {
          console.log('❌ WebSocket disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          setIsWebSocketConnected(false);
          
          // Don't reconnect if it was a clean close (code 1000)
          if (event.code === 1000) {
            console.log('WebSocket closed cleanly, not reconnecting');
            return;
          }
          
          // Reconnect with exponential backoff (max 30 seconds)
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsWebSocketConnected(false);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [dispatch, state]);

  // Return hook utilities
  return {
    isConnected: isWebSocketConnected,
    isSimulationStarted: simulationStarted,
    startSimulation,
  };
}
