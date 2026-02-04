# 🎮 MarketMind - AI Trading Arena

**A real-time stock market simulation game where you compete against AI-powered trading agents**

![nwHacks 2026](https://img.shields.io/badge/nwHacks-2026-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

---

## 🚀 What Is This?

MarketMind is an AI-powered stock market simulation game built for **nwHacks 2026**. Watch AI agents from major financial institutions (Citadel, Jane Street, BlackRock, Vanguard) trade against each other in real-time, and create your own custom AI trading bot to compete!

### ✨ Key Features

- **📈 Real-Time Market Simulation** - S&P 500 stocks with realistic price movements, volatility, and market trends
- **🤖 LLM-Powered Trading Agents** - AI agents powered by Google Gemini that make trading decisions based on market data and news
- **📰 Dynamic News Events** - Breaking news that affects stock prices (earnings beats, FDA approvals, analyst upgrades, etc.)
- **🎮 Create Your Own Agent** - Write your own trading strategy in natural language and compete!
- **💬 AI Trading Consultant** - Chat with a Gemini-powered assistant that knows live market data
- **🏆 Live Leaderboard** - Track performance and see who's winning

---

## 🆕 What's New?

### Core Simulation Features
- **Multi-Agent Market** - 10+ trading agents with different personalities:
  - **Quant Institutions** (Citadel, Jane Street) - Trade frequently, chase momentum
  - **Fundamental Institutions** (BlackRock, Vanguard) - Patient value investors
  - **Retail Traders** - Make emotional decisions, pay high fees
  - **Custom Agent** - Your own AI trader!

### Real-Time WebSocket Streaming
- Live market index updates
- Agent trading activity feed
- Top gainers/losers tracking
- Portfolio P&L calculations

### Smart News System
- Quant traders see news immediately
- Fundamental traders see news 1 tick later
- Retail traders see news 2 ticks later (simulating social media delay)

### Gemini-Powered Chat Assistant
- Ask about market conditions
- Chat assistant gives in-game commentary and strategy suggestions for the simulation
- AI knows live market data

---

## 🛠️ Tech Stack

### Backend (Python)
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async web framework |
| **WebSockets** | Real-time bidirectional communication |
| **OpenRouter API** | LLM access for trading agents (Gemini 3.0 Flash) |
| **Google GenAI** | Gemini API for chat assistant |
| **Uvicorn** | ASGI server |

### Frontend (TypeScript/React)
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **TypeScript** | Type safety |
| **TailwindCSS** | Utility-first styling |
| **Shadcn/UI** | Component library (Radix primitives) |
| **Recharts** | Data visualization |
| **Framer Motion** | Animations |
| **React Query** | Data fetching |

### Architecture
| Component | Description |
|-----------|-------------|
| **SimulationOrchestrator** | Central controller for tick-based market simulation |
| **OrderBook** | Price-time priority order matching engine |
| **TradingAgent** | LLM-powered agent with tool-calling capabilities |
| **NewsGenerator** | Random market news events |

---

## 🏃 How to Run

### Prerequisites for Option 1: Local Development
- Python 3.11+
- Node.js 18+
- OpenRouter API key (for trading agents)
- Google GenAI API key (for chat)

---

### 🖥️ Option 1: Local Development

For **local testing only** — no Nginx needed.

```bash
# Terminal 1: Backend
cd nwhacks2026
pip install -r requirements.txt
python3 server.py

# Terminal 2: Frontend
cd nwhacks2026/frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

### 🌐 Option 2: Use Live Server

A live server is already running 24/7 on Oracle Cloud:

| Service | URL |
|---------|-----|
| **Web App** | http://163.192.25.163/ |
| **API** | http://163.192.25.163/api/... |
| **WebSocket** | ws://163.192.25.163/ws |

Just open the URL in your browser — no setup required!

> **Server Info:** The server uses Nginx as a reverse proxy and runs the backend via tmux for continuous operation.

---

## 📊 How the Simulation Works

1. **Market Opens** - 500 S&P stocks loaded with 12-month price history
2. **Each Tick (Day)**:
   - Random market volatility applied (some stocks are bullish, some bearish)
   - News events may trigger (10% chance per tick)
   - Market maker posts quotes
   - LLM agents analyze market and make trading decisions
   - Orders matched in order book
   - Portfolios updated, P&L calculated
3. **Simulation Ends** - Final leaderboard shows who won!

---

## 🎯 Create Your Own Trading Agent

Write your strategy in natural language:

```python
MY_STRATEGY = """
I am a SMART CONTRARIAN. I look for overreactions in the market.
- When a stock drops MORE than 5% below its historical average, I BUY (oversold)
- When a stock rises MORE than 5% above its historical average, I SELL (overbought)
- I use medium position sizes (10-20 shares)
- I'm patient and wait for clear opportunities
"""
```

Or use pre-built strategies: `contrarian`, `momentum`, `value_hunter`, `sector_rotator`, `yolo`

---

## 📁 Project Structure

```
nwhacks2026/
├── server.py           # FastAPI WebSocket server
├── orchestration.py    # Simulation orchestrator
├── order_book.py       # Order matching engine
├── agents.py           # LLM trading agents
├── custom_agent.py     # Custom agent factory
├── news_events.py      # News event generator
├── stocks_sp500.csv    # S&P 500 stock data
├── requirements.txt    # Python dependencies
├── frontend/           # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── WEBSOCKET_API_FORMAT.md
```

---

## 👥 Team

Teammate: Dane, Timothy, Yaolong

Built with ❤️ at **nwHacks 2026**

---

## 📜 License

MIT License - Feel free to fork and build upon this project!
