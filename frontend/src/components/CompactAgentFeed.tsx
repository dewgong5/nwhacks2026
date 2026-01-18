// ============================================
// MarketMind - Compact Agent Activity Feed
// Horizontal compact version for under the chart
// ============================================

import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { AgentActivityPayload } from '@/types/market';
import { useMarketStore, selectAgentActivities } from '@/store/marketStore';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const AGENT_TYPE_COLORS: Record<AgentActivityPayload['agentType'], string> = {
  institutional: 'text-trader-institutional',
  retail: 'text-trader-retail',
  quant: 'text-trader-quant',
  hft: 'text-trader-hft',
};

const ACTION_ICONS: Record<AgentActivityPayload['action'], React.ElementType> = {
  increased: TrendingUp,
  decreased: TrendingDown,
  entered: LogIn,
  exited: LogOut,
  rebalanced: RefreshCw,
};

const ACTION_COLORS: Record<AgentActivityPayload['action'], string> = {
  increased: 'text-gain',
  decreased: 'text-loss',
  entered: 'text-gain',
  exited: 'text-loss',
  rebalanced: 'text-muted-foreground',
};

interface CompactActivityItemProps {
  activity: AgentActivityPayload;
}

const CompactActivityItem = forwardRef<HTMLDivElement, CompactActivityItemProps>(
  ({ activity }, ref) => {
    const Icon = ACTION_ICONS[activity.action];
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-accent/50 transition-colors shrink-0"
      >
        <div className={cn(
          "p-1 rounded-full bg-muted/50 shrink-0",
          ACTION_COLORS[activity.action]
        )}>
          <Icon size={10} />
        </div>
        <span className={cn("text-xs font-medium shrink-0", AGENT_TYPE_COLORS[activity.agentType])}>
          {activity.agentName}
        </span>
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
          {activity.summary.replace(activity.agentName, '').trim()}
        </span>
      </motion.div>
    );
  }
);

CompactActivityItem.displayName = 'CompactActivityItem';

export function CompactAgentFeed() {
  const { state } = useMarketStore();
  // Show ALL activities - no limit, so the log persists throughout the entire simulation
  const activities = selectAgentActivities(state);
  
  return (
    <div className="glass-card p-3 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Activity size={14} className="text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Agent Activity
        </span>
        {activities.length > 0 && (
          <span className="text-xs text-muted-foreground/70 ml-auto">
            {activities.length} events
          </span>
        )}
      </div>
      
      {/* Scrollable activity list - vertical */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col gap-2 pr-4 pb-2">
            <AnimatePresence mode="popLayout">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <CompactActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <span className="text-xs text-muted-foreground/50">
                  Waiting for agent activity...
                </span>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
