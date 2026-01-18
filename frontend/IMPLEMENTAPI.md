# MarketMind API Integration Guide

> **Document Status**: Living Document  
> **Last Updated**: January 2026  
> **Version**: 1.0.0

This document details the steps and code locations required to replace the current dummy data with live API calls, accurately simulating trader behavior based on real-time market data.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Finnhub API Integration](#finnhub-api-integration)
4. [Agent API Integration](#agent-api-integration)
5. [Rate Limit Considerations](#rate-limit-considerations)
6. [Error Handling](#error-handling)
7. [Code Migration Guide](#code-migration-guide)
8. [Backend Integration Points](#backend-integration-points)
9. [Environment Variables](#environment-variables)
10. [Testing & Validation](#testing--validation)

---

## Overview

MarketMind currently uses mocked real-time data via the `useTickSimulation` hook. This guide outlines the transition to:

1. **Finnhub API** - Real-time market data (prices, quotes, candles)
2. **Agent APIs** - AI-powered trading decisions (Gemini, OpenAI, custom models)

### Current Architecture (Mocked)

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  useTickSimulation (mocked data)                │    │
│  │  - generateTick() → random price data           │    │
│  │  - updateTraders() → random PnL changes         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Target Architecture (Live)

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  useTickSimulation (live data)                  │    │
│  │  - Finnhub WebSocket → real price data          │    │
│  │  - Agent API calls → AI trading decisions       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Edge Functions)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Finnhub Proxy│  │ Agent Router │  │ Rate Limiter │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │  Finnhub   │   │   Gemini   │   │   OpenAI   │
   │    API     │   │    API     │   │    API     │
   └────────────┘   └────────────┘   └────────────┘
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │   LiveChart.tsx     │    │   Leaderboard.tsx   │    │  ProfileBuilder │  │
│  │   - Price display   │    │   - Trader rankings │    │  - User config  │  │
│  │   - Candlesticks    │    │   - PnL tracking    │    │  - Strategy     │  │
│  └──────────┬──────────┘    └──────────┬──────────┘    └────────┬────────┘  │
│             │                          │                        │            │
│             └──────────────────────────┼────────────────────────┘            │
│                                        ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     useTickSimulation.ts                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ REPLACE: generateTick() → useFinnhubStream()                    │ │   │
│  │  │ REPLACE: updateTraders() → useAgentDecisions()                  │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                        │                                     │
└────────────────────────────────────────┼─────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Edge Functions)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │  /api/finnhub-proxy │    │  /api/agent-trade   │    │ /api/rate-check │  │
│  │  - WebSocket relay  │    │  - Route to agents  │    │ - Limit tracker │  │
│  │  - REST fallback    │    │  - Response cache   │    │ - Quota mgmt    │  │
│  └──────────┬──────────┘    └──────────┬──────────┘    └────────┬────────┘  │
│             │                          │                        │            │
└─────────────┼──────────────────────────┼────────────────────────┼────────────┘
              │                          │                        │
              ▼                          ▼                        ▼
       ┌────────────┐           ┌─────────────────┐       ┌────────────┐
       │  Finnhub   │           │   Agent APIs    │       │  Database  │
       │  API       │           │  ┌───────────┐  │       │  (Usage    │
       │            │           │  │  Gemini   │  │       │   Logs)    │
       └────────────┘           │  ├───────────┤  │       └────────────┘
                                │  │  OpenAI   │  │
                                │  ├───────────┤  │
                                │  │  Custom   │  │
                                │  └───────────┘  │
                                └─────────────────┘
```

---

## Finnhub API Integration

### Overview

Finnhub provides real-time stock market data. We'll use both REST and WebSocket endpoints for different use cases.

### Endpoints

#### 1. Real-Time Quote (REST)

```
GET https://finnhub.io/api/v1/quote
```

| Parameter | Type   | Required | Description                    | Example   |
|-----------|--------|----------|--------------------------------|-----------|
| `symbol`  | string | Yes      | Stock symbol                   | `"AAPL"`  |
| `token`   | string | Yes      | API key (query param or header)| `"abc123"`|

**Example Request:**

```typescript
// src/services/finnhub.ts

interface FinnhubQuote {
  c: number;   // Current price
  d: number;   // Change
  dp: number;  // Percent change
  h: number;   // High price of the day
  l: number;   // Low price of the day
  o: number;   // Open price of the day
  pc: number;  // Previous close price
  t: number;   // Timestamp
}

export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}`,
    {
      headers: {
        'X-Finnhub-Token': process.env.FINNHUB_API_KEY!,
      },
    }
  );
  
  if (!response.ok) {
    throw new FinnhubError(`Quote fetch failed: ${response.status}`);
  }
  
  return response.json();
}
```

**Example Response (Success):**

```json
{
  "c": 178.72,
  "d": 2.54,
  "dp": 1.4421,
  "h": 179.63,
  "l": 175.80,
  "o": 176.15,
  "pc": 176.18,
  "t": 1706198400
}
```

**Example Response (Error):**

```json
{
  "error": "Invalid API key"
}
```

#### 2. Real-Time WebSocket

```
wss://ws.finnhub.io?token=YOUR_API_KEY
```

**WebSocket Implementation:**

```typescript
// src/hooks/useFinnhubStream.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { TickData } from '@/types/trading';

interface FinnhubTrade {
  s: string;   // Symbol
  p: number;   // Last price
  t: number;   // Timestamp (ms)
  v: number;   // Volume
  c: string[]; // Trade conditions
}

interface FinnhubMessage {
  type: 'trade' | 'ping';
  data?: FinnhubTrade[];
}

export function useFinnhubStream(symbols: string[]) {
  const wsRef = useRef<WebSocket | null>(null);
  const [lastTrade, setLastTrade] = useState<Map<string, FinnhubTrade>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Use backend proxy to protect API key
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/finnhub-stream`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Subscribe to symbols
      symbols.forEach(symbol => {
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          symbol: symbol
        }));
      });
    };

    wsRef.current.onmessage = (event) => {
      const message: FinnhubMessage = JSON.parse(event.data);
      
      if (message.type === 'trade' && message.data) {
        message.data.forEach(trade => {
          setLastTrade(prev => new Map(prev).set(trade.s, trade));
        });
      }
    };

    wsRef.current.onerror = (event) => {
      console.error('Finnhub WebSocket error:', event);
      setError('WebSocket connection error');
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      
      // Exponential backoff reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        reconnectAttempts.current++;
        setTimeout(connect, delay);
      }
    };
  }, [symbols]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        symbols.forEach(symbol => {
          wsRef.current?.send(JSON.stringify({
            type: 'unsubscribe',
            symbol: symbol
          }));
        });
        wsRef.current.close();
      }
    };
  }, [connect, symbols]);

  return { lastTrade, isConnected, error };
}
```

#### 3. Stock Candles (Historical Data)

```
GET https://finnhub.io/api/v1/stock/candle
```

| Parameter    | Type   | Required | Description                        | Example        |
|--------------|--------|----------|------------------------------------|----------------|
| `symbol`     | string | Yes      | Stock symbol                       | `"AAPL"`       |
| `resolution` | string | Yes      | Candle resolution (1, 5, 15, 30, 60, D, W, M) | `"5"` |
| `from`       | number | Yes      | UNIX timestamp start               | `1706140800`   |
| `to`         | number | Yes      | UNIX timestamp end                 | `1706198400`   |
| `token`      | string | Yes      | API key                            | `"abc123"`     |

**Example Response:**

```json
{
  "c": [178.72, 179.10, 178.95],
  "h": [179.63, 179.80, 179.20],
  "l": [175.80, 178.50, 178.60],
  "o": [176.15, 178.72, 179.10],
  "s": "ok",
  "t": [1706140800, 1706144400, 1706148000],
  "v": [1234567, 987654, 456789]
}
```

### Data Transformation

Map Finnhub data to our internal `TickData` format:

```typescript
// src/utils/finnhubTransform.ts

import { TickData, MarketData } from '@/types/trading';

interface FinnhubCandle {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  t: number[];  // Timestamps
  v: number[];  // Volumes
  s: string;    // Status
}

export function transformCandleToTickData(candle: FinnhubCandle): TickData[] {
  if (candle.s !== 'ok' || !candle.c?.length) {
    return [];
  }

  return candle.c.map((close, index) => ({
    timestamp: candle.t[index] * 1000, // Convert to milliseconds
    open: candle.o[index],
    high: candle.h[index],
    low: candle.l[index],
    close: close,
    volume: candle.v[index],
  }));
}

export function transformQuoteToMarketData(
  quote: FinnhubQuote,
  symbol: string
): MarketData {
  const regime = quote.d > 0 ? 'bull' : quote.d < 0 ? 'bear' : 'sideways';
  const volatility = Math.abs(quote.dp) / 100; // Rough volatility estimate

  return {
    symbol,
    currentPrice: quote.c,
    previousPrice: quote.pc,
    changePercent: quote.dp,
    regime,
    volatility,
  };
}

export function transformTradeToTickData(trade: FinnhubTrade): Partial<TickData> {
  return {
    timestamp: trade.t,
    close: trade.p,
    volume: trade.v,
    // Note: Real-time trades don't include OHLC; aggregate on backend
  };
}
```

---

## Agent API Integration

### Agent Types

| Agent Name      | Type           | AI Provider | Description                              |
|-----------------|----------------|-------------|------------------------------------------|
| Alpha Quant     | `quant`        | Gemini      | Quantitative analysis, pattern detection |
| Velocity HFT    | `hft`          | Custom ML   | High-frequency, low-latency decisions    |
| DeepValue Fund  | `institutional`| OpenAI      | Fundamental analysis, long-term holds    |
| YOLO Trader     | `retail`       | Gemini      | Momentum-based, trend following          |
| SteadyEddie     | `institutional`| OpenAI      | Conservative, dividend-focused           |
| User Custom     | `custom`       | Configurable| User-defined strategy                    |

---

### 1. Gemini Agent API (Alpha Quant, YOLO Trader)

**Endpoint:**

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

**Parameters:**

| Parameter       | Type    | Required | Description                           | Example                    |
|-----------------|---------|----------|---------------------------------------|----------------------------|
| `contents`      | array   | Yes      | Conversation messages                 | See below                  |
| `generationConfig` | object | No    | Temperature, max tokens, etc.         | `{ "temperature": 0.7 }`   |
| `safetySettings`| array   | No       | Content safety filters                | See Gemini docs            |

**Request Body:**

```typescript
// src/services/agents/geminiAgent.ts

interface GeminiTradeRequest {
  symbol: string;
  currentPrice: number;
  priceHistory: number[];
  volume: number;
  marketRegime: 'bull' | 'bear' | 'sideways';
  volatility: number;
  traderProfile: {
    strategyType: string;
    riskAppetite: number;  // 0-100
    reactionSpeed: number; // 0-100
  };
}

interface GeminiTradeResponse {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;      // 0-1
  quantity: number;        // Suggested position size
  reasoning: string;       // Explanation of decision
  targetPrice?: number;    // Optional price target
  stopLoss?: number;       // Optional stop loss level
}

export async function getGeminiTradeDecision(
  request: GeminiTradeRequest
): Promise<GeminiTradeResponse> {
  const systemPrompt = buildTradingSystemPrompt(request.traderProfile);
  const userPrompt = buildMarketAnalysisPrompt(request);

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3, // Lower for more consistent trading decisions
          maxOutputTokens: 500,
          topP: 0.8,
        }
      }),
    }
  );

  if (!response.ok) {
    throw new AgentError(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return parseTradeResponse(data.candidates[0].content.parts[0].text);
}

function buildTradingSystemPrompt(profile: GeminiTradeRequest['traderProfile']): string {
  const riskLevel = profile.riskAppetite > 70 ? 'aggressive' : 
                    profile.riskAppetite > 30 ? 'moderate' : 'conservative';
  
  return `You are an AI trading agent with a ${profile.strategyType} strategy.
Your risk profile is ${riskLevel} (${profile.riskAppetite}/100).
Your reaction speed is ${profile.reactionSpeed}/100.

Respond ONLY with valid JSON in this format:
{
  "action": "buy" | "sell" | "hold",
  "confidence": 0.0-1.0,
  "quantity": number (0-100 representing % of available capital),
  "reasoning": "brief explanation",
  "targetPrice": number (optional),
  "stopLoss": number (optional)
}`;
}

function buildMarketAnalysisPrompt(request: GeminiTradeRequest): string {
  const recentPrices = request.priceHistory.slice(-10);
  const priceChange = ((request.currentPrice - recentPrices[0]) / recentPrices[0] * 100).toFixed(2);
  
  return `Analyze this market data and make a trading decision:

Symbol: ${request.symbol}
Current Price: $${request.currentPrice.toFixed(2)}
Recent Price Change: ${priceChange}%
Volume: ${request.volume.toLocaleString()}
Market Regime: ${request.marketRegime}
Volatility: ${(request.volatility * 100).toFixed(2)}%
Recent Prices: ${recentPrices.map(p => p.toFixed(2)).join(', ')}

What is your trading decision?`;
}

function parseTradeResponse(text: string): GeminiTradeResponse {
  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize response
    return {
      action: ['buy', 'sell', 'hold'].includes(parsed.action) ? parsed.action : 'hold',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      quantity: Math.max(0, Math.min(100, parsed.quantity || 0)),
      reasoning: parsed.reasoning || 'No reasoning provided',
      targetPrice: parsed.targetPrice,
      stopLoss: parsed.stopLoss,
    };
  } catch (error) {
    console.error('Failed to parse Gemini response:', text);
    return {
      action: 'hold',
      confidence: 0.5,
      quantity: 0,
      reasoning: 'Failed to parse AI response, defaulting to hold',
    };
  }
}
```

**Example Response (Success):**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "```json\n{\n  \"action\": \"buy\",\n  \"confidence\": 0.78,\n  \"quantity\": 35,\n  \"reasoning\": \"Strong bullish momentum with increasing volume. RSI indicates oversold conditions recovering. Target entry at current levels.\",\n  \"targetPrice\": 185.50,\n  \"stopLoss\": 172.00\n}\n```"
          }
        ]
      }
    }
  ]
}
```

---

### 2. OpenAI Agent API (DeepValue Fund, SteadyEddie)

**Endpoint:**

```
POST https://api.openai.com/v1/chat/completions
```

**Parameters:**

| Parameter     | Type    | Required | Description                     | Example                      |
|---------------|---------|----------|---------------------------------|------------------------------|
| `model`       | string  | Yes      | Model to use                    | `"gpt-4-turbo-preview"`      |
| `messages`    | array   | Yes      | Conversation messages           | See below                    |
| `temperature` | number  | No       | Randomness (0-2)                | `0.3`                        |
| `max_tokens`  | number  | No       | Maximum response length         | `500`                        |
| `response_format` | object | No   | Force JSON output               | `{ "type": "json_object" }`  |

**Request Body:**

```typescript
// src/services/agents/openaiAgent.ts

interface OpenAITradeRequest extends GeminiTradeRequest {
  fundamentalData?: {
    pe_ratio?: number;
    market_cap?: number;
    dividend_yield?: number;
    earnings_growth?: number;
  };
}

export async function getOpenAITradeDecision(
  request: OpenAITradeRequest
): Promise<GeminiTradeResponse> {
  const systemMessage = buildInstitutionalSystemPrompt(request.traderProfile);
  const userMessage = buildDetailedAnalysisPrompt(request);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new AgentError(`OpenAI API error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function buildInstitutionalSystemPrompt(profile: OpenAITradeRequest['traderProfile']): string {
  return `You are an institutional trading AI with a ${profile.strategyType} investment philosophy.

Your approach:
- Focus on fundamental analysis and long-term value
- Consider macroeconomic factors
- Prioritize capital preservation with risk appetite: ${profile.riskAppetite}/100
- Decision frequency aligned with reaction speed: ${profile.reactionSpeed}/100

Always respond with valid JSON matching this schema:
{
  "action": "buy" | "sell" | "hold",
  "confidence": number (0-1),
  "quantity": number (0-100, percentage of available capital),
  "reasoning": string (2-3 sentences explaining the decision),
  "targetPrice": number | null,
  "stopLoss": number | null,
  "timeHorizon": "short" | "medium" | "long"
}`;
}

function buildDetailedAnalysisPrompt(request: OpenAITradeRequest): string {
  let prompt = `Market Analysis Request:

Symbol: ${request.symbol}
Current Price: $${request.currentPrice.toFixed(2)}
Market Regime: ${request.marketRegime}
Volatility: ${(request.volatility * 100).toFixed(2)}%

Price History (last 10 periods):
${request.priceHistory.slice(-10).map((p, i) => `  ${i + 1}. $${p.toFixed(2)}`).join('\n')}

Volume: ${request.volume.toLocaleString()}`;

  if (request.fundamentalData) {
    prompt += `

Fundamental Data:
- P/E Ratio: ${request.fundamentalData.pe_ratio || 'N/A'}
- Market Cap: ${request.fundamentalData.market_cap ? `$${(request.fundamentalData.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
- Dividend Yield: ${request.fundamentalData.dividend_yield ? `${request.fundamentalData.dividend_yield}%` : 'N/A'}
- Earnings Growth: ${request.fundamentalData.earnings_growth ? `${request.fundamentalData.earnings_growth}%` : 'N/A'}`;
  }

  prompt += '\n\nProvide your trading decision as JSON.';
  
  return prompt;
}
```

---

### 3. Custom ML Agent API (Velocity HFT)

For high-frequency trading simulation, we use a custom ML model endpoint:

**Endpoint:**

```
POST /api/agent/hft-decision
```

**Parameters:**

| Parameter         | Type    | Required | Description                          | Example         |
|-------------------|---------|----------|--------------------------------------|-----------------|
| `symbol`          | string  | Yes      | Stock symbol                         | `"AAPL"`        |
| `tick_data`       | array   | Yes      | Last N ticks (price, volume, time)   | See below       |
| `order_book`      | object  | No       | Current bid/ask spread               | See below       |
| `latency_budget`  | number  | No       | Max response time in ms              | `50`            |

**Request Body:**

```typescript
// src/services/agents/hftAgent.ts

interface HFTRequest {
  symbol: string;
  tick_data: Array<{
    price: number;
    volume: number;
    timestamp: number;
  }>;
  order_book?: {
    bids: Array<[number, number]>; // [price, quantity]
    asks: Array<[number, number]>;
  };
  latency_budget?: number;
}

interface HFTResponse {
  action: 'buy' | 'sell' | 'hold';
  urgency: 'immediate' | 'next_tick' | 'wait';
  quantity: number;
  limit_price?: number;
  predicted_direction: 'up' | 'down' | 'neutral';
  prediction_confidence: number;
  model_version: string;
  inference_time_ms: number;
}

export async function getHFTDecision(request: HFTRequest): Promise<HFTResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.latency_budget || 100);

  try {
    const response = await fetch('/api/agent/hft-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new AgentError(`HFT API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      // Timeout - default to hold for HFT
      return {
        action: 'hold',
        urgency: 'wait',
        quantity: 0,
        predicted_direction: 'neutral',
        prediction_confidence: 0,
        model_version: 'timeout-fallback',
        inference_time_ms: request.latency_budget || 100,
      };
    }
    throw error;
  }
}
```

---

### 4. Unified Agent Router

```typescript
// src/services/agents/agentRouter.ts

import { getGeminiTradeDecision } from './geminiAgent';
import { getOpenAITradeDecision } from './openaiAgent';
import { getHFTDecision } from './hftAgent';
import { TraderResult, MarketData, TickData } from '@/types/trading';

interface AgentDecision {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  quantity: number;
  reasoning: string;
  pnlImpact: number;
}

export async function getAgentDecision(
  trader: TraderResult,
  marketData: MarketData,
  priceHistory: TickData[]
): Promise<AgentDecision> {
  const baseRequest = {
    symbol: marketData.symbol,
    currentPrice: marketData.currentPrice,
    priceHistory: priceHistory.map(t => t.close),
    volume: priceHistory[priceHistory.length - 1]?.volume || 0,
    marketRegime: marketData.regime,
    volatility: marketData.volatility,
    traderProfile: {
      strategyType: getStrategyType(trader.type),
      riskAppetite: getRiskAppetite(trader.type),
      reactionSpeed: getReactionSpeed(trader.type),
    },
  };

  let decision;

  switch (trader.type) {
    case 'quant':
    case 'retail':
      decision = await getGeminiTradeDecision(baseRequest);
      break;
    
    case 'institutional':
      decision = await getOpenAITradeDecision(baseRequest);
      break;
    
    case 'hft':
      const hftDecision = await getHFTDecision({
        symbol: marketData.symbol,
        tick_data: priceHistory.slice(-50).map(t => ({
          price: t.close,
          volume: t.volume,
          timestamp: t.timestamp,
        })),
        latency_budget: 50,
      });
      decision = {
        action: hftDecision.action,
        confidence: hftDecision.prediction_confidence,
        quantity: hftDecision.quantity,
        reasoning: `HFT signal: ${hftDecision.predicted_direction} with ${hftDecision.urgency} urgency`,
      };
      break;
    
    default:
      decision = { action: 'hold', confidence: 0.5, quantity: 0, reasoning: 'Unknown trader type' };
  }

  // Calculate PnL impact based on decision
  const pnlImpact = calculatePnLImpact(decision, marketData);

  return {
    ...decision,
    pnlImpact,
  };
}

function calculatePnLImpact(
  decision: { action: string; confidence: number; quantity: number },
  marketData: MarketData
): number {
  if (decision.action === 'hold') return 0;
  
  const priceMove = marketData.currentPrice - marketData.previousPrice;
  const positionSize = decision.quantity / 100; // Convert to fraction
  
  if (decision.action === 'buy') {
    return priceMove * positionSize * decision.confidence * 100;
  } else {
    return -priceMove * positionSize * decision.confidence * 100;
  }
}

function getStrategyType(traderType: string): string {
  const strategies: Record<string, string> = {
    quant: 'quantitative momentum',
    hft: 'high-frequency arbitrage',
    institutional: 'fundamental value',
    retail: 'trend following',
    custom: 'user-defined',
  };
  return strategies[traderType] || 'balanced';
}

function getRiskAppetite(traderType: string): number {
  const risks: Record<string, number> = {
    quant: 65,
    hft: 80,
    institutional: 40,
    retail: 75,
    custom: 50,
  };
  return risks[traderType] || 50;
}

function getReactionSpeed(traderType: string): number {
  const speeds: Record<string, number> = {
    quant: 70,
    hft: 100,
    institutional: 20,
    retail: 60,
    custom: 50,
  };
  return speeds[traderType] || 50;
}
```

---

## Rate Limit Considerations

### Finnhub API Rate Limits

| Plan       | REST Requests | WebSocket Symbols | Notes                    |
|------------|---------------|-------------------|--------------------------|
| Free       | 60/minute     | 50                | 1 connection             |
| Starter    | 300/minute    | 100               | Real-time trades         |
| Pro        | 600/minute    | 500               | Level 2 data available   |
| Enterprise | Custom        | Custom            | Contact sales            |

**Implementation:**

```typescript
// src/utils/rateLimiter.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.config.windowMs
    );

    if (this.requests.length >= this.config.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.config.windowMs - (now - oldestRequest);
      
      console.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return this.throttle(); // Retry
    }

    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const validRequests = this.requests.filter(
      time => now - time < this.config.windowMs
    );
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }
}

// Create rate limiters for each API
export const finnhubLimiter = new RateLimiter({
  maxRequests: 55, // Leave buffer under 60
  windowMs: 60 * 1000,
});

export const geminiLimiter = new RateLimiter({
  maxRequests: 55,
  windowMs: 60 * 1000,
});

export const openaiLimiter = new RateLimiter({
  maxRequests: 45,
  windowMs: 60 * 1000,
});
```

### Agent API Rate Limits

| Provider | Model              | RPM (Requests/min) | TPM (Tokens/min) | Notes            |
|----------|--------------------|--------------------|------------------|------------------|
| Gemini   | gemini-pro         | 60                 | 60,000           | Free tier        |
| OpenAI   | gpt-4-turbo        | 500                | 30,000           | Tier 1           |
| OpenAI   | gpt-4              | 10,000             | 300,000          | Tier 5           |
| Custom   | hft-model          | 1,000              | N/A              | Self-hosted      |

### Backend Rate Limiting

```typescript
// supabase/functions/_shared/rateLimit.ts

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  
  // Count requests in current window
  const { count, error } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart);

  if (error) {
    console.error('Rate limit check failed:', error);
    // Fail open but log the issue
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }

  const remaining = Math.max(0, limit - (count || 0));
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt: Date.now() + windowSeconds * 1000,
  };
}
```

### Caching Strategy

```typescript
// src/utils/cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new APICache();

// Usage example
export async function getCachedQuote(symbol: string): Promise<FinnhubQuote> {
  const cacheKey = `quote:${symbol}`;
  const cached = apiCache.get<FinnhubQuote>(cacheKey);
  
  if (cached) {
    return cached;
  }

  await finnhubLimiter.throttle();
  const quote = await getQuote(symbol);
  
  // Cache for 5 seconds (Finnhub updates every 1-5 seconds)
  apiCache.set(cacheKey, quote, 5000);
  
  return quote;
}
```

---

## Error Handling

### Error Types

```typescript
// src/types/errors.ts

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public provider: 'finnhub' | 'gemini' | 'openai' | 'custom',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(
    provider: 'finnhub' | 'gemini' | 'openai' | 'custom',
    public retryAfter: number
  ) {
    super(`Rate limit exceeded for ${provider}`, 429, provider, true);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends APIError {
  constructor(provider: 'finnhub' | 'gemini' | 'openai' | 'custom') {
    super(`Authentication failed for ${provider}`, 401, provider, false);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends APIError {
  constructor(provider: 'finnhub' | 'gemini' | 'openai' | 'custom') {
    super(`Network error connecting to ${provider}`, 0, provider, true);
    this.name = 'NetworkError';
  }
}
```

### Error Handler

```typescript
// src/utils/errorHandler.ts

import { toast } from '@/hooks/use-toast';
import { APIError, RateLimitError, AuthenticationError, NetworkError } from '@/types/errors';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  fallbackValue?: any;
}

export async function handleAPIError<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  const { showToast = true, logToConsole = true, fallbackValue = null } = options;

  try {
    return await operation();
  } catch (error) {
    if (logToConsole) {
      console.error('API Error:', error);
    }

    if (error instanceof RateLimitError) {
      if (showToast) {
        toast({
          title: 'Rate Limit Reached',
          description: `Too many requests. Please wait ${Math.ceil(error.retryAfter / 1000)} seconds.`,
          variant: 'destructive',
        });
      }
    } else if (error instanceof AuthenticationError) {
      if (showToast) {
        toast({
          title: 'Authentication Failed',
          description: 'Please check your API credentials.',
          variant: 'destructive',
        });
      }
    } else if (error instanceof NetworkError) {
      if (showToast) {
        toast({
          title: 'Connection Error',
          description: 'Unable to reach the server. Check your internet connection.',
          variant: 'destructive',
        });
      }
    } else if (error instanceof APIError) {
      if (showToast) {
        toast({
          title: 'API Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      if (showToast) {
        toast({
          title: 'Unexpected Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    }

    return fallbackValue;
  }
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-retryable errors
      if (error instanceof APIError && !error.retryable) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Logging Strategy

```typescript
// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    this.logs.push(entry);
    
    // Keep log size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs / 2);
    }

    // Console output
    const logMethod = level === 'error' ? console.error : 
                      level === 'warn' ? console.warn : 
                      level === 'debug' ? console.debug : console.log;
    
    logMethod(`[${level.toUpperCase()}] ${message}`, context || '', error || '');

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production' && (level === 'error' || level === 'warn')) {
      this.sendToLoggingService(entry);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  private async sendToLoggingService(entry: LogEntry) {
    // Implement your logging service integration here
    // Example: Sentry, LogRocket, DataDog, etc.
  }
}

export const logger = new Logger();
```

---

## Code Migration Guide

### Step 1: Replace Mock Tick Generation

**Current Location:** `src/hooks/useTickSimulation.ts`

**Before (Mocked):**

```typescript
const generateTick = (prevClose: number, volatility: number = 0.02): TickData => {
  const change = (Math.random() - 0.5) * 2 * volatility * prevClose;
  // ... random generation
};
```

**After (Live):**

```typescript
// In useTickSimulation.ts, replace generateTick usage with:

import { useFinnhubStream } from './useFinnhubStream';
import { transformTradeToTickData } from '@/utils/finnhubTransform';

export function useTickSimulation() {
  const { lastTrade, isConnected } = useFinnhubStream([currentSymbol]);
  
  // Replace setInterval with WebSocket data
  useEffect(() => {
    if (!isConnected) return;
    
    const trade = lastTrade.get(currentSymbol);
    if (trade) {
      const tickData = transformTradeToTickData(trade);
      setTickHistory(prev => [...prev.slice(-99), tickData as TickData]);
      // Update market data...
    }
  }, [lastTrade, currentSymbol, isConnected]);
  
  // ... rest of hook
}
```

### Step 2: Replace Mock Trader Updates

**Current Location:** `src/hooks/useTickSimulation.ts`, lines 86-105

**Before (Mocked):**

```typescript
setTraders(prev => {
  const updated = prev.map(trader => {
    const change = (Math.random() - 0.48) * 500 * (trader.type === 'hft' ? 1.5 : 1);
    // ... random updates
  });
});
```

**After (Live):**

```typescript
import { getAgentDecision } from '@/services/agents/agentRouter';

// In the tick update effect:
useEffect(() => {
  async function updateTradersWithAI() {
    const updatedTraders = await Promise.all(
      traders.map(async (trader) => {
        try {
          const decision = await getAgentDecision(trader, marketData, tickHistory);
          
          return {
            ...trader,
            previousPnL: trader.currentPnL,
            currentPnL: trader.currentPnL + decision.pnlImpact,
            sparklineData: [...trader.sparklineData.slice(-6), (trader.currentPnL + decision.pnlImpact) / 1000],
            lastDecision: decision, // Store for UI display
          };
        } catch (error) {
          logger.error('Agent decision failed', error as Error, { traderId: trader.id });
          return trader; // Keep unchanged on error
        }
      })
    );
    
    // Re-rank traders
    setTraders(
      updatedTraders
        .sort((a, b) => b.currentPnL - a.currentPnL)
        .map((t, i) => ({ ...t, previousRank: t.rank, rank: i + 1 }))
    );
  }
  
  if (isPlaying) {
    updateTradersWithAI();
  }
}, [tickHistory, isPlaying]);
```

### Step 3: Create Service Layer

Create new files in `src/services/`:

```
src/
├── services/
│   ├── agents/
│   │   ├── index.ts           # Exports all agents
│   │   ├── agentRouter.ts     # Routes to correct agent
│   │   ├── geminiAgent.ts     # Gemini API calls
│   │   ├── openaiAgent.ts     # OpenAI API calls
│   │   └── hftAgent.ts        # Custom HFT model
│   ├── finnhub/
│   │   ├── index.ts           # Exports all Finnhub functions
│   │   ├── quotes.ts          # REST quote fetching
│   │   ├── candles.ts         # Historical data
│   │   └── websocket.ts       # Real-time stream
│   └── index.ts               # Main service exports
```

---

## Backend Integration Points

### Edge Function Endpoints

| Endpoint                  | Method | Description                          | Auth Required |
|---------------------------|--------|--------------------------------------|---------------|
| `/api/finnhub-proxy`      | GET    | Proxy for Finnhub REST API           | Yes           |
| `/api/finnhub-stream`     | WS     | WebSocket proxy for real-time data   | Yes           |
| `/api/agent/trade`        | POST   | Get trading decision from AI agent   | Yes           |
| `/api/agent/hft-decision` | POST   | HFT model inference                  | Yes           |
| `/api/rate-check`         | GET    | Check remaining API quota            | Yes           |
| `/api/usage-log`          | POST   | Log API usage for analytics          | Yes           |

### Example Edge Function (Finnhub Proxy)

```typescript
// supabase/functions/finnhub-proxy/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    const { data: rateLimit } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'finnhub',
      p_limit: 55,
      p_window_seconds: 60,
    });

    if (!rateLimit?.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: rateLimit?.reset_at,
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward request to Finnhub
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol');
    const endpoint = url.searchParams.get('endpoint') || 'quote';

    const finnhubUrl = `https://finnhub.io/api/v1/${endpoint}?symbol=${symbol}`;
    const response = await fetch(finnhubUrl, {
      headers: {
        'X-Finnhub-Token': Deno.env.get('FINNHUB_API_KEY')!,
      },
    });

    const data = await response.json();

    // Log usage
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      endpoint: 'finnhub',
      symbol,
      response_status: response.status,
    });

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Finnhub proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Database Schema for Usage Tracking

```sql
-- API Usage Logs
CREATE TABLE api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  symbol TEXT,
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rate limiting queries
CREATE INDEX idx_usage_logs_rate_limit 
ON api_usage_logs (user_id, endpoint, created_at DESC);

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  SELECT COUNT(*) INTO v_count
  FROM api_usage_logs
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at >= v_window_start;
  
  RETURN json_build_object(
    'allowed', v_count < p_limit,
    'remaining', GREATEST(0, p_limit - v_count),
    'reset_at', EXTRACT(EPOCH FROM (v_window_start + (p_window_seconds || ' seconds')::INTERVAL))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Environment Variables

### Required Variables

| Variable             | Description                    | Where to Set      | Example                          |
|----------------------|--------------------------------|-------------------|----------------------------------|
| `FINNHUB_API_KEY`    | Finnhub API key                | Backend secrets   | `ct1234567890`                   |
| `GEMINI_API_KEY`     | Google Gemini API key          | Backend secrets   | `AIza...`                        |
| `OPENAI_API_KEY`     | OpenAI API key                 | Backend secrets   | `sk-...`                         |
| `SUPABASE_URL`       | Supabase project URL           | Auto-configured   | `https://xxx.supabase.co`        |
| `SUPABASE_ANON_KEY`  | Supabase anonymous key         | Auto-configured   | `eyJ...`                         |

### Frontend Environment Variables (Publishable)

```env
# .env.local (frontend - these are safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WS_URL=wss://your-project.supabase.co/functions/v1
```

> ⚠️ **Never expose secret API keys in frontend code.** All sensitive API calls must go through backend edge functions.

---

## Testing & Validation

### Unit Tests for Data Transformation

```typescript
// src/utils/__tests__/finnhubTransform.test.ts

import { describe, it, expect } from 'vitest';
import { transformCandleToTickData, transformQuoteToMarketData } from '../finnhubTransform';

describe('transformCandleToTickData', () => {
  it('should transform valid candle data to tick data array', () => {
    const candle = {
      c: [100, 101, 102],
      h: [102, 103, 104],
      l: [99, 100, 101],
      o: [100, 101, 102],
      t: [1706140800, 1706144400, 1706148000],
      v: [1000, 2000, 3000],
      s: 'ok',
    };

    const result = transformCandleToTickData(candle);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      timestamp: 1706140800000,
      open: 100,
      high: 102,
      low: 99,
      close: 100,
      volume: 1000,
    });
  });

  it('should return empty array for failed status', () => {
    const candle = { s: 'no_data', c: [], h: [], l: [], o: [], t: [], v: [] };
    expect(transformCandleToTickData(candle)).toEqual([]);
  });
});

describe('transformQuoteToMarketData', () => {
  it('should correctly identify bull market regime', () => {
    const quote = { c: 100, d: 2.5, dp: 2.5, h: 102, l: 98, o: 99, pc: 97.5, t: 1706198400 };
    const result = transformQuoteToMarketData(quote, 'AAPL');
    
    expect(result.regime).toBe('bull');
    expect(result.symbol).toBe('AAPL');
  });

  it('should correctly identify bear market regime', () => {
    const quote = { c: 95, d: -2.5, dp: -2.5, h: 98, l: 94, o: 97, pc: 97.5, t: 1706198400 };
    const result = transformQuoteToMarketData(quote, 'AAPL');
    
    expect(result.regime).toBe('bear');
  });
});
```

### Integration Tests

```typescript
// src/services/__tests__/agentRouter.integration.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgentDecision } from '../agents/agentRouter';

// Mock fetch for testing
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));
describe('Agent Router Integration', () => {
  const mockTrader = {
    id: '1',
    name: 'Test Quant',
    type: 'quant' as const,
    currentPnL: 1000,
    previousPnL: 900,
    sharpe: 1.5,
    winRate: 60,
    sparklineData: [1, 2, 3],
    rank: 1,
    previousRank: 1,
  };

  const mockMarketData = {
    symbol: 'AAPL',
    currentPrice: 180,
    previousPrice: 175,
    changePercent: 2.86,
    regime: 'bull' as const,
    volatility: 0.02,
  };

  const mockTickHistory = Array(30).fill(null).map((_, i) => ({
    timestamp: Date.now() - (30 - i) * 60000,
    open: 175 + i * 0.1,
    high: 176 + i * 0.1,
    low: 174 + i * 0.1,
    close: 175 + i * 0.15,
    volume: 10000 + i * 100,
  }));

  it('should return valid decision for quant trader', async () => {
    // This would hit actual APIs in integration environment
    const decision = await getAgentDecision(mockTrader, mockMarketData, mockTickHistory);

    expect(decision).toHaveProperty('action');
    expect(['buy', 'sell', 'hold']).toContain(decision.action);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });
});
```

### Manual Testing Checklist

- [ ] Finnhub REST API returns valid quote data
- [ ] Finnhub WebSocket connects and receives trades
- [ ] Gemini agent returns valid JSON decisions
- [ ] OpenAI agent returns valid JSON decisions
- [ ] Rate limiting correctly blocks excessive requests
- [ ] Error handling displays user-friendly messages
- [ ] Data transformations produce correct formats
- [ ] Leaderboard updates reflect AI decisions
- [ ] Chart displays real-time price updates

---

## Changelog

| Version | Date       | Changes                                    | Author |
|---------|------------|--------------------------------------------|--------|
| 1.0.0   | 2026-01-17 | Initial documentation                      | AI     |

---

## Additional Resources

- [Finnhub API Documentation](https://finnhub.io/docs/api)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Query for Data Fetching](https://tanstack.com/query/latest)

---

> **Note**: This is a living document. Please update it as APIs evolve and new integrations are added.
