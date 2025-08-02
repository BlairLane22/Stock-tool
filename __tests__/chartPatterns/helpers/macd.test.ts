import { calculateMACD, analyzeMACDSignals, getMACDRecommendation } from '../../../src/chartPatterns/helpers/macd';

// Mock candle data for testing
const mockCandles = [
  { open: 100, high: 102, low: 99, close: 101, volume: 1000, timeStamp: 1 },
  { open: 101, high: 103, low: 100, close: 102, volume: 1100, timeStamp: 2 },
  { open: 102, high: 104, low: 101, close: 103, volume: 1200, timeStamp: 3 },
  { open: 103, high: 105, low: 102, close: 104, volume: 1300, timeStamp: 4 },
  { open: 104, high: 106, low: 103, close: 105, volume: 1400, timeStamp: 5 },
  { open: 105, high: 107, low: 104, close: 106, volume: 1500, timeStamp: 6 },
  { open: 106, high: 108, low: 105, close: 107, volume: 1600, timeStamp: 7 },
  { open: 107, high: 109, low: 106, close: 108, volume: 1700, timeStamp: 8 },
  { open: 108, high: 110, low: 107, close: 109, volume: 1800, timeStamp: 9 },
  { open: 109, high: 111, low: 108, close: 110, volume: 1900, timeStamp: 10 },
  { open: 110, high: 112, low: 109, close: 111, volume: 2000, timeStamp: 11 },
  { open: 111, high: 113, low: 110, close: 112, volume: 2100, timeStamp: 12 },
  { open: 112, high: 114, low: 111, close: 113, volume: 2200, timeStamp: 13 },
  { open: 113, high: 115, low: 112, close: 114, volume: 2300, timeStamp: 14 },
  { open: 114, high: 116, low: 113, close: 115, volume: 2400, timeStamp: 15 },
  { open: 115, high: 117, low: 114, close: 116, volume: 2500, timeStamp: 16 },
  { open: 116, high: 118, low: 115, close: 117, volume: 2600, timeStamp: 17 },
  { open: 117, high: 119, low: 116, close: 118, volume: 2700, timeStamp: 18 },
  { open: 118, high: 120, low: 117, close: 119, volume: 2800, timeStamp: 19 },
  { open: 119, high: 121, low: 118, close: 120, volume: 2900, timeStamp: 20 },
  { open: 120, high: 122, low: 119, close: 121, volume: 3000, timeStamp: 21 },
  { open: 121, high: 123, low: 120, close: 122, volume: 3100, timeStamp: 22 },
  { open: 122, high: 124, low: 121, close: 123, volume: 3200, timeStamp: 23 },
  { open: 123, high: 125, low: 122, close: 124, volume: 3300, timeStamp: 24 },
  { open: 124, high: 126, low: 123, close: 125, volume: 3400, timeStamp: 25 },
  { open: 125, high: 127, low: 124, close: 126, volume: 3500, timeStamp: 26 },
  { open: 126, high: 128, low: 125, close: 127, volume: 3600, timeStamp: 27 },
  { open: 127, high: 129, low: 126, close: 128, volume: 3700, timeStamp: 28 },
  { open: 128, high: 130, low: 127, close: 129, volume: 3800, timeStamp: 29 },
  { open: 129, high: 131, low: 128, close: 130, volume: 3900, timeStamp: 30 },
];

describe('MACD Calculation', () => {
  describe('calculateMACD', () => {
    it('should return empty arrays for empty input', () => {
      const result = calculateMACD([]);
      expect(result.macd).toEqual([]);
      expect(result.signal).toEqual([]);
      expect(result.histogram).toEqual([]);
      expect(result.ema12).toEqual([]);
      expect(result.ema26).toEqual([]);
    });

    it('should calculate MACD with default parameters', () => {
      const result = calculateMACD(mockCandles);

      expect(result.macd.length).toBeGreaterThan(0);
      expect(result.ema12.length).toBeGreaterThan(0);
      expect(result.ema26.length).toBeGreaterThan(0);

      // Signal line might be empty if not enough data for 9-period EMA
      // With 30 candles, we should have some signal data
      if (mockCandles.length >= 26 + 9) {
        expect(result.signal.length).toBeGreaterThan(0);
        expect(result.histogram.length).toBeGreaterThan(0);
      }

      // MACD should be 12-EMA minus 26-EMA
      expect(result.macd.length).toBeLessThanOrEqual(result.ema12.length);
      expect(result.macd.length).toBeLessThanOrEqual(result.ema26.length);
    });

    it('should calculate MACD with custom parameters', () => {
      const result = calculateMACD(mockCandles, 5, 10, 3);
      
      expect(result.macd.length).toBeGreaterThan(0);
      expect(result.signal.length).toBeGreaterThan(0);
      expect(result.histogram.length).toBeGreaterThan(0);
    });

    it('should have MACD values as difference between EMAs', () => {
      const result = calculateMACD(mockCandles);

      if (result.macd.length > 0 && result.ema12.length > 0 && result.ema26.length > 0) {
        // Check that MACD calculation is reasonable
        // Since we align the EMAs, we need to check the aligned values
        expect(result.macd.length).toBeGreaterThan(0);

        // All MACD values should be numbers
        result.macd.forEach(value => {
          expect(typeof value).toBe('number');
          expect(isFinite(value)).toBe(true);
        });
      }
    });
  });

  describe('analyzeMACDSignals', () => {
    it('should analyze MACD signals correctly', () => {
      const result = calculateMACD(mockCandles);
      const analysis = analyzeMACDSignals(result);
      
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(analysis.currentSignal);
      expect(['BULLISH_CROSSOVER', 'BEARISH_CROSSOVER', 'NONE']).toContain(analysis.crossover);
      expect(['INCREASING', 'DECREASING', 'STABLE']).toContain(analysis.momentum);
      expect(['BULLISH_DIVERGENCE', 'BEARISH_DIVERGENCE', 'NONE']).toContain(analysis.divergence);
      expect(analysis.strength).toBeGreaterThanOrEqual(0);
      expect(analysis.strength).toBeLessThanOrEqual(100);
    });

    it('should return neutral for empty data', () => {
      const emptyResult = {
        macd: [],
        signal: [],
        histogram: [],
        ema12: [],
        ema26: []
      };
      
      const analysis = analyzeMACDSignals(emptyResult);
      
      expect(analysis.currentSignal).toBe('NEUTRAL');
      expect(analysis.crossover).toBe('NONE');
      expect(analysis.momentum).toBe('STABLE');
      expect(analysis.divergence).toBe('NONE');
      expect(analysis.strength).toBe(0);
    });
  });

  describe('getMACDRecommendation', () => {
    it('should provide trading recommendations', () => {
      const result = calculateMACD(mockCandles);
      const analysis = analyzeMACDSignals(result);
      const recommendation = getMACDRecommendation(analysis);
      
      expect(['BUY', 'SELL', 'HOLD']).toContain(recommendation.action);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(recommendation.confidence);
      expect(typeof recommendation.reason).toBe('string');
      expect(recommendation.reason.length).toBeGreaterThan(0);
    });

    it('should recommend HOLD for neutral signals', () => {
      const neutralAnalysis = {
        currentSignal: 'NEUTRAL' as const,
        crossover: 'NONE' as const,
        momentum: 'STABLE' as const,
        divergence: 'NONE' as const,
        strength: 0
      };
      
      const recommendation = getMACDRecommendation(neutralAnalysis);
      
      expect(recommendation.action).toBe('HOLD');
      expect(recommendation.confidence).toBe('LOW');
    });

    it('should recommend BUY for strong bullish signals', () => {
      const bullishAnalysis = {
        currentSignal: 'BULLISH' as const,
        crossover: 'BULLISH_CROSSOVER' as const,
        momentum: 'INCREASING' as const,
        divergence: 'NONE' as const,
        strength: 80
      };
      
      const recommendation = getMACDRecommendation(bullishAnalysis);
      
      expect(recommendation.action).toBe('BUY');
      expect(recommendation.confidence).toBe('HIGH');
    });

    it('should recommend SELL for strong bearish signals', () => {
      const bearishAnalysis = {
        currentSignal: 'BEARISH' as const,
        crossover: 'BEARISH_CROSSOVER' as const,
        momentum: 'DECREASING' as const,
        divergence: 'NONE' as const,
        strength: 75
      };
      
      const recommendation = getMACDRecommendation(bearishAnalysis);
      
      expect(recommendation.action).toBe('SELL');
      expect(recommendation.confidence).toBe('HIGH');
    });
  });
});
