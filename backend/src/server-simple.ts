import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables from variables.env
dotenv.config({
  path: 'variables.env'
});

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
        'GET /api/rsi/:symbol': 'Get comprehensive RSI analysis with trading strategy',
        'GET /api/rsi/:symbol/quick': 'Get quick RSI value and signal'
      },
      bollinger: {
        'GET /api/bollinger/:symbol': 'Get comprehensive Bollinger Bands analysis with squeeze detection',
        'GET /api/bollinger/:symbol/quick': 'Get quick Bollinger Bands values'
      },
      mfi: {
        'GET /api/mfi/:symbol': 'Get comprehensive Money Flow Index analysis with volume insights',
        'GET /api/mfi/:symbol/quick': 'Get quick MFI value and signal'
      },
      imi: {
        'GET /api/imi/:symbol/quick': 'Get Intraday Momentum Index analysis'
      },
      ema: {
        'GET /api/ema/:symbol': 'Get comprehensive Exponential Moving Average analysis with trend detection',
        'GET /api/ema/:symbol/quick': 'Get quick EMA value and trend'
      },
      atr: {
        'GET /api/atr/:symbol': 'Get comprehensive Average True Range analysis with position sizing',
        'GET /api/atr/:symbol/quick': 'Get quick ATR volatility assessment'
      }
    },
    status: 'Routes loading individually to avoid import issues'
  });
});

// Full RSI analysis endpoint
app.get('/api/rsi/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14', oversold = '30', overbought = '70', mock } = req.query;

    // Determine if we should use mock data (default to mock even with API tokens)
    const useMock = mock !== 'false'; // Only use real API if explicitly requested with mock=false

    if (!useMock && hasApiTokens) {
      try {
        // Try real API with proper error handling
        console.log(`🔄 Attempting real API call for RSI ${symbol}`);
        const { rsiAnalysis } = await import('./commands/rsiAnalysis');
        const result = await rsiAnalysis(symbol, {
          period: parseInt(period as string),
          customLevels: {
            oversold: parseInt(oversold as string),
            overbought: parseInt(overbought as string),
            extremeOversold: parseInt(oversold as string) - 10,
            extremeOverbought: parseInt(overbought as string) + 10
          },
          mock: false
        });
        console.log(`✅ Real API call successful for RSI ${symbol}`);
        res.json({
          symbol: symbol.toUpperCase(),
          indicator: 'RSI',
          timestamp: new Date().toISOString(),
          data: result,
          parameters: { period: parseInt(period as string), oversold: parseInt(oversold as string), overbought: parseInt(overbought as string) },
          metadata: { dataSource: 'Live API' }
        });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for RSI ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
        // Fall through to mock data
      }
    }

    // Generate comprehensive mock RSI analysis with chart data
    const { generateMockCandles } = await import('./commands/helper/mockData');
    const mockCandles = generateMockCandles(symbol, 100); // 100 data points for chart
    const { getRSI } = await import('./indicators/rsi');
    const rsiData = getRSI(mockCandles, parseInt(period as string));

    const mockRSI = rsiData.current;
    const previousRSI = rsiData.previous;
    const currentPrice = mockCandles[mockCandles.length - 1].close;

    // Generate chart data arrays
    const chartData = {
      timestamps: mockCandles.slice(-50).map(c => c.timeStamp), // Last 50 points
      prices: mockCandles.slice(-50).map(c => c.close),
      rsiValues: rsiData.values.slice(-50),
      volume: mockCandles.slice(-50).map(c => c.volume)
    };

    const mockResult = {
      symbol: symbol.toUpperCase(),
      indicator: 'RSI',
      timestamp: new Date().toISOString(),
      data: {
        current: mockRSI,
        previous: previousRSI,
        period: parseInt(period as string),
        signal: mockRSI < parseInt(oversold as string) ? 'BUY' : mockRSI > parseInt(overbought as string) ? 'SELL' : 'HOLD',
        strength: mockRSI < 30 || mockRSI > 70 ? 'STRONG' : mockRSI < 40 || mockRSI > 60 ? 'MODERATE' : 'WEAK',
        trend: mockRSI > 50 ? 'BULLISH' : mockRSI < 50 ? 'BEARISH' : 'NEUTRAL',
        momentum: mockRSI > previousRSI ? 'INCREASING' : mockRSI < previousRSI ? 'DECREASING' : 'STABLE',
        levels: {
          oversold: parseInt(oversold as string),
          overbought: parseInt(overbought as string),
          extremeOversold: parseInt(oversold as string) - 10,
          extremeOverbought: parseInt(overbought as string) + 10
        },
        interpretation: [
          `RSI at ${mockRSI} is ${mockRSI < 30 ? 'oversold' : mockRSI > 70 ? 'overbought' : 'in neutral territory'}`,
          `RSI trend is ${mockRSI > 50 ? 'bullish' : 'bearish'} (${mockRSI > 50 ? 'above' : 'below'} 50)`,
          `RSI momentum is ${mockRSI > previousRSI ? 'increasing' : 'decreasing'} (${(mockRSI - previousRSI).toFixed(1)})`
        ],
        tradingStrategy: {
          entry: mockRSI < 30 ? 'Consider buying on oversold bounce' : mockRSI > 70 ? 'Consider selling on overbought decline' : 'Wait for clearer signals',
          exit: mockRSI < 30 ? 'Exit when RSI crosses above 50' : mockRSI > 70 ? 'Exit when RSI crosses below 50' : 'Monitor for trend changes',
          stopLoss: currentPrice * (mockRSI < 50 ? 0.95 : 1.05),
          target: currentPrice * (mockRSI < 50 ? 1.08 : 0.92)
        },
        chartData: {
          timestamps: chartData.timestamps,
          prices: chartData.prices,
          rsiValues: chartData.rsiValues,
          volume: chartData.volume,
          levels: {
            oversold: parseInt(oversold as string),
            overbought: parseInt(overbought as string),
            midline: 50
          }
        }
      },
      parameters: {
        period: parseInt(period as string),
        oversold: parseInt(oversold as string),
        overbought: parseInt(overbought as string)
      },
      metadata: {
        dataPoints: 200,
        dataSource: 'Mock Data'
      }
    };

    console.log(`📊 Using mock data for RSI ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    res.status(500).json({
      error: 'RSI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
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

// Full Bollinger Bands analysis endpoint
app.get('/api/bollinger/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '20', multiplier = '2', squeeze = 'false', mock } = req.query;

    // Determine if we should use mock data (default to mock even with API tokens)
    const useMock = mock !== 'false';

    if (!useMock && hasApiTokens) {
      try {
        console.log(`🔄 Attempting real API call for Bollinger Bands ${symbol}`);
        const { bollingerBandsAnalysis } = await import('./commands/bollingerBandsAnalysis');
        const result = await bollingerBandsAnalysis(symbol, {
          period: parseInt(period as string),
          multiplier: parseFloat(multiplier as string),
          squeeze: squeeze === 'true',
          mock: false
        });
        console.log(`✅ Real API call successful for Bollinger Bands ${symbol}`);
        res.json({
          symbol: symbol.toUpperCase(),
          indicator: 'Bollinger Bands',
          timestamp: new Date().toISOString(),
          data: result,
          parameters: { period: parseInt(period as string), multiplier: parseFloat(multiplier as string) },
          metadata: { dataSource: 'Live API' }
        });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for Bollinger Bands ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
      }
    }

    // Generate comprehensive mock Bollinger Bands analysis with chart data
    const { generateMockCandles } = await import('./commands/helper/mockData');
    const mockCandles = generateMockCandles(symbol, 100);
    const { calculateBollingerBands } = await import('./indicators/bollingerBands');
    const bbData = calculateBollingerBands(mockCandles, parseInt(period as string), parseFloat(multiplier as string));

    const currentPrice = mockCandles[mockCandles.length - 1].close;
    const upperBand = bbData.upperBand[bbData.upperBand.length - 1];
    const lowerBand = bbData.lowerBand[bbData.lowerBand.length - 1];
    const middleBand = bbData.middleBand[bbData.middleBand.length - 1];
    const percentB = ((currentPrice - lowerBand) / (upperBand - lowerBand)) * 100;
    const bandwidth = ((upperBand - lowerBand) / middleBand) * 100;

    // Generate chart data arrays
    const chartData = {
      timestamps: mockCandles.slice(-50).map(c => c.timeStamp),
      prices: mockCandles.slice(-50).map(c => c.close),
      upperBand: bbData.upperBand.slice(-50),
      middleBand: bbData.middleBand.slice(-50),
      lowerBand: bbData.lowerBand.slice(-50),
      percentB: bbData.percentB.slice(-50),
      bandwidth: bbData.bandwidth.slice(-50),
      volume: mockCandles.slice(-50).map(c => c.volume)
    };

    const mockResult = {
      symbol: symbol.toUpperCase(),
      indicator: 'Bollinger Bands',
      timestamp: new Date().toISOString(),
      data: {
        current: {
          upper: parseFloat(upperBand.toFixed(2)),
          middle: parseFloat(middleBand.toFixed(2)),
          lower: parseFloat(lowerBand.toFixed(2)),
          price: parseFloat(currentPrice.toFixed(2)),
          percentB: parseFloat(percentB.toFixed(1)),
          bandwidth: parseFloat(bandwidth.toFixed(2))
        },
        signal: percentB > 80 ? 'SELL' : percentB < 20 ? 'BUY' : 'HOLD',
        position: percentB > 100 ? 'ABOVE_UPPER' : percentB < 0 ? 'BELOW_LOWER' :
                 percentB > 50 ? 'UPPER_HALF' : 'LOWER_HALF',
        volatility: bandwidth > 15 ? 'HIGH' : bandwidth < 8 ? 'LOW' : 'NORMAL',
        trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        squeeze: squeeze === 'true' ? {
          isSqueezing: bandwidth < 10,
          strength: parseFloat((Math.random() * 200 - 100).toFixed(1)),
          daysSinceLastSqueeze: Math.floor(Math.random() * 20),
          breakoutPotential: bandwidth < 8 ? 'HIGH' : bandwidth < 12 ? 'MEDIUM' : 'LOW'
        } : undefined,
        interpretation: [
          `Price at $${currentPrice.toFixed(2)} is ${percentB > 50 ? 'above' : 'below'} middle band`,
          `%B at ${percentB.toFixed(1)}% indicates ${percentB > 80 ? 'overbought' : percentB < 20 ? 'oversold' : 'neutral'} conditions`,
          `Bandwidth at ${bandwidth.toFixed(2)}% shows ${bandwidth > 15 ? 'high' : bandwidth < 8 ? 'low' : 'normal'} volatility`,
          squeeze === 'true' && bandwidth < 10 ? '🔥 Bollinger Band Squeeze detected - potential breakout ahead' : ''
        ].filter(Boolean),
        tradingStrategy: {
          entry: percentB < 20 ? 'Consider buying near lower band' : percentB > 80 ? 'Consider selling near upper band' : 'Wait for band touches',
          exit: 'Exit when price crosses middle band in opposite direction',
          stopLoss: percentB < 50 ? lowerBand * 0.98 : upperBand * 1.02,
          target: percentB < 50 ? upperBand * 0.95 : lowerBand * 1.05
        },
        chartData: {
          timestamps: chartData.timestamps,
          prices: chartData.prices,
          upperBand: chartData.upperBand,
          middleBand: chartData.middleBand,
          lowerBand: chartData.lowerBand,
          percentB: chartData.percentB,
          bandwidth: chartData.bandwidth,
          volume: chartData.volume
        }
      },
      parameters: {
        period: parseInt(period as string),
        multiplier: parseFloat(multiplier as string),
        includesSqueeze: squeeze === 'true'
      },
      metadata: {
        dataPoints: 200,
        dataSource: 'Mock Data'
      }
    };

    console.log(`📊 Using mock data for Bollinger Bands ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    res.status(500).json({
      error: 'Bollinger Bands Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
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

// Full MFI analysis endpoint
app.get('/api/mfi/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14', oversold = '20', overbought = '80', mock } = req.query;

    const useMock = mock !== 'false';

    if (!useMock && hasApiTokens) {
      try {
        console.log(`🔄 Attempting real API call for MFI ${symbol}`);
        const { mfiAnalysis } = await import('./commands/mfiAnalysis');
        const result = await mfiAnalysis(symbol, {
          period: parseInt(period as string),
          customLevels: {
            oversold: parseInt(oversold as string),
            overbought: parseInt(overbought as string),
            extremeOversold: parseInt(oversold as string) - 10,
            extremeOverbought: parseInt(overbought as string) + 10
          },
          mock: false
        });
        console.log(`✅ Real API call successful for MFI ${symbol}`);
        res.json({
          symbol: symbol.toUpperCase(),
          indicator: 'MFI',
          timestamp: new Date().toISOString(),
          data: result,
          parameters: { period: parseInt(period as string) },
          metadata: { dataSource: 'Live API' }
        });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for MFI ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
      }
    }

    // Generate comprehensive mock MFI analysis with chart data
    const { generateMockCandles } = await import('./commands/helper/mockData');
    const mockCandles = generateMockCandles(symbol, 100);
    const { calculateMFI } = await import('./indicators/moneyFlowIndex');
    const mfiValues = calculateMFI(mockCandles, parseInt(period as string));

    const mockMFI = mfiValues[mfiValues.length - 1];
    const previousMFI = mfiValues.length > 1 ? mfiValues[mfiValues.length - 2] : mockMFI;
    const moneyFlowRatio = parseFloat((Math.random() * 3 + 0.5).toFixed(2));

    // Generate chart data arrays
    const chartData = {
      timestamps: mockCandles.slice(-50).map(c => c.timeStamp),
      prices: mockCandles.slice(-50).map(c => c.close),
      mfiValues: mfiValues.slice(-50),
      volume: mockCandles.slice(-50).map(c => c.volume)
    };

    const mockResult = {
      symbol: symbol.toUpperCase(),
      indicator: 'MFI',
      timestamp: new Date().toISOString(),
      data: {
        current: mockMFI,
        previous: previousMFI,
        period: parseInt(period as string),
        moneyFlowRatio: moneyFlowRatio,
        signal: mockMFI < parseInt(oversold as string) ? 'BUY' : mockMFI > parseInt(overbought as string) ? 'SELL' : 'HOLD',
        strength: mockMFI < 20 || mockMFI > 80 ? 'STRONG' : mockMFI < 30 || mockMFI > 70 ? 'MODERATE' : 'WEAK',
        volumeTrend: moneyFlowRatio > 1.5 ? 'BULLISH' : moneyFlowRatio < 0.7 ? 'BEARISH' : 'NEUTRAL',
        momentum: mockMFI > previousMFI ? 'INCREASING' : mockMFI < previousMFI ? 'DECREASING' : 'STABLE',
        levels: {
          oversold: parseInt(oversold as string),
          overbought: parseInt(overbought as string),
          extremeOversold: parseInt(oversold as string) - 10,
          extremeOverbought: parseInt(overbought as string) + 10
        },
        interpretation: [
          `MFI at ${mockMFI} indicates ${mockMFI < 20 ? 'oversold' : mockMFI > 80 ? 'overbought' : 'neutral'} conditions`,
          `Money Flow Ratio of ${moneyFlowRatio} shows ${moneyFlowRatio > 1 ? 'positive' : 'negative'} money flow`,
          `Volume-weighted momentum is ${mockMFI > previousMFI ? 'increasing' : 'decreasing'}`
        ],
        tradingStrategy: {
          entry: mockMFI < 20 ? 'Consider buying on oversold with volume confirmation' : mockMFI > 80 ? 'Consider selling on overbought with volume' : 'Wait for volume-confirmed signals',
          exit: 'Exit when MFI crosses back through 50 level',
          volumeConfirmation: moneyFlowRatio > 1.2 ? 'Strong volume support' : 'Weak volume - use caution'
        },
        chartData: {
          timestamps: chartData.timestamps,
          prices: chartData.prices,
          mfiValues: chartData.mfiValues,
          volume: chartData.volume,
          levels: {
            oversold: parseInt(oversold as string),
            overbought: parseInt(overbought as string),
            midline: 50
          }
        }
      },
      parameters: {
        period: parseInt(period as string),
        oversold: parseInt(oversold as string),
        overbought: parseInt(overbought as string)
      },
      metadata: {
        dataPoints: 200,
        dataSource: 'Mock Data'
      }
    };

    console.log(`📊 Using mock data for MFI ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    res.status(500).json({
      error: 'MFI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
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

// Full EMA analysis endpoint
app.get('/api/ema/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '12', type = 'close', multi = 'false', mock } = req.query;

    const useMock = mock !== 'false';

    if (!useMock && hasApiTokens) {
      try {
        console.log(`🔄 Attempting real API call for EMA ${symbol}`);
        const { performEMAAnalysis } = await import('./commands/emaAnalysis');
        const result = await performEMAAnalysis(symbol, parseInt(period as string), type as any);
        console.log(`✅ Real API call successful for EMA ${symbol}`);
        res.json({
          symbol: symbol.toUpperCase(),
          indicator: 'EMA',
          timestamp: new Date().toISOString(),
          data: result,
          parameters: { period: parseInt(period as string), priceType: type },
          metadata: { dataSource: 'Live API' }
        });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for EMA ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
      }
    }

    // Generate comprehensive mock EMA analysis with chart data
    const { generateMockCandles } = await import('./commands/helper/mockData');
    const mockCandles = generateMockCandles(symbol, 100);
    const { calculateEMA } = await import('./indicators/ema');
    const emaValues = calculateEMA(mockCandles, parseInt(period as string), type as any);

    const currentPrice = mockCandles[mockCandles.length - 1].close;
    const emaValue = emaValues[emaValues.length - 1];
    const previousEMA = emaValues.length > 1 ? emaValues[emaValues.length - 2] : emaValue;

    // Generate chart data arrays
    const chartData = {
      timestamps: mockCandles.slice(-50).map(c => c.timeStamp),
      prices: mockCandles.slice(-50).map(c => c.close),
      emaValues: emaValues.slice(-50),
      volume: mockCandles.slice(-50).map(c => c.volume)
    };

    const mockResult = {
      symbol: symbol.toUpperCase(),
      indicator: 'EMA',
      timestamp: new Date().toISOString(),
      data: {
        ema: {
          current: parseFloat(emaValue.toFixed(2)),
          previous: parseFloat(previousEMA.toFixed(2)),
          period: parseInt(period as string),
          multiplier: 2 / (parseInt(period as string) + 1)
        },
        signal: currentPrice > emaValue ? (Math.random() > 0.5 ? 'BUY' : 'HOLD') : (Math.random() > 0.5 ? 'SELL' : 'HOLD'),
        trend: emaValue > previousEMA ? 'BULLISH' : emaValue < previousEMA ? 'BEARISH' : 'NEUTRAL',
        momentum: Math.random() > 0.6 ? 'INCREASING' : Math.random() > 0.3 ? 'STABLE' : 'DECREASING',
        pricePosition: currentPrice > emaValue ? 'ABOVE_EMA' : currentPrice < emaValue ? 'BELOW_EMA' : 'AT_EMA',
        crossover: Math.random() > 0.8 ? 'BULLISH_CROSSOVER' : Math.random() > 0.9 ? 'BEARISH_CROSSOVER' : 'NONE',
        strength: Math.random() > 0.6 ? 'STRONG' : Math.random() > 0.3 ? 'MODERATE' : 'WEAK',
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        interpretation: [
          `EMA-${period} at $${emaValue.toFixed(2)} provides trend guidance`,
          `Price at $${currentPrice.toFixed(2)} is ${currentPrice > emaValue ? 'above' : 'below'} EMA`,
          `EMA trend is ${emaValue > previousEMA ? 'bullish' : 'bearish'} based on recent movement`,
          `Price-EMA distance: ${Math.abs(((currentPrice - emaValue) / emaValue) * 100).toFixed(1)}%`
        ],
        tradingStrategy: {
          entry: currentPrice > emaValue ? 'Consider long positions above EMA' : 'Consider short positions below EMA',
          exit: 'Exit when price crosses opposite side of EMA',
          stopLoss: parseFloat((emaValue * (currentPrice > emaValue ? 0.98 : 1.02)).toFixed(2)),
          target: parseFloat((currentPrice * (currentPrice > emaValue ? 1.05 : 0.95)).toFixed(2))
        },
        chartData: {
          timestamps: chartData.timestamps,
          prices: chartData.prices,
          emaValues: chartData.emaValues,
          volume: chartData.volume
        }
      },
      parameters: {
        period: parseInt(period as string),
        priceType: type,
        multiTimeframe: multi === 'true'
      },
      metadata: {
        dataPoints: 200,
        dataSource: 'Mock Data'
      }
    };

    console.log(`📊 Using mock data for EMA ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    res.status(500).json({
      error: 'EMA Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple EMA endpoint
app.get('/api/ema/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '12', mock } = req.query;

    // Determine if we should use mock data (default to mock even with API tokens)
    const useMock = mock !== 'false'; // Only use real API if explicitly requested with mock=false

    // Generate mock EMA data
    const basePrice = 100 + Math.random() * 100; // Random price between 100-200
    const emaValue = basePrice * (0.95 + Math.random() * 0.1); // EMA slightly different from price
    const currentPrice = basePrice + (Math.random() - 0.5) * 10;

    const mockResult = {
      symbol: symbol.toUpperCase(),
      ema: parseFloat(emaValue.toFixed(2)),
      signal: currentPrice > emaValue ? (Math.random() > 0.5 ? 'BUY' : 'HOLD') : (Math.random() > 0.5 ? 'SELL' : 'HOLD'),
      trend: emaValue > (emaValue * 0.99) ? 'BULLISH' : emaValue < (emaValue * 1.01) ? 'BEARISH' : 'NEUTRAL',
      pricePosition: currentPrice > emaValue ? 'ABOVE_EMA' : currentPrice < emaValue ? 'BELOW_EMA' : 'AT_EMA',
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      period: parseInt(period as string),
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data'
    };

    if (!useMock && hasApiTokens) {
      try {
        // Try real API with proper error handling
        console.log(`🔄 Attempting real API call for EMA ${symbol}`);
        const { quickEMA } = await import('./commands/emaAnalysis');
        const result = await quickEMA(symbol, parseInt(period as string));
        console.log(`✅ Real API call successful for EMA ${symbol}`);
        res.json({ ...result, dataSource: 'Live API' });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for EMA ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
        // Fall through to mock data
      }
    }

    // Use mock data (default or fallback)
    console.log(`📊 Using mock data for EMA ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    // Final fallback to mock data
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      ema: parseFloat((100 + Math.random() * 50).toFixed(2)),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL',
      trend: Math.random() > 0.5 ? 'BULLISH' : Math.random() > 0.25 ? 'NEUTRAL' : 'BEARISH',
      pricePosition: Math.random() > 0.5 ? 'ABOVE_EMA' : 'BELOW_EMA',
      currentPrice: parseFloat((100 + Math.random() * 50).toFixed(2)),
      period: parseInt((req.query.period as string) || '12'),
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data (Error Fallback)',
      note: 'API error occurred, using mock data'
    };
    res.json(mockResult);
  }
});

// Full ATR analysis endpoint
app.get('/api/atr/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14', mock } = req.query;

    const useMock = mock !== 'false';

    if (!useMock && hasApiTokens) {
      try {
        console.log(`🔄 Attempting real API call for ATR ${symbol}`);
        const { performATRAnalysis } = await import('./commands/atrAnalysis');
        const result = await performATRAnalysis(symbol, parseInt(period as string));
        console.log(`✅ Real API call successful for ATR ${symbol}`);
        res.json({
          symbol: symbol.toUpperCase(),
          indicator: 'ATR',
          timestamp: new Date().toISOString(),
          data: result,
          parameters: { period: parseInt(period as string) },
          metadata: { dataSource: 'Live API' }
        });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for ATR ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
      }
    }

    // Generate comprehensive mock ATR analysis with chart data
    const { generateMockCandles } = await import('./commands/helper/mockData');
    const mockCandles = generateMockCandles(symbol, 100);
    const { calculateATR } = await import('./indicators/atr');
    const atrValues = calculateATR(mockCandles, parseInt(period as string));

    const currentPrice = mockCandles[mockCandles.length - 1].close;
    const atrValue = atrValues[atrValues.length - 1];
    const previousATR = atrValues.length > 1 ? atrValues[atrValues.length - 2] : atrValue;
    const percentageOfPrice = (atrValue / currentPrice) * 100;

    // Generate chart data arrays
    const chartData = {
      timestamps: mockCandles.slice(-50).map(c => c.timeStamp),
      prices: mockCandles.slice(-50).map(c => c.close),
      atrValues: atrValues.slice(-50),
      volume: mockCandles.slice(-50).map(c => c.volume),
      high: mockCandles.slice(-50).map(c => c.high),
      low: mockCandles.slice(-50).map(c => c.low)
    };

    const volatilityLevels = ['VERY_LOW', 'LOW', 'NORMAL', 'HIGH', 'VERY_HIGH'];
    const volatilityTrends = ['INCREASING', 'DECREASING', 'STABLE'];
    const signals = ['BREAKOUT_LIKELY', 'CONSOLIDATION', 'NORMAL_VOLATILITY'];

    const volatility = volatilityLevels[Math.floor(Math.random() * volatilityLevels.length)];
    const volatilityTrend = volatilityTrends[Math.floor(Math.random() * volatilityTrends.length)];
    const signal = signals[Math.floor(Math.random() * signals.length)];

    const mockResult = {
      symbol: symbol.toUpperCase(),
      indicator: 'ATR',
      timestamp: new Date().toISOString(),
      data: {
        atr: {
          current: parseFloat(atrValue.toFixed(2)),
          previous: parseFloat(previousATR.toFixed(2)),
          period: parseInt(period as string)
        },
        volatility: volatility,
        volatilityTrend: volatilityTrend,
        percentageOfPrice: parseFloat(percentageOfPrice.toFixed(2)),
        signal: signal,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        levels: {
          support: parseFloat((currentPrice - atrValue * 2).toFixed(2)),
          resistance: parseFloat((currentPrice + atrValue * 2).toFixed(2)),
          stopLossLong: parseFloat((currentPrice - atrValue * 2).toFixed(2)),
          stopLossShort: parseFloat((currentPrice + atrValue * 2).toFixed(2))
        },
        interpretation: [
          `ATR at $${atrValue.toFixed(2)} represents ${percentageOfPrice.toFixed(2)}% of current price`,
          `Volatility is ${volatility.toLowerCase().replace('_', ' ')} based on recent price movements`,
          `ATR trend is ${volatilityTrend.toLowerCase()} (${((atrValue - previousATR) / previousATR * 100).toFixed(1)}%)`,
          `Expected daily range: ±$${(atrValue * 2).toFixed(2)} (${(percentageOfPrice * 2).toFixed(1)}%)`
        ],
        tradingStrategy: {
          positionSizing: volatility === 'VERY_HIGH' ? 'Reduce position size due to high volatility' :
                         volatility === 'HIGH' ? 'Use moderate position size' :
                         'Standard position sizing appropriate',
          stopLoss: `Set stop loss at $${(atrValue * 2).toFixed(2)} (2x ATR) from entry`,
          entryStrategy: signal === 'BREAKOUT_LIKELY' ? 'Prepare for breakout trades' :
                        signal === 'CONSOLIDATION' ? 'Avoid trend-following strategies' :
                        'Use ATR for position sizing',
          riskManagement: `Daily range typically ${atrValue.toFixed(2)} (${percentageOfPrice.toFixed(1)}% of price)`
        },
        chartData: {
          timestamps: chartData.timestamps,
          prices: chartData.prices,
          high: chartData.high,
          low: chartData.low,
          atrValues: chartData.atrValues,
          volume: chartData.volume
        }
      },
      parameters: {
        period: parseInt(period as string),
        multiplier: 2
      },
      metadata: {
        dataPoints: 200,
        dataSource: 'Mock Data'
      }
    };

    console.log(`📊 Using mock data for ATR ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    res.status(500).json({
      error: 'ATR Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple ATR endpoint
app.get('/api/atr/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14', mock } = req.query;

    // Determine if we should use mock data (default to mock even with API tokens)
    const useMock = mock !== 'false'; // Only use real API if explicitly requested with mock=false

    // Generate mock ATR data
    const basePrice = 100 + Math.random() * 100; // Random price between 100-200
    const atrValue = basePrice * (0.02 + Math.random() * 0.06); // ATR 2-8% of price
    const volatilityLevels = ['VERY_LOW', 'LOW', 'NORMAL', 'HIGH', 'VERY_HIGH'];
    const signals = ['BREAKOUT_LIKELY', 'CONSOLIDATION', 'NORMAL_VOLATILITY'];

    const mockResult = {
      symbol: symbol.toUpperCase(),
      atr: parseFloat(atrValue.toFixed(2)),
      volatility: volatilityLevels[Math.floor(Math.random() * volatilityLevels.length)],
      percentageOfPrice: parseFloat(((atrValue / basePrice) * 100).toFixed(2)),
      signal: signals[Math.floor(Math.random() * signals.length)],
      currentPrice: parseFloat(basePrice.toFixed(2)),
      period: parseInt(period as string),
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data'
    };

    if (!useMock && hasApiTokens) {
      try {
        // Try real API with proper error handling
        console.log(`🔄 Attempting real API call for ATR ${symbol}`);
        const { quickATR } = await import('./commands/atrAnalysis');
        const result = await quickATR(symbol, parseInt(period as string));
        console.log(`✅ Real API call successful for ATR ${symbol}`);
        res.json({ ...result, dataSource: 'Live API' });
        return;
      } catch (apiError) {
        console.log(`❌ Real API call failed for ATR ${symbol}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
        // Fall through to mock data
      }
    }

    // Use mock data (default or fallback)
    console.log(`📊 Using mock data for ATR ${symbol}`);
    res.json(mockResult);

  } catch (error) {
    // Final fallback to mock data
    const mockResult = {
      symbol: req.params.symbol.toUpperCase(),
      atr: parseFloat((2 + Math.random() * 8).toFixed(2)),
      volatility: 'NORMAL',
      percentageOfPrice: parseFloat((2 + Math.random() * 4).toFixed(2)),
      signal: 'NORMAL_VOLATILITY',
      currentPrice: parseFloat((100 + Math.random() * 50).toFixed(2)),
      period: parseInt((req.query.period as string) || '14'),
      timestamp: Math.floor(Date.now() / 1000),
      dataSource: 'Mock Data (Error Fallback)',
      note: 'API error occurred, using mock data'
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
  console.log(`   EMA: http://localhost:${PORT}/api/ema/AAPL/quick`);
  console.log(`   ATR: http://localhost:${PORT}/api/atr/AAPL/quick`);
});

export default app;
