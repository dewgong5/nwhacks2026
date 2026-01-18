// ============================================
// MarketMind - Main Dashboard Page
// Market-level abstraction with Index + Sectors
// ============================================

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { InstrumentChart } from '@/components/InstrumentChart';
import { MarketBoard } from '@/components/MarketBoard';
import { CompactAgentFeed } from '@/components/CompactAgentFeed';
import { AgentStatusBoard } from '@/components/AgentStatusBoard';
import { SimulationControls } from '@/components/SimulationControls';
import { MarketSummary } from '@/components/MarketSummary';
import { TraderFooter } from '@/components/TraderFooter';
import { ProfileBuilder } from '@/components/ProfileBuilder';
import { PerformanceCelebration } from '@/components/PerformanceCelebration';
import { SessionEndBanner } from '@/components/SessionEndBanner';
import { PostMarketAnalysis } from '@/components/PostMarketAnalysis';
import { TradingConsultant } from '@/components/TradingConsultant';
import { TraderResult } from '@/types/trading';
import { useMarketStore } from '@/store/marketStore';
import { useSimulationControls } from '@/store/MarketProvider';

const Index = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [userTrader, setUserTrader] = useState<TraderResult | undefined>();
  
  const { state, dispatch } = useMarketStore();
  const { isConnected, isSimulationStarted, startSimulation } = useSimulationControls();
  // Session is complete when we receive simulation_complete from backend
  const isSessionComplete = state.simulationResults !== undefined;

  // Auto-pause when session is complete
  useEffect(() => {
    if (isSessionComplete && state.simStatus.running) {
      dispatch({ type: 'SIM_TOGGLE_PLAY' });
    }
  }, [isSessionComplete, state.simStatus.running, dispatch]);

  const handleJumpIn = () => {
    setIsProfileOpen(true);
  };

  const handleAdjust = () => {
    setIsProfileOpen(true);
  };

  const handleViewAnalysis = () => {
    setIsAnalysisOpen(true);
  };

  const handleRestart = () => {
    dispatch({ type: 'SIM_RESET' });
    setIsAnalysisOpen(false);
  };

  const handleProfileSubmit = (trader: Omit<TraderResult, 'rank' | 'previousRank' | 'currentPnL' | 'previousPnL'>) => {
    // Create the full trader result with initial values
    const fullTrader: TraderResult = {
      ...trader,
      rank: 5,
      previousRank: 5,
      currentPnL: 0,
      previousPnL: 0,
    };
    setUserTrader(fullTrader);
    setIsProfileOpen(false);
    
    // Start simulation with custom agent config
    if (trader.customPrompt) {
      startSimulation({
        name: trader.name,
        prompt: trader.customPrompt,
        capital: trader.capital || 100000,
      });
    } else {
      // Start without custom agent
      startSimulation();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Performance celebration toast */}
      <PerformanceCelebration userTrader={userTrader} />
      
      <main className="container px-4 md:px-6 py-4 md:py-6 flex-1">
        {/* Session End Banner */}
        {isSessionComplete && (
          <div className="mb-4">
            <SessionEndBanner onViewAnalysis={handleViewAnalysis} />
          </div>
        )}

        {/* Main Grid Layout - 70/30 */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left Column - Chart + Controls (70%) */}
          <div className="flex-1 lg:w-[70%] space-y-4">
            {/* Chart Container */}
            <div className="glass-card h-[50vh] md:h-[55vh] lg:h-[60vh] p-2 md:p-4">
              <InstrumentChart />
            </div>
            
            {/* Simulation Controls */}
            <SimulationControls disabled={isSessionComplete} />
            
            {/* Agent Status Board - Directly after chart */}
            <div className="h-[380px]">
              <AgentStatusBoard />
            </div>
            
            {/* Your Trader (bob) + Trading Consultant - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: '350px', height: '350px' }}>
              <TraderFooter 
                userTrader={userTrader} 
                onJumpIn={handleJumpIn} 
                onAdjust={handleAdjust}
                isSessionComplete={isSessionComplete}
                onViewAnalysis={handleViewAnalysis}
                variant="panel"
              />
              <TradingConsultant />
            </div>
            
            {/* Market Summary Cards */}
            <MarketSummary />
          </div>

          {/* Right Column - Market Board + Agent Activity (30%) */}
          <div className="lg:w-[30%] space-y-4">
            {/* Market Board */}
            <div className="h-[calc(55vh+70px)] md:h-[calc(55vh+70px)] lg:h-[calc(60vh+70px)]">
              <MarketBoard />
            </div>
            
            {/* Agent Activity Feed */}
            <div className="h-[400px] md:h-[450px]">
              <CompactAgentFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Profile Builder Modal */}
      <ProfileBuilder 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onSubmit={handleProfileSubmit}
      />
      
      {/* Post-Market Analysis Modal */}
      <PostMarketAnalysis
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        onRestart={handleRestart}
        userTrader={userTrader}
      />
    </div>
  );
};

export default Index;
