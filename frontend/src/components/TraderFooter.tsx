// ============================================
// MarketMind - Trader Footer Panel
// Footer-style panel for trader identity & CTA
// ============================================

import { motion } from 'framer-motion';
import { Rocket, Sparkles, TrendingUp, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TraderResult } from '@/types/trading';
import { cn } from '@/lib/utils';

interface TraderFooterProps {
  userTrader?: TraderResult;
  onJumpIn: () => void;
  onAdjust: () => void;
  isSessionComplete?: boolean;
  onViewAnalysis?: () => void;
  variant?: 'footer' | 'panel';
}

export function TraderFooter({ 
  userTrader, 
  onJumpIn, 
  onAdjust, 
  isSessionComplete, 
  onViewAnalysis,
  variant = 'footer'
}: TraderFooterProps) {
  const isPanel = variant === 'panel';
  if (userTrader) {
    // User has created a profile - show status
    return (
      <div className="glass-card p-4 h-full flex flex-col">
        <div className={cn(
          "flex gap-4",
          isPanel ? "flex-col items-start" : "flex-col md:flex-row items-center md:gap-8"
        )}>
          {/* Trader identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{userTrader.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium capitalize">
                  {userTrader.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active in competition</p>
            </div>
          </div>

          {/* Trading Status */}
          <div className={cn(
            "flex items-center gap-3",
            isPanel && "w-full py-4 border-y border-border/50"
          )}>
            <motion.div
              className="w-3 h-3 rounded-full bg-gain"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="text-lg font-medium">
              <span className="text-primary">{userTrader.name}</span> is trading...
            </p>
          </div>

          {/* Spacer for footer mode */}
          {!isPanel && <div className="flex-1" />}

          {/* Actions */}
          <div className={cn(
            "flex items-center gap-3",
            isPanel && "w-full mt-auto"
          )}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAdjust}
              className={cn("gap-2", isPanel && "flex-1")}
            >
              <Settings2 className="h-4 w-4" />
              Adjust
            </Button>
            {isSessionComplete && onViewAnalysis && (
              <Button 
                onClick={onViewAnalysis}
                size="sm"
                className={cn("gap-2", isPanel && "flex-1")}
              >
                <TrendingUp className="h-4 w-4" />
                Analysis
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No profile yet - show CTA
  return (
    <motion.div 
      className="glass-card p-4 h-full relative overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10" />
      <motion.div 
        className="absolute top-0 right-0 w-64 h-32 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      <div className={cn(
        "relative flex gap-4",
        isPanel ? "flex-col items-start flex-1" : "flex-col md:flex-row items-center md:gap-8"
      )}>
        {/* Title & description */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Think You Can Beat Wall Street?</h3>
            <p className="text-sm text-muted-foreground">
              Write a prompt. Watch it trade.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className={cn(
          "flex gap-4",
          isPanel ? "flex-col gap-2 py-2" : "items-center md:gap-6"
        )}>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-gain shrink-0" />
            <span>Real-time P&L</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-400 shrink-0" />
            <span>You write the rules</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4 text-trader-custom shrink-0" />
            <span>Compete vs. Citadel & friends</span>
          </div>
        </div>

        {/* Spacer */}
        {!isPanel && <div className="flex-1" />}

        {/* CTA button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(isPanel && "w-full mt-auto")}
        >
          <Button 
            onClick={onJumpIn}
            className={cn(
              "h-11 px-6 text-base font-semibold shadow-lg shadow-primary/25",
              isPanel && "w-full"
            )}
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
