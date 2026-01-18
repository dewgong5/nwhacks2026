"""
Custom AI Trading Agent - Create your own trading personality!
Users can define their own strategy and compete against the big institutions.
"""

import json
import requests
from orchestration import SimulationOrchestrator, Side
from agents import TradingAgent  # Import to share API key


class CustomTradingAgent:
    """
    A customizable LLM-powered trading agent.
    Users provide their own trading personality/strategy prompt.
    """
    
    # Use the same API key as the main agents
    API_KEY = TradingAgent.API_KEY
    
    def __init__(
        self,
        agent_id: str,
        orchestrator: SimulationOrchestrator,
        custom_prompt: str,
        model: str = "google/gemini-2.0-flash-001",
        price_history: dict = None
    ):
        self.agent_id = agent_id
        self.orchestrator = orchestrator
        self.custom_prompt = custom_prompt
        self.model = model
        self.price_history = price_history or {}
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
    
    def _call_llm(self, messages: list[dict]) -> str:
        headers = {
            "Authorization": f"Bearer {self.API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
        }
        payload = {"model": self.model, "messages": messages}
        response = requests.post(self.base_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"    API Error {response.status_code}: {response.text[:200]}")
            raise Exception(f"API returned {response.status_code}")
        
        return response.json()["choices"][0]["message"]["content"]
    
    def get_tools_description(self) -> str:
        return """
You have the following tools:

1. get_prices - Get current prices of all stocks
   Usage: {"tool": "get_prices"}

2. get_history - Get last 5 historical prices for each stock
   Usage: {"tool": "get_history"}

3. get_portfolio - Get your cash and stock positions
   Usage: {"tool": "get_portfolio"}

4. buy - Buy a stock
   Usage: {"tool": "buy", "args": {"ticker": "AAPL", "size": 10}}

5. sell - Sell a stock
   Usage: {"tool": "sell", "args": {"ticker": "AAPL", "size": 5}}

6. done - Finish trading for this tick
   Usage: {"tool": "done"}

Respond with ONLY valid JSON. No other text.
"""
    
    def execute_tool(self, tool_call: dict) -> dict:
        tool = tool_call.get("tool")
        args = tool_call.get("args", {})
        
        if tool == "get_prices":
            return self.orchestrator.get_snapshot()
        
        elif tool == "get_history":
            return self.price_history
        
        elif tool == "get_portfolio":
            portfolio = self.orchestrator.get_agent_portfolio(self.agent_id)
            if portfolio:
                return {"cash": portfolio.cash, "positions": dict(portfolio.positions)}
            return {"error": "Portfolio not found"}
        
        elif tool == "buy":
            ticker = args.get("ticker")
            size = args.get("size", 0)
            if not ticker or size <= 0:
                return {"success": False, "message": "Invalid ticker or size"}
            prices = self.orchestrator.get_snapshot()
            if ticker not in prices:
                return {"success": False, "message": f"Unknown stock: {ticker}"}
            
            # Custom agent gets fair execution (no slippage penalty)
            price = prices[ticker] * 1.001
            
            success = self.orchestrator.submit_order(self.agent_id, ticker, Side.BUY, round(price, 2), int(size))
            return {"success": success, "message": f"Buy order: {size} {ticker} @ ${price:.2f}" if success else "Order rejected"}
        
        elif tool == "sell":
            ticker = args.get("ticker")
            size = args.get("size", 0)
            if not ticker or size <= 0:
                return {"success": False, "message": "Invalid ticker or size"}
            prices = self.orchestrator.get_snapshot()
            if ticker not in prices:
                return {"success": False, "message": f"Unknown stock: {ticker}"}
            
            # Custom agent gets fair execution (no slippage penalty)
            price = prices[ticker] * 0.999
            
            success = self.orchestrator.submit_order(self.agent_id, ticker, Side.SELL, round(price, 2), int(size))
            return {"success": success, "message": f"Sell order: {size} {ticker} @ ${price:.2f}" if success else "Order rejected"}
        
        elif tool == "done":
            return {"message": "Done"}
        
        return {"error": f"Unknown tool: {tool}"}
    
    def decide(self, tick: int, max_tool_calls: int = 5) -> list[dict]:
        actions = []
        
        system_prompt = f"""You are {self.agent_id}, a custom trading agent.

YOUR TRADING STRATEGY:
{self.custom_prompt}

Current tick: {tick}

{self.get_tools_description()}

IMPORTANT:
1. First call get_portfolio and get_prices to understand your position
2. Call get_history to see price trends
3. Make trading decisions based on YOUR strategy
4. Call done when finished

Respond with ONLY JSON."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Begin trading. What's your first action?"}
        ]
        
        for _ in range(max_tool_calls):
            try:
                response_text = self._call_llm(messages).strip()
                
                # Parse JSON from response
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start != -1 and end > start:
                    response_text = response_text[start:end]
                
                tool_call = json.loads(response_text)
                
                if tool_call.get("tool") in ["done", "pass"]:
                    break
                
                result = self.execute_tool(tool_call)
                actions.append({"tool": tool_call, "result": result})
                
                messages.append({"role": "assistant", "content": json.dumps(tool_call)})
                messages.append({"role": "user", "content": f"Result: {json.dumps(result)}\n\nNext action?"})
                
            except json.JSONDecodeError:
                print(f"  [{self.agent_id}] Invalid JSON: {response_text[:80]}...")
                break
            except Exception as e:
                print(f"  [{self.agent_id}] Error: {e}")
                break
        
        return actions


# =============================================================================
# EXAMPLE CUSTOM STRATEGIES - Users can copy and modify these!
# =============================================================================

EXAMPLE_STRATEGIES = {
    "contrarian": """I am a CONTRARIAN trader. I do the OPPOSITE of the crowd.
- When stocks are DOWN, I BUY (others are panicking, I'm greedy)
- When stocks are UP, I SELL (others are greedy, I'm fearful)
- I look for stocks that dropped the most and buy them
- I look for stocks that gained the most and sell them
- Position size: 10-20 shares per trade""",

    "momentum": """I am a MOMENTUM trader. I ride the wave.
- I BUY stocks that are going UP (trend following)
- I SELL stocks that are going DOWN (cut losses)
- I want to catch big moves and ride them
- Position size: 15-30 shares per trade""",

    "value_hunter": """I am a VALUE HUNTER. I look for deals.
- I compare current price to historical average
- If current price is BELOW average, I BUY (undervalued)
- If current price is ABOVE average, I SELL (overvalued)
- I'm patient and only trade clear opportunities
- Position size: 5-15 shares per trade""",

    "sector_rotator": """I am a SECTOR ROTATOR. I bet on sectors.
- I focus on a few sectors each tick
- I look for the strongest performing sector and buy those stocks
- I look for the weakest performing sector and avoid/sell those
- I trade in batches within the same sector
- Position size: 10-20 shares per trade""",

    "yolo": """I am a YOLO trader. High risk, high reward.
- I make BIG bets on my highest conviction plays
- I'm not afraid to go all-in on a single stock
- I look for the biggest movers and jump in
- Position size: 30-50 shares per trade
- I trade aggressively and often""",
}


def create_custom_agent(
    agent_id: str,
    orchestrator: SimulationOrchestrator,
    custom_prompt: str,
    model: str = "google/gemini-2.0-flash-001",
    price_history: dict = None
) -> CustomTradingAgent:
    """
    Factory function to create a custom trading agent.
    
    Args:
        agent_id: Unique identifier for this agent
        orchestrator: The simulation orchestrator
        custom_prompt: Your trading strategy/personality description
        model: LLM model to use
        price_history: Historical price data
    
    Returns:
        CustomTradingAgent instance
    """
    return CustomTradingAgent(agent_id, orchestrator, custom_prompt, model, price_history)


# =============================================================================
# QUICK START - Run this file directly to test your custom agent!
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  🎮 CUSTOM TRADING AGENT - Test Your Strategy!")
    print("=" * 60)
    print("\nExample strategies available:")
    for name, desc in EXAMPLE_STRATEGIES.items():
        print(f"\n  📌 {name.upper()}:")
        print(f"     {desc[:80]}...")
    
    print("\n" + "=" * 60)
    print("To use in simulation, import and create your agent:")
    print("""
    from custom_agent import create_custom_agent, EXAMPLE_STRATEGIES
    
    my_strategy = '''
    I am a cautious trader who only buys blue chip stocks.
    I never risk more than 10% of my portfolio on a single trade.
    I hold positions for multiple ticks before selling.
    '''
    
    my_agent = create_custom_agent(
        "my_trader",
        orchestrator,
        my_strategy,  # or EXAMPLE_STRATEGIES["contrarian"]
        price_history=stock_history
    )
    """)
