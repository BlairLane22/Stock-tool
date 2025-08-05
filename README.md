# StockTrack

A comprehensive stock trading and portfolio management system with advanced technical analysis capabilities and modern API architecture.

## 🏗️ Project Structure

```
StockTrack/
├── backend/          # Trading API & Technical Analysis Engine
│   ├── src/          # Source code
│   ├── docs/         # API documentation
│   ├── test-data/    # Test datasets
│   └── README.md     # Backend documentation
└── portfolio/        # Portfolio Management API
    ├── src/          # Source code
    ├── README.md     # Portfolio API documentation
    └── .env.example  # Environment configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### 1. Start Backend Trading API

```bash
cd backend
npm install
npm run dev-server-simple
```

The backend API will be available at `http://localhost:3000`

### 2. Start Portfolio Management API

```bash
cd portfolio
npm install
cp .env.example .env
npm run dev
```

The portfolio API will be available at `http://localhost:3001`

### 3. Test the System

```bash
# Test backend health
curl http://localhost:3000/health

# Test portfolio health
curl http://localhost:3001/health

# Get RSI analysis
curl http://localhost:3000/api/rsi/AAPL/quick

# Get portfolio data
curl http://localhost:3001/api/portfolio -H "user-id: demo-user"
```

## 📊 System Overview

### Backend - Trading API
- **Technical Indicators**: RSI, Bollinger Bands, MFI, IMI, EMA, ATR
- **Chart Patterns**: Cup & Handle pattern recognition
- **Data Sources**: Mock data (default), Live APIs (optional)
- **Analysis**: Comprehensive trading signals and strategies

### Portfolio - Management API
- **Portfolio Management**: Create, track, and analyze investment portfolios
- **Holdings Tracking**: Real-time position monitoring with P&L
- **Watchlist**: Track stocks with integrated technical analysis
- **Performance Analytics**: Portfolio performance and risk metrics
- **Backend Integration**: Live market data and trading signals

## 🔗 API Integration

The portfolio API seamlessly integrates with the backend trading API:

```javascript
// Portfolio holdings enriched with trading data
GET /api/portfolio/:id/holdings
// Returns holdings with current prices, RSI signals, and P&L

// Watchlist with technical analysis
GET /api/portfolio/:id/watchlist  
// Returns watchlist items with RSI, signals, and recommendations
```

## 📈 Features

### ✅ Backend Features
- 6 Technical Indicators (RSI, Bollinger Bands, MFI, IMI, EMA, ATR)
- HTTP API with JSON responses
- Command-line interface
- Multiple data sources (mock, test data, live APIs)
- Educational content and trading strategies
- Comprehensive documentation

### ✅ Portfolio Features
- Portfolio creation and management
- Holdings tracking with real-time data
- Watchlist management
- Performance and risk analysis
- User authentication (JWT)
- Backend API integration
- Health monitoring

### 🔄 Planned Features
- Real-time WebSocket updates
- Database persistence (PostgreSQL)
- Advanced portfolio analytics
- Mobile API optimization
- Backtesting capabilities
- Alert system

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run build              # Build TypeScript
npm start                  # CLI commands
npm run dev-server-simple  # Development API server
npm test                   # Run tests
```

### Portfolio Development
```bash
cd portfolio
npm run build      # Build TypeScript
npm run dev        # Development server
npm run dev:watch  # Development with auto-reload
npm test           # Run tests
npm run lint       # Code linting
```

## 🔧 Configuration

### Backend Configuration
- Environment: `backend/variables.env`
- API keys for live data (optional)
- Mock data enabled by default

### Portfolio Configuration
- Environment: `portfolio/.env`
- Backend API URL configuration
- JWT secrets for authentication
- CORS settings

## 📚 Documentation

- **[Backend API Documentation](backend/README.md)** - Complete trading API reference
- **[Portfolio API Documentation](portfolio/README.md)** - Portfolio management API
- **[API Routes](backend/docs/api-routes.md)** - HTTP endpoint reference
- **[Technical Indicators](backend/docs/)** - Indicator-specific documentation

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                                    # Run all tests
npm start -- rsi AAPL --test-data ibm-recent-data  # CLI testing
curl http://localhost:3000/api/rsi/AAPL/quick      # API testing
```

### Portfolio Testing
```bash
cd portfolio
npm test                                           # Run all tests
curl http://localhost:3001/api/portfolio -H "user-id: demo-user"  # API testing
```

## 🌐 Production Deployment

### Docker Deployment
```dockerfile
# Backend
FROM node:16-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "server"]

# Portfolio
FROM node:16-alpine
WORKDIR /app/portfolio
COPY portfolio/package*.json ./
RUN npm ci --only=production
COPY portfolio/ .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables
```bash
# Backend
PORT=3000
ALPHA_VANTAGE_API_KEY=optional
FINNHUB_API_TOKEN=optional

# Portfolio
PORT=3001
BACKEND_API_URL=http://backend:3000
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the individual package files for details.

## 🆘 Support

- **Backend Issues**: See [backend/README.md](backend/README.md) troubleshooting section
- **Portfolio Issues**: See [portfolio/README.md](portfolio/README.md) 
- **General Issues**: Open an issue on the repository

## 🎯 Getting Started Examples

### Basic Trading Analysis
```bash
# Start backend
cd backend && npm run dev-server-simple

# Get RSI analysis
curl http://localhost:3000/api/rsi/AAPL/quick

# Get comprehensive analysis
curl http://localhost:3000/api/rsi/AAPL
```

### Portfolio Management
```bash
# Start both services
cd backend && npm run dev-server-simple &
cd portfolio && npm run dev &

# Create portfolio
curl -X POST http://localhost:3001/api/portfolio \
  -H "Content-Type: application/json" \
  -H "user-id: demo-user" \
  -d '{"name": "My Portfolio", "initialCash": 10000}'

# Add holding
curl -X POST http://localhost:3001/api/portfolio/demo-portfolio-1/holdings \
  -H "Content-Type: application/json" \
  -H "user-id: demo-user" \
  -d '{"symbol": "AAPL", "quantity": 10, "averagePrice": 150}'
```

---

**StockTrack** - Professional trading analysis and portfolio management system
