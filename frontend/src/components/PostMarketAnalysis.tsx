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
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMarketStore, selectIndex, selectTopPerformers, selectBottomPerformers, selectSectors } from '@/store/marketStore';
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
  const sectors = selectSectors(state);
  
  const positiveCount = sectors.filter(s => s.changePercent > 0).length;
  const breadth = (positiveCount / sectors.length) * 100;
  
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
          {/* User Performance (if trader exists) */}
          {userTrader && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-primary" />
                <h3 className="font-semibold">Your Performance</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Final Rank</p>
                  <p className="text-2xl font-bold text-primary">#{userTrader.rank}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total PnL</p>
                  <p className={cn(
                    "text-2xl font-mono font-bold",
                    userTrader.currentPnL >= 0 ? 'text-gain' : 'text-loss'
                  )}>
                    {userTrader.currentPnL >= 0 ? '+' : ''}${Math.abs(userTrader.currentPnL).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Strategy</p>
                  <p className="text-lg font-medium capitalize">{userTrader.type}</p>
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* S&P 500 */}
              <div>
                <p className="text-xs text-muted-foreground">S&P 500</p>
                <p className={cn(
                  "text-lg font-mono font-bold",
                  index && index.changePercent >= 0 ? 'text-gain' : 'text-loss'
                )}>
                  {index && index.changePercent >= 0 ? '+' : ''}{index?.changePercent.toFixed(2)}%
                </p>
              </div>
              
              {/* Breadth */}
              <div>
                <p className="text-xs text-muted-foreground">Market Breadth</p>
                <p className={cn(
                  "text-lg font-mono font-bold",
                  breadth > 50 ? 'text-gain' : 'text-loss'
                )}>
                  {breadth.toFixed(0)}% positive
                </p>
              </div>
              
              {/* Session Length */}
              <div>
                <p className="text-xs text-muted-foreground">Session Length</p>
                <p className="text-lg font-mono font-bold">
                  {state.simStatus.maxTicks} days
                </p>
              </div>
              
              {/* Total Ticks */}
              <div>
                <p className="text-xs text-muted-foreground">Data Points</p>
                <p className="text-lg font-mono font-bold">
                  {state.simStatus.tickCount}
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
