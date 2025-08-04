import express from 'express';
import cors from 'cors';

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
        'GET /api/rsi/:symbol/quick': 'Get quick RSI value and signal'
      },
      bollinger: {
        'GET /api/bollinger/:symbol': 'Get Bollinger Bands analysis',
        'GET /api/bollinger/:symbol/quick': 'Get quick Bollinger Bands values'
      }
    },
    status: 'Routes loading individually to avoid import issues'
  });
});

// Simple RSI endpoint without external route file
app.get('/api/rsi/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Import the function dynamically
    const { quickRSI } = await import('./commands/rsiAnalysis');
    const result = await quickRSI(symbol, 14);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'RSI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple Bollinger Bands endpoint
app.get('/api/bollinger/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '20', multiplier = '2' } = req.query;
    
    // Import the function dynamically
    const { quickBollingerBands } = await import('./commands/bollingerBandsAnalysis');
    const result = await quickBollingerBands(
      symbol, 
      parseInt(period as string), 
      parseFloat(multiplier as string)
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Bollinger Bands Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple MFI endpoint
app.get('/api/mfi/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14' } = req.query;
    
    // Import the function dynamically
    const { quickMFI } = await import('./commands/mfiAnalysis');
    const result = await quickMFI(symbol, parseInt(period as string));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'MFI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple IMI endpoint
app.get('/api/imi/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14' } = req.query;
    
    // Import the function dynamically
    const { quickIMI } = await import('./commands/imiAnalysis');
    const result = await quickIMI(symbol, parseInt(period as string));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'IMI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

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
  console.log(`   RSI: http://localhost:${PORT}/api/rsi/AAPL/quick`);
  console.log(`   Bollinger Bands: http://localhost:${PORT}/api/bollinger/AAPL/quick`);
  console.log(`   MFI: http://localhost:${PORT}/api/mfi/AAPL/quick`);
  console.log(`   IMI: http://localhost:${PORT}/api/imi/AAPL/quick`);
});

export default app;
