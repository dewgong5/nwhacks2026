import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <img src={logo} alt="MarketMind Logo" className="w-10 h-10 object-contain" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MarketMind</h1>
            <p className="text-xs text-muted-foreground">Live Trading Competition</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gain/10 border border-gain/20">
            <motion.div 
              className="w-2 h-2 rounded-full bg-gain"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-gain">Live</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Real-time simulation</span>
          </div>
        </div>
      </div>
    </header>
  );
}
