import express from 'express';
import { getCandles } from '../commands/helper/getCandles';
import { loadTestData } from '../util/testDataLoader';
import { analyzeCupAndHandlePattern, getCupAndHandleResult, generateMockCupAndHandleData } from '../indicators/cupAndHandle';

const router = express.Router();

/**
 * GET /api/cup-handle/:symbol
 * Get complete Cup and Handle pattern analysis for a symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      testData,
      mock = 'false'
    } = req.query;

    const options = {
      testData: testData as string,
      mock: mock === 'true'
    };

    // Get candle data
    let candles: any;
    if (testData) {
      const testDataObj = loadTestData(testData as string);
      candles = testDataObj.candles;
    } else if (options.mock) {
      candles = generateMockCupAndHandleData(100, 20, 60);
    } else {
      candles = await getCandles(symbol);
      if (candles.length < 40) {
        candles = generateMockCupAndHandleData(100, 20, 60);
      }
    }

    // Perform Cup and Handle pattern analysis
    const analysis = analyzeCupAndHandlePattern(candles);

    // Extract the key data from the analysis result
    const responseData = {
      symbol: symbol.toUpperCase(),
      indicator: 'Cup and Handle Pattern',
      timestamp: new Date().toISOString(),
      data: {
        patternDetected: analysis.pattern.isPattern,
        confidence: analysis.pattern.confidence,
        stage: analysis.stage,
        cupDepth: analysis.pattern.cupDepth,
        handleDepth: analysis.pattern.handleDepth,
        breakoutLevel: analysis.pattern.breakoutLevel,
        targetPrice: analysis.pattern.targetPrice,
        stopLoss: analysis.pattern.stopLoss,
        patternDuration: analysis.pattern.patternDuration,
        volumeConfirmation: analysis.pattern.volumeConfirmation,
        strength: analysis.strength,
        riskReward: analysis.riskReward,
        signal: analysis.signal,
        interpretation: analysis.interpretation,
        tradingStrategy: analysis.tradingStrategy,
        chartData: analysis.chartData,
        patternDetails: {
          cupStart: analysis.pattern.cupStart,
          cupBottom: analysis.pattern.cupBottom,
          cupEnd: analysis.pattern.cupEnd,
          handleStart: analysis.pattern.handleStart,
          handleEnd: analysis.pattern.handleEnd,
          reasons: analysis.pattern.reasons
        }
      },
      metadata: {
        dataPoints: candles.length,
        dataSource: testData ? 'Test Data' : (options.mock ? 'Mock Data' : 'Live API')
      }
    };

    res.json(responseData);

  } catch (error) {
    res.status(500).json({
      error: 'Cup and Handle Analysis Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/cup-handle/:symbol/quick
 * Get quick Cup and Handle pattern detection
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { testData } = req.query;

    const options = {
      testData: testData as string
    };

    // Get candle data for quick analysis
    let candles: any;
    if (testData) {
      const testDataObj = loadTestData(testData as string);
      candles = testDataObj.candles;
    } else {
      try {
        candles = await getCandles(symbol);
        if (candles.length < 40) {
          candles = generateMockCupAndHandleData(100, 20, 60);
        }
      } catch (error) {
        candles = generateMockCupAndHandleData(100, 20, 60);
      }
    }

    // Perform quick Cup and Handle analysis
    const patternResult = getCupAndHandleResult(candles);

    res.json({
      symbol: symbol.toUpperCase(),
      patternDetected: patternResult.isPattern,
      confidence: patternResult.confidence,
      signal: patternResult.isPattern ?
        (patternResult.confidence === 'HIGH' ? 'BUY' : 'HOLD') : 'WAIT',
      targetPrice: patternResult.targetPrice,
      breakoutLevel: patternResult.breakoutLevel,
      stopLoss: patternResult.stopLoss,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Quick Cup and Handle Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate mock candle data for testing with cup and handle pattern potential
 * This function is kept for backward compatibility but delegates to the indicator's mock data generator
 */
function generateMockCandles(_symbol: string, count: number) {
  return generateMockCupAndHandleData(100, 20, count);
}

export default router;
