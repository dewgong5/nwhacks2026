// ============================================
// MarketMind - Compact Agent Activity Feed
// Horizontal compact version for under the chart
// ============================================

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

function CompactActivityItem({ activity }: CompactActivityItemProps) {
  const Icon = ACTION_ICONS[activity.action];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-accent/50 transition-colors whitespace-nowrap shrink-0"
    >
      <div className={cn(
        "p-1 rounded-full bg-muted/50",
        ACTION_COLORS[activity.action]
      )}>
        <Icon size={10} />
      </div>
      <span className={cn("text-xs font-medium", AGENT_TYPE_COLORS[activity.agentType])}>
        {activity.agentName}
      </span>
      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
        {activity.summary.replace(activity.agentName, '').trim()}
      </span>
    </motion.div>
  );
}

export function CompactAgentFeed() {
  const { state } = useMarketStore();
  const activities = selectAgentActivities(state, 8);
  
  return (
    <div className="glass-card p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Activity size={14} className="text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Agent Activity
        </span>
      </div>
      
      {/* Scrollable activity list - vertical */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-2 pr-2">
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
  );
}
