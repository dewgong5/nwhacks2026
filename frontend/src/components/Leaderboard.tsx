import { motion, AnimatePresence } from 'framer-motion';
import { TraderResult } from '@/types/trading';
import { Trophy, TrendingUp, TrendingDown, Star, Zap, Building2, Users, Brain, Cpu } from 'lucide-react';
import { Sparkline } from './Sparkline';

interface LeaderboardProps {
  traders: TraderResult[];
}

const traderTypeConfig = {
  institutional: { icon: Building2, label: 'Institutional', className: 'trader-institutional' },
  retail: { icon: Users, label: 'Retail', className: 'trader-retail' },
  quant: { icon: Brain, label: 'Quant', className: 'trader-quant' },
  hft: { icon: Zap, label: 'HFT', className: 'trader-hft' },
  custom: { icon: Cpu, label: 'Custom AI', className: 'trader-custom' },
};

const rankBadge = (rank: number) => {
  if (rank === 1) return { icon: '🥇', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  if (rank === 2) return { icon: '🥈', className: 'bg-gray-400/20 text-gray-300 border-gray-400/30' };
  if (rank === 3) return { icon: '🥉', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
  return { icon: `${rank}`, className: 'bg-secondary text-muted-foreground border-border' };
};

export function Leaderboard({ traders }: LeaderboardProps) {
  return (
    <div className="glass-card p-4 h-full overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h2 className="font-semibold text-lg">Live Leaderboard</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {traders.map((trader) => {
            const config = traderTypeConfig[trader.type];
            const Icon = config.icon;
            const badge = rankBadge(trader.rank);
            const pnlChange = trader.currentPnL - trader.previousPnL;
            const isUp = pnlChange >= 0;
            const rankChanged = trader.rank !== trader.previousRank;

            return (
              <motion.div
                key={trader.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`glass-card-hover p-3 ${trader.isUser ? 'ring-2 ring-primary/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <motion.div 
                    animate={rankChanged ? { scale: [1, 1.2, 1] } : {}}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${badge.className}`}
                  >
                    {badge.icon}
                  </motion.div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {trader.name}
                        {trader.isUser && <Star className="inline-block ml-1 h-3 w-3 text-primary" />}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${config.className}`}>
                      <Icon size={10} />
                      <span>{config.label}</span>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="w-16 h-6">
                    <Sparkline data={trader.sparklineData} isPositive={trader.currentPnL > 0} />
                  </div>

                  {/* PnL */}
                  <div className="text-right min-w-[80px]">
                    <motion.div 
                      key={trader.currentPnL.toFixed(0)}
                      initial={{ opacity: 0.7, y: isUp ? 3 : -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-mono font-bold tabular-nums ${
                        trader.currentPnL >= 0 ? 'text-gain' : 'text-loss'
                      }`}
                    >
                      {trader.currentPnL >= 0 ? '+' : ''}${Math.abs(trader.currentPnL).toLocaleString()}
                    </motion.div>
                    <div className={`text-xs flex items-center justify-end gap-0.5 ${
                      isUp ? 'text-gain/70' : 'text-loss/70'
                    }`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      <span className="font-mono tabular-nums">
                        {isUp ? '+' : ''}{pnlChange.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span>Sharpe: <span className="text-foreground font-medium">{trader.sharpe.toFixed(1)}</span></span>
                  <span>Win: <span className="text-foreground font-medium">{trader.winRate}%</span></span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
