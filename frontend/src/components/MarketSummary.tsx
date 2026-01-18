// ============================================
// MarketMind - Market Summary Cards
// Quick overview of market status
// ============================================

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { useMarketStore, selectIndex, selectTopPerformers, selectBottomPerformers } from "@/store/marketStore";
import { cn } from "@/lib/utils";

export function MarketSummary() {
  const { state } = useMarketStore();
  const index = selectIndex(state);
  const topPerformers = selectTopPerformers(state, 3);
  const bottomPerformers = selectBottomPerformers(state, 3);

  if (!index) return null;

  const isPositive = index.changePercent >= 0;
  const regime = isPositive ? "bull" : index.changePercent < -0.5 ? "bear" : "sideways";

  // Calculate market breadth (% of sectors positive)
  const sectors = Object.values(state.instruments).filter((i) => i.kind === "sector");
  const positiveCount = sectors.filter((s) => s.changePercent > 0).length;
  const breadth = (positiveCount / sectors.length) * 100;

  // Calculate average volatility
  const avgVolatility = sectors.reduce((acc, s) => acc + Math.abs(s.changePercent), 0) / sectors.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Market Regime */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Activity size={14} />
          <span>Market Regime</span>
        </div>
        <div
          className={cn(
            "text-2xl font-bold capitalize",
            regime === "bull" ? "text-gain" : regime === "bear" ? "text-loss" : "text-muted-foreground",
          )}
        >
          {regime}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          S&P 500 {isPositive ? "+" : ""}
          {index.changePercent.toFixed(2)}%
        </div>
      </div>

      {/* Market Breadth */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <BarChart3 size={14} />
          <span>Market Breadth</span>
        </div>
        <div
          className={cn(
            "text-2xl font-bold font-mono",
            breadth > 60 ? "text-gain" : breadth < 40 ? "text-loss" : "text-muted-foreground",
          )}
        >
          {breadth.toFixed(0)}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {positiveCount} of {sectors.length} sectors positive
        </div>
      </div>

      {/* Top Performer */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <TrendingUp size={14} className="text-gain" />
          <span>Top Performer</span>
        </div>
        {topPerformers[0] && (
          <>
            <div className="text-lg font-bold text-gain truncate">{topPerformers[0].label}</div>
            <div className="text-sm font-mono text-gain">+{topPerformers[0].changePercent.toFixed(2)}%</div>
          </>
        )}
      </div>

      {/* Bottom Performer */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <TrendingDown size={14} className="text-loss" />
          <span>Laggard</span>
        </div>
        {bottomPerformers[0] && (
          <>
            <div className="text-lg font-bold text-loss truncate">{bottomPerformers[0].label}</div>
            <div className="text-sm font-mono text-loss">{bottomPerformers[0].changePercent.toFixed(2)}%</div>
          </>
        )}
      </div>
    </div>
  );
}
