import { calculateRSI, getRSI, analyzeRSI, getMultiTimeframeRSI, Candle } from '../../src/indicators/rsi';

describe('RSI (Relative Strength Index)', () => {
  // Create test data with known RSI characteristics
  const createTestCandles = (): Candle[] => {
    const candles: Candle[] = [];
    const prices = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03,
      46.83, 46.69, 46.45, 46.59, 46.3, 46.28, 46.28, 46.00, 46.03, 46.41,
      46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 47.44, 47.31, 47.20, 47.09
    ];
    
    prices.forEach((price, index) => {
      candles.push({
        open: price - 0.1,
        high: price + 0.2,
        low: price - 0.2,
        close: price,
        volume: 1000000,
        timeStamp: Date.now() / 1000 - (prices.length - index) * 24 * 60 * 60
      });
    });
    
    return candles;
  };

  describe('calculateRSI', () => {
    it('should calculate RSI values correctly', () => {
      const candles = createTestCandles();
      const rsi = calculateRSI(candles, 14);
      
      expect(rsi).toBeDefined();
      expect(rsi.length).toBeGreaterThan(0);
      expect(rsi.length).toBe(candles.length - 14); // Should have length - period values
      
      // RSI should be between 0 and 100
      rsi.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should return empty array for insufficient data', () => {
      const candles = createTestCandles().slice(0, 10); // Only 10 candles
      const rsi = calculateRSI(candles, 14);
      
      expect(rsi).toEqual([]);
    });

    it('should handle different periods', () => {
      const candles = createTestCandles();
      const rsi9 = calculateRSI(candles, 9);
      const rsi21 = calculateRSI(candles, 21);
      
      expect(rsi9.length).toBe(candles.length - 9);
      expect(rsi21.length).toBe(candles.length - 21);
    });
  });

  describe('getRSI', () => {
    it('should return RSI result with current and previous values', () => {
      const candles = createTestCandles();
      const result = getRSI(candles, 14);
      
      expect(result).toHaveProperty('values');
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('previous');
      expect(result).toHaveProperty('period');
      
      expect(result.period).toBe(14);
      expect(typeof result.current).toBe('number');
      expect(typeof result.previous).toBe('number');
      expect(result.values.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeRSI', () => {
    it('should provide complete RSI analysis', () => {
      const candles = createTestCandles();
      const analysis = analyzeRSI(candles, 14);
      
      expect(analysis).toHaveProperty('rsi');
      expect(analysis).toHaveProperty('signal');
      expect(analysis).toHaveProperty('strength');
      expect(analysis).toHaveProperty('trend');
      expect(analysis).toHaveProperty('momentum');
      expect(analysis).toHaveProperty('divergence');
      expect(analysis).toHaveProperty('interpretation');
      expect(analysis).toHaveProperty('tradingLevels');
      
      // Check signal is valid
      expect(['BUY', 'SELL', 'HOLD']).toContain(analysis.signal);
      
      // Check strength is valid
      expect(['EXTREMELY_OVERSOLD', 'OVERSOLD', 'UNDERSOLD', 'NEUTRAL', 'OVERBOUGHT', 'EXTREMELY_OVERBOUGHT']).toContain(analysis.strength);
      
      // Check trend is valid
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(analysis.trend);
      
      // Check interpretation is provided
      expect(Array.isArray(analysis.interpretation)).toBe(true);
      expect(analysis.interpretation.length).toBeGreaterThan(0);
    });

    it('should use custom trading levels', () => {
      const candles = createTestCandles();
      const customLevels = {
        oversold: 25,
        overbought: 75,
        extremeOversold: 15,
        extremeOverbought: 85
      };
      
      const analysis = analyzeRSI(candles, 14, customLevels);
      
      expect(analysis.tradingLevels.oversoldThreshold).toBe(25);
      expect(analysis.tradingLevels.overboughtThreshold).toBe(75);
      expect(analysis.tradingLevels.extremeOversold).toBe(15);
      expect(analysis.tradingLevels.extremeOverbought).toBe(85);
    });
  });

  describe('getMultiTimeframeRSI', () => {
    it('should analyze multiple RSI periods', () => {
      const candles = createTestCandles();
      const periods = [9, 14, 21];
      const result = getMultiTimeframeRSI(candles, periods);
      
      expect(result).toHaveProperty('analyses');
      expect(result).toHaveProperty('consensus');
      expect(result).toHaveProperty('confidence');
      
      expect(result.analyses.length).toBe(periods.length);
      expect(['BUY', 'SELL', 'HOLD']).toContain(result.consensus);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.confidence);
      
      // Each analysis should have the correct period
      result.analyses.forEach((analysis, index) => {
        expect(analysis.rsi.period).toBe(periods[index]);
      });
    });
  });

  describe('RSI Edge Cases', () => {
    it('should handle all gains (no losses)', () => {
      const candles: Candle[] = [];
      let price = 100;
      
      // Create 20 candles with only gains
      for (let i = 0; i < 20; i++) {
        price += 1; // Always increasing
        candles.push({
          open: price - 0.5,
          high: price + 0.5,
          low: price - 0.5,
          close: price,
          volume: 1000000,
          timeStamp: Date.now() / 1000 - (20 - i) * 24 * 60 * 60
        });
      }
      
      const rsi = calculateRSI(candles, 14);
      expect(rsi.length).toBeGreaterThan(0);
      
      // With only gains, RSI should approach 100
      const lastRSI = rsi[rsi.length - 1];
      expect(lastRSI).toBeGreaterThan(90);
    });

    it('should handle all losses (no gains)', () => {
      const candles: Candle[] = [];
      let price = 100;
      
      // Create 20 candles with only losses
      for (let i = 0; i < 20; i++) {
        price -= 1; // Always decreasing
        candles.push({
          open: price + 0.5,
          high: price + 0.5,
          low: price - 0.5,
          close: price,
          volume: 1000000,
          timeStamp: Date.now() / 1000 - (20 - i) * 24 * 60 * 60
        });
      }
      
      const rsi = calculateRSI(candles, 14);
      expect(rsi.length).toBeGreaterThan(0);
      
      // With only losses, RSI should approach 0
      const lastRSI = rsi[rsi.length - 1];
      expect(lastRSI).toBeLessThan(10);
    });

    it('should handle flat prices (no change)', () => {
      const candles: Candle[] = [];
      const price = 100;
      
      // Create 20 candles with no price change
      for (let i = 0; i < 20; i++) {
        candles.push({
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 1000000,
          timeStamp: Date.now() / 1000 - (20 - i) * 24 * 60 * 60
        });
      }
      
      const rsi = calculateRSI(candles, 14);
      expect(rsi.length).toBeGreaterThan(0);
      
      // With no change, RSI should be around 50 (or handle division by zero)
      const lastRSI = rsi[rsi.length - 1];
      expect(lastRSI).toBeGreaterThanOrEqual(0);
      expect(lastRSI).toBeLessThanOrEqual(100);
    });
  });
});
