"""
LLM Trading Agents using OpenRouter API.
"""

import json
import requests
from orchestration import SimulationOrchestrator, Side


class TradingAgent:
    """An LLM-powered trading agent that uses OpenRouter to make decisions."""
    
    # Hardcoded API key
    API_KEY = "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"
    
    def __init__(
        self,
        agent_id: str,
        orchestrator: SimulationOrchestrator,
        personality: str = "You are a rational trader.",
        model: str = "google/gemini-2.0-flash-001",
        price_history: dict = None
    ):
        self.agent_id = agent_id
        self.orchestrator = orchestrator
        self.api_key = self.API_KEY
        self.model = model
        self.personality = personality
        self.price_history = price_history or {}
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
    
    def _call_llm(self, messages: list[dict]) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
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

1. get_prices - Get current prices
   Usage: {"tool": "get_prices"}

2. get_history - Get last 5 historical prices (oldest to newest)
   Usage: {"tool": "get_history"}

3. get_portfolio - Get your cash and positions
   Usage: {"tool": "get_portfolio"}

4. buy - Buy a stock
   Usage: {"tool": "buy", "args": {"ticker": "AAPL", "size": 10}}

5. sell - Sell a stock
   Usage: {"tool": "sell", "args": {"ticker": "AAPL", "size": 5}}

6. done - Finish trading
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
            price = prices[ticker] * 0.999
            success = self.orchestrator.submit_order(self.agent_id, ticker, Side.SELL, round(price, 2), int(size))
            return {"success": success, "message": f"Sell order: {size} {ticker} @ ${price:.2f}" if success else "Order rejected"}
        
        elif tool == "done":
            return {"message": "Done"}
        
        return {"error": f"Unknown tool: {tool}"}
    
    def decide(self, tick: int, max_tool_calls: int = 5) -> list[dict]:
        actions = []
        
        system_prompt = f"""You are {self.agent_id}, a trading agent.

{self.personality}

Current tick: {tick}

{self.get_tools_description()}

Strategy:
1. Call get_portfolio and get_prices first
2. Call get_history to see trends
3. Make trading decisions
4. Call done when finished

Respond with ONLY JSON."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Begin trading. What's your first action?"}
        ]
        
        for _ in range(max_tool_calls):
            try:
                response_text = self._call_llm(messages).strip()
                
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


PERSONALITIES = {
    "quant_institutional": """You are a QUANTITATIVE INSTITUTIONAL TRADER at a hedge fund.
You manage $10M+ and make data-driven decisions based on technical analysis.

Your strategy:
- Look at price HISTORY to identify trends and momentum
- Buy stocks showing strong upward momentum (price consistently increasing)
- Sell or avoid stocks showing downward momentum
- Use larger position sizes (10-20 shares)
- Act decisively based on the data
- Diversify across multiple stocks

If current_price > average of history = UPTREND = BUY
If current_price < average of history = DOWNTREND = SELL or avoid""",

    "fundamental_institutional": """You are a FUNDAMENTAL INSTITUTIONAL TRADER at an asset management firm.

Your strategy:
- Look for stocks that have DROPPED significantly (undervalued)
- Buy when a stock is trading BELOW its historical average
- Sell when a stock is trading way ABOVE its historical average
- Be patient - you don't need to trade every tick
- Use medium position sizes (5-15 shares)
- Focus on 2-3 best opportunities

You believe prices revert to the mean.""",

    "retail_trader": """You are a RETAIL TRADER - an individual investor with limited capital.

Your strategy:
- You have FOMO - when you see a stock going UP, you want to buy it
- You panic sell when prices drop
- You make smaller trades (3-8 shares)
- You chase momentum - buying what's hot
- You're not very patient
- You often buy at the top and sell at the bottom

You get excited when stocks go up and scared when they go down.""",
}


def create_agent(
    agent_id: str,
    orchestrator: SimulationOrchestrator,
    personality_type: str = "retail_trader",
    model: str = "google/gemini-2.0-flash-001",
    price_history: dict = None
) -> TradingAgent:
    personality = PERSONALITIES.get(personality_type, PERSONALITIES["retail_trader"])
    return TradingAgent(agent_id, orchestrator, personality, model, price_history)
