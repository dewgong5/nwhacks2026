// ============================================
// MarketMind - Performance Celebration
// Congratulates user when they outperform others
// ============================================

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Sparkles, Medal } from 'lucide-react';
import { TraderResult } from '@/types/trading';
import { toast } from 'sonner';

interface PerformanceCelebrationProps {
  userTrader?: TraderResult;
}

const celebrationMessages = [
  { rank: 1, message: "🏆 You're #1! Dominating the competition!", icon: Trophy },
  { rank: 2, message: "🥈 Amazing! You've climbed to 2nd place!", icon: Medal },
  { rank: 3, message: "🥉 Great job! You made it to the top 3!", icon: Medal },
  { rank: 5, message: "📈 Rising star! Top 5 and climbing!", icon: TrendingUp },
];

export function PerformanceCelebration({ userTrader }: PerformanceCelebrationProps) {
  const previousRankRef = useRef<number | null>(null);
  const hasShownInitialRef = useRef(false);

  useEffect(() => {
    if (!userTrader) return;

    // Skip initial render celebration
    if (!hasShownInitialRef.current) {
      previousRankRef.current = userTrader.rank;
      hasShownInitialRef.current = true;
      return;
    }

    const prevRank = previousRankRef.current;
    const currentRank = userTrader.rank;

    // Check if rank improved
    if (prevRank !== null && currentRank < prevRank) {
      // Find appropriate celebration message
      const celebration = celebrationMessages.find(c => currentRank <= c.rank);
      
      if (celebration) {
        const Icon = celebration.icon;
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="glass-card p-4 border border-primary/30 shadow-lg shadow-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{celebration.message}</p>
                <p className="text-sm text-muted-foreground">
                  Moved from #{prevRank} → #{currentRank}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
          </motion.div>
        ), {
          duration: 4000,
          position: 'top-center',
        });
      }
    }

    // Check for significant PnL milestone
    if (userTrader.currentPnL > 0 && userTrader.previousPnL <= 0) {
      toast.success("💰 You're now in profit! Keep it up!", {
        duration: 3000,
        position: 'top-center',
      });
    }

    previousRankRef.current = currentRank;
  }, [userTrader?.rank, userTrader?.currentPnL]);

  return null; // This component only triggers toasts
}
