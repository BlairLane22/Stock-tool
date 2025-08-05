# RSI (Relative Strength Index) API

## Overview
The RSI is a momentum oscillator that measures the speed and change of price movements. It oscillates between 0-100 and helps identify overbought/oversold conditions.

## Quick Usage

### Command Line
```bash
# Basic RSI analysis
npm start rsi AAPL

# Multi-timeframe analysis
npm start rsi AAPL --multi

# Custom parameters
npm start rsi AAPL --period 21 --oversold 25 --overbought 75

# Quick API response (JSON)
npm start quick-rsi AAPL
```

### API Integration
```javascript
import { analyzeRSI, quickRSI } from './commands/rsiAnalysis';

// Full analysis
const analysis = await rsiAnalysis('AAPL', {
  period: 14,
  multiTimeframe: true
});

// Quick RSI value
const rsi = await quickRSI('AAPL', 14);
// Returns: { symbol: "AAPL", rsi: 65.2, signal: "HOLD", timestamp: 1234567890 }
```

## RSI Levels
- **0-30**: Oversold (potential buy)
- **30-70**: Neutral territory  
- **70-100**: Overbought (potential sell)

## Command Options
- `--period <number>`: RSI period (default: 14)
- `--multi`: Multi-timeframe analysis
- `--periods <list>`: Custom periods (e.g., "9,14,21")
- `--oversold <number>`: Custom oversold level (default: 30)
- `--overbought <number>`: Custom overbought level (default: 70)
- `--test-data <file>`: Use test data file
- `--mock`: Use mock data

## Output
- RSI value and trend
- Buy/Sell/Hold signal
- Strength assessment
- Momentum analysis
- Visual RSI chart
- Trading recommendations
