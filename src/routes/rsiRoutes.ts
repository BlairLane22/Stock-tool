import express from 'express';
import { rsiAnalysis, quickRSI } from '../commands/rsiAnalysis';
import { analyzeRSI } from '../indicators/rsi';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';

const router = express.Router();

/**
 * GET /api/rsi/:symbol
 * Get complete RSI analysis for a symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      period = '14', 
      oversold = '30', 
      overbought = '70',
      testData,
      mock = 'false'
    } = req.query;

    const options = {
      period: parseInt(period as string),
      oversoldThreshold: parseInt(oversold as string),
      overboughtThreshold: parseInt(overbought as string),
      testData: testData as string,
      mock: mock === 'true'
    };

    // Get candle data
    let candles: any;
    if (testData) {
      const testDataObj = loadTestData(testData as string);
      candles = testDataObj.candles;
    } else if (options.mock) {
      // Generate mock data
      candles = generateMockCandles(symbol, 200);
    } else {
      candles = await getCandles(symbol);
    }

    const analysis = analyzeRSI(candles, options.period, {
      oversold: options.oversoldThreshold,
      overbought: options.overboughtThreshold
    });

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'RSI',
      timestamp: new Date().toISOString(),
      data: {
        current: analysis.rsi.current,
        previous: analysis.rsi.previous,
        period: analysis.rsi.period,
        signal: analysis.signal,
        strength: analysis.strength,
        trend: analysis.trend,
        momentum: analysis.momentum,
        divergence: analysis.divergence,
        tradingLevels: analysis.tradingLevels,
        interpretation: analysis.interpretation
      },
      metadata: {
        dataPoints: analysis.rsi.values.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'RSI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/rsi/:symbol/quick
 * Get quick RSI value and signal
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14' } = req.query;

    const result = await quickRSI(symbol, parseInt(period as string));
    
    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: 'Quick RSI Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/rsi/:symbol/multi
 * Get multi-timeframe RSI analysis
 */
router.get('/:symbol/multi', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      periods = '9,14,21',
      testData,
      mock = 'false'
    } = req.query;

    const periodArray = (periods as string).split(',').map(p => parseInt(p.trim()));
    
    // Get candle data
    let candles: any;
    if (testData) {
      const testDataObj = loadTestData(testData as string);
      candles = testDataObj.candles;
    } else if (mock === 'true') {
      candles = generateMockCandles(symbol, 200);
    } else {
      candles = await getCandles(symbol);
    }

    const multiAnalysis = periodArray.map(period => {
      const analysis = analyzeRSI(candles, period, { oversold: 30, overbought: 70 });
      return {
        period,
        rsi: analysis.rsi.current,
        signal: analysis.signal,
        strength: analysis.strength,
        trend: analysis.trend
      };
    });

    // Calculate consensus
    const signals = multiAnalysis.map(a => a.signal);
    const buyCount = signals.filter(s => s === 'BUY').length;
    const sellCount = signals.filter(s => s === 'SELL').length;
    const holdCount = signals.filter(s => s === 'HOLD').length;

    let consensus = 'HOLD';
    if (buyCount > sellCount && buyCount > holdCount) {
      consensus = 'BUY';
    } else if (sellCount > buyCount && sellCount > holdCount) {
      consensus = 'SELL';
    }

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'RSI Multi-Timeframe',
      timestamp: new Date().toISOString(),
      data: {
        analyses: multiAnalysis,
        consensus: {
          signal: consensus,
          confidence: Math.max(buyCount, sellCount, holdCount) / periodArray.length,
          breakdown: {
            buy: buyCount,
            sell: sellCount,
            hold: holdCount
          }
        }
      },
      metadata: {
        periods: periodArray,
        dataSource: testData ? 'Test Data' : (mock === 'true' ? 'Mock Data' : 'Live API')
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Multi-timeframe RSI Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate mock candle data for testing
 */
function generateMockCandles(symbol: string, count: number) {
  const candles: any[] = [];
  let price = 100 + Math.random() * 100;

  for (let i = 0; i < count; i++) {
    const dailyChange = (Math.random() - 0.5) * 0.04;
    const trendFactor = Math.sin(i / 25) * 0.002;

    price = price * (1 + dailyChange + trendFactor);

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
