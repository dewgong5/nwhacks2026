// ============================================
// MarketMind - Market Board Component
// Displays S&P 500 Index + All Sectors
// ============================================

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketInstrument } from '@/types/market';
import { useMarketStore, selectIndex, selectSortedSectors } from '@/store/marketStore';
import { cn } from '@/lib/utils';

interface RangeBarProps {
  low: number;
  high: number;
  current: number;
  isPositive: boolean;
}

function RangeBar({ low, high, current, isPositive }: RangeBarProps) {
  const range = high - low;
  const position = range > 0 ? ((current - low) / range) * 100 : 50;
  
  return (
    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden w-full min-w-[80px]">
      <div 
        className={cn(
          "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
          isPositive ? "bg-gain/30" : "bg-loss/30"
        )}
        style={{ width: `${position}%` }}
      />
      <div 
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300",
          isPositive ? "bg-gain" : "bg-loss"
        )}
        style={{ left: `calc(${position}% - 4px)` }}
      />
    </div>
  );
}

interface MarketRowProps {
  instrument: MarketInstrument;
  isActive: boolean;
  onClick: () => void;
  isIndex?: boolean;
}

function MarketRow({ instrument, isActive, onClick, isIndex = false }: MarketRowProps) {
  const isPositive = instrument.changePercent >= 0;
  const changeIntensity = Math.min(Math.abs(instrument.changePercent) / 3, 1);
  
  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "grid grid-cols-[1fr,100px,100px,120px] gap-4 items-center px-4 py-3 cursor-pointer transition-colors rounded-lg",
        isIndex && "bg-primary/5 border border-primary/20",
        isActive && !isIndex && "bg-accent",
        !isActive && !isIndex && "hover:bg-accent/50"
      )}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      {/* Name */}
      <div className="flex items-center gap-2">
        {isIndex && (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
        <span className={cn(
          "font-medium truncate",
          isIndex && "text-primary font-semibold"
        )}>
          {instrument.label}
        </span>
      </div>
      
      {/* Price */}
      <motion.span 
        key={instrument.price.toFixed(2)}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="font-mono text-sm text-right tabular-nums"
      >
        {isIndex ? instrument.price.toFixed(2) : `$${instrument.price.toFixed(2)}`}
      </motion.span>
      
      {/* Change % */}
      <motion.div 
        key={`change-${instrument.changePercent.toFixed(2)}`}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className={cn(
          "flex items-center justify-end gap-1 font-mono text-sm tabular-nums font-medium",
          isPositive ? "text-gain" : "text-loss"
        )}
        style={{
          opacity: 0.5 + changeIntensity * 0.5,
        }}
      >
        {isPositive ? <TrendingUp size={12} /> : instrument.changePercent < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
        <span>{isPositive ? '+' : ''}{instrument.changePercent.toFixed(2)}%</span>
      </motion.div>
      
      {/* Range */}
      <RangeBar 
        low={instrument.range.low}
        high={instrument.range.high}
        current={instrument.price}
        isPositive={isPositive}
      />
    </motion.div>
  );
}

export function MarketBoard() {
  const { state, dispatch } = useMarketStore();
  const index = selectIndex(state);
  const sectors = selectSortedSectors(state);
  
  const handleSelectInstrument = (instrumentId: string) => {
    dispatch({ type: 'SET_ACTIVE_INSTRUMENT', instrumentId });
  };
  
  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Market Board
        </h2>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          S&P 500 Index & Sectors
        </p>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-[1fr,100px,100px,120px] gap-4 px-4 py-2 border-b border-border/30 text-xs text-muted-foreground uppercase tracking-wider">
        <span>Name</span>
        <span className="text-right">Price</span>
        <span className="text-right">Today</span>
        <span className="text-right">Range</span>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        {/* S&P 500 Index (always first) */}
        {index && (
          <MarketRow
            instrument={index}
            isActive={state.activeInstrumentId === 'SP500'}
            onClick={() => handleSelectInstrument('SP500')}
            isIndex
          />
        )}
        
        {/* Divider */}
        <div className="h-px bg-border/30 mx-4 my-2" />
        
        {/* Sectors */}
        {sectors.map((sector) => (
          <MarketRow
            key={sector.id}
            instrument={sector}
            isActive={state.activeInstrumentId === sector.id}
            onClick={() => handleSelectInstrument(sector.id)}
          />
        ))}
      </div>
    </div>
  );
}
