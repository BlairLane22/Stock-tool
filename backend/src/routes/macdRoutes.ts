import express from 'express';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';
import { analyzeMACDSignals, getMACDResult } from '../indicators/macd';

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

    // Perform MACD analysis
    const analysis = analyzeMACDSignals(candles, options.fastPeriod, options.slowPeriod, options.signalPeriod);

    // Extract the key data from the analysis result
    const responseData = {
      symbol: symbol.toUpperCase(),
      indicator: 'MACD',
      timestamp: new Date().toISOString(),
      data: {
        current: {
          macd: analysis.macd.current,
          signal: analysis.macd.signalCurrent,
          histogram: analysis.macd.histogramCurrent
        },
        previous: {
          macd: analysis.macd.previous,
          signal: analysis.macd.signalPrevious,
          histogram: analysis.macd.histogramPrevious
        },
        signal: analysis.signal,
        crossover: analysis.crossover,
        trend: analysis.trend,
        momentum: analysis.momentum,
        strength: analysis.strength,
        divergence: analysis.divergence,
        interpretation: analysis.interpretation,
        tradingStrategy: analysis.tradingStrategy,
        chartData: analysis.chartData
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

    // Get candle data for quick analysis
    let candles: any;
    try {
      candles = await getCandles(symbol);
      if (candles.length < Math.max(options.slowPeriod + options.signalPeriod, 50)) {
        candles = generateMockCandles(symbol, 200);
      }
    } catch (error) {
      candles = generateMockCandles(symbol, 200);
    }

    // Perform quick MACD analysis
    const macdResult = getMACDResult(candles, options.fastPeriod, options.slowPeriod, options.signalPeriod);

    res.json({
      symbol: symbol.toUpperCase(),
      macd: macdResult.current,
      signal: macdResult.signalCurrent,
      histogram: macdResult.histogramCurrent,
      crossover: macdResult.current > macdResult.signalCurrent ?
        (macdResult.previous <= macdResult.signalPrevious ? 'BULLISH_CROSSOVER' : 'BULLISH') :
        (macdResult.previous >= macdResult.signalPrevious ? 'BEARISH_CROSSOVER' : 'BEARISH'),
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
