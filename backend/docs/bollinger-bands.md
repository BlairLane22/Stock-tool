# Bollinger Bands API

## Overview
Bollinger Bands measure volatility and identify overbought/oversold conditions using a moving average with standard deviation bands above and below.

## Quick Usage

### Command Line
```bash
# Basic Bollinger Bands analysis
npm start bollinger AAPL

# Include squeeze analysis
npm start bollinger AAPL --squeeze

# Custom parameters
npm start bollinger AAPL --period 20 --multiplier 2.5

# Quick API response (JSON)
npm start quick-bollinger AAPL
```

### API Integration
```javascript
import { bollingerBandsAnalysis, quickBollingerBands } from './commands/bollingerBandsAnalysis';

// Full analysis
const analysis = await bollingerBandsAnalysis('AAPL', {
  period: 20,
  multiplier: 2,
  squeeze: true
});

// Quick values
const bands = await quickBollingerBands('AAPL', 20, 2);
// Returns: { symbol: "AAPL", upper: 150.25, middle: 145.00, lower: 139.75, price: 147.50, percentB: 65.2, signal: "HOLD" }
```

## Band Components
- **Upper Band**: Middle + (2 × Standard Deviation)
- **Middle Band**: 20-period Simple Moving Average
- **Lower Band**: Middle - (2 × Standard Deviation)
- **%B**: Price position within bands (0-100%)
- **Bandwidth**: Band width relative to middle band

## Trading Signals
- **Price near Lower Band**: Potential buy (oversold)
- **Price near Upper Band**: Potential sell (overbought)
- **Squeeze**: Low volatility, breakout expected
- **Band Expansion**: High volatility period

## Command Options
- `--period <number>`: Moving average period (default: 20)
- `--multiplier <number>`: Standard deviation multiplier (default: 2)
- `--squeeze`: Include squeeze analysis
- `--test-data <file>`: Use test data file
- `--mock`: Use mock data

## Output
- Current band values and price position
- %B and bandwidth metrics
- Volatility assessment
- Trading signals and strategy
- Visual band chart
- Squeeze analysis (if requested)
