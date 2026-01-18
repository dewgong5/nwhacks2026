// ============================================
// MarketMind - Agent Activity Feed
// Shows natural-language agent activity summaries
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { AgentActivityPayload } from '@/types/market';
import { useMarketStore, selectAgentActivities } from '@/store/marketStore';
import { cn } from '@/lib/utils';

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

interface ActivityItemProps {
  activity: AgentActivityPayload;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = ACTION_ICONS[activity.action];
  const timeSince = getTimeSince(activity.timestamp);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
    >
      {/* Icon */}
      <div className={cn(
        "p-1.5 rounded-full bg-muted/50",
        ACTION_COLORS[activity.action]
      )}>
        <Icon size={12} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">
          <span className={cn("font-medium", AGENT_TYPE_COLORS[activity.agentType])}>
            {activity.agentName}
          </span>
          {' '}
          <span className="text-muted-foreground">
            {activity.summary.replace(activity.agentName, '').trim()}
          </span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {timeSince}
        </p>
      </div>
    </motion.div>
  );
}

function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AgentActivityFeed() {
  const { state } = useMarketStore();
  const activities = selectAgentActivities(state, 10);
  
  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Agent Activity
          </h2>
          <p className="text-xs text-muted-foreground/70">
            Real-time trading signals
          </p>
        </div>
      </div>
      
      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
              Waiting for agent activity...
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
