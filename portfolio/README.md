# StockTrack Portfolio API

**AI-Powered Portfolio Management & Trading System**

A comprehensive portfolio management API that acts as a **pretend bank account** with AI-driven trading decisions. The system integrates with the StockTrack backend API to analyze stocks using multiple technical indicators and make intelligent trading recommendations.

## 🎯 Key Features

- **🤖 AI Trading Assistant** - Analyzes stocks using RSI, MACD, Bollinger Bands, Head & Shoulders, and Cup & Handle patterns
- **💰 Virtual Bank Account** - Manages portfolio with $100,000 starting cash
- **📊 SQLite Database** - Persistent storage for portfolios, holdings, and trading decisions
- **🔍 Multi-Indicator Analysis** - Combines multiple technical indicators for trading signals
- **📈 Real-time Integration** - Live market data from Alpha Vantage API
- **🎯 Smart Recommendations** - BUY/SELL/HOLD/WATCH signals with confidence levels

## 🚀 Quick Start

### Prerequisites
- **Backend API** running on port 3000 (StockTrack technical indicators)
- **Alpha Vantage API Key** configured in backend
- Node.js 18+ and npm

### Setup & Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start
```

The server will:
- 🚀 Start on **port 3001**
- 📊 Create SQLite database at `data/portfolio.db`
- 👤 Initialize your user account (Blair Lane)
- 💰 Create empty portfolio with $100,000 cash
- 🔗 Connect to backend API on port 3000

### Your Default Account
- **User**: Blair Lane (user-blair-1)
- **Portfolio**: "Blair's Trading Account" (portfolio-blair-main)
- **Starting Cash**: $100,000
- **Holdings**: Empty (clean slate as requested)

## 📊 API Endpoints

### Health & Status
```
GET /health              # Basic health check
GET /health/detailed     # Detailed health check with backend connectivity
```

### Authentication
```
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Refresh access token
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
POST /api/auth/change-password  # Change password
```

### Portfolio Management
```
GET    /api/portfolio           # Get all user portfolios
POST   /api/portfolio           # Create new portfolio
GET    /api/portfolio/:id       # Get specific portfolio
PUT    /api/portfolio/:id       # Update portfolio
DELETE /api/portfolio/:id       # Delete portfolio
```

### Holdings Management
```
GET    /api/portfolio/:id/holdings              # Get portfolio holdings
POST   /api/portfolio/:id/holdings              # Add new holding
PUT    /api/portfolio/:id/holdings/:holdingId   # Update holding
DELETE /api/portfolio/:id/holdings/:holdingId   # Remove holding
```

### Portfolio Analysis
```
GET /api/portfolio/:id/analysis     # Portfolio analysis & metrics
GET /api/portfolio/:id/performance  # Performance tracking
GET /api/portfolio/:id/risk         # Risk analysis
```

### Watchlist Management
```
GET    /api/portfolio/:id/watchlist         # Get watchlist
POST   /api/portfolio/:id/watchlist         # Add to watchlist
DELETE /api/portfolio/:id/watchlist/:symbol # Remove from watchlist
```

## 🔧 Integration with Backend

This portfolio API integrates seamlessly with the StockTrack backend trading API to provide:

- **Real-time market data** for portfolio holdings
- **Technical indicator analysis** (RSI, Bollinger Bands, MFI, EMA, ATR)
- **Trading signals** for watchlist items
- **Multi-indicator analysis** for portfolio overview

### Backend Integration Examples

```javascript
// Get portfolio with enriched market data
const response = await fetch('/api/portfolio/demo-portfolio-1/holdings');
const holdings = await response.json();

// Each holding includes:
// - currentPrice (from backend API)
// - marketValue (calculated)
// - gainLoss (calculated)
// - gainLossPercent (calculated)

// Get watchlist with trading signals
const watchlistResponse = await fetch('/api/portfolio/demo-portfolio-1/watchlist');
const watchlist = await watchlistResponse.json();

// Each watchlist item includes:
// - currentPrice (from backend)
// - rsi (from backend RSI analysis)
// - signal (BUY/SELL/HOLD from backend)
```

## 📈 Features

### ✅ Implemented Features

- **Portfolio Management** - Create, update, delete portfolios
- **Holdings Tracking** - Add, update, remove stock holdings
- **Watchlist Management** - Track stocks of interest
- **Real-time Integration** - Live data from backend trading API
- **Performance Analysis** - Portfolio performance metrics
- **Risk Analysis** - Risk assessment and recommendations
- **User Authentication** - JWT-based auth system
- **Health Monitoring** - Comprehensive health checks

### 🔄 Planned Features

- **Database Integration** - PostgreSQL for persistent storage
- **Real-time Updates** - WebSocket support for live portfolio updates
- **Advanced Analytics** - Sector allocation, correlation analysis
- **Backtesting** - Historical performance simulation
- **Alerts & Notifications** - Price alerts and portfolio notifications
- **Mobile API** - Optimized endpoints for mobile apps

## 🏗️ Architecture

### Project Structure
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API route definitions
├── types/           # TypeScript type definitions
├── middleware/      # Custom middleware
└── utils/           # Utility functions
```

### Data Flow
1. **Client Request** → API Route → Controller
2. **Controller** → Service Layer → Business Logic
3. **Service** → Backend API (for market data)
4. **Response** ← Enriched Data ← Combined Results

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - API request throttling
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - HTTP security headers
- **Input Validation** - Request data validation

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `BACKEND_API_URL` | Backend API URL | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Required |

## 📚 API Examples

### Create Portfolio
```bash
curl -X POST http://localhost:3001/api/portfolio \
  -H "Content-Type: application/json" \
  -H "user-id: demo-user" \
  -d '{
    "name": "Growth Portfolio",
    "description": "Long-term growth investments",
    "initialCash": 50000
  }'
```

### Add Holding
```bash
curl -X POST http://localhost:3001/api/portfolio/demo-portfolio-1/holdings \
  -H "Content-Type: application/json" \
  -H "user-id: demo-user" \
  -d '{
    "symbol": "AAPL",
    "quantity": 100,
    "averagePrice": 150.00,
    "purchaseDate": "2024-01-15T00:00:00.000Z"
  }'
```

### Get Portfolio Analysis
```bash
curl http://localhost:3001/api/portfolio/demo-portfolio-1/analysis \
  -H "user-id: demo-user"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
