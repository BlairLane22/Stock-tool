import express from 'express';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';

const router = express.Router();

/**
 * GET /api/macd/:symbol
 * Get complete MACD analysis for a symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      fastPeriod = '12',
      slowPeriod = '26',
      signalPeriod = '9',
      testData,
      mock = 'false'
    } = req.query;

    const options = {
      fastPeriod: parseInt(fastPeriod as string),
      slowPeriod: parseInt(slowPeriod as string),
      signalPeriod: parseInt(signalPeriod as string),
      testData: testData as string,
      mock: mock === 'true'
    };

    // Get candle data
    let candles: any;
    if (testData) {
      const testDataObj = loadTestData(testData as string);
      candles = testDataObj.candles;
    } else if (options.mock) {
      candles = generateMockCandles(symbol, 200);
    } else {
      candles = await getCandles(symbol);
    }

    // Placeholder MACD analysis
    const analysis = {
      macd: { current: 0, previous: 0 },
      signal_line: { current: 0, previous: 0 },
      histogram: { current: 0, previous: 0 },
      trading_signal: 'HOLD',
      trend: 'NEUTRAL',
      momentum: 'STABLE',
      divergence: 'NONE',
      interpretation: ['MACD analysis not yet implemented']
    };

    // Extract the key data from the analysis result
    const responseData = {
      symbol: symbol.toUpperCase(),
      indicator: 'MACD',
      timestamp: new Date().toISOString(),
      data: {
        current: {
          macd: analysis?.macd?.current || 0,
          signal: analysis?.signal_line?.current || 0,
          histogram: analysis?.histogram?.current || 0
        },
        previous: {
          macd: analysis?.macd?.previous || 0,
          signal: analysis?.signal_line?.previous || 0,
          histogram: analysis?.histogram?.previous || 0
        },
        signal: analysis?.trading_signal || 'HOLD',
        trend: analysis?.trend || 'NEUTRAL',
        momentum: analysis?.momentum || 'STABLE',
        divergence: analysis?.divergence || 'NONE',
        interpretation: analysis?.interpretation || []
      },
      parameters: {
        fastPeriod: options.fastPeriod,
        slowPeriod: options.slowPeriod,
        signalPeriod: options.signalPeriod
      },
      metadata: {
        dataPoints: candles.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    };

    res.json(responseData);

  } catch (error) {
    res.status(500).json({
      error: 'MACD Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/macd/:symbol/quick
 * Get quick MACD values and signal
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      fastPeriod = '12',
      slowPeriod = '26',
      signalPeriod = '9'
    } = req.query;

    const options = {
      fastPeriod: parseInt(fastPeriod as string),
      slowPeriod: parseInt(slowPeriod as string),
      signalPeriod: parseInt(signalPeriod as string)
    };

    // Placeholder MACD analysis
    const analysis = {
      macd: { current: 0 },
      signal_line: { current: 0 },
      histogram: { current: 0 },
      trading_signal: 'HOLD'
    };

    res.json({
      symbol: symbol.toUpperCase(),
      macd: analysis?.macd?.current || 0,
      signal: analysis?.signal_line?.current || 0,
      histogram: analysis?.histogram?.current || 0,
      trading_signal: analysis?.trading_signal || 'HOLD',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Quick MACD Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate mock candle data for testing with trending patterns
 */
function generateMockCandles(_symbol: string, count: number) {
  const candles: any[] = [];
  let price = 100 + Math.random() * 100;

  for (let i = 0; i < count; i++) {
    // Create trending patterns that work well with MACD
    const longTrend = Math.sin(i / 50) * 0.002;
    const shortTrend = Math.sin(i / 20) * 0.001;
    const dailyNoise = (Math.random() - 0.5) * 0.03;

    const dailyChange = longTrend + shortTrend + dailyNoise;
    price = price * (1 + dailyChange);

    const volatility = 0.02;
    const open: number = i === 0 ? price : candles[i - 1].close;
    const high = Math.max(open, price) * (1 + Math.random() * volatility);
    const low = Math.min(open, price) * (1 - Math.random() * volatility);
    const close = price;
    const volume = Math.floor(Math.random() * 2000000 + 500000);
    
    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      timeStamp: Date.now() / 1000 - (count - i) * 24 * 60 * 60
    });
  }
  
  return candles;
}

export default router;
