import express from 'express';
import { bollingerBandsAnalysis, quickBollingerBands } from '../commands/bollingerBandsAnalysis';
import { analyzeBollingerBands, detectBollingerSqueeze } from '../indicators/bollingerBands';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';

const router = express.Router();

/**
 * GET /api/bollinger/:symbol
 * Get complete Bollinger Bands analysis for a symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      period = '20', 
      multiplier = '2',
      testData,
      mock = 'false'
    } = req.query;

    const options = {
      period: parseInt(period as string),
      multiplier: parseFloat(multiplier as string),
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

    const analysis = analyzeBollingerBands(candles, options.period, options.multiplier);

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'Bollinger Bands',
      timestamp: new Date().toISOString(),
      data: {
        current: {
          upper: analysis.current.upper,
          middle: analysis.current.middle,
          lower: analysis.current.lower,
          price: analysis.current.price,
          percentB: analysis.current.percentB,
          bandwidth: analysis.current.bandwidth
        },
        signal: analysis.signal,
        position: analysis.position,
        volatility: analysis.volatility,
        trend: analysis.trend,
        interpretation: analysis.interpretation,
        tradingStrategy: analysis.tradingStrategy
      },
      parameters: {
        period: options.period,
        multiplier: options.multiplier
      },
      metadata: {
        dataPoints: analysis.bands.middleBand.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Bollinger Bands Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bollinger/:symbol/quick
 * Get quick Bollinger Bands values
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      period = '20', 
      multiplier = '2'
    } = req.query;

    const result = await quickBollingerBands(
      symbol, 
      parseInt(period as string), 
      parseFloat(multiplier as string)
    );
    
    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: 'Quick Bollinger Bands Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bollinger/:symbol/squeeze
 * Get Bollinger Bands analysis with squeeze detection
 */
router.get('/:symbol/squeeze', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      period = '20', 
      multiplier = '2',
      lookback = '20',
      testData,
      mock = 'false'
    } = req.query;

    const options = {
      period: parseInt(period as string),
      multiplier: parseFloat(multiplier as string),
      lookback: parseInt(lookback as string),
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

    const analysis = analyzeBollingerBands(candles, options.period, options.multiplier);
    const squeezeAnalysis = detectBollingerSqueeze(candles, options.period, options.lookback);

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'Bollinger Bands with Squeeze',
      timestamp: new Date().toISOString(),
      data: {
        bands: {
          upper: analysis.current.upper,
          middle: analysis.current.middle,
          lower: analysis.current.lower,
          price: analysis.current.price,
          percentB: analysis.current.percentB,
          bandwidth: analysis.current.bandwidth
        },
        signal: analysis.signal,
        position: analysis.position,
        volatility: analysis.volatility,
        trend: analysis.trend,
        squeeze: {
          isSqueezing: squeezeAnalysis.isSqueezing,
          squeezeStrength: squeezeAnalysis.squeezeStrength,
          daysSinceLastSqueeze: squeezeAnalysis.daysSinceLastSqueeze,
          potentialBreakout: squeezeAnalysis.potentialBreakout
        },
        interpretation: analysis.interpretation,
        tradingStrategy: analysis.tradingStrategy
      },
      parameters: {
        period: options.period,
        multiplier: options.multiplier,
        lookback: options.lookback
      },
      metadata: {
        dataPoints: analysis.bands.middleBand.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Bollinger Bands Squeeze Analysis Failed',
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
    const volatilityCycle = Math.sin(i / 30) * 0.5 + 1;
    const dailyChange = (Math.random() - 0.5) * 0.04 * volatilityCycle;
    const trendFactor = Math.sin(i / 50) * 0.001;

    price = price * (1 + dailyChange + trendFactor);

    const volatility = 0.02 * volatilityCycle;
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
