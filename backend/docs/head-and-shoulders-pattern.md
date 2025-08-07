# Head and Shoulders Pattern Documentation

## Overview

The Head and Shoulders pattern is one of the most reliable bearish reversal patterns in technical analysis. It signals a potential trend change from bullish to bearish and is characterized by three peaks: a left shoulder, a higher head, and a right shoulder that's roughly equal in height to the left shoulder.

## Pattern Structure

### Components

1. **Left Shoulder**: The first peak in an uptrend
2. **Head**: The highest peak, higher than both shoulders
3. **Right Shoulder**: The third peak, roughly equal to the left shoulder
4. **Neckline**: Support line connecting the lows between the shoulders and head
5. **Volume**: Should decrease during head formation and increase on breakdown

### Visual Representation

```
    Head (165.80)
      /\
     /  \
    /    \
   /      \
  /        \
 /          \
Left         Right
Shoulder     Shoulder
(152.30)     (151.90)
   \            /
    \          /
     \        /
      \______/  <- Neckline (142.50)
```

## Implementation Details

### Pattern Detection Criteria

1. **Head Prominence**: Head must be 3-25% higher than shoulders
2. **Shoulder Symmetry**: Shoulders should be within 15% height difference
3. **Pattern Duration**: 15-100 periods for reliable patterns
4. **Neckline Slope**: Should be relatively flat (≤5% slope)
5. **Volume Confirmation**: Decreasing volume during head, increasing on breakdown

### Confidence Scoring

- **HIGH (80-100 points)**: Strong pattern with all criteria met
- **MEDIUM (60-79 points)**: Good pattern with most criteria met
- **LOW (0-59 points)**: Weak pattern, not recommended for trading

### Trading Signals

- **SELL**: High confidence pattern ready for breakdown
- **HOLD**: Medium confidence pattern, wait for confirmation
- **WAIT**: Low confidence or pattern not complete

## API Usage

### HTTP Endpoints

#### Comprehensive Analysis
```bash
GET /api/head-and-shoulders/:symbol
```

**Parameters:**
- `mock=true` (default) - Use mock data
- `mock=false` - Use live API data
- `minPatternPeriods=20` - Minimum pattern duration
- `maxPatternPeriods=100` - Maximum pattern duration

**Response:**
```json
{
  "symbol": "AAPL",
  "indicator": "Head and Shoulders Pattern",
  "data": {
    "patternDetected": true,
    "confidence": "HIGH",
    "stage": "COMPLETED",
    "leftShoulderHeight": 152.30,
    "headHeight": 165.80,
    "rightShoulderHeight": 151.90,
    "breakoutLevel": 142.50,
    "targetPrice": 119.20,
    "stopLoss": 155.00,
    "riskReward": 1.8,
    "signal": "SELL",
    "interpretation": [
      "✅ Head and Shoulders pattern detected with HIGH confidence",
      "🚀 Pattern complete - ready for breakdown",
      "📏 Head prominence: 8.9%",
      "⚖️ Shoulder symmetry: 99.7%"
    ],
    "tradingStrategy": {
      "entry": "Enter short position on break below $142.50",
      "exit": "Target reached or stop loss hit",
      "stopLoss": 155.00,
      "target": 119.20
    }
  }
}
```

#### Quick Analysis
```bash
GET /api/head-and-shoulders/:symbol/quick
```

**Response:**
```json
{
  "symbol": "AAPL",
  "isPattern": true,
  "confidence": "HIGH",
  "signal": "SELL",
  "stage": "COMPLETED",
  "strength": 85,
  "breakoutLevel": 142.50,
  "targetPrice": 119.20,
  "stopLoss": 155.00,
  "riskReward": 1.8
}
```

## CLI Usage

### Basic Pattern Analysis
```bash
npm start -- head-shoulders AAPL
npm start -- head-shoulders AAPL --mock
npm start -- head-shoulders AAPL --live
```

### Advanced Analysis
```bash
npm start -- head-shoulders-analysis AAPL --min-pattern 20 --max-pattern 100
```

### Quick JSON Output
```bash
npm start -- quick-head-shoulders AAPL
```

## Trading Strategy

### Entry Rules
1. Wait for pattern completion (all three peaks formed)
2. Enter short position on neckline breakdown
3. Confirm with increased volume on breakdown
4. Set stop loss above right shoulder

### Exit Rules
1. **Target**: Distance from head to neckline projected downward
2. **Stop Loss**: 2% above right shoulder peak
3. **Risk Management**: Position size based on stop loss distance

### Risk/Reward Calculation
```
Risk = Entry Price - Stop Loss
Reward = Entry Price - Target Price
Risk/Reward Ratio = Reward / Risk
```

## Pattern Stages

1. **LEFT_SHOULDER**: First peak forming
2. **HEAD_FORMING**: Central peak developing
3. **RIGHT_SHOULDER**: Final peak forming
4. **COMPLETED**: Pattern complete, ready for breakdown
5. **BREAKDOWN**: Price has broken below neckline
6. **NONE**: No pattern detected

## Volume Analysis

### Ideal Volume Pattern
- **Left Shoulder**: High volume on formation
- **Head**: Lower volume (shows weakening momentum)
- **Right Shoulder**: Moderate volume
- **Breakdown**: High volume confirmation

### Volume Confirmation
The pattern includes volume analysis to confirm the bearish reversal:
- Volume should decrease during head formation
- Volume should increase on neckline breakdown
- This confirms the shift from buying to selling pressure

## Examples

### JavaScript Integration
```javascript
const axios = require('axios');

// Get Head and Shoulders analysis
const response = await axios.get('http://localhost:3000/api/head-and-shoulders/AAPL/quick');
const { isPattern, signal, confidence, targetPrice } = response.data;

if (isPattern && signal === 'SELL') {
  console.log(`Bearish reversal signal detected with ${confidence} confidence`);
  console.log(`Target price: $${targetPrice}`);
}
```

### Python Integration
```python
import requests

response = requests.get('http://localhost:3000/api/head-and-shoulders/AAPL/quick')
data = response.json()

if data['isPattern'] and data['signal'] == 'SELL':
    print(f"Head and Shoulders pattern detected: {data['confidence']} confidence")
    print(f"Target: ${data['targetPrice']}, Stop: ${data['stopLoss']}")
```

## Technical Notes

### Pattern Reliability
- Head and Shoulders is considered one of the most reliable reversal patterns
- Success rate increases with proper volume confirmation
- Works best in established uptrends
- False breakouts can occur, hence the importance of volume confirmation

### Market Context
- More reliable in trending markets
- Less effective in sideways/choppy markets
- Consider overall market conditions
- Use in conjunction with other technical indicators

### Limitations
- Pattern can take weeks or months to complete
- False breakouts are possible
- Requires patience for proper formation
- Not suitable for short-term trading strategies

## References

- [Investopedia: Head and Shoulders Pattern](https://www.investopedia.com/terms/h/head-shoulders.asp)
- [Technical Analysis Guide](https://www.investopedia.com/articles/technical/121201.asp)
- Pattern recognition based on classical technical analysis principles
