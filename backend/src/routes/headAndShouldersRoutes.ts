import express from 'express';
import { analyzeHeadAndShouldersPattern, generateMockHeadAndShouldersData } from '../indicators/headAndShoulders';
import { getCandles } from '../commands/helper/getCandles';

const router = express.Router();

/**
 * GET /api/head-and-shoulders/:symbol
 * Comprehensive Head and Shoulders pattern analysis with chart data
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      mock = 'true',
      testData,
      minPatternPeriods = '20',
      maxPatternPeriods = '100'
    } = req.query;

    let candles;
    let dataSource = 'Mock Data';

    if (mock === 'false' && !testData) {
      // Use real API data
      candles = await getCandles(symbol);
      dataSource = 'Live API';
    } else if (testData) {
      // Use test data
      const testDataModule = await import(`../../test-data/${testData}.json`);
      candles = testDataModule.default;
      dataSource = `Test Data: ${testData}`;
    } else {
      // Use mock data
      candles = generateMockHeadAndShouldersData(150, 25, 80);
      dataSource = 'Mock Data';
    }

    const analysis = analyzeHeadAndShouldersPattern(
      candles,
      parseInt(minPatternPeriods as string),
      parseInt(maxPatternPeriods as string)
    );

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'Head and Shoulders Pattern',
      timestamp: new Date().toISOString(),
      data: analysis,
      parameters: {
        minPatternPeriods: parseInt(minPatternPeriods as string),
        maxPatternPeriods: parseInt(maxPatternPeriods as string)
      },
      metadata: {
        dataPoints: candles.length,
        dataSource
      }
    });

  } catch (error) {
    console.error('Head and Shoulders analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze Head and Shoulders pattern',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/head-and-shoulders/:symbol/quick
 * Quick Head and Shoulders pattern analysis
 */
router.get('/:symbol/quick', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      mock = 'true',
      testData,
      minPatternPeriods = '20',
      maxPatternPeriods = '100'
    } = req.query;

    let candles;

    if (mock === 'false' && !testData) {
      candles = await getCandles(symbol);
    } else if (testData) {
      const testDataModule = await import(`../../test-data/${testData}.json`);
      candles = testDataModule.default;
    } else {
      candles = generateMockHeadAndShouldersData(150, 25, 80);
    }

    const analysis = analyzeHeadAndShouldersPattern(
      candles,
      parseInt(minPatternPeriods as string),
      parseInt(maxPatternPeriods as string)
    );

    // Quick response format
    res.json({
      symbol: symbol.toUpperCase(),
      isPattern: analysis.pattern.isPattern,
      confidence: analysis.pattern.confidence,
      signal: analysis.signal,
      stage: analysis.stage,
      strength: analysis.strength,
      breakoutLevel: analysis.pattern.breakoutLevel,
      targetPrice: analysis.pattern.targetPrice,
      stopLoss: analysis.pattern.stopLoss,
      riskReward: analysis.riskReward,
      timestamp: Math.floor(Date.now() / 1000)
    });

  } catch (error) {
    console.error('Head and Shoulders quick analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze Head and Shoulders pattern',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/head-and-shoulders/:symbol/mock
 * Generate mock Head and Shoulders data for testing
 */
router.get('/:symbol/mock', (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      basePrice = '150',
      patternHeight = '25',
      totalPeriods = '80'
    } = req.query;

    const mockData = generateMockHeadAndShouldersData(
      parseFloat(basePrice as string),
      parseFloat(patternHeight as string),
      parseInt(totalPeriods as string)
    );

    const analysis = analyzeHeadAndShouldersPattern(mockData);

    res.json({
      symbol: symbol.toUpperCase(),
      indicator: 'Head and Shoulders Pattern (Mock Data)',
      timestamp: new Date().toISOString(),
      data: {
        analysis,
        mockCandles: mockData
      },
      parameters: {
        basePrice: parseFloat(basePrice as string),
        patternHeight: parseFloat(patternHeight as string),
        totalPeriods: parseInt(totalPeriods as string)
      },
      metadata: {
        dataPoints: mockData.length,
        dataSource: 'Generated Mock Data'
      }
    });

  } catch (error) {
    console.error('Head and Shoulders mock data error:', error);
    res.status(500).json({
      error: 'Failed to generate Head and Shoulders mock data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
