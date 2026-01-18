import { useState, useEffect, useCallback, useRef } from 'react';
import { TickData, MarketData, TraderResult, SimulationSpeed } from '@/types/trading';

const SYMBOLS = ['MMKT', 'TECHX', 'ENERG', 'FINCO', 'CRYPTX'];

const SPEED_INTERVALS: Record<SimulationSpeed, number> = {
  slow: 2000,
  normal: 1000,
  fast: 400,
};

const generateInitialPrice = () => 100 + Math.random() * 50;

const generateTick = (prevClose: number, volatility: number = 0.02): TickData => {
  const change = (Math.random() - 0.5) * 2 * volatility * prevClose;
  const open = prevClose;
  const close = prevClose + change;
  const high = Math.max(open, close) + Math.random() * volatility * prevClose * 0.5;
  const low = Math.min(open, close) - Math.random() * volatility * prevClose * 0.5;
  
  return {
    timestamp: Date.now(),
    open,
    high,
    low,
    close,
    volume: Math.floor(Math.random() * 10000) + 1000,
  };
};

const INITIAL_TRADERS: TraderResult[] = [
  { id: '1', name: 'Alpha Quant', type: 'quant', currentPnL: 15420, previousPnL: 15420, sharpe: 1.8, winRate: 62, sparklineData: [0, 2, 5, 3, 8, 12, 15], rank: 1, previousRank: 1 },
  { id: '2', name: 'Velocity HFT', type: 'hft', currentPnL: 12350, previousPnL: 12350, sharpe: 2.1, winRate: 58, sparklineData: [0, 1, 4, 2, 6, 9, 12], rank: 2, previousRank: 2 },
  { id: '3', name: 'DeepValue Fund', type: 'institutional', currentPnL: 8920, previousPnL: 8920, sharpe: 1.4, winRate: 55, sparklineData: [0, 1, 2, 4, 5, 7, 9], rank: 3, previousRank: 3 },
  { id: '4', name: 'YOLO Trader', type: 'retail', currentPnL: 5430, previousPnL: 5430, sharpe: 0.9, winRate: 48, sparklineData: [0, 3, -1, 4, 2, 6, 5], rank: 4, previousRank: 4 },
  { id: '5', name: 'SteadyEddie', type: 'institutional', currentPnL: 3200, previousPnL: 3200, sharpe: 1.2, winRate: 52, sparklineData: [0, 1, 1, 2, 2, 3, 3], rank: 5, previousRank: 5 },
];

export function useTickSimulation() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<SimulationSpeed>('normal');
  const [currentSymbol, setCurrentSymbol] = useState('MMKT');
  const [tickCount, setTickCount] = useState(0);
  const [maxTicks] = useState(5);
  
  const [tickHistory, setTickHistory] = useState<TickData[]>(() => {
    const initial: TickData[] = [];
    let price = generateInitialPrice();
    for (let i = 0; i < 30; i++) {
      const tick = generateTick(price);
      initial.push(tick);
      price = tick.close;
    }
    return initial;
  });
  
  const [marketData, setMarketData] = useState<MarketData>(() => ({
    symbol: currentSymbol,
    currentPrice: tickHistory[tickHistory.length - 1]?.close || 125,
    previousPrice: tickHistory[tickHistory.length - 2]?.close || 125,
    changePercent: 0,
    regime: 'bull',
    volatility: 0.02,
  }));
  
  const [traders, setTraders] = useState<TraderResult[]>(INITIAL_TRADERS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addTick = useCallback(() => {
    setTickHistory(prev => {
      const lastClose = prev[prev.length - 1]?.close || 125;
      const newTick = generateTick(lastClose, marketData.volatility);
      const newHistory = [...prev.slice(-99), newTick];
      
      setMarketData(m => ({
        ...m,
        previousPrice: m.currentPrice,
        currentPrice: newTick.close,
        changePercent: ((newTick.close - prev[0].close) / prev[0].close) * 100,
        regime: newTick.close > lastClose ? 'bull' : newTick.close < lastClose ? 'bear' : 'sideways',
      }));
      
      return newHistory;
    });

    // Update traders PnL
    setTraders(prev => {
      const updated = prev.map(trader => {
        const change = (Math.random() - 0.48) * 500 * (trader.type === 'hft' ? 1.5 : 1);
        const newPnL = trader.currentPnL + change;
        const newSparkline = [...trader.sparklineData.slice(-6), newPnL / 1000];
        return {
          ...trader,
          previousPnL: trader.currentPnL,
          currentPnL: newPnL,
          sparklineData: newSparkline,
          previousRank: trader.rank,
        };
      });
      
      // Re-rank
      return updated
        .sort((a, b) => b.currentPnL - a.currentPnL)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    });

    setTickCount(c => Math.min(c + 1, maxTicks));
  }, [marketData.volatility, maxTicks]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(addTick, SPEED_INTERVALS[speed]);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, addTick]);

  const togglePlay = () => setIsPlaying(p => !p);
  const changeSpeed = (newSpeed: SimulationSpeed) => setSpeed(newSpeed);
  const changeSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    setMarketData(m => ({ ...m, symbol }));
  };
  
  const addUserTrader = (trader: Omit<TraderResult, 'rank' | 'previousRank' | 'previousPnL'>) => {
    setTraders(prev => {
      const newTrader: TraderResult = {
        ...trader,
        previousPnL: trader.currentPnL,
        rank: prev.length + 1,
        previousRank: prev.length + 1,
        isUser: true,
      };
      return [...prev, newTrader];
    });
  };

  const seekTo = (tick: number) => {
    setTickCount(tick);
  };

  return {
    isPlaying,
    speed,
    currentSymbol,
    symbols: SYMBOLS,
    tickCount,
    maxTicks,
    tickHistory,
    marketData,
    traders,
    togglePlay,
    changeSpeed,
    changeSymbol,
    addUserTrader,
    seekTo,
  };
}
