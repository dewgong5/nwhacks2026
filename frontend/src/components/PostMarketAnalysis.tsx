// ============================================
// MarketMind - Post-Market Analysis Screen
// Shows after session completes
// ============================================

import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Home, 
  RefreshCw,
  Target,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMarketStore, selectIndex, selectTopPerformers, selectBottomPerformers } from '@/store/marketStore';
import { TraderResult } from '@/types/trading';
import { cn } from '@/lib/utils';

interface PostMarketAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  userTrader?: TraderResult;
}

export function PostMarketAnalysis({ isOpen, onClose, onRestart, userTrader }: PostMarketAnalysisProps) {
  const { state } = useMarketStore();
  const index = selectIndex(state);
  const topPerformers = selectTopPerformers(state, 3);
  const bottomPerformers = selectBottomPerformers(state, 3);
  
  // Find user's agent in leaderboard to get actual P&L
  const userAgentResult = state.simulationResults?.leaderboard?.find(
    a => a.id === 'my_agent' || a.type === 'custom'
  );
  
  // Get leaderboard sorted by P&L % (already sorted this way from backend)
  const topByPnlPct = state.simulationResults?.leaderboard?.slice(0, 3) || [];
  
  // Get leaderboard sorted by absolute profit $
  const topByProfit = state.simulationResults?.leaderboard
    ? [...state.simulationResults.leaderboard].sort((a, b) => b.pnl - a.pnl).slice(0, 3)
    : [];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-primary/20">
        <DialogTitle className="sr-only">Post-Market Analysis</DialogTitle>
        
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-background to-background p-6 border-b border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Session Complete</h2>
              <p className="text-muted-foreground">Markets are now closed</p>
            </div>
          </motion.div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* User Performance (if trader exists and we have results) */}
          {userTrader && userAgentResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 border border-primary/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-primary" />
                <h3 className="font-semibold">Your Performance - {userTrader.name}</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Final Rank</p>
                  <p className="text-2xl font-bold text-primary">#{userAgentResult.rank}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Return %</p>
                  <p className={cn(
                    "text-2xl font-mono font-bold",
                    userAgentResult.pnl_pct >= 0 ? 'text-gain' : 'text-loss'
                  )}>
                    {userAgentResult.pnl_pct >= 0 ? '+' : ''}{userAgentResult.pnl_pct.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Profit/Loss</p>
                  <p className={cn(
                    "text-2xl font-mono font-bold",
                    userAgentResult.pnl >= 0 ? 'text-gain' : 'text-loss'
                  )}>
                    ${userAgentResult.pnl >= 0 ? '+' : ''}{userAgentResult.pnl.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Market Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-primary" />
              <h3 className="font-semibold">Market Summary</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* S&P 500 */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Market Index</p>
                <p className={cn(
                  "text-lg font-mono font-bold",
                  index && index.changePercent >= 0 ? 'text-gain' : 'text-loss'
                )}>
                  {index && index.changePercent >= 0 ? '+' : ''}{index?.changePercent.toFixed(2)}%
                </p>
              </div>
              
              {/* Session Length */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Session Length</p>
                <p className="text-lg font-mono font-bold">
                  {state.simStatus.maxTicks} days
                </p>
              </div>
              
              {/* Final Index Price */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Final Index</p>
                <p className="text-lg font-mono font-bold">
                  {state.simulationResults?.marketIndex?.toFixed(2) || index?.price.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Sector Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Top Performers */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-gain" />
                <h4 className="text-sm font-semibold">Top Performers</h4>
              </div>
              <div className="space-y-2">
                {topPerformers.map((sector, i) => (
                  <div key={sector.id} className="flex justify-between items-center">
                    <span className="text-sm truncate">{sector.label}</span>
                    <span className="text-sm font-mono text-gain">
                      +{sector.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bottom Performers */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-loss" />
                <h4 className="text-sm font-semibold">Laggards</h4>
              </div>
              <div className="space-y-2">
                {bottomPerformers.map((sector, i) => (
                  <div key={sector.id} className="flex justify-between items-center">
                    <span className="text-sm truncate">{sector.label}</span>
                    <span className="text-sm font-mono text-loss">
                      {sector.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Two Leaderboards Side by Side */}
          {state.simulationResults?.leaderboard && state.simulationResults.leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Top 3 by Return % */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-yellow-400" />
                  <h3 className="font-semibold">Top Return %</h3>
                </div>
                
                <div className="space-y-2">
                  {topByPnlPct.map((agent, i) => (
                    <div 
                      key={agent.id} 
                      className={cn(
                        "flex justify-between items-center p-2 rounded-lg",
                        agent.id === 'my_agent' || agent.type === 'custom' 
                          ? "bg-primary/20 border border-primary/30" 
                          : "bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="font-medium text-sm truncate max-w-[120px]">{agent.name}</span>
                      </div>
                      <p className={cn("font-mono font-bold", agent.pnl_pct >= 0 ? 'text-gain' : 'text-loss')}>
                        {agent.pnl_pct >= 0 ? '+' : ''}{agent.pnl_pct.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top 3 by Profit $ */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={16} className="text-yellow-400" />
                  <h3 className="font-semibold">Top Profit $</h3>
                </div>
                
                <div className="space-y-2">
                  {topByProfit.map((agent, i) => (
                    <div 
                      key={agent.id} 
                      className={cn(
                        "flex justify-between items-center p-2 rounded-lg",
                        agent.id === 'my_agent' || agent.type === 'custom' 
                          ? "bg-primary/20 border border-primary/30" 
                          : "bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="font-medium text-sm truncate max-w-[120px]">{agent.name}</span>
                      </div>
                      <p className={cn("font-mono font-bold", agent.pnl >= 0 ? 'text-gain' : 'text-loss')}>
                        ${agent.pnl >= 0 ? '+' : ''}{agent.pnl.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 pt-2"
          >
            <Button
              variant="outline"
              onClick={onClose}
              className="gap-2"
            >
              <Home size={16} />
              Back to Dashboard
            </Button>
            <Button
              onClick={onRestart}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Start New Session
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
