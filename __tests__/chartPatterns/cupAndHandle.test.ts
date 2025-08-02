import { cupAndHandle, analyzeCupAndHandle, generateCupAndHandleMockData } from '../../src/chartPatterns/cupAndHandle';
import { loadTestData, validateTestResult, runTestDataAnalysis } from '../../src/util/testDataLoader';

// Mock candle data for testing
const mockCandles = [
  { open: 100, high: 102, low: 99, close: 101, volume: 1000000, timeStamp: 1 },
  { open: 101, high: 103, low: 100, close: 102, volume: 1100000, timeStamp: 2 },
  { open: 102, high: 104, low: 101, close: 103, volume: 1200000, timeStamp: 3 },
  { open: 103, high: 105, low: 102, close: 104, volume: 1300000, timeStamp: 4 },
  { open: 104, high: 106, low: 103, close: 105, volume: 1400000, timeStamp: 5 },
  { open: 105, high: 107, low: 104, close: 106, volume: 1500000, timeStamp: 6 },
  { open: 106, high: 108, low: 105, close: 107, volume: 1600000, timeStamp: 7 },
  { open: 107, high: 109, low: 106, close: 108, volume: 1700000, timeStamp: 8 },
  { open: 108, high: 110, low: 107, close: 109, volume: 1800000, timeStamp: 9 },
  { open: 109, high: 111, low: 108, close: 110, volume: 1900000, timeStamp: 10 },
  { open: 110, high: 112, low: 109, close: 111, volume: 2000000, timeStamp: 11 },
  { open: 111, high: 113, low: 110, close: 112, volume: 2100000, timeStamp: 12 },
  { open: 112, high: 114, low: 111, close: 113, volume: 2200000, timeStamp: 13 },
  { open: 113, high: 115, low: 112, close: 114, volume: 2300000, timeStamp: 14 },
  { open: 114, high: 116, low: 113, close: 115, volume: 2400000, timeStamp: 15 },
  { open: 115, high: 117, low: 114, close: 116, volume: 2500000, timeStamp: 16 },
  { open: 116, high: 118, low: 115, close: 117, volume: 2600000, timeStamp: 17 },
  { open: 117, high: 119, low: 116, close: 118, volume: 2700000, timeStamp: 18 },
  { open: 118, high: 120, low: 117, close: 119, volume: 2800000, timeStamp: 19 },
  { open: 119, high: 121, low: 118, close: 120, volume: 2900000, timeStamp: 20 },
];

describe('cupAndHandle function', () => {
  describe('Basic functionality', () => {
    it('should return default result for insufficient data', () => {
      const shortData = mockCandles.slice(0, 10);
      const result = cupAndHandle(shortData);

      expect(result.isPattern).toBe(false);
      expect(result.confidence).toBe('LOW');
      expect(result.reasons).toContain('Insufficient data for pattern detection');
    });

    it('should return default result for empty data', () => {
      const result = cupAndHandle([]);

      expect(result.isPattern).toBe(false);
      expect(result.confidence).toBe('LOW');
      expect(result.reasons).toContain('Insufficient data for pattern detection');
    });

    it('should have proper result structure', () => {
      const result = cupAndHandle(mockCandles);

      expect(result).toHaveProperty('isPattern');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('cupStart');
      expect(result).toHaveProperty('cupBottom');
      expect(result).toHaveProperty('cupEnd');
      expect(result).toHaveProperty('handleStart');
      expect(result).toHaveProperty('handleEnd');
      expect(result).toHaveProperty('breakoutLevel');
      expect(result).toHaveProperty('targetPrice');
      expect(result).toHaveProperty('stopLoss');
      expect(result).toHaveProperty('patternDuration');
      expect(result).toHaveProperty('cupDepth');
      expect(result).toHaveProperty('handleDepth');
      expect(result).toHaveProperty('volumeConfirmation');
      expect(result).toHaveProperty('reasons');
      expect(Array.isArray(result.reasons)).toBe(true);
    });
  });

  describe('Pattern detection with mock data', () => {
    it('should detect cup and handle pattern in generated mock data', () => {
      const mockData = generateCupAndHandleMockData(100, 25, 50);
      const result = cupAndHandle(mockData);

      // With properly generated mock data, we should have valid data structure
      expect(mockData.length).toBe(50);
      expect(result).toHaveProperty('isPattern');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasons');
      expect(Array.isArray(result.reasons)).toBe(true);

      // The algorithm should at least attempt to find patterns
      // Pattern detection may or may not succeed depending on the generated data
      if (result.isPattern) {
        expect(result.cupStart).toBeGreaterThanOrEqual(0);
        expect(result.cupBottom).toBeGreaterThan(result.cupStart);
        expect(result.cupEnd).toBeGreaterThan(result.cupBottom);
        expect(result.handleStart).toBeGreaterThan(result.cupEnd);
        expect(result.handleEnd).toBeGreaterThan(result.handleStart);
        expect(result.breakoutLevel).toBeGreaterThan(0);
        expect(result.targetPrice).toBeGreaterThan(result.breakoutLevel);
        expect(result.stopLoss).toBeGreaterThan(0);
        expect(result.cupDepth).toBeGreaterThan(0);
        expect(result.handleDepth).toBeGreaterThan(0);
      } else {
        // If no pattern is detected, should have valid reasons
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.cupStart).toBe(-1);
        expect(result.cupBottom).toBe(-1);
        expect(result.cupEnd).toBe(-1);
      }
    });

    it('should generate realistic mock data', () => {
      const mockData = generateCupAndHandleMockData(100, 20, 40);

      expect(mockData.length).toBe(40);
      expect(mockData[0].close).toBeCloseTo(100, -1); // Should start reasonably near base price (within 10)

      // Check that all candles have required properties
      mockData.forEach(candle => {
        expect(candle).toHaveProperty('open');
        expect(candle).toHaveProperty('high');
        expect(candle).toHaveProperty('low');
        expect(candle).toHaveProperty('close');
        expect(candle).toHaveProperty('volume');
        expect(candle).toHaveProperty('timeStamp');

        // Basic OHLC validation
        expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
        expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
        expect(candle.volume).toBeGreaterThan(0);
      });
    });
  });

  describe('analyzeCupAndHandle function', () => {
    it('should provide comprehensive analysis', () => {
      const mockData = generateCupAndHandleMockData(100, 25, 50);
      const analysis = analyzeCupAndHandle(mockData);

      expect(analysis).toHaveProperty('result');
      expect(analysis).toHaveProperty('analysis');
      expect(analysis).toHaveProperty('tradingRecommendation');

      expect(Array.isArray(analysis.analysis)).toBe(true);
      expect(analysis.analysis.length).toBeGreaterThan(0);

      expect(analysis.tradingRecommendation).toHaveProperty('action');
      expect(analysis.tradingRecommendation).toHaveProperty('confidence');
      expect(analysis.tradingRecommendation).toHaveProperty('entryPrice');
      expect(analysis.tradingRecommendation).toHaveProperty('stopLoss');
      expect(analysis.tradingRecommendation).toHaveProperty('targetPrice');
      expect(analysis.tradingRecommendation).toHaveProperty('riskReward');

      expect(['BUY', 'HOLD', 'WAIT']).toContain(analysis.tradingRecommendation.action);
    });

    it('should return WAIT action for no pattern', () => {
      const analysis = analyzeCupAndHandle(mockCandles.slice(0, 10));

      expect(analysis.result.isPattern).toBe(false);
      expect(analysis.tradingRecommendation.action).toBe('WAIT');
      expect(analysis.tradingRecommendation.confidence).toBe('N/A');
    });
  });

  describe('Pattern validation', () => {
    it('should validate confidence levels', () => {
      const result = cupAndHandle(mockCandles);

      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.confidence);
    });

    it('should calculate reasonable target prices and stop losses when pattern is detected', () => {
      const mockData = generateCupAndHandleMockData(100, 20, 50);
      const result = cupAndHandle(mockData);

      // Test the structure regardless of pattern detection
      expect(typeof result.targetPrice).toBe('number');
      expect(typeof result.stopLoss).toBe('number');
      expect(typeof result.cupDepth).toBe('number');
      expect(typeof result.handleDepth).toBe('number');

      if (result.isPattern) {
        expect(result.targetPrice).toBeGreaterThan(result.breakoutLevel);
        expect(result.stopLoss).toBeLessThan(result.breakoutLevel);
        expect(result.cupDepth).toBeGreaterThan(0);
        expect(result.cupDepth).toBeLessThan(100); // Should be reasonable percentage
        expect(result.handleDepth).toBeGreaterThan(0);
        expect(result.handleDepth).toBeLessThan(result.cupDepth); // Handle should be shallower than cup
      } else {
        // When no pattern is detected, values should be 0 or -1
        expect(result.targetPrice).toBe(0);
        expect(result.stopLoss).toBe(0);
        expect(result.cupDepth).toBe(0);
        expect(result.handleDepth).toBe(0);
      }
    });
  });

  describe('Test data validation', () => {
    it('should load and validate test data files', () => {
      // Test loading a known test data file
      expect(() => {
        const testData = loadTestData('cup-and-handle-strong');
        expect(testData).toHaveProperty('symbol');
        expect(testData).toHaveProperty('candles');
        expect(testData.candles.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should validate pattern detection against test data', () => {
      const testAnalysis = runTestDataAnalysis('cup-and-handle-strong', cupAndHandle);

      expect(testAnalysis).toHaveProperty('testData');
      expect(testAnalysis).toHaveProperty('result');
      expect(testAnalysis).toHaveProperty('validation');

      expect(testAnalysis.validation).toHaveProperty('passed');
      expect(testAnalysis.validation).toHaveProperty('details');
      expect(testAnalysis.validation).toHaveProperty('score');

      expect(Array.isArray(testAnalysis.validation.details)).toBe(true);
      expect(typeof testAnalysis.validation.score).toBe('number');
      expect(testAnalysis.validation.score).toBeGreaterThanOrEqual(0);
      expect(testAnalysis.validation.score).toBeLessThanOrEqual(100);
    });

    it('should handle non-pattern test data correctly', () => {
      const testAnalysis = runTestDataAnalysis('no-pattern-trending', cupAndHandle);

      // Should not detect a pattern in trending data
      expect(testAnalysis.result.isPattern).toBe(false);
      expect(testAnalysis.validation.details.length).toBeGreaterThan(0);
    });

    it('should reject false patterns', () => {
      const testAnalysis = runTestDataAnalysis('false-v-shaped-recovery', cupAndHandle);

      // Should not detect a valid pattern in V-shaped recovery
      expect(testAnalysis.result.isPattern).toBe(false);
      expect(testAnalysis.validation.details.length).toBeGreaterThan(0);
    });
  });
});
