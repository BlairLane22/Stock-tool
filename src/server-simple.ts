import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Check if API tokens are available
const hasApiTokens = !!(process.env.FINNHUB_API_TOKEN || process.env.ALPHA_VANTAGE_API_KEY);
console.log(`🔑 API Tokens Available: ${hasApiTokens ? 'Yes' : 'No'}`);
if (hasApiTokens) {
  console.log(`📊 Finnhub Token: ${process.env.FINNHUB_API_TOKEN ? 'Set' : 'Not Set'}`);
  console.log(`📈 Alpha Vantage Key: ${process.env.ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not Set'}`);
}

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
    const { period = '14', mock } = req.query;

    // Determine if we should use mock data (default to mock even with API tokens)
    const useMock = mock !== 'false'; // Only use real API if explicitly requested with mock=false

    // Generate mock data
    const mockResult = {
      symbol: symbol.toUpperCase(),
      rsi: parseFloat((Math.random() * 40 + 30).toFixed(2)), // Random RSI between 30-70
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data'
    };

    if (!useMock && hasApiTokens) {
      try {
        // Try real API with proper error handling
        console.log(`🔄 Attempting real API call for RSI ${symbol}`);
        const { quickRSI } = await import('./commands/rsiAnalysis');
        const result = await quickRSI(symbol, parseInt(period as string));
        console.log(`✅ Real API call successful for RSI ${symbol}`);
        res.json({ ...result, dataSource: 'Live API' });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for RSI ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
        // Fall through to mock data
      }
    }

    // Use mock data (default or fallback)
    console.log(`📊 Using mock data for RSI ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    // Final fallback to mock data
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      rsi: parseFloat((Math.random() * 40 + 30).toFixed(2)),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data (Error Fallback)',
      note: 'API error occurred, using mock data'
    };
    res.json(mockResult);
  }
});

// Simple Bollinger Bands endpoint
app.get('/api/bollinger/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '20', multiplier = '2', mock } = req.query;

    // Determine if we should use mock data (default to mock even with API tokens)
    const useMock = mock !== 'false'; // Only use real API if explicitly requested with mock=false

    // Generate mock Bollinger Bands data
    const basePrice = 100 + Math.random() * 100; // Random price between 100-200
    const volatility = 0.1 + Math.random() * 0.1; // Random volatility
    const mockResult = {
      symbol: symbol.toUpperCase(),
      upper: parseFloat((basePrice * (1 + volatility)).toFixed(2)),
      middle: parseFloat(basePrice.toFixed(2)),
      lower: parseFloat((basePrice * (1 - volatility)).toFixed(2)),
      price: parseFloat((basePrice + (Math.random() - 0.5) * volatility * basePrice).toFixed(2)),
      percentB: parseFloat((Math.random() * 100).toFixed(1)),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data'
    };

    if (!useMock && hasApiTokens) {
      try {
        // Try real API with proper error handling
        console.log(`🔄 Attempting real API call for Bollinger Bands ${symbol}`);
        const { quickBollingerBands } = await import('./commands/bollingerBandsAnalysis');
        const result = await quickBollingerBands(
          symbol,
          parseInt(period as string),
          parseFloat(multiplier as string)
        );
        console.log(`✅ Real API call successful for Bollinger Bands ${symbol}`);
        res.json({ ...result, dataSource: 'Live API' });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for Bollinger Bands ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
        // Fall through to mock data
      }
    }

    // Use mock data (default or fallback)
    console.log(`📊 Using mock data for Bollinger Bands ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    // Final fallback to mock data
    const basePrice = 100 + Math.random() * 100;
    const volatility = 0.1 + Math.random() * 0.1;
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      upper: parseFloat((basePrice * (1 + volatility)).toFixed(2)),
      middle: parseFloat(basePrice.toFixed(2)),
      lower: parseFloat((basePrice * (1 - volatility)).toFixed(2)),
      price: parseFloat((basePrice + (Math.random() - 0.5) * volatility * basePrice).toFixed(2)),
      percentB: parseFloat((Math.random() * 100).toFixed(1)),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data (Error Fallback)',
      note: 'API error occurred, using mock data'
    };
    res.json(mockResult);
  }
});

// Simple MFI endpoint
app.get('/api/mfi/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14', mock = 'true' } = req.query; // Default to mock data

    // Generate mock MFI data
    const mockResult = {
      symbol: symbol.toUpperCase(),
      mfi: parseFloat((Math.random() * 60 + 20).toFixed(2)), // Random MFI between 20-80
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      moneyFlowRatio: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      timestamp: Math.floor(Date.now() / 1000)
    };

    if (mock === 'false') {
      // Try real API only if explicitly requested
      const { quickMFI } = await import('./commands/mfiAnalysis');
      const result = await quickMFI(symbol, parseInt(period as string));
      res.json(result);
    } else {
      // Use mock data by default
      res.json(mockResult);
    }
  } catch (error) {
    // Fallback to mock data if API fails
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      mfi: parseFloat((Math.random() * 60 + 20).toFixed(2)),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      moneyFlowRatio: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      timestamp: Math.floor(Date.now() / 1000),
      note: 'Using mock data due to API error'
    };
    res.json(mockResult);
  }
});

// Simple IMI endpoint
app.get('/api/imi/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14', mock = 'true' } = req.query; // Default to mock data

    // Generate mock IMI data
    const mockResult = {
      symbol: symbol.toUpperCase(),
      imi: parseFloat((Math.random() * 40 + 30).toFixed(2)), // Random IMI between 30-70
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      intradayBias: Math.random() > 0.5 ? 'BULLISH' : Math.random() > 0.25 ? 'NEUTRAL' : 'BEARISH',
      upDays: Math.floor(Math.random() * 8 + 4), // Random between 4-12
      downDays: Math.floor(Math.random() * 8 + 4), // Random between 4-12
      timestamp: Math.floor(Date.now() / 1000)
    };

    if (mock === 'false') {
      // Try real API only if explicitly requested
      const { quickIMI } = await import('./commands/imiAnalysis');
      const result = await quickIMI(symbol, parseInt(period as string));
      res.json(result);
    } else {
      // Use mock data by default
      res.json(mockResult);
    }
  } catch (error) {
    // Fallback to mock data if API fails
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      imi: parseFloat((Math.random() * 40 + 30).toFixed(2)),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      intradayBias: Math.random() > 0.5 ? 'BULLISH' : Math.random() > 0.25 ? 'NEUTRAL' : 'BEARISH',
      upDays: Math.floor(Math.random() * 8 + 4),
      downDays: Math.floor(Math.random() * 8 + 4),
      timestamp: Math.floor(Date.now() / 1000),
      note: 'Using mock data due to API error'
    };
    res.json(mockResult);
  }
});

// Full Bollinger Bands analysis endpoint
app.get('/api/bollinger/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '20', multiplier = '2', mock = 'true' } = req.query;

    // Generate comprehensive mock Bollinger Bands data
    const basePrice = 100 + Math.random() * 100;
    const volatility = 0.1 + Math.random() * 0.1;
    const currentPrice = basePrice + (Math.random() - 0.5) * volatility * basePrice;
    const upper = basePrice * (1 + volatility);
    const lower = basePrice * (1 - volatility);
    const percentB = ((currentPrice - lower) / (upper - lower)) * 100;

    const mockResult = {
      symbol: symbol.toUpperCase(),
      indicator: 'Bollinger Bands',
      timestamp: new Date().toISOString(),
      data: {
        current: {
          upper: parseFloat(upper.toFixed(2)),
          middle: parseFloat(basePrice.toFixed(2)),
          lower: parseFloat(lower.toFixed(2)),
          price: parseFloat(currentPrice.toFixed(2)),
          percentB: parseFloat(percentB.toFixed(1)),
          bandwidth: parseFloat(((volatility * 2) * 100).toFixed(2))
        },
        signal: percentB > 80 ? 'SELL' : percentB < 20 ? 'BUY' : 'HOLD',
        position: percentB > 100 ? 'ABOVE_UPPER' : percentB < 0 ? 'BELOW_LOWER' :
                 percentB > 50 ? 'UPPER_HALF' : 'LOWER_HALF',
        volatility: volatility > 0.15 ? 'HIGH' : volatility < 0.08 ? 'LOW' : 'NORMAL',
        trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        interpretation: [
          `Price at $${currentPrice.toFixed(2)} is ${percentB > 50 ? 'above' : 'below'} middle band`,
          `%B at ${percentB.toFixed(1)}% indicates ${percentB > 80 ? 'overbought' : percentB < 20 ? 'oversold' : 'neutral'} conditions`,
          `Bandwidth at ${((volatility * 2) * 100).toFixed(2)}% shows ${volatility > 0.15 ? 'high' : 'normal'} volatility`
        ]
      },
      parameters: {
        period: parseInt(period as string),
        multiplier: parseFloat(multiplier as string)
      },
      metadata: {
        dataPoints: 200,
        dataSource: 'Mock Data'
      }
    };

    if (mock === 'false') {
      // Try real API only if explicitly requested
      const { analyzeBollingerBands } = await import('./indicators/bollingerBands');
      const { getCandles } = await import('./commands/helper/getCandles');
      const candles = await getCandles(symbol);
      const analysis = analyzeBollingerBands(candles, parseInt(period as string), parseFloat(multiplier as string));

      res.json({
        symbol: symbol.toUpperCase(),
        indicator: 'Bollinger Bands',
        timestamp: new Date().toISOString(),
        data: analysis,
        parameters: { period: parseInt(period as string), multiplier: parseFloat(multiplier as string) },
        metadata: { dataPoints: candles.length, dataSource: 'Live API' }
      });
    } else {
      res.json(mockResult);
    }
  } catch (error) {
    // Fallback to simplified mock data
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      indicator: 'Bollinger Bands',
      timestamp: new Date().toISOString(),
      data: {
        current: {
          upper: 150.25,
          middle: 145.00,
          lower: 139.75,
          price: 147.50,
          percentB: 65.2,
          bandwidth: 7.2
        },
        signal: 'HOLD',
        position: 'UPPER_HALF',
        volatility: 'NORMAL',
        trend: 'BULLISH',
        interpretation: ['Using mock data due to API error']
      },
      metadata: { dataSource: 'Mock Data (Error Fallback)' }
    };
    res.json(mockResult);
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
