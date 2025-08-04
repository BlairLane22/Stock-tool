import express from 'express';
import { mfiAnalysis, quickMFI } from '../commands/mfiAnalysis';
import { analyzeMFI } from '../indicators/moneyFlowIndex';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';

const router = express.Router();

/**
 * GET /api/mfi/:symbol
 * Get complete Money Flow Index analysis for a symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      period = '14', 
      oversold = '20', 
      overbought = '80',
      extremeOversold = '10',
      extremeOverbought = '90',
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

    const analysis = analyzeMFI(candles, options.period, options.customLevels);

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'Money Flow Index',
      timestamp: new Date().toISOString(),
      data: {
        current: analysis.mfi.current,
        previous: analysis.mfi.previous,
        period: analysis.mfi.period,
        moneyFlowRatio: analysis.mfi.moneyFlowRatio,
        positiveMoneyFlow: analysis.mfi.positiveMoneyFlow,
        negativeMoneyFlow: analysis.mfi.negativeMoneyFlow,
        signal: analysis.signal,
        strength: analysis.strength,
        trend: analysis.trend,
        momentum: analysis.momentum,
        divergence: analysis.divergence,
        volumeStrength: analysis.volumeStrength,
        tradingLevels: analysis.tradingLevels,
        interpretation: analysis.interpretation
      },
      metadata: {
        dataPoints: analysis.mfi.values.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'MFI Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/mfi/:symbol/quick
 * Get quick MFI value and signal
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '14' } = req.query;

    const result = await quickMFI(symbol, parseInt(period as string));
    
    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: 'Quick MFI Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate mock candle data for testing with volume correlation
 */
function generateMockCandles(symbol: string, count: number) {
  const candles: any[] = [];
  let price = 100 + Math.random() * 100;

  for (let i = 0; i < count; i++) {
    const dailyChange = (Math.random() - 0.5) * 0.05;
    const trendFactor = Math.sin(i / 25) * 0.002;

    price = price * (1 + dailyChange + trendFactor);

    const volatility = 0.02;
    const open: number = i === 0 ? price : candles[i - 1].close;
    const high = Math.max(open, price) * (1 + Math.random() * volatility);
    const low = Math.min(open, price) * (1 - Math.random() * volatility);
    const close = price;
    
    // Volume correlates with price movement for more realistic MFI
    const priceChange = Math.abs(close - open);
    const baseVolume = 1000000;
    const volumeMultiplier = 1 + (priceChange / price) * 5;
    const volume = Math.floor(baseVolume * volumeMultiplier * (0.5 + Math.random()));
    
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
