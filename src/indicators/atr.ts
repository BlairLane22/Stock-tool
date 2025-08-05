/**
 * Average True Range (ATR) Implementation
 * Based on J. Welles Wilder Jr.'s definition - measures market volatility
 * 
 * True Range (TR) = Max of:
 * 1. Current High - Current Low
 * 2. |Current High - Previous Close|
 * 3. |Current Low - Previous Close|
 * 
 * ATR = Moving Average of True Range values (typically 14 periods)
 * 
 * ATR is used to measure volatility, not price direction. Higher ATR indicates
 * higher volatility, while lower ATR indicates lower volatility.
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface ATRResult {
  values: number[];
  current: number;
  previous: number;
  period: number;
  trueRanges: number[];
}

export interface ATRAnalysis {
  atr: ATRResult;
  volatility: 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW' | 'VERY_LOW';
  volatilityTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  percentageOfPrice: number;
  signal: 'BREAKOUT_LIKELY' | 'CONSOLIDATION' | 'NORMAL_VOLATILITY';
  interpretation: string[];
  tradingStrategy: {
    positionSizing: string;
    stopLoss: string;
    entryStrategy: string;
    riskManagement: string;
  };
}

/**
 * Calculate True Range for a single period
 * @param current Current candle
 * @param previous Previous candle (optional for first calculation)
 * @returns True Range value
 */
export function calculateTrueRange(current: Candle, previous?: Candle): number {
  if (!previous) {
    // For the first candle, TR is simply high - low
    return current.high - current.low;
  }

  const range1 = current.high - current.low;
  const range2 = Math.abs(current.high - previous.close);
  const range3 = Math.abs(current.low - previous.close);

  return Math.max(range1, range2, range3);
}

/**
 * Calculate True Range values for all candles
 * @param candles Array of price candles
 * @returns Array of True Range values
 */
export function calculateTrueRanges(candles: Candle[]): number[] {
  if (candles.length === 0) return [];

  const trueRanges: number[] = [];
  
  // First candle - use high - low
  trueRanges.push(calculateTrueRange(candles[0]));
  
  // Remaining candles - use full TR calculation
  for (let i = 1; i < candles.length; i++) {
    trueRanges.push(calculateTrueRange(candles[i], candles[i - 1]));
  }

  return trueRanges;
}

/**
 * Calculate Average True Range using Simple Moving Average
 * @param candles Array of price candles
 * @param period ATR period (default: 14)
 * @returns Array of ATR values
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period) {
    return [];
  }

  const trueRanges = calculateTrueRanges(candles);
  const atr: number[] = [];

  // Calculate initial ATR using SMA of first 'period' true ranges
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i];
  }
  const initialATR = sum / period;
  atr.push(initialATR);

  // Calculate subsequent ATR values using Wilder's smoothing method
  // ATR = ((Previous ATR * (period - 1)) + Current TR) / period
  for (let i = period; i < trueRanges.length; i++) {
    const previousATR = atr[atr.length - 1];
    const currentTR = trueRanges[i];
    const currentATR = ((previousATR * (period - 1)) + currentTR) / period;
    atr.push(currentATR);
  }

  return atr;
}

/**
 * Get ATR result with detailed information
 * @param candles Array of price candles
 * @param period ATR period (default: 14)
 * @returns Detailed ATR result
 */
export function getATR(candles: Candle[], period: number = 14): ATRResult {
  const values = calculateATR(candles, period);
  const trueRanges = calculateTrueRanges(candles);
  
  if (values.length === 0) {
    return {
      values: [],
      current: 0,
      previous: 0,
      period,
      trueRanges: []
    };
  }

  return {
    values,
    current: values[values.length - 1],
    previous: values.length > 1 ? values[values.length - 2] : values[0],
    period,
    trueRanges
  };
}

/**
 * Analyze ATR for volatility assessment and trading insights
 * @param candles Array of price candles
 * @param period ATR period (default: 14)
 * @returns Complete ATR analysis
 */
export function analyzeATR(candles: Candle[], period: number = 14): ATRAnalysis {
  const atr = getATR(candles, period);
  const interpretation: string[] = [];
  const currentPrice = candles[candles.length - 1].close;

  // Calculate ATR as percentage of current price
  const percentageOfPrice = (atr.current / currentPrice) * 100;
  interpretation.push(`ATR is ${percentageOfPrice.toFixed(2)}% of current price ($${currentPrice.toFixed(2)})`);

  // Determine volatility level
  let volatility: ATRAnalysis['volatility'] = 'NORMAL';
  
  if (percentageOfPrice > 8) {
    volatility = 'VERY_HIGH';
    interpretation.push('🔥 Very high volatility - expect large price swings');
  } else if (percentageOfPrice > 5) {
    volatility = 'HIGH';
    interpretation.push('📈 High volatility - significant price movements likely');
  } else if (percentageOfPrice > 2) {
    volatility = 'NORMAL';
    interpretation.push('📊 Normal volatility - typical price movement range');
  } else if (percentageOfPrice > 1) {
    volatility = 'LOW';
    interpretation.push('📉 Low volatility - limited price movement expected');
  } else {
    volatility = 'VERY_LOW';
    interpretation.push('😴 Very low volatility - price consolidation likely');
  }

  // Determine volatility trend
  let volatilityTrend: ATRAnalysis['volatilityTrend'] = 'STABLE';
  const atrChange = atr.current - atr.previous;
  const atrChangePercent = (atrChange / atr.previous) * 100;
  
  if (atrChangePercent > 10) {
    volatilityTrend = 'INCREASING';
    interpretation.push(`⬆️ Volatility increasing (+${atrChangePercent.toFixed(1)}%) - market becoming more active`);
  } else if (atrChangePercent < -10) {
    volatilityTrend = 'DECREASING';
    interpretation.push(`⬇️ Volatility decreasing (${atrChangePercent.toFixed(1)}%) - market calming down`);
  } else {
    interpretation.push('➡️ Volatility trend is stable');
  }

  // Generate signal based on volatility conditions
  let signal: ATRAnalysis['signal'] = 'NORMAL_VOLATILITY';
  
  if (volatility === 'VERY_LOW' && volatilityTrend === 'DECREASING') {
    signal = 'BREAKOUT_LIKELY';
    interpretation.push('🚀 Low volatility with decreasing trend suggests potential breakout');
  } else if (volatility === 'VERY_HIGH' && volatilityTrend === 'INCREASING') {
    signal = 'CONSOLIDATION';
    interpretation.push('⚠️ Very high volatility may lead to consolidation period');
  }

  // Calculate historical ATR percentiles for context
  if (atr.values.length >= 20) {
    const recentATRs = atr.values.slice(-20);
    const sortedATRs = [...recentATRs].sort((a, b) => a - b);
    const currentPercentile = (sortedATRs.indexOf(atr.current) / sortedATRs.length) * 100;
    
    if (currentPercentile > 80) {
      interpretation.push(`📊 Current ATR is in the top 20% of recent values - unusually high volatility`);
    } else if (currentPercentile < 20) {
      interpretation.push(`📊 Current ATR is in the bottom 20% of recent values - unusually low volatility`);
    }
  }

  // Generate trading strategy based on ATR
  const tradingStrategy = {
    positionSizing: volatility === 'VERY_HIGH' ? 'Reduce position size due to high volatility' :
                   volatility === 'HIGH' ? 'Use moderate position size' :
                   volatility === 'LOW' ? 'Can use larger position size due to low volatility' :
                   'Use standard position sizing',
    
    stopLoss: `Set stop loss at ${(atr.current * 2).toFixed(2)} (2x ATR) or ${(atr.current * 3).toFixed(2)} (3x ATR) from entry`,
    
    entryStrategy: signal === 'BREAKOUT_LIKELY' ? 'Prepare for breakout trades - low volatility may precede big moves' :
                  signal === 'CONSOLIDATION' ? 'Avoid trend-following strategies - expect sideways movement' :
                  'Use ATR for position sizing and stop placement',
    
    riskManagement: `Daily price range typically ${atr.current.toFixed(2)} (${percentageOfPrice.toFixed(1)}% of price). ` +
                   `Adjust risk accordingly. ${volatility === 'VERY_HIGH' ? 'Consider reducing exposure.' : 
                   volatility === 'LOW' ? 'May increase position size cautiously.' : 'Maintain standard risk levels.'}`
  };

  return {
    atr,
    volatility,
    volatilityTrend,
    percentageOfPrice,
    signal,
    interpretation,
    tradingStrategy
  };
}

/**
 * Calculate ATR-based support and resistance levels
 * @param candles Array of price candles
 * @param period ATR period (default: 14)
 * @param multiplier ATR multiplier for levels (default: 2)
 * @returns Support and resistance levels based on ATR
 */
export function calculateATRLevels(
  candles: Candle[], 
  period: number = 14, 
  multiplier: number = 2
): {
  support: number;
  resistance: number;
  currentPrice: number;
  atrValue: number;
} {
  const atr = getATR(candles, period);
  const currentPrice = candles[candles.length - 1].close;
  
  return {
    support: currentPrice - (atr.current * multiplier),
    resistance: currentPrice + (atr.current * multiplier),
    currentPrice,
    atrValue: atr.current
  };
}

/**
 * Calculate position size based on ATR and risk tolerance
 * @param candles Array of price candles
 * @param accountSize Total account size
 * @param riskPercent Risk percentage per trade (e.g., 0.02 for 2%)
 * @param atrMultiplier ATR multiplier for stop loss (default: 2)
 * @param period ATR period (default: 14)
 * @returns Recommended position size
 */
export function calculateATRPositionSize(
  candles: Candle[],
  accountSize: number,
  riskPercent: number,
  atrMultiplier: number = 2,
  period: number = 14
): {
  positionSize: number;
  stopLossDistance: number;
  riskAmount: number;
  atrValue: number;
} {
  const atr = getATR(candles, period);
  const riskAmount = accountSize * riskPercent;
  const stopLossDistance = atr.current * atrMultiplier;
  const positionSize = riskAmount / stopLossDistance;
  
  return {
    positionSize: Math.floor(positionSize),
    stopLossDistance,
    riskAmount,
    atrValue: atr.current
  };
}
