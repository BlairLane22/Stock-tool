import { personalTradingStrategy } from '../../src/commands/personalTradingStrategy';

// Mock the dependencies
jest.mock('../../src/commands/helper/getCandles');
jest.mock('../../src/util/rest');

import { getCandles } from '../../src/commands/helper/getCandles';
import { getQuote } from '../../src/util/rest';

const mockGetCandles = getCandles as jest.MockedFunction<typeof getCandles>;
const mockGetQuote = getQuote as jest.MockedFunction<typeof getQuote>;

describe('personalTradingStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock quote data
    mockGetQuote.mockResolvedValue({
      open: 200,
      high: 210,
      low: 195,
      current: 205,
      previousClose: 202
    });

    // Mock candles data - insufficient data to trigger mock generation
    mockGetCandles.mockResolvedValue([]);
  });

  it('should analyze a stock and return strategy analysis', async () => {
    const result = await personalTradingStrategy('AAPL', 10000, 2);
    
    expect(result).toHaveProperty('fundamentalScore');
    expect(result).toHaveProperty('technicalScore');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('tradingSignal');
    expect(result).toHaveProperty('checklist');
    
    expect(result.tradingSignal).toHaveProperty('signal');
    expect(result.tradingSignal).toHaveProperty('confidence');
    expect(result.tradingSignal).toHaveProperty('reasons');
    expect(result.tradingSignal).toHaveProperty('riskReward');
    expect(result.tradingSignal).toHaveProperty('stopLoss');
    expect(result.tradingSignal).toHaveProperty('targetPrice');
    expect(result.tradingSignal).toHaveProperty('positionSize');
    
    expect(['BUY', 'SELL', 'HOLD']).toContain(result.tradingSignal.signal);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.tradingSignal.confidence);
    expect(Array.isArray(result.tradingSignal.reasons)).toBe(true);
    expect(typeof result.tradingSignal.riskReward).toBe('number');
  });

  it('should handle different account balances and risk levels', async () => {
    const result = await personalTradingStrategy('AAPL', 50000, 1.5);
    
    expect(result).toHaveProperty('tradingSignal');
    expect(typeof result.tradingSignal.positionSize).toBe('number');
    expect(result.tradingSignal.positionSize).toBeGreaterThanOrEqual(0);
  });

  it('should handle API errors gracefully', async () => {
    mockGetCandles.mockRejectedValue(new Error('API Error'));
    
    const result = await personalTradingStrategy('AAPL', 10000, 2);
    
    // Should still return a valid analysis using mock data
    expect(result).toHaveProperty('tradingSignal');
    expect(result.tradingSignal).toHaveProperty('signal');
  });
});
