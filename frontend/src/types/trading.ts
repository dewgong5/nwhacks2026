export interface TraderProfile {
  id: string;
  name: string;
  strategyType: 'momentum' | 'meanReversion' | 'passive' | 'sentiment' | 'custom';
  riskProfile: number; // 0-100
  reactionSpeed: number; // 0-100
  enableAIReasoning: boolean;
  createdAt: Date;
  type: 'institutional' | 'retail' | 'quant' | 'hft' | 'custom';
}

export interface TraderResult {
  id: string;
  name: string;
  type: TraderProfile['type'];
  currentPnL: number;
  previousPnL: number;
  sharpe: number;
  winRate: number;
  sparklineData: number[];
  rank: number;
  previousRank: number;
  isUser?: boolean;
  customPrompt?: string; // Custom AI strategy prompt
  capital?: number; // Starting capital for custom agents
}

export interface TickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  regime: 'bull' | 'bear' | 'sideways';
  volatility: number;
}

export type SimulationSpeed = 'slow' | 'normal' | 'fast';
