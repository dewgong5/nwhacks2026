import { motion } from 'framer-motion';
import { Rocket, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TraderResult } from '@/types/trading';

interface SidebarCTAProps {
  userTrader?: TraderResult;
  onJumpIn: () => void;
  onAdjust: () => void;
}

export function SidebarCTA({ userTrader, onJumpIn, onAdjust }: SidebarCTAProps) {
  if (userTrader) {
    // User has created a profile - show status
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Your Trader</h3>
            <p className="text-xs text-muted-foreground">Active in competition</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="font-medium">{userTrader.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Rank</span>
            <span className="font-bold text-primary">#{userTrader.rank}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">PnL</span>
            <span className={`font-mono font-bold ${userTrader.currentPnL >= 0 ? 'text-gain' : 'text-loss'}`}>
              {userTrader.currentPnL >= 0 ? '+' : ''}${Math.abs(userTrader.currentPnL).toLocaleString()}
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={onAdjust}
        >
          Adjust Profile
        </Button>
      </div>
    );
  }

  // No profile yet - show CTA
  return (
    <motion.div 
      className="glass-card p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <motion.div 
        className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Think You Can Beat Wall Street?</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          Write a trading strategy in plain English. Your AI agent will go head-to-head with CCL, Jane Street, and more.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-gain" />
            <span>Real-time P&L tracking</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span>You write the rules</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4 text-trader-custom" />
            <span>Compete vs. the big dogs</span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onJumpIn}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
            size="lg"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Jump In
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
