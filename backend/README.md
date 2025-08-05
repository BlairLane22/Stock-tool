
# Trading Strategy API

A comprehensive technical analysis system providing both command-line interface and HTTP API for professional trading indicator calculations and pattern recognition.

## 🚀 Quick Start

### HTTP API Server (Recommended)
```bash
# Install dependencies
npm install

# Start the API server (simple version - recommended)
npm run dev-server-simple

# Alternative: Full server (if route imports work)
npm run dev-server

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/rsi/AAPL/quick
```

### Command Line Interface
```bash
# Install dependencies
npm install

# Run technical analysis (uses mock data by default)
npm start -- rsi AAPL
npm start -- bollinger AAPL --squeeze
npm start -- mfi AAPL --period 21

# Use test data files
npm start -- rsi AAPL --test-data ibm-recent-data
npm start -- bollinger AAPL --test-data ibm-recent-data --squeeze

# Use live API data (requires API keys)
npm start -- rsi AAPL --live
npm start -- bollinger AAPL --live
```

## 📊 Available Technical Indicators

### ✅ Implemented Indicators
- **RSI (Relative Strength Index)** - Momentum oscillator (0-100)
- **Bollinger Bands** - Volatility bands with squeeze detection
- **MFI (Money Flow Index)** - Volume-weighted momentum indicator
- **IMI (Intraday Momentum Index)** - Intraday momentum analysis
- **EMA (Exponential Moving Average)** - Trend-following indicator with recent price emphasis
- **ATR (Average True Range)** - Volatility measurement and risk assessment

### 🔄 Placeholder Indicators
- **Cup & Handle Pattern** - Chart pattern recognition
- **MACD** - Moving Average Convergence Divergence

## 🌐 HTTP API Endpoints

### Server Management
```bash
npm run dev-server-simple   # Start simple development server (recommended)
npm run dev-server          # Start full development server
npm run server              # Start production server
```

### API Endpoints
```
GET /health                  # Server health check
GET /                        # API documentation

# RSI Endpoints
GET /api/rsi/:symbol         # Comprehensive RSI analysis with trading strategy
GET /api/rsi/:symbol/quick   # Quick RSI value and signal

# Bollinger Bands Endpoints
GET /api/bollinger/:symbol         # Comprehensive analysis with squeeze detection
GET /api/bollinger/:symbol/quick   # Quick Bollinger Bands values

# Money Flow Index Endpoints
GET /api/mfi/:symbol         # Comprehensive MFI analysis with volume insights
GET /api/mfi/:symbol/quick   # Quick MFI value and signal

# Intraday Momentum Index Endpoints
GET /api/imi/:symbol/quick   # Quick IMI value and signal

# Exponential Moving Average Endpoints
GET /api/ema/:symbol         # Comprehensive EMA analysis with trend detection
GET /api/ema/:symbol/quick   # Quick EMA value and trend

# Average True Range Endpoints
GET /api/atr/:symbol         # Comprehensive ATR analysis with position sizing
GET /api/atr/:symbol/quick   # Quick ATR volatility assessment
```

## 💻 Command Line Interface

### RSI Analysis
```bash
npm start -- rsi AAPL                    # Basic RSI analysis (mock data)
npm start -- rsi AAPL --multi            # Multi-timeframe RSI
npm start -- rsi AAPL --period 21        # Custom period
npm start -- rsi AAPL --test-data ibm-recent-data  # Use test data
npm start -- rsi AAPL --live             # Use live API data
npm start -- quick-rsi AAPL              # JSON output
```

### Bollinger Bands Analysis
```bash
npm start -- bollinger AAPL             # Basic analysis
npm start -- bollinger AAPL --squeeze   # Include squeeze detection
npm start -- bollinger AAPL --period 20 --multiplier 2.5
npm start -- bollinger AAPL --test-data ibm-recent-data --squeeze
npm start -- quick-bollinger AAPL       # JSON output
```

### Money Flow Index Analysis
```bash
npm start -- mfi AAPL                   # Basic MFI analysis
npm start -- mfi AAPL --period 14       # Custom period
npm start -- mfi AAPL --test-data ibm-recent-data
npm start -- quick-mfi AAPL             # JSON output
```

### Intraday Momentum Index Analysis
```bash
npm start -- imi AAPL                   # Basic IMI analysis
npm start -- imi AAPL --period 14       # Custom period
npm start -- imi AAPL --test-data ibm-recent-data
npm start -- quick-imi AAPL             # JSON output
```

### Exponential Moving Average Analysis
```bash
npm start -- ema AAPL     tes              # Basic EMA analysis
npm start -- ema AAPL --period 12       # Custom period
npm start -- ema AAPL --multi           # Multi-timeframe analysis
npm start -- ema AAPL --type median     # Use median price
npm start -- ema AAPL --test-data ibm-recent-data
npm start -- quick-ema AAPL             # JSON output
```

### Average True Range Analysis
```bash
npm start -- atr AAPL                   # Basic ATR analysis
npm start -- atr AAPL --period 14       # Custom period
npm start -- atr AAPL --position-sizing # Position sizing analysis
npm start -- atr AAPL --test-data ibm-recent-data
npm start -- quick-atr AAPL             # JSON output
```

## 🔧 Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get RSI analysis
const rsi = await axios.get('http://localhost:3000/api/rsi/AAPL/quick');
console.log(`RSI: ${rsi.data.rsi}, Signal: ${rsi.data.signal}`);

// Get Bollinger Bands analysis
const bb = await axios.get('http://localhost:3000/api/bollinger/AAPL/quick');
console.log(`Price: ${bb.data.price}, %B: ${bb.data.percentB}%`);

// Get MFI analysis
const mfi = await axios.get('http://localhost:3000/api/mfi/AAPL/quick');
console.log(`MFI: ${mfi.data.mfi}, Signal: ${mfi.data.signal}`);

// Get EMA analysis
const ema = await axios.get('http://localhost:3000/api/ema/AAPL/quick');
console.log(`EMA: ${ema.data.ema}, Trend: ${ema.data.trend}`);

// Get ATR analysis
const atr = await axios.get('http://localhost:3000/api/atr/AAPL/quick');
console.log(`ATR: ${atr.data.atr}, Volatility: ${atr.data.volatility}`);
```

### Python
```python
import requests

# Get RSI analysis
response = requests.get('http://localhost:3000/api/rsi/AAPL/quick')
rsi_data = response.json()
print(f"RSI: {rsi_data['rsi']}, Signal: {rsi_data['signal']}")

# Get Bollinger Bands analysis
response = requests.get('http://localhost:3000/api/bollinger/AAPL/quick')
bb_data = response.json()
print(f"Price: {bb_data['price']}, %B: {bb_data['percentB']}%")
```

### cURL
```bash
# Health check
curl http://localhost:3000/health

# Get RSI analysis
curl http://localhost:3000/api/rsi/AAPL/quick

# Get Bollinger Bands with parameters
curl "http://localhost:3000/api/bollinger/AAPL?period=20&multiplier=2.5"

# Get MFI with mock data
curl "http://localhost:3000/api/mfi/AAPL?mock=true"
```

## 📈 Data Sources

### Mock Data (Default) ⭐
- **Default for all endpoints** - No API keys required
- **Realistic patterns** - Includes volatility cycles and trends
- **No rate limits** - Perfect for development and testing
- **Instant response** - No network delays

### Live Market Data (Optional)
- **Finnhub API** - Real-time and historical stock data
- **Alpha Vantage API** - Alternative real market data source
- **Usage**: Add `?mock=false` to any endpoint
- **Requires API keys** - See setup instructions below

### Test Data
- **Predefined datasets** - Use `--test-data filename` or `?testData=filename`
- **IBM recent data** - `ibm-recent-data` for testing with real market patterns
- **CLI only** - Available for command-line interface

## 🎯 Response Formats

### Complete Analysis Response with Chart Data
```json
{
  "symbol": "AAPL",
  "indicator": "RSI",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "current": 65.2,
    "previous": 62.8,
    "period": 14,
    "signal": "HOLD",
    "strength": "MODERATE",
    "trend": "BULLISH",
    "momentum": "INCREASING",
    "levels": {
      "oversold": 30,
      "overbought": 70,
      "extremeOversold": 20,
      "extremeOverbought": 80
    },
    "interpretation": [
      "RSI at 65.2 is in neutral territory",
      "RSI trend is bullish (above 50)",
      "RSI momentum is increasing (+2.4)"
    ],
    "tradingStrategy": {
      "entry": "Wait for clearer signals",
      "exit": "Monitor for trend changes",
      "stopLoss": 142.50,
      "target": 162.00
    },
    "chartData": {
      "timestamps": [1704067200000, 1704153600000, 1704240000000],
      "prices": [145.32, 147.85, 149.12],
      "rsiValues": [62.1, 64.8, 65.2],
      "volume": [45230000, 52100000, 48750000],
      "levels": {
        "oversold": 30,
        "overbought": 70,
        "midline": 50
      }
    }
  },
  "parameters": {
    "period": 14,
    "oversold": 30,
    "overbought": 70
  },
  "metadata": {
    "dataPoints": 200,
    "dataSource": "Mock Data"
  }
}
```

### Bollinger Bands Complete Response with Chart Data
```json
{
  "symbol": "AAPL",
  "indicator": "Bollinger Bands",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "current": {
      "upper": 152.45,
      "middle": 147.20,
      "lower": 141.95,
      "price": 149.30,
      "percentB": 68.5,
      "bandwidth": 7.2
    },
    "signal": "HOLD",
    "position": "UPPER_HALF",
    "volatility": "NORMAL",
    "trend": "BULLISH",
    "squeeze": {
      "isSqueezing": false,
      "strength": 45.2,
      "daysSinceLastSqueeze": 8,
      "breakoutPotential": "MEDIUM"
    },
    "interpretation": [
      "Price at $149.30 is above middle band",
      "%B at 68.5% indicates neutral conditions",
      "Bandwidth at 7.2% shows normal volatility"
    ],
    "tradingStrategy": {
      "entry": "Wait for band touches",
      "exit": "Exit when price crosses middle band in opposite direction",
      "stopLoss": 139.51,
      "target": 144.85
    },
    "chartData": {
      "timestamps": [1704067200000, 1704153600000, 1704240000000],
      "prices": [145.32, 147.85, 149.30],
      "upperBand": [151.20, 151.85, 152.45],
      "middleBand": [146.50, 146.85, 147.20],
      "lowerBand": [141.80, 141.85, 141.95],
      "percentB": [34.2, 58.7, 68.5],
      "bandwidth": [6.8, 7.0, 7.2],
      "volume": [45230000, 52100000, 48750000]
    }
  },
  "parameters": {
    "period": 20,
    "multiplier": 2,
    "includesSqueeze": true
  },
  "metadata": {
    "dataPoints": 200,
    "dataSource": "Mock Data"
  }
}
```

### Chart Data Features

All comprehensive endpoints (`/api/{indicator}/{symbol}`) include chart data for visualization:

**RSI Chart Data**:
- `timestamps` - Unix timestamps for each data point
- `prices` - Price data for the period
- `rsiValues` - RSI values for charting
- `volume` - Volume data
- `levels` - Key RSI levels (oversold, overbought, midline)

**Bollinger Bands Chart Data**:
- `timestamps`, `prices`, `volume` - Basic OHLC data
- `upperBand`, `middleBand`, `lowerBand` - Band values for plotting
- `percentB` - %B indicator values
- `bandwidth` - Bandwidth values for volatility analysis

**EMA Chart Data**:
- `timestamps`, `prices`, `volume` - Price and volume data
- `emaValues` - EMA line values for overlay charting

**ATR Chart Data**:
- `timestamps`, `prices`, `volume` - Basic data
- `high`, `low` - High/low values for range visualization
- `atrValues` - ATR values for volatility charting

**MFI Chart Data**:
- `timestamps`, `prices`, `volume` - Price and volume data
- `mfiValues` - MFI oscillator values
- `levels` - Key MFI levels (oversold, overbought, midline)

### Quick API Response
```json
{
  "symbol": "AAPL",
  "rsi": 65.2,
  "signal": "HOLD",
  "timestamp": 1704110400
}
```

## ⚙️ Configuration & Parameters

### Common Parameters
- `--period <number>` - Indicator calculation period
- `--test-data <filename>` - Use specific test dataset
- `--mock` - Generate mock data for testing
- `--help` - Show command help

### RSI Specific
- `--oversold <number>` - Oversold threshold (default: 30)
- `--overbought <number>` - Overbought threshold (default: 70)
- `--multi` - Multi-timeframe analysis
- `--periods <list>` - Custom periods for multi-timeframe (e.g., "9,14,21")

### Bollinger Bands Specific
- `--multiplier <number>` - Standard deviation multiplier (default: 2)
- `--squeeze` - Include squeeze analysis

### HTTP API Parameters
- `?period=N` - Indicator period
- `?mock=true` - Use mock data
- `?testData=filename` - Use test dataset
- `?oversold=N&overbought=N` - Custom thresholds

## 🏗️ Development

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd trading-strategy-api

# Install dependencies
npm install

# Build the project
npm run build
```

### Available Scripts
```bash
npm run build              # Build TypeScript to JavaScript
npm start                  # Run CLI commands
npm run dev-server-simple  # Start simple development API server (recommended)
npm run dev-server         # Start full development API server
npm run server             # Start production API server
npm test                   # Run tests (if available)
```

### Troubleshooting

#### Server Import Issues
If you encounter module import errors when running `npm run dev-server`, use the simple server instead:

```bash
# Use this instead of dev-server if you get import errors
npm run dev-server-simple
```

The simple server uses dynamic imports and avoids complex route file dependencies while providing the same core API functionality.

#### Common Issues
- **Module not found errors**: Use `npm run dev-server-simple`
- **TypeScript compilation errors**: Run `npm run build` first
- **Port already in use**: Change the PORT environment variable or kill existing processes
- **401 API errors**: The system uses mock data by default, no API keys required
- **API rate limits**: All endpoints default to mock data (`mock=true`)

#### API Key Setup (Optional)
The API works with mock data by default. To use real market data:

1. **Create environment file**:
   ```bash
   # Create variables.env file
   touch variables.env
   ```

2. **Get API keys** (optional):
   - [Finnhub API](https://finnhub.io/register) - Free tier available
   - [Alpha Vantage API](https://www.alphavantage.co/support/#api-key) - Free tier available

3. **Add keys to variables.env file**:
   ```bash
   FINNHUB_API_TOKEN=your_token_here
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

4. **Use real data**:
   ```bash
   # Add mock=false to use real API data
   curl "http://localhost:3000/api/rsi/AAPL/quick?mock=false"
   ```

**Note**: Mock data is realistic and perfect for development/testing without API limits.

### Project Structure
```
src/
├── commands/          # CLI command implementations
├── indicators/        # Technical indicator calculations
├── routes/           # HTTP API route handlers
├── util/             # Utility functions
├── index.ts          # CLI entry point
└── server.ts         # HTTP server entry point

docs/                 # Documentation
├── api-routes.md     # HTTP API documentation
├── trading-api.md    # Main API documentation
└── *.md             # Indicator-specific docs

test-data/           # Test datasets
└── *.json          # Market data files
```

## 📚 Documentation

- **[API Routes Documentation](docs/api-routes.md)** - Complete HTTP API reference
- **[Trading API Documentation](docs/trading-api.md)** - Main API documentation
- **[RSI Documentation](docs/rsi-indicator.md)** - RSI-specific documentation
- **[Bollinger Bands Documentation](docs/bollinger-bands.md)** - Bollinger Bands documentation

## 🎯 Features

### ✅ Implemented Features
- **6 Technical Indicators** - RSI, Bollinger Bands, MFI, IMI, EMA, ATR
- **HTTP API Server** - RESTful endpoints with JSON responses
- **Command Line Interface** - Full CLI with help and options
- **Multiple Data Sources** - Live API, test data, mock data
- **Educational Content** - Built-in explanations for each indicator
- **Trading Signals** - Buy/Sell/Hold recommendations
- **Multi-timeframe Analysis** - RSI and EMA across multiple periods
- **Pattern Recognition** - Bollinger Band squeeze detection
- **Volume Analysis** - MFI and IMI volume-based indicators
- **Volatility Assessment** - ATR for risk management and position sizing
- **Trend Analysis** - EMA for trend identification and crossover signals
- **Comprehensive Documentation** - API docs and integration examples

### 🔄 Planned Features
- **Additional Indicators** - Put-Call Ratio, Open Interest
- **Real-time Streaming** - WebSocket support for live updates
- **Database Integration** - Historical data storage
- **Authentication** - API key management
- **Rate Limiting** - API usage controls
- **Backtesting** - Strategy performance testing

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3000                    # API server port
ALPHA_VANTAGE_API_KEY=xxx   # Alpha Vantage API key
NODE_ENV=production         # Environment
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "server"]
```

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions, issues, or feature requests, please open an issue on the repository.