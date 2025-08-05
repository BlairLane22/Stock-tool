/**
 * Bollinger Bands Implementation
 * Based on John Bollinger's definition from the 1980s
 * 
 * Bollinger Bands consist of:
 * - Middle Band: Simple Moving Average (typically 20-period)
 * - Upper Band: Middle Band + (Standard Deviation × multiplier, typically 2)
 * - Lower Band: Middle Band - (Standard Deviation × multiplier, typically 2)
 * 
 * Used to measure volatility and identify overbought/oversold conditions
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface BollingerBandsResult {
  upperBand: number[];
  middleBand: number[];
  lowerBand: number[];
  bandwidth: number[];
  percentB: number[];
  squeeze: boolean[];
}

export interface BollingerBandsAnalysis {
  bands: BollingerBandsResult;
  current: {
    upper: number;
    middle: number;
    lower: number;
    price: number;
    percentB: number;
    bandwidth: number;
  };
  signal: 'BUY' | 'SELL' | 'HOLD';
  position: 'ABOVE_UPPER' | 'UPPER_HALF' | 'LOWER_HALF' | 'BELOW_LOWER' | 'ON_MIDDLE';
  volatility: 'HIGH' | 'NORMAL' | 'LOW' | 'SQUEEZE';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  interpretation: string[];
  tradingStrategy: {
    entry: string;
    exit: string;
    stopLoss: number | null;
    target: number | null;
  };
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(values: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Calculate Standard Deviation for a given period
 */
function calculateStandardDeviation(values: number[], period: number, smaValues: number[]): number[] {
  const stdDev: number[] = [];
  
  for (let i = period - 1; i < values.length; i++) {
    const periodValues = values.slice(i - period + 1, i + 1);
    const mean = smaValues[i - period + 1];
    
    const variance = periodValues.reduce((acc, val) => {
      return acc + Math.pow(val - mean, 2);
    }, 0) / period;
    
    stdDev.push(Math.sqrt(variance));
  }
  
  return stdDev;
}

/**
 * Calculate Bollinger Bands
 * @param candles Array of price candles
 * @param period Period for moving average (default: 20)
 * @param multiplier Standard deviation multiplier (default: 2)
 * @returns Bollinger Bands data
 */
export function calculateBollingerBands(
  candles: Candle[], 
  period: number = 20, 
  multiplier: number = 2
): BollingerBandsResult {
  if (candles.length < period) {
    return {
      upperBand: [],
      middleBand: [],
      lowerBand: [],
      bandwidth: [],
      percentB: [],
      squeeze: []
    };
  }

  const closePrices = candles.map(candle => candle.close);
  
  // Calculate middle band (SMA)
  const middleBand = calculateSMA(closePrices, period);
  
  // Calculate standard deviation
  const stdDev = calculateStandardDeviation(closePrices, period, middleBand);
  
  // Calculate upper and lower bands
  const upperBand = middleBand.map((sma, index) => sma + (stdDev[index] * multiplier));
  const lowerBand = middleBand.map((sma, index) => sma - (stdDev[index] * multiplier));
  
  // Calculate %B (Percent B) - shows where price is relative to bands
  const percentB = middleBand.map((_, index) => {
    const price = closePrices[index + period - 1];
    const upper = upperBand[index];
    const lower = lowerBand[index];
    return (price - lower) / (upper - lower);
  });
  
  // Calculate Bandwidth - measures band width relative to middle band
  const bandwidth = middleBand.map((middle, index) => {
    return (upperBand[index] - lowerBand[index]) / middle;
  });
  
  // Detect squeeze conditions (low volatility)
  const squeeze = bandwidth.map((bw, index) => {
    if (index < 20) return false; // Need enough data
    const recent20 = bandwidth.slice(Math.max(0, index - 19), index + 1);
    const avgBandwidth = recent20.reduce((sum, val) => sum + val, 0) / recent20.length;
    return bw < avgBandwidth * 0.8; // Squeeze when bandwidth is 20% below recent average
  });

  return {
    upperBand,
    middleBand,
    lowerBand,
    bandwidth,
    percentB,
    squeeze
  };
}

/**
 * Analyze Bollinger Bands for trading signals
 * @param candles Array of price candles
 * @param period Period for moving average (default: 20)
 * @param multiplier Standard deviation multiplier (default: 2)
 * @returns Complete Bollinger Bands analysis
 */
export function analyzeBollingerBands(
  candles: Candle[], 
  period: number = 20, 
  multiplier: number = 2
): BollingerBandsAnalysis {
  const bands = calculateBollingerBands(candles, period, multiplier);
  const interpretation: string[] = [];
  
  if (bands.middleBand.length === 0) {
    return {
      bands,
      current: { upper: 0, middle: 0, lower: 0, price: 0, percentB: 0, bandwidth: 0 },
      signal: 'HOLD',
      position: 'ON_MIDDLE',
      volatility: 'NORMAL',
      trend: 'NEUTRAL',
      interpretation: ['Insufficient data for analysis'],
      tradingStrategy: { entry: 'Wait for more data', exit: 'N/A', stopLoss: null, target: null }
    };
  }

  const lastIndex = bands.middleBand.length - 1;
  const currentPrice = candles[candles.length - 1].close;
  
  const current = {
    upper: bands.upperBand[lastIndex],
    middle: bands.middleBand[lastIndex],
    lower: bands.lowerBand[lastIndex],
    price: currentPrice,
    percentB: bands.percentB[lastIndex],
    bandwidth: bands.bandwidth[lastIndex]
  };

  // Determine position relative to bands
  let position: BollingerBandsAnalysis['position'] = 'ON_MIDDLE';
  if (currentPrice > current.upper) {
    position = 'ABOVE_UPPER';
    interpretation.push(`Price is above upper band ($${current.upper.toFixed(2)}) - potentially overbought`);
  } else if (currentPrice < current.lower) {
    position = 'BELOW_LOWER';
    interpretation.push(`Price is below lower band ($${current.lower.toFixed(2)}) - potentially oversold`);
  } else if (currentPrice > current.middle) {
    position = 'UPPER_HALF';
    interpretation.push('Price is in upper half of bands - bullish bias');
  } else if (currentPrice < current.middle) {
    position = 'LOWER_HALF';
    interpretation.push('Price is in lower half of bands - bearish bias');
  } else {
    interpretation.push('Price is near middle band - neutral');
  }

  // Determine volatility condition
  let volatility: BollingerBandsAnalysis['volatility'] = 'NORMAL';
  const isCurrentSqueeze = bands.squeeze[lastIndex];
  
  if (isCurrentSqueeze) {
    volatility = 'SQUEEZE';
    interpretation.push('🔥 Bollinger Band Squeeze detected - low volatility, potential breakout coming');
  } else if (current.bandwidth > 0.2) {
    volatility = 'HIGH';
    interpretation.push('High volatility - bands are wide');
  } else if (current.bandwidth < 0.1) {
    volatility = 'LOW';
    interpretation.push('Low volatility - bands are narrow');
  } else {
    interpretation.push('Normal volatility levels');
  }

  // Determine trend from middle band direction
  let trend: BollingerBandsAnalysis['trend'] = 'NEUTRAL';
  if (bands.middleBand.length >= 5) {
    const recent5 = bands.middleBand.slice(-5);
    const trendSlope = (recent5[4] - recent5[0]) / 4;
    
    if (trendSlope > current.middle * 0.01) {
      trend = 'BULLISH';
      interpretation.push('📈 Middle band trending upward - bullish trend');
    } else if (trendSlope < -current.middle * 0.01) {
      trend = 'BEARISH';
      interpretation.push('📉 Middle band trending downward - bearish trend');
    } else {
      interpretation.push('Middle band is flat - sideways trend');
    }
  }

  // Generate trading signal
  let signal: BollingerBandsAnalysis['signal'] = 'HOLD';
  let tradingStrategy = {
    entry: 'Hold current position',
    exit: 'Monitor for signal changes',
    stopLoss: null as number | null,
    target: null as number | null
  };

  // Bollinger Band trading strategies
  if (position === 'BELOW_LOWER' && current.percentB < 0) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: Price below lower band (Bollinger Bounce strategy)');
    tradingStrategy = {
      entry: 'Buy on oversold bounce from lower band',
      exit: 'Target middle band or upper band',
      stopLoss: current.price * 0.95,
      target: current.middle
    };
  } else if (position === 'ABOVE_UPPER' && current.percentB > 1) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: Price above upper band (Bollinger Bounce strategy)');
    tradingStrategy = {
      entry: 'Sell on overbought rejection from upper band',
      exit: 'Target middle band or lower band',
      stopLoss: current.price * 1.05,
      target: current.middle
    };
  } else if (isCurrentSqueeze && volatility === 'SQUEEZE') {
    interpretation.push('🟡 WAIT: Squeeze condition - prepare for breakout in either direction');
    tradingStrategy = {
      entry: 'Wait for breakout from squeeze',
      exit: 'Follow breakout direction',
      stopLoss: null,
      target: null
    };
  } else if (position === 'UPPER_HALF' && trend === 'BULLISH') {
    interpretation.push('🟡 HOLD: Bullish trend with price in upper half - trend continuation likely');
  } else if (position === 'LOWER_HALF' && trend === 'BEARISH') {
    interpretation.push('🟡 HOLD: Bearish trend with price in lower half - trend continuation likely');
  }

  // Add %B interpretation
  if (current.percentB > 1) {
    interpretation.push(`%B at ${(current.percentB * 100).toFixed(1)}% - price above upper band`);
  } else if (current.percentB < 0) {
    interpretation.push(`%B at ${(current.percentB * 100).toFixed(1)}% - price below lower band`);
  } else {
    interpretation.push(`%B at ${(current.percentB * 100).toFixed(1)}% - price within bands`);
  }

  // Add bandwidth interpretation
  interpretation.push(`Bandwidth: ${(current.bandwidth * 100).toFixed(2)}% - ${volatility.toLowerCase()} volatility`);

  return {
    bands,
    current,
    signal,
    position,
    volatility,
    trend,
    interpretation,
    tradingStrategy
  };
}

/**
 * Detect Bollinger Band squeeze conditions
 * @param candles Array of price candles
 * @param period Period for calculation
 * @param lookback Periods to look back for squeeze detection
 * @returns Squeeze analysis
 */
export function detectBollingerSqueeze(
  candles: Candle[], 
  period: number = 20, 
  lookback: number = 20
): {
  isSqueezing: boolean;
  squeezeStrength: number;
  daysSinceLastSqueeze: number;
  potentialBreakout: 'HIGH' | 'MEDIUM' | 'LOW';
} {
  const bands = calculateBollingerBands(candles, period);
  
  if (bands.bandwidth.length < lookback) {
    return {
      isSqueezing: false,
      squeezeStrength: 0,
      daysSinceLastSqueeze: 0,
      potentialBreakout: 'LOW'
    };
  }

  const recentBandwidth = bands.bandwidth.slice(-lookback);
  const currentBandwidth = bands.bandwidth[bands.bandwidth.length - 1];
  const avgBandwidth = recentBandwidth.reduce((sum, val) => sum + val, 0) / recentBandwidth.length;
  const minBandwidth = Math.min(...recentBandwidth);
  
  const isSqueezing = currentBandwidth <= minBandwidth * 1.1; // Within 10% of minimum
  const squeezeStrength = avgBandwidth > 0 ? (avgBandwidth - currentBandwidth) / avgBandwidth : 0;
  
  // Find days since last squeeze
  let daysSinceLastSqueeze = 0;
  for (let i = bands.squeeze.length - 2; i >= 0; i--) {
    if (bands.squeeze[i]) break;
    daysSinceLastSqueeze++;
  }
  
  // Determine breakout potential
  let potentialBreakout: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (isSqueezing && squeezeStrength > 0.3) {
    potentialBreakout = 'HIGH';
  } else if (isSqueezing && squeezeStrength > 0.15) {
    potentialBreakout = 'MEDIUM';
  }

  return {
    isSqueezing,
    squeezeStrength,
    daysSinceLastSqueeze,
    potentialBreakout
  };
}
