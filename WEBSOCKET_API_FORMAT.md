# WebSocket API Format Specification

This document describes the exact data formats the frontend expects from the WebSocket backend.

## Connection

- **URL**: `ws://10.19.132.108:8000/ws`
- **On Connect**: Frontend sends `{"command": "start_simulation", "num_ticks": 20, "tick_delay": 1.0}`

---

## Message Types

The frontend accepts two main message types:
1. **Price/Tick Updates** - Market data for instruments (S&P 500 index and sectors)
2. **Agent Activity** - Trading agent actions

---

## 1. Price/Tick Updates

### Required Fields for Each Tick

The frontend needs complete tick data to build the chart bars (OHLCV - Open, High, Low, Close, Volume).

#### Format Option A: Complete Tick Object (Recommended)

```json
{
  "type": "tick",
  "tick": 5,
  "timestamp": 1704067200000,
  "instrumentId": "SP500",
  "price": 113.99,
  "open": 113.50,
  "high": 114.20,
  "low": 113.45,
  "close": 113.99,
  "volume": 1250000,
  "previousPrice": 113.25,
  "changePercent": 0.65
}
```

#### Format Option B: Multiple Instruments in One Message

```json
{
  "type": "tick",
  "tick": 5,
  "timestamp": 1704067200000,
  "prices": {
    "SP500": {
      "price": 113.99,
      "open": 113.50,
      "high": 114.20,
      "low": 113.45,
      "close": 113.99,
      "volume": 1250000
    },
    "SECTOR_TECH": {
      "price": 115.50,
      "open": 115.00,
      "high": 115.80,
      "low": 114.90,
      "close": 115.50,
      "volume": 750000
    }
  }
}
```

#### Format Option C: Minimal (Frontend will calculate missing fields)

```json
{
  "price": 113.99,
  "timestamp": 1704067200000,
  "instrumentId": "SP500",
  "volume": 1250000,
  "tick": 5
}
```

**Note**: If `open`, `high`, `low` are missing, the frontend will:
- Use previous instrument price as `open`
- Generate cosmetic `high`/`low` from `price` (not ideal for real data)

---

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Optional | `"tick"` or `"INDEX_TICK"` or `"SECTOR_TICK"` |
| `tick` | number | **Required** | Tick number for the day (0, 1, 2, ...) - used for day bar display |
| `timestamp` | number | **Required** | Unix timestamp in milliseconds |
| `instrumentId` | string | **Required** | Instrument identifier: `"SP500"` or `"SECTOR_{SECTOR_ID}"` (e.g., `"SECTOR_TECH"`) |
| `price` | number | **Required** | Current price (used as `close` if `close` not provided) |
| `open` | number | Recommended | Opening price for this tick |
| `high` | number | Recommended | Highest price during this tick |
| `low` | number | Recommended | Lowest price during this tick |
| `close` | number | Optional | Closing price (defaults to `price` if not provided) |
| `volume` | number | **Required** | Trading volume for this tick |
| `previousPrice` | number | Optional | Previous tick's price (frontend can calculate if missing) |
| `changePercent` | number | Optional | Percentage change (frontend can calculate if missing) |

### Instrument IDs

The frontend expects these exact instrument IDs:

- **Index**: `"SP500"`
- **Sectors**: `"SECTOR_TECH"`, `"SECTOR_HEALTH"`, `"SECTOR_FINANCE"`, `"SECTOR_ENERGY"`, `"SECTOR_CONSUMER_DISC"`, `"SECTOR_CONSUMER_STAPLES"`, `"SECTOR_INDUSTRIALS"`, `"SECTOR_MATERIALS"`, `"SECTOR_UTILITIES"`, `"SECTOR_REAL_ESTATE"`, `"SECTOR_COMM_SERVICES"`

---

## 2. Agent Activity

### Format: Event String (Current Working Format)

```json
{
  "event": "🏦 CCL BUYS 30 AAPL"
}
```

The frontend parses this string to extract:
- **Agent Type**: From emoji (🏦 = institutional, 👤 = retail, 🤖 = quant, ⚡ = hft)
- **Agent Name**: Text before action keyword
- **Action**: BUYS/SELLS/BUY/SELL/DIP/FALLING KNIFE
- **Target**: Ticker symbol or sector name

### Format: Structured Object (Alternative)

```json
{
  "type": "AGENT_ACTIVITY",
  "event": {
    "id": "activity-123",
    "timestamp": 1704067200000,
    "agentType": "institutional",
    "agentName": "CCL",
    "action": "increased",
    "target": "AAPL",
    "summary": "🏦 CCL BUYS 30 AAPL"
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | **Required** | Human-readable event string (e.g., `"🏦 CCL BUYS 30 AAPL"`) |
| `id` | string | Optional | Unique activity ID (frontend generates if missing) |
| `timestamp` | number | Optional | Unix timestamp (frontend uses current time if missing) |
| `agentType` | string | Optional | `"institutional"`, `"retail"`, `"quant"`, or `"hft"` |
| `agentName` | string | Optional | Agent name |
| `action` | string | Optional | `"increased"`, `"decreased"`, `"entered"`, `"exited"`, or `"rebalanced"` |
| `target` | string | Optional | Ticker or sector name |
| `summary` | string | Optional | Full event description |

---

## 3. Status Messages (Optional)

These are informational and don't create events:

```json
{
  "type": "connected",
  "message": "Connected to Market Simulation API"
}
```

```json
{
  "type": "error",
  "message": "Simulation already running"
}
```

---

## Example Complete Message Flow

### Start of Simulation

```json
// Frontend sends:
{"command": "start_simulation", "num_ticks": 20, "tick_delay": 1.0}

// Backend responds:
{"type": "connected", "message": "Connected to Market Simulation API"}
```

### Tick 1

```json
{
  "type": "tick",
  "tick": 1,
  "timestamp": 1704067201000,
  "instrumentId": "SP500",
  "price": 113.99,
  "open": 113.50,
  "high": 114.20,
  "low": 113.45,
  "close": 113.99,
  "volume": 1250000,
  "previousPrice": 113.25,
  "changePercent": 0.65
}
```

### Agent Activity (same tick)

```json
{
  "event": "🏦 CCL BUYS 30 AAPL"
}
```

### Tick 2 (Multiple Instruments)

```json
{
  "type": "tick",
  "tick": 2,
  "timestamp": 1704067202000,
  "prices": {
    "SP500": {
      "price": 114.15,
      "open": 113.99,
      "high": 114.30,
      "low": 113.95,
      "close": 114.15,
      "volume": 1300000
    },
    "SECTOR_TECH": {
      "price": 116.00,
      "open": 115.50,
      "high": 116.20,
      "low": 115.40,
      "close": 116.00,
      "volume": 800000
    }
  }
}
```

---

## Current Frontend Behavior

### What Frontend Currently Does with Missing Data

1. **Missing `open`**: Uses previous instrument price
2. **Missing `high`/`low`**: Generates cosmetic values from `price` (±0.5%)
3. **Missing `volume`**: Generates random volume (100k-1M for SP500, 50k-500k for sectors)
4. **Missing `timestamp`**: Uses `Date.now()`
5. **Missing `changePercent`**: Calculates from first tick price
6. **Missing `previousPrice`**: Uses current instrument price

### Recommended Backend Implementation

**Send complete tick data** to avoid frontend approximations:
- Include `tick` number (required for day bar)
- Include `open`, `high`, `low`, `close`, `volume` (required for accurate chart)
- Include `timestamp` (required for time-based display)
- Include `instrumentId` or use `prices` object for multiple instruments

---

## Summary: Minimum Required Fields

### For Price/Tick Updates:
- ✅ `tick` (number) - **REQUIRED** for day bar
- ✅ `price` (number) - **REQUIRED**
- ✅ `timestamp` (number) - **REQUIRED**
- ✅ `volume` (number) - **REQUIRED** (or frontend generates random)
- ✅ `instrumentId` (string) - **REQUIRED** (or use `prices` object)
- ⚠️ `open`, `high`, `low` - **RECOMMENDED** (frontend will approximate if missing)

### For Agent Activity:
- ✅ `event` (string) - **REQUIRED** (e.g., `"🏦 CCL BUYS 30 AAPL"`)

---

## Testing

To test the WebSocket connection:

1. Connect to `ws://10.19.132.108:8000/ws`
2. Send: `{"command": "start_simulation", "num_ticks": 20, "tick_delay": 1.0}`
3. Send tick messages with `tick` field included
4. Check browser console for parsing logs
5. Verify chart updates with new bars
6. Verify agent activity feed updates
