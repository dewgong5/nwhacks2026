import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TickData, MarketData } from '@/types/trading';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LiveChartProps {
  tickHistory: TickData[];
  marketData: MarketData;
}

export function LiveChart({ tickHistory, marketData }: LiveChartProps) {
  const chartData = useMemo(() => 
    tickHistory.map((tick, i) => ({
      index: i,
      price: tick.close,
      high: tick.high,
      low: tick.low,
      volume: tick.volume,
    })),
    [tickHistory]
  );

  const priceChange = marketData.currentPrice - marketData.previousPrice;
  const isPositive = priceChange >= 0;
  const firstPrice = tickHistory[0]?.close || marketData.currentPrice;
  const overallChange = marketData.currentPrice - firstPrice;
  const overallPositive = overallChange >= 0;

  const minPrice = Math.min(...chartData.map(d => d.low)) * 0.998;
  const maxPrice = Math.max(...chartData.map(d => d.high)) * 1.002;

  return (
    <div className="relative h-full w-full">
      {/* Price display overlay */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-3">
          <motion.span 
            key={marketData.currentPrice.toFixed(2)}
            initial={{ opacity: 0.5, y: isPositive ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl font-bold font-mono tabular-nums ${
              isPositive ? 'text-gain' : 'text-loss'
            }`}
          >
            ${marketData.currentPrice.toFixed(2)}
          </motion.span>
          <motion.div 
            key={`change-${priceChange.toFixed(2)}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              isPositive ? 'bg-gain-muted text-gain' : 'bg-loss-muted text-loss'
            }`}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-mono tabular-nums">
              {isPositive ? '+' : ''}{marketData.changePercent.toFixed(2)}%
            </span>
          </motion.div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
          <span className="font-medium">{marketData.symbol}</span>
          <span className="text-muted-foreground/50">•</span>
          <div className={`flex items-center gap-1 ${
            marketData.regime === 'bull' ? 'text-gain' : 
            marketData.regime === 'bear' ? 'text-loss' : 'text-muted-foreground'
          }`}>
            {marketData.regime === 'bull' ? <TrendingUp size={12} /> : 
             marketData.regime === 'bear' ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span className="capitalize">{marketData.regime} Market</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 80, right: 20, bottom: 20, left: 20 }}>
          <defs>
            <linearGradient id="priceGradientUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="priceGradientDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
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
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            width={50}
          />
          <ReferenceLine 
            y={firstPrice} 
            stroke="hsl(220, 14%, 25%)" 
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={overallPositive ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 60%)'}
            strokeWidth={2}
            fill={overallPositive ? 'url(#priceGradientUp)' : 'url(#priceGradientDown)'}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Volume bars */}
      <div className="absolute bottom-4 left-16 right-4 h-12 flex items-end gap-[2px]">
        {chartData.slice(-50).map((d, i) => (
          <div 
            key={i}
            className="flex-1 bg-chart-volume/40 rounded-t-sm transition-all duration-200"
            style={{ height: `${(d.volume / 10000) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
