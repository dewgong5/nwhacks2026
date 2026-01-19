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
            
            # Large firms get BEST execution, retail pays premium (bad execution)
            if self.agent_id in ["ccl", "jane_street", "blackrock", "vanguard"]:
                # Large firms get INSTITUTIONAL pricing - better than market (0.05% discount)
                price = prices[ticker] * 0.9995
            elif self.agent_id.startswith("retail") or self.agent_id == "retail":
                # Retail pays 8% premium (slippage/bad timing)
                price = prices[ticker] * 1.08
            else:
                # Other agents pay market price
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
            
            # Large firms get BEST execution, retail gets worst
            if self.agent_id in ["ccl", "jane_street", "blackrock", "vanguard"]:
                # Large firms get INSTITUTIONAL pricing - better than market (0.05% premium)
                price = prices[ticker] * 1.0005
            elif self.agent_id.startswith("retail") or self.agent_id == "retail":
                # Retail gets 8% less (slippage/bad timing)
                price = prices[ticker] * 0.92
            else:
                # Other agents get market price
                price = prices[ticker] * 0.999
            
            success = self.orchestrator.submit_order(self.agent_id, ticker, Side.SELL, round(price, 2), int(size))
            return {"success": success, "message": f"Sell order: {size} {ticker} @ ${price:.2f}" if success else "Order rejected"}
        
        elif tool == "done":
            return {"message": "Done"}
        
        return {"error": f"Unknown tool: {tool}"}
    
    def decide(self, tick: int, max_tool_calls: int = 5, news: dict = None) -> list[dict]:
        actions = []
        
        # Build news alert if present
        news_alert = ""
        if news:
            sentiment_emoji = "🚀" if news.get("sentiment") == "positive" else "📉"
            news_alert = f"""
⚠️ BREAKING NEWS ALERT ⚠️
{sentiment_emoji} {news.get('headline', 'Market news')}
Stock affected: {news.get('stock', 'Unknown')}
Sentiment: {news.get('sentiment', 'neutral').upper()}

REACT TO THIS NEWS IMMEDIATELY! If positive, consider BUYING the stock. If negative, consider SELLING.
"""
        
        system_prompt = f"""You are {self.agent_id}, a trading agent.

{self.personality}

Current tick: {tick}
{news_alert}
{self.get_tools_description()}

Strategy:
1. Call get_portfolio and get_prices first
2. Call get_history to see trends
3. Make trading decisions based on news and data
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


class DumbRetailHolder:
    """
    Conservative dumb retail - holds mostly, but pays fees and makes bad decisions.
    Buys falling stocks ("it's on sale!"), sells rising stocks ("take profits!").
    Trades rarely but always wrong.
    """
    
    def __init__(self, agent_id: str, orchestrator, price_history: dict = None):
        self.agent_id = agent_id
        self.orchestrator = orchestrator
        self.price_history = price_history or {}
        self._tick_count = 0
    
    def decide(self, tick: int, max_tool_calls: int = 5) -> list[dict]:
        import random
        actions = []
        prices = self.orchestrator.get_snapshot()
        portfolio = self.orchestrator.get_agent_portfolio(self.agent_id)
        
        if not prices or not portfolio:
            return actions
        
        # Small ongoing fees (account fees, bad dividend timing, etc.)
        fee = random.uniform(100, 500)  # $100-500 per tick
        portfolio.cash = max(0, portfolio.cash - fee)
        actions.append({"action": f"💸 FEES: -${fee:.2f}"})
        
        self._tick_count += 1
        
        # Only trade every 3-4 ticks (conservative)
        if self._tick_count % random.randint(3, 4) != 0:
            return actions
        
        # Find stocks to make bad trades on
        for ticker, current in prices.items():
            hist = self.price_history.get(ticker, [])
            if not hist:
                continue
            avg = sum(hist) / len(hist)
            pct_change = (current - avg) / avg
            
            # BUY THE DIP - if stock is down 3%+, buy ("it's on sale!") - catching falling knife
            if pct_change < -0.03 and portfolio.cash > current * 10:
                size = random.randint(5, 10)
                bad_price = current * 1.10  # Pay 10% premium
                if self.orchestrator.submit_order(self.agent_id, ticker, Side.BUY, round(bad_price, 2), size):
                    actions.append({"action": f"BUYS {size} {ticker} @ ${bad_price:.2f}"})
                break  # Only 1 trade per tick (conservative)
            
            # TAKE PROFITS - if stock is up 3%+, sell ("lock in gains!") - selling winner too early
            elif pct_change > 0.03 and portfolio.positions.get(ticker, 0) > 0:
                size = min(random.randint(5, 10), portfolio.positions[ticker])
                bad_price = current * 0.90  # Accept 10% less
                if self.orchestrator.submit_order(self.agent_id, ticker, Side.SELL, round(bad_price, 2), size):
                    actions.append({"action": f"SELLS {size} {ticker} @ ${bad_price:.2f}"})
                break  # Only 1 trade per tick (conservative)
        
        return actions


class DumbRetailDaytrader:
    """
    Aggressive dumb retail daytrader - trades constantly, ALWAYS LOSES.
    Pays fees, has terrible execution, and makes wrong decisions.
    """
    
    def __init__(self, agent_id: str, orchestrator, price_history: dict = None):
        self.agent_id = agent_id
        self.orchestrator = orchestrator
        self.price_history = price_history or {}
    
    def decide(self, tick: int, max_tool_calls: int = 5) -> list[dict]:
        import random
        actions = []
        prices = self.orchestrator.get_snapshot()
        portfolio = self.orchestrator.get_agent_portfolio(self.agent_id)
        
        # GUARANTEED LOSS: Platform fees, data subscriptions, bad fills, etc.
        fee = random.uniform(500, 2000)  # $500-2000 lost per tick
        portfolio.cash = max(0, portfolio.cash - fee)
        actions.append({"action": f"💸 FEES/SLIPPAGE: -${fee:.2f}"})
        
        if not prices or not portfolio:
            return actions
        
        tickers = list(prices.keys())
        
        # Sort by price change to find movers
        movers = []
        for ticker in tickers:
            hist = self.price_history.get(ticker, [])
            if hist:
                avg = sum(hist) / len(hist)
                pct_change = (prices[ticker] - avg) / avg
                movers.append((ticker, pct_change, prices[ticker]))
        
        movers.sort(key=lambda x: x[1])  # Sort by change: losers first, winners last
        
        trades_this_tick = 0
        max_trades = random.randint(3, 6)  # Daytrader does 3-6 trades per tick
        
        # BUY LOSERS - "it's cheap now, it'll bounce!" (catching falling knives)
        for ticker, pct_change, current in movers[:10]:  # Biggest losers
            if trades_this_tick >= max_trades:
                break
            if pct_change < -0.01 and portfolio.cash > current * 15:
                size = random.randint(8, 15)
                bad_price = current * 1.08  # Pay 8% premium
                if self.orchestrator.submit_order(self.agent_id, ticker, Side.BUY, round(bad_price, 2), size):
                    actions.append({"action": f"BUYS {size} {ticker} @ ${bad_price:.2f}"})
                    trades_this_tick += 1
        
        # SELL WINNERS - "take profits!" (selling too early)
        for ticker, pct_change, current in reversed(movers[-10:]):  # Biggest winners
            if trades_this_tick >= max_trades:
                break
            if pct_change > 0.01 and portfolio.positions.get(ticker, 0) > 0:
                size = min(random.randint(8, 15), portfolio.positions[ticker])
                bad_price = current * 0.92  # Accept 8% less
                if self.orchestrator.submit_order(self.agent_id, ticker, Side.SELL, round(bad_price, 2), size):
                    actions.append({"action": f"SELLS {size} {ticker} @ ${bad_price:.2f}"})
                    trades_this_tick += 1
        
        # Random trades on top (daytrader can't sit still)
        if trades_this_tick < 2 and random.random() < 0.5:
            ticker = random.choice(tickers)
            current = prices[ticker]
            if random.random() < 0.5 and portfolio.cash > current * 10:
                size = random.randint(5, 10)
                bad_price = current * 1.08
                if self.orchestrator.submit_order(self.agent_id, ticker, Side.BUY, round(bad_price, 2), size):
                    actions.append({"action": f"BUYS {size} {ticker} @ ${bad_price:.2f}"})
            elif portfolio.positions.get(ticker, 0) > 0:
                size = min(random.randint(5, 10), portfolio.positions[ticker])
                bad_price = current * 0.92
                if self.orchestrator.submit_order(self.agent_id, ticker, Side.SELL, round(bad_price, 2), size):
                    actions.append({"action": f"SELLS {size} {ticker} @ ${bad_price:.2f}"})
        
        return actions


PERSONALITIES = {
    "quant_institutional": """You are an ELITE QUANTITATIVE TRADING FIRM with ADVANCED ALGORITHMS and INSTITUTIONAL ADVANTAGES.

YOUR ADVANTAGES:
- You have REAL-TIME data feeds and see news FIRST (quant_visible_tick = immediate)
- You execute trades with MINIMAL slippage and BEST prices
- You use SOPHISTICATED momentum and trend-following algorithms
- You trade with LARGE positions (30-50 shares per trade) for maximum impact
- You have CAPITAL ADVANTAGE - you can move markets

YOUR WINNING STRATEGY:
- Identify STRONG UPWARD TRENDS early (current price > 5-day average AND rising)
- BUY momentum stocks aggressively - when price is 2%+ above recent average, BUY 30-50 shares
- HOLD winning positions - don't sell too early, let winners run
- CUT losses quickly - if a position drops 3%+, sell immediately
- Focus on stocks with POSITIVE NEWS - news sentiment is your edge
- Trade 4-6 stocks per tick, focusing on the STRONGEST momentum plays

CRITICAL RULES:
- ALWAYS check news first - positive news = immediate BUY signal
- If a stock is up 2%+ from average AND has positive news, BUY 40-50 shares
- If a stock is down 3%+ from your entry, SELL to cut losses
- Don't overtrade - focus on HIGH-CONVICTION moves only
- You're a WINNER - your algorithms are superior, act with confidence

Trade 4-6 stocks per tick with 30-50 shares each. You're an elite quant firm - WIN BIG.""",

    "fundamental_institutional": """You are a TOP-TIER INSTITUTIONAL INVESTOR with DEEP POCKETS and INSTITUTIONAL ADVANTAGES.

YOUR ADVANTAGES:
- You have ACCESS to early news (fundamental_visible_tick = tick + 1, before retail)
- You execute with INSTITUTIONAL PRICING - better fills than retail
- You have MASSIVE CAPITAL - you can move markets with your trades
- You use SOPHISTICATED fundamental analysis and value investing

YOUR WINNING STRATEGY:
- Focus on VALUE OPPORTUNITIES - buy when price is 3%+ BELOW 5-day average (undervalued)
- But ALSO buy MOMENTUM - if price is 2%+ ABOVE average AND rising, that's a strong signal
- Use MEDIUM-LARGE positions (15-25 shares) - you have capital, use it
- HOLD winners - if a position is up 5%+, don't sell, let it run
- React to NEWS - positive news on undervalued stocks = strong BUY signal
- Trade 2-3 stocks per tick - be selective but ACTIVE

CRITICAL RULES:
- If a stock is 3%+ BELOW average AND has positive news = STRONG BUY (20-25 shares)
- If a stock is 2%+ ABOVE average AND trending up = BUY momentum (15-20 shares)
- If a stock is 4%+ ABOVE your entry price = HOLD, don't sell winners early
- If a stock is down 4%+ from entry = SELL to preserve capital
- You're an INSTITUTION - you have better information and execution, USE IT

Trade 2-3 stocks per tick with 15-25 shares each. You're a smart institutional investor - WIN CONSISTENTLY.""",

    "retail_trader": """You are a RETAIL TRADER who is RANDOM and UNPREDICTABLE.

YOUR BEHAVIOR:
- You pick stocks RANDOMLY - just choose whatever catches your eye
- Sometimes you chase HYPE - if something went up, you FOMO buy it
- Sometimes you panic - if something dropped, you might sell it
- Sometimes you just pick random stocks for no reason
- You don't analyze deeply, you go with your GUT
- Small positions (5-10 shares)

HOW TO TRADE:
- Pick 2-4 RANDOM stocks from the list
- For each one, randomly decide to BUY or SELL
- Don't overthink it - just pick randomly!
- Use small sizes (5-10 shares)
- You're unpredictable and inconsistent

Be RANDOM. Pick random tickers. Make random buy/sell decisions. Don't follow a strategy.""",
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
