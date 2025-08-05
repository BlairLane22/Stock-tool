# Trading Strategy API Routes

## Server Information
- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins

## Quick Start
```bash
# Start the API server
npm run dev-server

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/rsi/AAPL/quick
```

## Available Endpoints

### 🏥 Health & Documentation
- `GET /health` - Server health check
- `GET /` - API documentation and endpoint list

### 📊 RSI (Relative Strength Index)
- `GET /api/rsi/:symbol` - Complete RSI analysis
- `GET /api/rsi/:symbol/quick` - Quick RSI value and signal
- `GET /api/rsi/:symbol/multi` - Multi-timeframe RSI analysis

**Parameters:**
- `period` - RSI period (default: 14)
- `oversold` - Oversold threshold (default: 30)
- `overbought` - Overbought threshold (default: 70)
- `testData` - Use test data file (e.g., `ibm-recent-data`)
- `mock` - Use mock data (true/false)

**Examples:**
```bash
GET /api/rsi/AAPL
GET /api/rsi/AAPL?period=21&oversold=25&overbought=75
GET /api/rsi/AAPL/quick
GET /api/rsi/AAPL/multi?periods=9,14,21
GET /api/rsi/AAPL?mock=true
```

### 📈 Bollinger Bands
- `GET /api/bollinger/:symbol` - Complete Bollinger Bands analysis
- `GET /api/bollinger/:symbol/quick` - Quick Bollinger Bands values
- `GET /api/bollinger/:symbol/squeeze` - Bollinger Bands with squeeze analysis

**Parameters:**
- `period` - Moving average period (default: 20)
- `multiplier` - Standard deviation multiplier (default: 2)
- `lookback` - Lookback periods for squeeze (default: 20)
- `testData` - Use test data file
- `mock` - Use mock data (true/false)

**Examples:**
```bash
GET /api/bollinger/AAPL
GET /api/bollinger/AAPL?period=20&multiplier=2.5
GET /api/bollinger/AAPL/quick
GET /api/bollinger/AAPL/squeeze
GET /api/bollinger/AAPL?mock=true
```

### 💰 MFI (Money Flow Index)
- `GET /api/mfi/:symbol` - Complete MFI analysis
- `GET /api/mfi/:symbol/quick` - Quick MFI value and signal

**Parameters:**
- `period` - MFI period (default: 14)
- `oversold` - Oversold threshold (default: 20)
- `overbought` - Overbought threshold (default: 80)
- `extremeOversold` - Extreme oversold threshold (default: 10)
- `extremeOverbought` - Extreme overbought threshold (default: 90)
- `testData` - Use test data file
- `mock` - Use mock data (true/false)

**Examples:**
```bash
GET /api/mfi/AAPL
GET /api/mfi/AAPL?period=21&oversold=15&overbought=85
GET /api/mfi/AAPL/quick
GET /api/mfi/AAPL?mock=true
```

### 🕐 IMI (Intraday Momentum Index)
- `GET /api/imi/:symbol` - Complete IMI analysis
- `GET /api/imi/:symbol/quick` - Quick IMI value and signal

**Parameters:**
- `period` - IMI period (default: 14)
- `oversold` - Oversold threshold (default: 30)
- `overbought` - Overbought threshold (default: 70)
- `extremeOversold` - Extreme oversold threshold (default: 20)
- `extremeOverbought` - Extreme overbought threshold (default: 80)
- `testData` - Use test data file
- `mock` - Use mock data (true/false)

**Examples:**
```bash
GET /api/imi/AAPL
GET /api/imi/AAPL?period=21&oversold=25&overbought=75
GET /api/imi/AAPL/quick
GET /api/imi/AAPL?mock=true
```

### 🏆 Cup & Handle Pattern (Placeholder)
- `GET /api/cup-handle/:symbol` - Complete Cup and Handle analysis
- `GET /api/cup-handle/:symbol/quick` - Quick pattern detection

**Parameters:**
- `testData` - Use test data file
- `mock` - Use mock data (true/false)

**Examples:**
```bash
GET /api/cup-handle/AAPL
GET /api/cup-handle/AAPL/quick
GET /api/cup-handle/AAPL?mock=true
```

### 📉 MACD (Placeholder)
- `GET /api/macd/:symbol` - Complete MACD analysis
- `GET /api/macd/:symbol/quick` - Quick MACD values and signal

**Parameters:**
- `fastPeriod` - Fast EMA period (default: 12)
- `slowPeriod` - Slow EMA period (default: 26)
- `signalPeriod` - Signal line period (default: 9)
- `testData` - Use test data file
- `mock` - Use mock data (true/false)

**Examples:**
```bash
GET /api/macd/AAPL
GET /api/macd/AAPL?fastPeriod=12&slowPeriod=26&signalPeriod=9
GET /api/macd/AAPL/quick
GET /api/macd/AAPL?mock=true
```

## Response Format

### Standard Response Structure
```json
{
  "symbol": "AAPL",
  "indicator": "RSI",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "current": 65.2,
    "signal": "HOLD",
    "interpretation": ["RSI analysis details..."]
  },
  "metadata": {
    "dataPoints": 200,
    "dataSource": "Live API"
  }
}
```

### Quick Response Structure
```json
{
  "symbol": "AAPL",
  "rsi": 65.2,
  "signal": "HOLD",
  "timestamp": 1704110400
}
```

### Error Response Structure
```json
{
  "error": "RSI Analysis Failed",
  "message": "Insufficient data for analysis",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get RSI analysis
const rsi = await axios.get('http://localhost:3000/api/rsi/AAPL');
console.log(`RSI: ${rsi.data.data.current}, Signal: ${rsi.data.data.signal}`);

// Get quick Bollinger Bands
const bb = await axios.get('http://localhost:3000/api/bollinger/AAPL/quick');
console.log(`Price: ${bb.data.price}, %B: ${bb.data.percentB}%`);
```

### Python
```python
import requests

# Get MFI analysis
response = requests.get('http://localhost:3000/api/mfi/AAPL')
mfi_data = response.json()
print(f"MFI: {mfi_data['data']['current']}, Signal: {mfi_data['data']['signal']}")

# Get quick IMI
response = requests.get('http://localhost:3000/api/imi/AAPL/quick')
imi_data = response.json()
print(f"IMI: {imi_data['imi']}, Bias: {imi_data['intradayBias']}")
```

### cURL
```bash
# Get RSI with custom parameters
curl "http://localhost:3000/api/rsi/AAPL?period=21&oversold=25&overbought=75"

# Get Bollinger Bands squeeze analysis
curl "http://localhost:3000/api/bollinger/AAPL/squeeze?period=20&multiplier=2"

# Get MFI with mock data
curl "http://localhost:3000/api/mfi/AAPL?mock=true"
```

## Data Sources
- **Live API**: Real market data from Alpha Vantage
- **Test Data**: Predefined datasets (e.g., `ibm-recent-data`)
- **Mock Data**: Generated realistic market data for testing

## Status Codes
- `200` - Success
- `404` - Endpoint not found
- `500` - Internal server error (analysis failed)

## Rate Limiting
- No rate limiting currently implemented
- Live API calls are subject to Alpha Vantage rate limits
- Use `mock=true` for testing without API limits
