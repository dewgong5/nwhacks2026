import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Brain, Gauge, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TraderProfile, TraderResult } from '@/types/trading';

interface ProfileBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trader: Omit<TraderResult, 'rank' | 'previousRank' | 'previousPnL'>) => void;
}

const strategyDescriptions = {
  momentum: 'Rides trends and breakouts. Best in strong directional markets.',
  meanReversion: 'Bets on price returning to average. Thrives in range-bound markets.',
  passive: 'Holds positions long-term. Low turnover, steady approach.',
  sentiment: 'Reacts to news and market sentiment. Volatile but high potential.',
  custom: 'Your unique AI-driven strategy. Full control.',
};

export function ProfileBuilder({ isOpen, onClose, onSubmit }: ProfileBuilderProps) {
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<TraderProfile['strategyType']>('momentum');
  const [risk, setRisk] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [enableAI, setEnableAI] = useState(false);

  const getPersonalitySummary = () => {
    const riskLabel = risk < 33 ? 'Conservative' : risk < 66 ? 'Balanced' : 'Aggressive';
    const speedLabel = speed < 33 ? 'Patient' : speed < 66 ? 'Adaptive' : 'Rapid-fire';
    const strategyLabel = {
      momentum: 'Momentum',
      meanReversion: 'Mean Reversion',
      passive: 'Passive',
      sentiment: 'Sentiment',
      custom: 'Custom AI',
    }[strategy];
    
    return `${speedLabel} ${strategyLabel.toLowerCase()} trader with ${riskLabel.toLowerCase()} risk profile`;
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSubmit({
      id: `user-${Date.now()}`,
      name: name.trim(),
      type: 'custom',
      currentPnL: 0,
      sharpe: 0,
      winRate: 50,
      sparklineData: [0],
      isUser: true,
    });
    
    onClose();
    setName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create Your Trader</h2>
                    <p className="text-sm text-muted-foreground">Build a custom AI profile</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Trader Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My Quant Bot"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Strategy */}
                <div className="space-y-2">
                  <Label>Strategy Type</Label>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as TraderProfile['strategyType'])}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentum">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          Momentum Chaser
                        </div>
                      </SelectItem>
                      <SelectItem value="meanReversion">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-blue-400" />
                          Mean Reversion
                        </div>
                      </SelectItem>
                      <SelectItem value="passive">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-400" />
                          Passive Indexer
                        </div>
                      </SelectItem>
                      <SelectItem value="sentiment">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-pink-400" />
                          Sentiment Trader
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Rocket className="h-4 w-4 text-cyan-400" />
                          Custom AI
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{strategyDescriptions[strategy]}</p>
                </div>

                {/* Risk */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Risk Appetite</Label>
                    <span className="text-sm font-mono text-muted-foreground">{risk}%</span>
                  </div>
                  <Slider
                    value={[risk]}
                    onValueChange={([v]) => setRisk(v)}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                </div>

                {/* Speed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Reaction Speed</Label>
                    <span className="text-sm font-mono text-muted-foreground">{speed}%</span>
                  </div>
                  <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Patient</span>
                    <span>Rapid-fire</span>
                  </div>
                </div>

                {/* AI Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-toggle" className="cursor-pointer">Enable AI Reasoning</Label>
                    <p className="text-xs text-muted-foreground">Advanced decision explanations</p>
                  </div>
                  <Switch
                    id="ai-toggle"
                    checked={enableAI}
                    onCheckedChange={setEnableAI}
                  />
                </div>

                {/* Personality Preview */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">Your Trader Personality</p>
                  <p className="text-sm text-foreground">{getPersonalitySummary()}</p>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Trading
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
