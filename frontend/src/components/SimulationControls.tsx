// ============================================
// MarketMind - Simulation Controls
// Play/Pause, Speed, Reset - Event-driven
// ============================================

import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMarketStore, selectIsRunning, selectSpeed } from '@/store/marketStore';
import { SimulationSpeed } from '@/types/trading';
import { cn } from '@/lib/utils';

const SPEED_OPTIONS: { value: SimulationSpeed; label: string }[] = [
  { value: 'slow', label: '0.5x' },
  { value: 'normal', label: '1x' },
  { value: 'fast', label: '2x' },
];

interface SimulationControlsProps {
  disabled?: boolean;
}

export function SimulationControls({ disabled = false }: SimulationControlsProps) {
  const { state, dispatch } = useMarketStore();
  const isRunning = selectIsRunning(state);
  const speed = selectSpeed(state);
  
  const handleTogglePlay = () => {
    if (disabled) return;
    dispatch({ type: 'SIM_TOGGLE_PLAY' });
  };
  
  const handleSetSpeed = (newSpeed: SimulationSpeed) => {
    if (disabled) return;
    dispatch({ type: 'SIM_SET_SPEED', speed: newSpeed });
  };
  
  const handleReset = () => {
    dispatch({ type: 'SIM_RESET' });
  };
  
  const handleSeek = (value: number[]) => {
    if (disabled) return;
    dispatch({ type: 'SIM_SEEK', tick: value[0] });
  };
  
  return (
    <div className="glass-card p-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Play/Pause */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleTogglePlay}
            className={cn(
              "h-10 w-10 transition-colors",
              isRunning && "bg-primary/10 border-primary/50"
            )}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-10 w-10"
          >
            <RotateCcw size={16} />
          </Button>
        </div>
        
        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-muted-foreground" />
          <div className="flex rounded-lg overflow-hidden border border-border">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSetSpeed(option.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  speed === option.value 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent text-muted-foreground hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Timeline scrubber */}
        <div className="flex-1 flex items-center gap-3 min-w-[200px]">
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Day {state.simStatus.tickCount}
          </span>
          <Slider
            value={[state.simStatus.tickCount]}
            max={state.simStatus.maxTicks}
            step={1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs font-mono text-muted-foreground tabular-nums text-right">
            {state.simStatus.maxTicks} days
          </span>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isRunning ? "bg-gain animate-pulse" : "bg-muted"
          )} />
          <span>{isRunning ? 'Running' : 'Paused'}</span>
        </div>
      </div>
    </div>
  );
}
