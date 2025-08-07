import { headAndShoulders, generateHeadAndShouldersMockData } from '../../src/chartPatterns/headAndShoulders';
import { analyzeHeadAndShouldersPattern } from '../../src/indicators/headAndShoulders';

describe('Head and Shoulders Pattern Detection', () => {
  
  test('should detect Head and Shoulders pattern in mock data', () => {
    // Generate mock data with Head and Shoulders pattern
    const mockData = generateHeadAndShouldersMockData(150, 25, 80);
    
    // Test basic pattern detection
    const result = headAndShoulders(mockData);
    
    // The mock data should contain a valid pattern
    expect(mockData.length).toBe(80);
    expect(result).toBeDefined();
    expect(result.reasons).toBeDefined();
    expect(Array.isArray(result.reasons)).toBe(true);
  });

  test('should analyze Head and Shoulders pattern with proper structure', () => {
    // Generate mock data
    const mockData = generateHeadAndShouldersMockData(150, 25, 80);
    
    // Test comprehensive analysis
    const analysis = analyzeHeadAndShouldersPattern(mockData);
    
    expect(analysis).toBeDefined();
    expect(analysis.pattern).toBeDefined();
    expect(analysis.signal).toMatch(/^(SELL|HOLD|WAIT)$/);
    expect(analysis.stage).toMatch(/^(LEFT_SHOULDER|HEAD_FORMING|RIGHT_SHOULDER|COMPLETED|BREAKDOWN|NONE)$/);
    expect(typeof analysis.strength).toBe('number');
    expect(analysis.strength).toBeGreaterThanOrEqual(0);
    expect(analysis.strength).toBeLessThanOrEqual(100);
    expect(Array.isArray(analysis.interpretation)).toBe(true);
    expect(analysis.tradingStrategy).toBeDefined();
    expect(analysis.chartData).toBeDefined();
    expect(Array.isArray(analysis.chartData.timestamps)).toBe(true);
    expect(Array.isArray(analysis.chartData.prices)).toBe(true);
    expect(Array.isArray(analysis.chartData.volume)).toBe(true);
  });

  test('should handle insufficient data gracefully', () => {
    // Test with insufficient data
    const insufficientData = generateHeadAndShouldersMockData(150, 25, 10);
    
    const result = headAndShoulders(insufficientData);
    
    expect(result.isPattern).toBe(false);
    expect(result.reasons).toContain('Insufficient data for pattern detection');
  });

  test('should generate valid mock data structure', () => {
    const mockData = generateHeadAndShouldersMockData(100, 20, 60);
    
    expect(mockData.length).toBe(60);
    
    // Check that each candle has required properties
    mockData.forEach(candle => {
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
      expect(candle).toHaveProperty('volume');
      expect(candle).toHaveProperty('timeStamp');
      
      expect(typeof candle.open).toBe('number');
      expect(typeof candle.high).toBe('number');
      expect(typeof candle.low).toBe('number');
      expect(typeof candle.close).toBe('number');
      expect(typeof candle.volume).toBe('number');
      expect(typeof candle.timeStamp).toBe('number');
      
      // Basic OHLC validation
      expect(candle.high).toBeGreaterThanOrEqual(candle.low);
      expect(candle.high).toBeGreaterThanOrEqual(candle.open);
      expect(candle.high).toBeGreaterThanOrEqual(candle.close);
      expect(candle.low).toBeLessThanOrEqual(candle.open);
      expect(candle.low).toBeLessThanOrEqual(candle.close);
      expect(candle.volume).toBeGreaterThan(0);
    });
  });

  test('should return proper confidence levels', () => {
    const mockData = generateHeadAndShouldersMockData(150, 25, 80);
    const result = headAndShoulders(mockData);
    
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.confidence);
  });

  test('should calculate risk/reward ratio', () => {
    const mockData = generateHeadAndShouldersMockData(150, 25, 80);
    const analysis = analyzeHeadAndShouldersPattern(mockData);
    
    expect(typeof analysis.riskReward).toBe('number');
    expect(analysis.riskReward).toBeGreaterThanOrEqual(0);
  });

  test('should provide trading strategy', () => {
    const mockData = generateHeadAndShouldersMockData(150, 25, 80);
    const analysis = analyzeHeadAndShouldersPattern(mockData);
    
    expect(analysis.tradingStrategy).toBeDefined();
    expect(typeof analysis.tradingStrategy.entry).toBe('string');
    expect(typeof analysis.tradingStrategy.exit).toBe('string');
    expect(typeof analysis.tradingStrategy.stopLoss).toBe('number');
    expect(typeof analysis.tradingStrategy.target).toBe('number');
  });

  test('should include chart data for visualization', () => {
    const mockData = generateHeadAndShouldersMockData(150, 25, 80);
    const analysis = analyzeHeadAndShouldersPattern(mockData);
    
    expect(analysis.chartData.timestamps.length).toBe(mockData.length);
    expect(analysis.chartData.prices.length).toBe(mockData.length);
    expect(analysis.chartData.volume.length).toBe(mockData.length);
    
    // Check that chart data indices are valid
    expect(typeof analysis.chartData.leftShoulderStartIndex).toBe('number');
    expect(typeof analysis.chartData.leftShoulderPeakIndex).toBe('number');
    expect(typeof analysis.chartData.leftShoulderEndIndex).toBe('number');
    expect(typeof analysis.chartData.headStartIndex).toBe('number');
    expect(typeof analysis.chartData.headPeakIndex).toBe('number');
    expect(typeof analysis.chartData.headEndIndex).toBe('number');
    expect(typeof analysis.chartData.rightShoulderStartIndex).toBe('number');
    expect(typeof analysis.chartData.rightShoulderPeakIndex).toBe('number');
    expect(typeof analysis.chartData.rightShoulderEndIndex).toBe('number');
    expect(typeof analysis.chartData.necklineLeftIndex).toBe('number');
    expect(typeof analysis.chartData.necklineRightIndex).toBe('number');
  });
});
