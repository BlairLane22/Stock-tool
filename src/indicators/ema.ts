/**
 * Exponential Moving Average (EMA) Implementation
 * Based on Investopedia definition - gives more weight to recent prices
 * 
 * EMA = (Value Today × (Smoothing / (1 + Days))) + EMA Yesterday × (1 - (Smoothing / (1 + Days)))
 * 
 * Where:
 * - Smoothing factor is typically 2
 * - Multiplier = 2 / (period + 1)
 * 
 * The EMA responds more quickly to recent price changes than a Simple Moving Average (SMA),
 * making it more sensitive to current market trends.
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface EMAResult {
  values: number[];
  current: number;
  previous: number;
  period: number;
  multiplier: number;
}

export interface EMAAnalysis {
  ema: EMAResult;
  signal: 'BUY' | 'SELL' | 'HOLD';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum: 'INCREASING' | 'DECREASING' | 'STABLE';
  pricePosition: 'ABOVE_EMA' | 'BELOW_EMA' | 'AT_EMA';
  crossover: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NONE';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  interpretation: string[];
  tradingStrategy: {
    entry: string;
    exit: string;
    stopLoss?: number;
    target?: number;
  };
}

/**
 * Calculate Exponential Moving Average
 * @param candles Array of price candles
 * @param period EMA period (default: 12)
 * @param priceType Price type to use ('close', 'high', 'low', 'open', 'median')
 * @returns EMA values array
 */
export function calculateEMA(
  candles: Candle[], 
  period: number = 12, 
  priceType: 'close' | 'high' | 'low' | 'open' | 'median' = 'close'
): number[] {
  if (candles.length < period) {
    return [];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Get price values based on type
  const prices = candles.map(candle => {
    switch (priceType) {
      case 'high': return candle.high;
      case 'low': return candle.low;
      case 'open': return candle.open;
      case 'median': return (candle.high + candle.low) / 2;
      default: return candle.close;
    }
  });

  // Calculate initial SMA for the first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  const initialSMA = sum / period;
  ema.push(initialSMA);

  // Calculate EMA for remaining periods
  for (let i = period; i < prices.length; i++) {
    const currentPrice = prices[i];
    const previousEMA = ema[ema.length - 1];
    const currentEMA = (currentPrice * multiplier) + (previousEMA * (1 - multiplier));
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Get EMA result with detailed information
 * @param candles Array of price candles
 * @param period EMA period (default: 12)
 * @param priceType Price type to use
 * @returns Detailed EMA result
 */
export function getEMA(
  candles: Candle[], 
  period: number = 12, 
  priceType: 'close' | 'high' | 'low' | 'open' | 'median' = 'close'
): EMAResult {
  const values = calculateEMA(candles, period, priceType);
  
  if (values.length === 0) {
    return {
      values: [],
      current: 0,
      previous: 0,
      period,
      multiplier: 2 / (period + 1)
    };
  }

  return {
    values,
    current: values[values.length - 1],
    previous: values.length > 1 ? values[values.length - 2] : values[0],
    period,
    multiplier: 2 / (period + 1)
  };
}

/**
 * Analyze EMA for trading signals and market conditions
 * @param candles Array of price candles
 * @param period EMA period (default: 12)
 * @param priceType Price type to use
 * @returns Complete EMA analysis
 */
export function analyzeEMA(
  candles: Candle[], 
  period: number = 12,
  priceType: 'close' | 'high' | 'low' | 'open' | 'median' = 'close'
): EMAAnalysis {
  const ema = getEMA(candles, period, priceType);
  const interpretation: string[] = [];
  const currentPrice = candles[candles.length - 1].close;
  const previousPrice = candles.length > 1 ? candles[candles.length - 2].close : currentPrice;

  // Determine price position relative to EMA
  let pricePosition: EMAAnalysis['pricePosition'] = 'AT_EMA';
  const priceDifference = Math.abs(currentPrice - ema.current);
  const priceThreshold = currentPrice * 0.001; // 0.1% threshold

  if (currentPrice > ema.current + priceThreshold) {
    pricePosition = 'ABOVE_EMA';
    interpretation.push(`Price at $${currentPrice.toFixed(2)} is above EMA at $${ema.current.toFixed(2)} - bullish signal`);
  } else if (currentPrice < ema.current - priceThreshold) {
    pricePosition = 'BELOW_EMA';
    interpretation.push(`Price at $${currentPrice.toFixed(2)} is below EMA at $${ema.current.toFixed(2)} - bearish signal`);
  } else {
    interpretation.push(`Price at $${currentPrice.toFixed(2)} is near EMA at $${ema.current.toFixed(2)} - neutral`);
  }

  // Determine trend based on EMA direction
  let trend: EMAAnalysis['trend'] = 'NEUTRAL';
  const emaTrend = ema.current - ema.previous;
  const trendThreshold = ema.current * 0.001; // 0.1% threshold

  if (emaTrend > trendThreshold) {
    trend = 'BULLISH';
    interpretation.push(`EMA trending upward (+${((emaTrend / ema.previous) * 100).toFixed(2)}%) - bullish trend`);
  } else if (emaTrend < -trendThreshold) {
    trend = 'BEARISH';
    interpretation.push(`EMA trending downward (${((emaTrend / ema.previous) * 100).toFixed(2)}%) - bearish trend`);
  } else {
    interpretation.push('EMA trend is neutral - sideways movement');
  }

  // Determine momentum
  let momentum: EMAAnalysis['momentum'] = 'STABLE';
  const momentumChange = Math.abs(emaTrend);
  const momentumThreshold = ema.current * 0.005; // 0.5% threshold

  if (momentumChange > momentumThreshold) {
    if (emaTrend > 0) {
      momentum = 'INCREASING';
      interpretation.push('EMA momentum is increasing - strengthening uptrend');
    } else {
      momentum = 'DECREASING';
      interpretation.push('EMA momentum is decreasing - strengthening downtrend');
    }
  } else {
    interpretation.push('EMA momentum is stable');
  }

  // Check for crossovers
  let crossover: EMAAnalysis['crossover'] = 'NONE';
  if (candles.length >= 2) {
    const wasBelowEMA = previousPrice < ema.previous;
    const isAboveEMA = currentPrice > ema.current;
    const wasAboveEMA = previousPrice > ema.previous;
    const isBelowEMA = currentPrice < ema.current;

    if (wasBelowEMA && isAboveEMA) {
      crossover = 'BULLISH_CROSSOVER';
      interpretation.push('🟢 Bullish crossover: Price crossed above EMA - potential buy signal');
    } else if (wasAboveEMA && isBelowEMA) {
      crossover = 'BEARISH_CROSSOVER';
      interpretation.push('🔴 Bearish crossover: Price crossed below EMA - potential sell signal');
    }
  }

  // Determine signal strength
  let strength: EMAAnalysis['strength'] = 'MODERATE';
  const priceEMADistance = Math.abs((currentPrice - ema.current) / ema.current);
  
  if (priceEMADistance > 0.05) { // 5% or more
    strength = 'STRONG';
    interpretation.push(`Strong signal: Price is ${(priceEMADistance * 100).toFixed(1)}% away from EMA`);
  } else if (priceEMADistance < 0.01) { // Less than 1%
    strength = 'WEAK';
    interpretation.push(`Weak signal: Price is only ${(priceEMADistance * 100).toFixed(1)}% away from EMA`);
  }

  // Generate trading signal
  let signal: EMAAnalysis['signal'] = 'HOLD';
  
  if (crossover === 'BULLISH_CROSSOVER' || (pricePosition === 'ABOVE_EMA' && trend === 'BULLISH' && momentum === 'INCREASING')) {
    signal = 'BUY';
  } else if (crossover === 'BEARISH_CROSSOVER' || (pricePosition === 'BELOW_EMA' && trend === 'BEARISH' && momentum === 'DECREASING')) {
    signal = 'SELL';
  }

  // Generate trading strategy
  const tradingStrategy = {
    entry: signal === 'BUY' ? 'Enter long position on bullish EMA signal' : 
           signal === 'SELL' ? 'Enter short position on bearish EMA signal' : 
           'Wait for clear EMA crossover or strong trend confirmation',
    exit: signal === 'BUY' ? 'Exit when price crosses below EMA or trend weakens' :
          signal === 'SELL' ? 'Exit when price crosses above EMA or trend weakens' :
          'Monitor for EMA crossover signals',
    stopLoss: signal === 'BUY' ? ema.current * 0.98 : signal === 'SELL' ? ema.current * 1.02 : undefined,
    target: signal === 'BUY' ? currentPrice * 1.05 : signal === 'SELL' ? currentPrice * 0.95 : undefined
  };

  return {
    ema,
    signal,
    trend,
    momentum,
    pricePosition,
    crossover,
    strength,
    interpretation,
    tradingStrategy
  };
}

/**
 * Calculate multiple EMAs for comparison (e.g., 12-day and 26-day for MACD)
 * @param candles Array of price candles
 * @param periods Array of periods to calculate
 * @param priceType Price type to use
 * @returns Object with EMA results for each period
 */
export function calculateMultipleEMAs(
  candles: Candle[], 
  periods: number[] = [12, 26], 
  priceType: 'close' | 'high' | 'low' | 'open' | 'median' = 'close'
): { [key: number]: EMAResult } {
  const results: { [key: number]: EMAResult } = {};
  
  periods.forEach(period => {
    results[period] = getEMA(candles, period, priceType);
  });
  
  return results;
}
