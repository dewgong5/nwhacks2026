// ============================================
// MarketMind - Instrument Chart (Refactored)
// Instrument-agnostic chart component
// ============================================

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { TickData, MarketInstrument } from '@/types/market';
import { useMarketStore, selectActiveInstrument, selectActiveTickHistory } from '@/store/marketStore';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  index: number;
  price: number;
  high: number;
  low: number;
  volume: number;
}

export function InstrumentChart() {
  const { state } = useMarketStore();
  const instrument = selectActiveInstrument(state);
  const tickHistory = selectActiveTickHistory(state);
  
  const chartData: ChartDataPoint[] = useMemo(() => 
    tickHistory.map((tick, i) => ({
      index: i,
      price: tick.close,
      high: tick.high,
      low: tick.low,
      volume: tick.volume,
    })),
    [tickHistory]
  );
  
  if (!instrument) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select an instrument to view chart
      </div>
    );
  }
  
  const priceChange = instrument.price - instrument.previousPrice;
  const isPositive = priceChange >= 0;
  const firstPrice = tickHistory[0]?.close || instrument.price;
  const overallChange = instrument.price - firstPrice;
  const overallPositive = overallChange >= 0;
  
  const minPrice = chartData.length > 0 
    ? Math.min(...chartData.map(d => d.low)) * 0.998 
    : instrument.price * 0.99;
  const maxPrice = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.high)) * 1.002 
    : instrument.price * 1.01;

  return (
    <div className="relative h-full w-full">
      {/* Price display overlay */}
      <div className="absolute top-2 left-4 z-10">
        <div className="flex items-center gap-3">
          <motion.span 
            key={instrument.price.toFixed(2)}
            initial={{ opacity: 0.5, y: isPositive ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-4xl font-bold font-mono tabular-nums",
              isPositive ? 'text-gain' : 'text-loss'
            )}
          >
            {instrument.kind === 'index' 
              ? instrument.price.toFixed(2)
              : `$${instrument.price.toFixed(2)}`
            }
          </motion.span>
          <motion.div 
            key={`change-${instrument.changePercent.toFixed(2)}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
              isPositive ? 'bg-gain-muted text-gain' : 'bg-loss-muted text-loss'
            )}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-mono tabular-nums">
              {isPositive ? '+' : ''}{instrument.changePercent.toFixed(2)}%
            </span>
          </motion.div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
          <span className="font-medium">{instrument.label}</span>
          <span className="text-muted-foreground/50">•</span>
          <div className={cn(
            "flex items-center gap-1",
            isPositive ? 'text-gain' : 
            instrument.changePercent < 0 ? 'text-loss' : 'text-muted-foreground'
          )}>
            {isPositive ? <TrendingUp size={12} /> : 
             instrument.changePercent < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span className="capitalize">
              {isPositive ? 'Bullish' : instrument.changePercent < 0 ? 'Bearish' : 'Neutral'}
            </span>
          </div>
          {instrument.kind === 'sector' && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70">
                Sector
              </span>
            </>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity size={12} className="text-primary animate-pulse" />
        <span>LIVE</span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 80, right: 20, bottom: 40, left: 20 }}>
          <defs>
            <linearGradient id="instrumentGradientUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--gain))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--gain))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="instrumentGradientDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="index" 
            axisLine={false}
            tickLine={false}
            tick={false}
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(value) => instrument.kind === 'index' ? value.toFixed(0) : `$${value.toFixed(0)}`}
            width={60}
          />
          <ReferenceLine 
            y={firstPrice} 
            stroke="hsl(220, 14%, 25%)" 
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={overallPositive ? 'hsl(var(--gain))' : 'hsl(var(--loss))'}
            strokeWidth={2}
            fill={overallPositive ? 'url(#instrumentGradientUp)' : 'url(#instrumentGradientDown)'}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Volume bars */}
      <div className="absolute bottom-4 left-16 right-4 h-12 flex items-end gap-[2px]">
        {chartData.slice(-50).map((d, i) => {
          const maxVolume = Math.max(...chartData.slice(-50).map(x => x.volume));
          return (
            <div 
              key={i}
              className="flex-1 bg-chart-volume/40 rounded-t-sm transition-all duration-200"
              style={{ height: `${(d.volume / maxVolume) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
