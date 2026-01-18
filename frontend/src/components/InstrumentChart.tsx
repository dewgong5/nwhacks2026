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
  volume: number;
}

/**
 * Generate cosmetic high/low values from close price for visual variety.
 * Uses deterministic pseudo-randomness based on index for consistency.
 * These values are purely aesthetic and not related to actual market data.
 */
function generateCosmeticRange(close: number, index: number): { high: number; low: number } {
  // Deterministic "random" value based on index (for consistency)
  const seed = (index * 17 + close * 0.01) % 1;
  const seed2 = (index * 23 + close * 0.007) % 1;
  
  // High: close + 0.1% to 0.6% (cosmetic upward movement)
  const highOffset = 0.001 + (seed * 0.005);
  const high = close * (1 + highOffset);
  
  // Low: close - 0.1% to 0.6% (cosmetic downward movement)
  const lowOffset = 0.001 + (seed2 * 0.005);
  const low = close * (1 - lowOffset);
  
  return { high, low };
}

export function InstrumentChart() {
  const { state } = useMarketStore();
  const instrument = selectActiveInstrument(state);
  const tickHistory = selectActiveTickHistory(state);
  
  const chartData: ChartDataPoint[] = useMemo(() => 
    tickHistory.map((tick, i) => ({
      index: i,
      price: tick.close,
      volume: tick.volume,
    })),
    [tickHistory]
  );
  
  // Generate cosmetic high/low values for Y-axis domain calculation
  // These are purely for visual variety and not from API data
  const cosmeticRanges = useMemo(() => 
    tickHistory.map((tick, i) => generateCosmeticRange(tick.close, i)),
    [tickHistory]
  );
  
  // Calculate Y-axis domain based on actual price data to show price changes clearly
  // MUST be called before any early returns (Rules of Hooks)
  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) {
      // If no data yet, show empty chart with default range
      return {
        minPrice: 0,
        maxPrice: 100,
      };
    }
    
    // Get actual price range from data
    const prices = chartData.map(d => d.price);
    const actualMin = Math.min(...prices);
    const actualMax = Math.max(...prices);
    const priceRange = actualMax - actualMin;
    
    // If range is very small, ensure minimum visible range
    // Use 10% padding on each side, but at least 2% of the average price
    const avgPrice = (actualMin + actualMax) / 2;
    const minPadding = Math.max(priceRange * 0.1, avgPrice * 0.02);
    
    const calculatedMin = Math.max(0, actualMin - minPadding);
    const calculatedMax = actualMax + minPadding;
    
    // Ensure minimum range for visibility (at least 1% of the average)
    const minRange = avgPrice * 0.01;
    const currentRange = calculatedMax - calculatedMin;
    
    if (currentRange < minRange) {
      const center = (calculatedMin + calculatedMax) / 2;
      return {
        minPrice: Math.max(0, center - minRange / 2),
        maxPrice: center + minRange / 2,
      };
    }
    
    return {
      minPrice: calculatedMin,
      maxPrice: calculatedMax,
    };
  }, [chartData, instrument?.price || 0]);
  
  // Now we can do early returns after all hooks are called
  if (!instrument) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select an instrument to view chart
      </div>
    );
  }

  // Show empty state if no data has been received yet
  if (chartData.length === 0) {
    return (
      <div className="relative h-full w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Waiting for market data...</p>
            <p className="text-xs mt-1">First tick will appear here</p>
          </div>
        </div>
      </div>
    );
  }
  
  const priceChange = instrument.price - instrument.previousPrice;
  const isPositive = priceChange >= 0;
  const firstPrice = tickHistory[0]?.close || instrument.price;
  const overallChange = instrument.price - firstPrice;
  const overallPositive = overallChange >= 0;

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
            tickFormatter={(value) => {
              // Smart formatting based on price magnitude
              if (instrument.kind === 'index') {
                if (value >= 1000) return value.toFixed(0);
                if (value >= 100) return value.toFixed(1);
                return value.toFixed(2);
              } else {
                if (value >= 1000) return `$${value.toFixed(0)}`;
                if (value >= 100) return `$${value.toFixed(1)}`;
                if (value >= 10) return `$${value.toFixed(2)}`;
                return `$${value.toFixed(2)}`;
              }
            }}
            width={70}
            allowDecimals={true}
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
