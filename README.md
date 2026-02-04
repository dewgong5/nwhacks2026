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
- Get trading advice (it's a game, so no disclaimers!)
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

### Prerequisites
- Python 3.11+
- Node.js 18+ (or Bun)
- OpenRouter API key (for trading agents)
- Google GenAI API key (for chat)

### Backend Setup

```bash
# Navigate to project root
cd nwhacks2026

# Install Python dependencies
pip install -r requirements.txt

# Run the server
python server.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (npm or bun)
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The frontend will start on `http://localhost:5173` (Vite default)

---

## 🌐 Accessing the Server

The application is deployed and accessible at:

| Service | URL |
|---------|-----|
| **Frontend** | http://163.192.25.163:8080/ |
| **Backend Health Check** | http://163.192.25.163:8000/ |
| **WebSocket** | ws://163.192.25.163:8000/ws |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check - returns server status |
| `/ws` | WebSocket | Real-time market data stream |
| `/start` | POST | Manually start simulation (for testing) |
| `/api/chat` | POST | Chat with AI trading consultant |

### WebSocket Commands

Connect to `/ws` and send:
```json
{
  "command": "start_simulation",
  "num_ticks": 10,
  "tick_delay": 1.0,
  "custom_agent": {
    "name": "My Bot",
    "prompt": "I am a momentum trader who buys rising stocks...",
    "capital": 100000
  }
}
```

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

Teammate: Dane, Timothy, Allen

Built with ❤️ at **nwHacks 2026**

---

## 📜 License

MIT License - Feel free to fork and build upon this project!
