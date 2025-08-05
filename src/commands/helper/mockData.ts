/**
 * Mock Data Generation Helper
 * Generates realistic market data for testing and demonstration purposes
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

/**
 * Generate mock candle data for testing
 * @param symbol Stock symbol (for seeding randomness)
 * @param count Number of candles to generate
 * @returns Array of mock candles with realistic price movements
 */
export function generateMockCandles(symbol: string, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 100 + Math.random() * 100; // Start between $100-200
  
  // Use symbol to seed some consistency
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  Math.random = (() => {
    let seed = symbolSeed;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })();
  
  for (let i = 0; i < count; i++) {
    // Create realistic price movement with volatility cycles
    const volatility = 0.02 + Math.sin(i / 20) * 0.01; // Varying volatility
    const trend = Math.sin(i / 50) * 0.001; // Long-term trend
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    // Calculate price change
    const priceChange = trend + randomWalk;
    price = Math.max(price * (1 + priceChange), 1); // Ensure price stays positive
    
    // Generate OHLC data
    const open = price;
    const dailyVolatility = volatility * 0.5;
    const high = open * (1 + Math.random() * dailyVolatility);
    const low = open * (1 - Math.random() * dailyVolatility);
    const close = low + Math.random() * (high - low);
    
    // Generate volume (higher volume on bigger moves)
    const priceMovement = Math.abs(close - open) / open;
    const baseVolume = 1000000 + Math.random() * 2000000;
    const volume = Math.floor(baseVolume * (1 + priceMovement * 5));
    
    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      timeStamp: Date.now() - (count - i) * 24 * 60 * 60 * 1000 // Daily candles going back
    });
    
    price = close; // Next candle starts where this one ended
  }
  
  return candles;
}

/**
 * Generate mock quote data
 * @param symbol Stock symbol
 * @param candles Optional candles array to base quote on
 * @returns Mock quote object
 */
export function generateMockQuote(symbol: string, candles?: Candle[]) {
  const currentPrice = candles ? candles[candles.length - 1].close : 100 + Math.random() * 100;
  const previousPrice = candles && candles.length > 1 ? candles[candles.length - 2].close : currentPrice * 0.99;
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  
  return {
    symbol: symbol.toUpperCase(),
    current: parseFloat(currentPrice.toFixed(2)),
    previous: parseFloat(previousPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    high: parseFloat((currentPrice * 1.02).toFixed(2)),
    low: parseFloat((currentPrice * 0.98).toFixed(2)),
    volume: Math.floor(1000000 + Math.random() * 2000000),
    timestamp: Date.now()
  };
}

/**
 * Generate realistic mock data with specific patterns
 * @param symbol Stock symbol
 * @param count Number of candles
 * @param pattern Pattern type ('trending_up', 'trending_down', 'sideways', 'volatile')
 * @returns Array of mock candles with specified pattern
 */
export function generateMockCandlesWithPattern(
  symbol: string, 
  count: number, 
  pattern: 'trending_up' | 'trending_down' | 'sideways' | 'volatile' = 'sideways'
): Candle[] {
  const candles: Candle[] = [];
  let price = 100 + Math.random() * 100;
  
  for (let i = 0; i < count; i++) {
    let trend = 0;
    let volatility = 0.02;
    
    switch (pattern) {
      case 'trending_up':
        trend = 0.001 + Math.random() * 0.002; // 0.1-0.3% daily uptrend
        volatility = 0.015 + Math.random() * 0.01; // Lower volatility in uptrend
        break;
      case 'trending_down':
        trend = -0.001 - Math.random() * 0.002; // 0.1-0.3% daily downtrend
        volatility = 0.02 + Math.random() * 0.015; // Higher volatility in downtrend
        break;
      case 'sideways':
        trend = (Math.random() - 0.5) * 0.001; // Random small movements
        volatility = 0.01 + Math.random() * 0.01; // Low volatility
        break;
      case 'volatile':
        trend = (Math.random() - 0.5) * 0.003; // Larger random movements
        volatility = 0.03 + Math.random() * 0.02; // High volatility
        break;
    }
    
    const randomWalk = (Math.random() - 0.5) * volatility;
    const priceChange = trend + randomWalk;
    price = Math.max(price * (1 + priceChange), 1);
    
    // Generate OHLC
    const open = price;
    const dailyVolatility = volatility * 0.5;
    const high = open * (1 + Math.random() * dailyVolatility);
    const low = open * (1 - Math.random() * dailyVolatility);
    const close = low + Math.random() * (high - low);
    
    const priceMovement = Math.abs(close - open) / open;
    const baseVolume = 1000000 + Math.random() * 2000000;
    const volume = Math.floor(baseVolume * (1 + priceMovement * 5));
    
    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      timeStamp: Date.now() - (count - i) * 24 * 60 * 60 * 1000
    });
    
    price = close;
  }
  
  return candles;
}

/**
 * Generate mock data with cup and handle pattern
 * @param symbol Stock symbol
 * @param count Number of candles
 * @returns Array of mock candles with cup and handle pattern
 */
export function generateCupAndHandlePattern(symbol: string, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let price = 100 + Math.random() * 50;
  const startPrice = price;
  
  for (let i = 0; i < count; i++) {
    let trend = 0;
    const progress = i / count;
    
    if (progress < 0.1) {
      // Initial uptrend
      trend = 0.002;
    } else if (progress < 0.4) {
      // Cup formation - downtrend
      trend = -0.003 * Math.sin((progress - 0.1) * Math.PI / 0.3);
    } else if (progress < 0.7) {
      // Cup bottom and recovery
      trend = 0.003 * Math.sin((progress - 0.4) * Math.PI / 0.3);
    } else if (progress < 0.85) {
      // Handle formation - slight pullback
      trend = -0.001;
    } else {
      // Breakout
      trend = 0.004;
    }
    
    const volatility = 0.015 + Math.random() * 0.01;
    const randomWalk = (Math.random() - 0.5) * volatility;
    const priceChange = trend + randomWalk;
    price = Math.max(price * (1 + priceChange), 1);
    
    // Generate OHLC
    const open = price;
    const dailyVolatility = volatility * 0.5;
    const high = open * (1 + Math.random() * dailyVolatility);
    const low = open * (1 - Math.random() * dailyVolatility);
    const close = low + Math.random() * (high - low);
    
    const volume = Math.floor(1000000 + Math.random() * 2000000);
    
    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      timeStamp: Date.now() - (count - i) * 24 * 60 * 60 * 1000
    });
    
    price = close;
  }
  
  return candles;
}
