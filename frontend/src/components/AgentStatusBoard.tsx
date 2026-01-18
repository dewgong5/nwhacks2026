// ============================================
// Agent Status Board - Shows real-time agent status
// Client-side rendered from activity events
// Card-based layout
// ============================================

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStore, selectAgentActivities, selectAgentPortfolios } from '@/store/marketStore';
import { cn } from '@/lib/utils';

// Define all agents we're tracking
const AGENTS = [
  { id: 'citadel', name: 'Citadel', emoji: '🏦', type: 'quant' },
  { id: 'jane_street', name: 'Jane Street', emoji: '🏦', type: 'quant' },
  { id: 'blackrock', name: 'BlackRock', emoji: '📊', type: 'institutional' },
  { id: 'vanguard', name: 'Vanguard', emoji: '📊', type: 'institutional' },
  { id: 'retail_1', name: 'Retail 1', emoji: '👤', type: 'retail' },
  { id: 'retail_2', name: 'Retail 2', emoji: '👤', type: 'retail' },
  { id: 'retail_3', name: 'Retail 3', emoji: '👤', type: 'retail' },
  { id: 'retail_4', name: 'Retail 4', emoji: '👤', type: 'retail' },
  { id: 'daytrader', name: 'Daytrader', emoji: '🎰', type: 'retail' },
  { id: 'my_agent', name: 'Your Agent', emoji: '🎮', type: 'custom' },
];

interface AgentStatus {
  status: 'analyzing' | 'traded' | 'idle' | 'holding';
  trades: string[]; // e.g., ["Bought 30 AAPL", "Sold 20 MSFT"]
}

export function AgentStatusBoard() {
  const { state } = useMarketStore();
  const activities = selectAgentActivities(state);
  const portfolios = selectAgentPortfolios(state);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  
  // Track previous P&L for tick-over-tick comparison
  const prevPortfoliosRef = useRef<Record<string, number>>({});
  const [pnlChanges, setPnlChanges] = useState<Record<string, 'up' | 'down' | 'same'>>({});
  
  // Calculate tick-over-tick changes
  useEffect(() => {
    const changes: Record<string, 'up' | 'down' | 'same'> = {};
    
    Object.entries(portfolios).forEach(([agentId, p]) => {
      if (p && p.pnl_pct !== undefined) {
        const prevPnl = prevPortfoliosRef.current[agentId];
        const currentPnl = p.pnl_pct;
        
        if (prevPnl !== undefined) {
          if (currentPnl > prevPnl + 0.05) {
            changes[agentId] = 'up';
          } else if (currentPnl < prevPnl - 0.05) {
            changes[agentId] = 'down';
          } else {
            changes[agentId] = 'same';
          }
        } else {
          // First tick - use overall P&L sign
          changes[agentId] = currentPnl > 0 ? 'up' : currentPnl < 0 ? 'down' : 'same';
        }
        
        // Update prev for next comparison
        prevPortfoliosRef.current[agentId] = currentPnl;
      }
    });
    
    setPnlChanges(changes);
  }, [portfolios]);
  
  // Parse activities to build agent statuses
  useEffect(() => {
    const newStatuses: Record<string, AgentStatus> = {};
    
    // Initialize all agents as analyzing
    AGENTS.forEach(agent => {
      newStatuses[agent.id] = { status: 'analyzing', trades: [] };
    });
    
    // Parse recent activities (last 50 or so)
    const recentActivities = activities.slice(0, 50);
    
    recentActivities.forEach(activity => {
      const summary = activity.summary || '';
      const agentName = activity.agentName?.toUpperCase() || '';
      
      // Match agent by name - normalize both to handle underscores/spaces
      const normalizedAgentName = agentName.replace(/[_\s]/g, '');
      
      const matchedAgent = AGENTS.find(a => {
        const normalizedId = a.id.toUpperCase().replace(/[_\s]/g, '');
        const normalizedName = a.name.toUpperCase().replace(/[_\s]/g, '');
        
        return (
          normalizedAgentName.includes(normalizedName) ||
          normalizedAgentName.includes(normalizedId) ||
          agentName.includes(a.id.toUpperCase()) ||
          agentName.includes(a.id.toUpperCase().replace('_', ' ')) ||
          (a.id === 'my_agent' && (agentName.includes('MY_AGENT') || agentName.includes('YOUR') || agentName.includes('MY AGENT')))
        );
      });
      
      if (matchedAgent) {
        const agentId = matchedAgent.id;
        if (!newStatuses[agentId]) {
          newStatuses[agentId] = { status: 'idle', trades: [] };
        }
        
        // Parse the trade from summary
        if (summary.includes('BUYS') || summary.includes('SELLS') || 
            summary.includes('BUY') || summary.includes('SELL')) {
          newStatuses[agentId].status = 'traded';
          
          // Extract trade info
          const buyMatch = summary.match(/BUYS?\s+(\d+)\s+(\w+)/i);
          const sellMatch = summary.match(/SELLS?\s+(\d+)\s+(\w+)/i);
          
          if (buyMatch) {
            newStatuses[agentId].trades.push(`+${buyMatch[1]} ${buyMatch[2]}`);
          }
          if (sellMatch) {
            newStatuses[agentId].trades.push(`-${sellMatch[1]} ${sellMatch[2]}`);
          }
        }
      }
    });
    
    // Retail holders that didn't trade are "holding"
    AGENTS.forEach(agent => {
      if (agent.type === 'retail' && newStatuses[agent.id].status === 'analyzing') {
        newStatuses[agent.id].status = 'holding';
      }
    });
    
    setAgentStatuses(newStatuses);
  }, [activities]);
  
  // Get status color
  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'analyzing': return 'text-yellow-400';
      case 'traded': return 'text-gain';
      case 'holding': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };
  
  // Get status display text
  const getStatusText = (status: AgentStatus) => {
    if (status.status === 'analyzing') {
      return 'Analyzing...';
    }
    if (status.status === 'holding') {
      return 'Holding';
    }
    if (status.status === 'traded' && status.trades.length > 0) {
      // Show up to 2 trades
      return status.trades.slice(0, 2).join(', ');
    }
    return 'No trades';
  };
  
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          <h3 className="font-semibold">Agent Status</h3>
        </div>
        <span className="text-sm text-muted-foreground font-mono">
          Day {state.simStatus.tickCount}
        </span>
      </div>
      
      {/* Agent Cards Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {AGENTS.map((agent, index) => {
            const status = agentStatuses[agent.id] || { status: 'analyzing', trades: [] };
            const portfolio = portfolios[agent.id];
            const isCustomAgent = agent.id === 'my_agent';
            const isAnalyzing = status.status === 'analyzing';
            const hasPnL = portfolio && portfolio.pnl_pct !== undefined;
            
            // Get tick-over-tick change direction
            const pnlChange = pnlChanges[agent.id] || 'same';
            const isPositive = pnlChange === 'up';
            const isNegative = pnlChange === 'down';
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl text-center min-h-[140px]",
                  "bg-secondary/50 border transition-all duration-500",
                  isCustomAgent 
                    ? "border-primary/50 bg-primary/10" 
                    : "border-border hover:border-primary/30",
                  isAnalyzing && "border-yellow-400/30"
                )}
              >
                {/* Analyzing indicator dot - subtle slow pulse */}
                {isAnalyzing && (
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400"
                    animate={{ opacity: [0.8, 0.3, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                
                {/* Emoji */}
                <span className="text-2xl mb-1">{agent.emoji}</span>
                
                {/* Name */}
                <span className={cn(
                  "font-semibold text-sm truncate w-full",
                  isCustomAgent && "text-primary"
                )}>
                  {agent.name}
                </span>
                
                {/* Portfolio Balance & P&L */}
                {hasPnL && (
                  <div className="flex flex-col items-center mt-1">
                    {/* Balance */}
                    <span className="text-xs font-mono text-muted-foreground">
                      ${portfolio.value >= 1000000 
                        ? (portfolio.value / 1000000).toFixed(2) + 'M' 
                        : portfolio.value >= 1000 
                          ? (portfolio.value / 1000).toFixed(0) + 'K'
                          : portfolio.value.toFixed(0)
                      }
                    </span>
                    {/* P&L */}
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-bold",
                      isPositive && "text-gain",
                      isNegative && "text-loss",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}>
                      {isPositive && <TrendingUp size={12} />}
                      {isNegative && <TrendingDown size={12} />}
                      <span>{portfolio.pnl_pct >= 0 ? '+' : ''}{portfolio.pnl_pct.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
                
                {/* Status */}
                <div className={cn(
                  "text-xs mt-1 font-mono truncate w-full",
                  getStatusColor(status.status),
                  status.status === 'traded' && status.trades.some(t => t.startsWith('+')) && 'text-gain',
                  status.status === 'traded' && status.trades.every(t => t.startsWith('-')) && 'text-loss'
                )}>
                  {getStatusText(status)}
                </div>
                
                {/* Trade count badge */}
                {status.trades.length > 2 && (
                  <span className="absolute bottom-1 right-1 text-[10px] text-muted-foreground">
                    +{status.trades.length - 2} more
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
