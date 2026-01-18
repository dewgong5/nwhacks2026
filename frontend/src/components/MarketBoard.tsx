// ============================================
// MarketMind - Market Board Component
// Displays S&P 500 Index + Top Movers (Gainers & Losers)
// ============================================

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketInstrument, StockMover } from '@/types/market';
import { useMarketStore, selectIndex, selectTopMovers } from '@/store/marketStore';
import { cn } from '@/lib/utils';

interface RangeBarProps {
  change: number;  // percent change
  isPositive: boolean;
}

function RangeBar({ change, isPositive }: RangeBarProps) {
  // Map change percent to position (0-100)
  // Assume ±20% as max range
  const normalized = Math.min(Math.abs(change) / 20, 1) * 100;
  
  return (
    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden w-full min-w-[80px]">
      <div 
        className={cn(
          "absolute top-0 h-full rounded-full transition-all duration-300",
          isPositive ? "left-1/2 bg-gain/40" : "right-1/2 bg-loss/40"
        )}
        style={{ width: `${normalized / 2}%` }}
      />
      <div 
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300",
          isPositive ? "bg-gain" : "bg-loss"
        )}
        style={{ 
          left: isPositive 
            ? `calc(50% + ${normalized / 2}% - 4px)` 
            : `calc(50% - ${normalized / 2}% - 4px)` 
        }}
      />
      {/* Center line */}
      <div className="absolute left-1/2 top-0 w-px h-full bg-muted-foreground/30" />
    </div>
  );
}

interface IndexRowProps {
  instrument: MarketInstrument;
  isActive: boolean;
  onClick: () => void;
}

function IndexRow({ instrument, isActive, onClick }: IndexRowProps) {
  const isPositive = instrument.changePercent >= 0;
  
  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "grid grid-cols-[minmax(80px,1fr),80px,90px,minmax(80px,1fr)] gap-2 items-center px-3 py-3 cursor-pointer transition-colors rounded-lg",
        "bg-primary/5 border border-primary/20",
        isActive && "ring-1 ring-primary"
      )}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <span className="font-semibold text-primary whitespace-nowrap">S&P 500</span>
      </div>
      
      <motion.span 
        key={instrument.price.toFixed(2)}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="font-mono text-sm text-right tabular-nums font-medium"
      >
        {instrument.price.toFixed(2)}
      </motion.span>
      
      <motion.div 
        className={cn(
          "flex items-center justify-end gap-1 font-mono text-sm tabular-nums font-semibold",
          isPositive ? "text-gain" : "text-loss"
        )}
      >
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isPositive ? '+' : ''}{instrument.changePercent.toFixed(2)}%</span>
      </motion.div>
      
      <RangeBar change={instrument.changePercent} isPositive={isPositive} />
    </motion.div>
  );
}

interface StockMoverRowProps {
  mover: StockMover;
  rank: number;
}

function StockMoverRow({ mover, rank }: StockMoverRowProps) {
  const isPositive = mover.change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isPositive ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="grid grid-cols-[minmax(80px,1fr),80px,90px,minmax(80px,1fr)] gap-2 items-center px-3 py-2.5 hover:bg-accent/50 rounded-lg transition-colors"
    >
      {/* Ticker */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0",
          isPositive ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"
        )}>
          {rank}
        </span>
        <span className="font-medium text-sm whitespace-nowrap">{mover.ticker}</span>
      </div>
      
      {/* Price */}
      <span className="font-mono text-sm text-right tabular-nums text-muted-foreground">
        ${mover.price.toFixed(2)}
      </span>
      
      {/* Change % */}
      <div className={cn(
        "flex items-center justify-end gap-1 font-mono text-sm tabular-nums font-medium",
        isPositive ? "text-gain" : "text-loss"
      )}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{isPositive ? '+' : ''}{mover.change.toFixed(1)}%</span>
      </div>
      
      {/* Range bar */}
      <RangeBar change={mover.change} isPositive={isPositive} />
    </motion.div>
  );
}

function EmptyMovers({ type }: { type: 'gainers' | 'losers' }) {
  return (
    <div className="px-4 py-6 text-center text-muted-foreground/60 text-sm">
      <Minus className="w-5 h-5 mx-auto mb-2 opacity-50" />
      No {type} yet
    </div>
  );
}

export function MarketBoard() {
  const { state, dispatch } = useMarketStore();
  const index = selectIndex(state);
  const topMovers = selectTopMovers(state);
  
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
          S&P 500 Index & Top Movers
        </p>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-[minmax(80px,1fr),80px,90px,minmax(80px,1fr)] gap-2 px-3 py-2 border-b border-border/30 text-xs text-muted-foreground uppercase tracking-wider">
        <span>Name</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
        <span className="text-right">Range</span>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* S&P 500 Index (always first) */}
        {index && (
          <div className="px-1">
            <IndexRow
              instrument={index}
              isActive={state.activeInstrumentId === 'SP500'}
              onClick={() => handleSelectInstrument('SP500')}
            />
          </div>
        )}
        
        {/* Top Gainers Section */}
        <div className="mt-4">
          <div className="px-4 py-1.5 flex items-center gap-2">
            <TrendingUp size={14} className="text-gain" />
            <span className="text-xs font-semibold text-gain uppercase tracking-wider">
              Top Gainers
            </span>
          </div>
          {topMovers.gainers.length > 0 ? (
            topMovers.gainers.map((mover, i) => (
              <StockMoverRow key={mover.ticker} mover={mover} rank={i + 1} />
            ))
          ) : (
            <EmptyMovers type="gainers" />
          )}
        </div>
        
        {/* Divider */}
        <div className="h-px bg-border/30 mx-4 my-3" />
        
        {/* Top Losers Section */}
        <div>
          <div className="px-4 py-1.5 flex items-center gap-2">
            <TrendingDown size={14} className="text-loss" />
            <span className="text-xs font-semibold text-loss uppercase tracking-wider">
              Top Losers
            </span>
          </div>
          {topMovers.losers.length > 0 ? (
            topMovers.losers.map((mover, i) => (
              <StockMoverRow key={mover.ticker} mover={mover} rank={i + 1} />
            ))
          ) : (
            <EmptyMovers type="losers" />
          )}
        </div>
      </div>
    </div>
  );
}
