import express from 'express';
import { imiAnalysis, quickIMI } from '../commands/imiAnalysis';
import { analyzeIMI } from '../indicators/intradayMomentumIndex';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';

const router = express.Router();

/**
 * GET /api/imi/:symbol
 * Get complete Intraday Momentum Index analysis for a symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      period = '14', 
      oversold = '30', 
      overbought = '70',
      extremeOversold = '20',
      extremeOverbought = '80',
      testData,
      mock = 'false'
    } = req.query;

    const options = {
      period: parseInt(period as string),
      customLevels: {
        oversold: parseInt(oversold as string),
        overbought: parseInt(overbought as string),
        extremeOversold: parseInt(extremeOversold as string),
        extremeOverbought: parseInt(extremeOverbought as string)
      },
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

    const analysis = analyzeIMI(candles, options.period, options.customLevels);

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'Intraday Momentum Index',
      timestamp: new Date().toISOString(),
      data: {
        current: analysis.imi.current,
        previous: analysis.imi.previous,
        period: analysis.imi.period,
        totalGains: analysis.imi.totalGains,
        totalLosses: analysis.imi.totalLosses,
        upDays: analysis.imi.upDays,
        downDays: analysis.imi.downDays,
        signal: analysis.signal,
        strength: analysis.strength,
        trend: analysis.trend,
        momentum: analysis.momentum,
        divergence: analysis.divergence,
        intradayBias: analysis.intradayBias,
        tradingLevels: analysis.tradingLevels,
        interpretation: analysis.interpretation
      },
      metadata: {
        dataPoints: analysis.imi.values.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'IMI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/imi/:symbol/quick
 * Get quick IMI value and signal
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14' } = req.query;

    const result = await quickIMI(symbol, parseInt(period as string));
    
    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: 'Quick IMI Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate mock candle data for testing with realistic intraday patterns
 */
function generateMockCandles(_symbol: string, count: number) {
  const candles: any[] = [];
  let price = 100 + Math.random() * 100;

  for (let i = 0; i < count; i++) {
    const dailyChange = (Math.random() - 0.5) * 0.04;
    const trendFactor = Math.sin(i / 30) * 0.002;

    price = price * (1 + dailyChange + trendFactor);

    // Create realistic intraday patterns
    const intradayVolatility = 0.015 + Math.random() * 0.01;
    const open: number = i === 0 ? price : candles[i - 1].close;
    
    // Simulate intraday momentum - some days have strong intraday moves
    const intradayMomentum = (Math.random() - 0.5) * 0.03;
    const close = open * (1 + intradayMomentum);
    
    // High and low based on open/close range
    const high = Math.max(open, close) * (1 + Math.random() * intradayVolatility);
    const low = Math.min(open, close) * (1 - Math.random() * intradayVolatility);
    
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
