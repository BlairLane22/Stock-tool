
# Trading Strategy API

A comprehensive technical analysis system providing both command-line interface and HTTP API for professional trading indicator calculations and pattern recognition.

## 🚀 Quick Start

### HTTP API Server (Recommended)
```bash
# Install dependencies
npm install

# Start the API server
npm run dev-server

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/rsi/AAPL/quick
```

### Command Line Interface
```bash
# Install dependencies
npm install

# Run technical analysis
npm start rsi AAPL
npm start bollinger AAPL --squeeze
npm start mfi AAPL --period 21
```

## 📊 Available Technical Indicators

### ✅ Implemented Indicators
- **RSI (Relative Strength Index)** - Momentum oscillator (0-100)
- **Bollinger Bands** - Volatility bands with squeeze detection
- **MFI (Money Flow Index)** - Volume-weighted momentum indicator
- **IMI (Intraday Momentum Index)** - Intraday momentum analysis

### 🔄 Placeholder Indicators
- **Cup & Handle Pattern** - Chart pattern recognition
- **MACD** - Moving Average Convergence Divergence

## 🌐 HTTP API Endpoints

### Server Management
```bash
npm run dev-server          # Start development server
npm run server              # Start production server
```

### API Endpoints
```
GET /health                  # Server health check
GET /                        # API documentation

# RSI Endpoints
GET /api/rsi/:symbol         # Complete RSI analysis
GET /api/rsi/:symbol/quick   # Quick RSI value
GET /api/rsi/:symbol/multi   # Multi-timeframe analysis

# Bollinger Bands Endpoints
GET /api/bollinger/:symbol         # Complete analysis
GET /api/bollinger/:symbol/quick   # Quick values
GET /api/bollinger/:symbol/squeeze # Squeeze analysis

# Money Flow Index Endpoints
GET /api/mfi/:symbol         # Complete MFI analysis
GET /api/mfi/:symbol/quick   # Quick MFI value

# Intraday Momentum Index Endpoints
GET /api/imi/:symbol         # Complete IMI analysis
GET /api/imi/:symbol/quick   # Quick IMI value
```

## 💻 Command Line Interface

### RSI Analysis
```bash
npm start rsi AAPL                    # Basic RSI analysis
npm start rsi AAPL --multi            # Multi-timeframe RSI
npm start rsi AAPL --period 21        # Custom period
npm start quick-rsi AAPL              # JSON output
```

### Bollinger Bands Analysis
```bash
npm start bollinger AAPL             # Basic analysis
npm start bollinger AAPL --squeeze   # Include squeeze detection
npm start bollinger AAPL --period 20 --multiplier 2.5
npm start quick-bollinger AAPL       # JSON output
```

### Money Flow Index Analysis
```bash
npm start mfi AAPL                   # Basic MFI analysis
npm start mfi AAPL --period 14       # Custom period
npm start quick-mfi AAPL             # JSON output
```

### Intraday Momentum Index Analysis
```bash
npm start imi AAPL                   # Basic IMI analysis
npm start imi AAPL --period 14       # Custom period
npm start quick-imi AAPL             # JSON output
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

### Live Market Data
- **Alpha Vantage API** - Real-time and historical stock data
- **Automatic fallback** to mock data if API limits reached

### Test Data
- **Predefined datasets** - Use `--test-data filename` or `?testData=filename`
- **IBM recent data** - `ibm-recent-data` for testing with real market patterns

### Mock Data
- **Generated realistic data** - Use `--mock` or `?mock=true`
- **No API rate limits** - Perfect for development and testing
- **Realistic patterns** - Includes volatility cycles and trends

## 🎯 Response Formats

### Complete Analysis Response
```json
{
  "symbol": "AAPL",
  "indicator": "RSI",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "current": 65.2,
    "previous": 62.8,
    "signal": "HOLD",
    "strength": "NEUTRAL",
    "trend": "BULLISH",
    "interpretation": [
      "RSI at 65.2 is in neutral territory",
      "RSI trend is bullish (above 50)"
    ]
  },
  "metadata": {
    "dataPoints": 200,
    "dataSource": "Live API"
  }
}
```

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
npm run build          # Build TypeScript to JavaScript
npm start              # Run CLI commands
npm run dev-server     # Start development API server
npm run server         # Start production API server
npm test               # Run tests (if available)
```

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
- **4 Technical Indicators** - RSI, Bollinger Bands, MFI, IMI
- **HTTP API Server** - RESTful endpoints with JSON responses
- **Command Line Interface** - Full CLI with help and options
- **Multiple Data Sources** - Live API, test data, mock data
- **Educational Content** - Built-in explanations for each indicator
- **Trading Signals** - Buy/Sell/Hold recommendations
- **Multi-timeframe Analysis** - RSI across multiple periods
- **Pattern Recognition** - Bollinger Band squeeze detection
- **Volume Analysis** - MFI and IMI volume-based indicators
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