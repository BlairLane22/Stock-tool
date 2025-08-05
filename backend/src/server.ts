import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import rsiRoutes from './routes/rsiRoutes';
import bollingerRoutes from './routes/bollingerRoutes';
import mfiRoutes from './routes/mfiRoutes';
import imiRoutes from './routes/imiRoutes';
import cupHandleRoutes from './routes/cupHandleRoutes';
import macdRoutes from './routes/macdRoutes';

// Load environment variables from variables.env
dotenv.config({
  path: 'variables.env'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Trading Strategy API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Trading Strategy API',
    version: '1.0.0',
    description: 'Professional technical analysis indicators API',
    endpoints: {
      rsi: {
        'GET /api/rsi/:symbol': 'Get RSI analysis for a symbol',
        'GET /api/rsi/:symbol/quick': 'Get quick RSI value and signal',
        'GET /api/rsi/:symbol/multi': 'Get multi-timeframe RSI analysis'
      },
      bollinger: {
        'GET /api/bollinger/:symbol': 'Get Bollinger Bands analysis',
        'GET /api/bollinger/:symbol/quick': 'Get quick Bollinger Bands values',
        'GET /api/bollinger/:symbol/squeeze': 'Get Bollinger Bands with squeeze analysis'
      },
      mfi: {
        'GET /api/mfi/:symbol': 'Get Money Flow Index analysis',
        'GET /api/mfi/:symbol/quick': 'Get quick MFI value and signal'
      },
      imi: {
        'GET /api/imi/:symbol': 'Get Intraday Momentum Index analysis',
        'GET /api/imi/:symbol/quick': 'Get quick IMI value and signal'
      },
      cupHandle: {
        'GET /api/cup-handle/:symbol': 'Get Cup and Handle pattern analysis',
        'GET /api/cup-handle/:symbol/quick': 'Get quick Cup and Handle detection'
      },
      macd: {
        'GET /api/macd/:symbol': 'Get MACD analysis',
        'GET /api/macd/:symbol/quick': 'Get quick MACD values and signal'
      }
    },
    parameters: {
      period: 'Indicator period (default varies by indicator)',
      testData: 'Use specific test data file (e.g., ?testData=ibm-recent-data)',
      mock: 'Use mock data for demonstration (e.g., ?mock=true)'
    },
    examples: [
      'GET /api/rsi/AAPL',
      'GET /api/bollinger/MSFT?period=20&multiplier=2',
      'GET /api/mfi/GOOGL?period=14',
      'GET /api/imi/TSLA/quick',
      'GET /api/cup-handle/IBM?testData=ibm-recent-data'
    ]
  });
});

// Routes
app.use('/api/rsi', rsiRoutes);
app.use('/api/bollinger', bollingerRoutes);
app.use('/api/mfi', mfiRoutes);
app.use('/api/imi', imiRoutes);
app.use('/api/cup-handle', cupHandleRoutes);
app.use('/api/macd', macdRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trading Strategy API Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`\n📈 Available Endpoints:`);
  console.log(`   RSI: http://localhost:${PORT}/api/rsi/AAPL`);
  console.log(`   Bollinger Bands: http://localhost:${PORT}/api/bollinger/AAPL`);
  console.log(`   MFI: http://localhost:${PORT}/api/mfi/AAPL`);
  console.log(`   IMI: http://localhost:${PORT}/api/imi/AAPL`);
  console.log(`   Cup & Handle: http://localhost:${PORT}/api/cup-handle/AAPL`);
  console.log(`   MACD: http://localhost:${PORT}/api/macd/AAPL`);
});

export default app;
