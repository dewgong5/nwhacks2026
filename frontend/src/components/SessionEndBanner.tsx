// ============================================
// MarketMind - Session End Banner
// Shows when simulation reaches the end
// ============================================

import { motion } from 'framer-motion';
import { Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionEndBannerProps {
  onViewAnalysis: () => void;
}

export function SessionEndBanner({ onViewAnalysis }: SessionEndBannerProps) {
  return (
    <motion.div 
      className="glass-card p-4 border-primary/30 bg-primary/5"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Session Complete</h3>
            <p className="text-sm text-muted-foreground">
              Markets are now closed. Trading has been disabled.
            </p>
          </div>
        </div>
        
        <Button onClick={onViewAnalysis} className="gap-2">
          <BarChart3 size={16} />
          View Post-Market Analysis
        </Button>
      </div>
    </motion.div>
  );
}
