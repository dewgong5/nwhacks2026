import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TraderResult } from '@/types/trading';

interface ProfileBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trader: Omit<TraderResult, 'rank' | 'previousRank' | 'previousPnL'>) => void;
}

const EXAMPLE_PROMPTS = [
  "I am a momentum trader. I buy stocks that are going UP and sell stocks that are going DOWN.",
  "I am a contrarian. When stocks drop more than 5%, I buy. When they rise more than 5%, I sell.",
  "I am a value investor. I only buy stocks trading below their historical average price.",
  "I am aggressive. I make large trades (50+ shares) and chase the biggest movers.",
];

export function ProfileBuilder({ isOpen, onClose, onSubmit }: ProfileBuilderProps) {
  const [name, setName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !customPrompt.trim()) return;
    
    onSubmit({
      id: `user-${Date.now()}`,
      name: name.trim(),
      type: 'custom',
      currentPnL: 0,
      sharpe: 0,
      winRate: 50,
      sparklineData: [0],
      isUser: true,
      customPrompt: customPrompt.trim(),
    });
    
    onClose();
    setName('');
    setCustomPrompt('');
  };

  const useExample = (prompt: string) => {
    setCustomPrompt(prompt);
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create Your AI Trader</h2>
                    <p className="text-sm text-muted-foreground">Write a system prompt for your agent</p>
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

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">System Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your trading strategy... e.g., 'I am a momentum trader. I buy stocks going up and sell stocks going down.'"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="bg-secondary border-border min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt tells the AI how to trade. Be specific about when to buy/sell and position sizes.
                  </p>
                </div>

                {/* Example Prompts */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Quick Examples</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => useExample(prompt)}
                        className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {prompt.split('.')[0].replace('I am ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {customPrompt && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">Your Strategy</p>
                    <p className="text-sm text-foreground line-clamp-3">{customPrompt}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !customPrompt.trim()}
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
