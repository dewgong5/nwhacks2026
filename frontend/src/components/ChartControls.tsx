import { SimulationSpeed } from '@/types/trading';
import { Play, Pause, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ChartControlsProps {
  isPlaying: boolean;
  speed: SimulationSpeed;
  tickCount: number;
  maxTicks: number;
  symbols: string[];
  currentSymbol: string;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: SimulationSpeed) => void;
  onChangeSymbol: (symbol: string) => void;
  onSeek: (tick: number) => void;
}

const speedConfig: Record<SimulationSpeed, { label: string; desc: string }> = {
  slow: { label: '0.5x', desc: '1 day/tick' },
  normal: { label: '1x', desc: '1 hour/tick' },
  fast: { label: '2x', desc: '1 min/tick' },
};

export function ChartControls({
  isPlaying,
  speed,
  tickCount,
  maxTicks,
  symbols,
  currentSymbol,
  onTogglePlay,
  onChangeSpeed,
  onChangeSymbol,
  onSeek,
}: ChartControlsProps) {
  return (
    <div className="glass-card p-4">
      {/* Top row - Symbol selector and speed */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Symbol pills */}
        <div className="flex flex-wrap gap-2">
          {symbols.map((symbol) => (
            <button
              key={symbol}
              onClick={() => onChangeSymbol(symbol)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentSymbol === symbol
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>

        {/* Speed controls */}
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-secondary rounded-lg p-1">
            {(Object.keys(speedConfig) as SimulationSpeed[]).map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  speed === s
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {speedConfig[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row - Play controls and timeline */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTogglePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isPlaying 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40' 
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          }`}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </motion.button>

        <div className="flex-1 space-y-1">
          <Slider
            value={[tickCount]}
            max={maxTicks}
            step={1}
            onValueChange={([value]) => onSeek(value)}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Day {tickCount + 1}</span>
            <span>{maxTicks} days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
