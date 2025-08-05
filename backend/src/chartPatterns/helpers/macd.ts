interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
  ema12: number[];
  ema26: number[];
}

/**
 * Calculate Exponential Moving Average (EMA)
 * Formula: EMA = (Close - EMA_previous) * (2 / (period + 1)) + EMA_previous
 * First EMA value is calculated as Simple Moving Average (SMA)
 */
function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0 || period <= 0) return [];
  
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Calculate first EMA value as SMA
  if (prices.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);
    
    // Calculate subsequent EMA values
    for (let i = period; i < prices.length; i++) {
      const emaValue = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(emaValue);
    }
  }
  
  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * 
 * MACD is a trend-following momentum indicator that shows the relationship 
 * between two moving averages of a security's price.
 * 
 * Components:
 * 1. MACD Line: 12-period EMA - 26-period EMA
 * 2. Signal Line: 9-period EMA of MACD Line
 * 3. Histogram: MACD Line - Signal Line
 * 
 * Interpretation:
 * - MACD above signal line: Bullish momentum
 * - MACD below signal line: Bearish momentum
 * - MACD crossing above signal line: Bullish crossover (buy signal)
 * - MACD crossing below signal line: Bearish crossover (sell signal)
 * - Histogram above zero: MACD is above signal line
 * - Histogram below zero: MACD is below signal line
 * 
 * @param candles Array of price candles
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line EMA period (default: 9)
 * @returns MACDResult object containing all MACD components
 */
export function calculateMACD(
  candles: Candle[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): MACDResult {
  if (candles.length === 0) {
    return {
      macd: [],
      signal: [],
      histogram: [],
      ema12: [],
      ema26: []
    };
  }
  
  // Extract closing prices
  const closePrices = candles.map(candle => candle.close);
  
  // Calculate EMAs
  const ema12 = calculateEMA(closePrices, fastPeriod);
  const ema26 = calculateEMA(closePrices, slowPeriod);
  
  // Calculate MACD line (12-period EMA - 26-period EMA)
  // Align the EMAs - both should start from the same index
  const macd: number[] = [];
  const alignmentOffset = Math.abs(ema12.length - ema26.length);

  if (ema12.length > ema26.length) {
    // EMA12 is longer, start from offset
    for (let i = 0; i < ema26.length; i++) {
      macd.push(ema12[i + alignmentOffset] - ema26[i]);
    }
  } else if (ema26.length > ema12.length) {
    // EMA26 is longer, start from offset
    for (let i = 0; i < ema12.length; i++) {
      macd.push(ema12[i] - ema26[i + alignmentOffset]);
    }
  } else {
    // Same length
    for (let i = 0; i < ema12.length; i++) {
      macd.push(ema12[i] - ema26[i]);
    }
  }
  
  // Calculate Signal line (9-period EMA of MACD)
  const signal = calculateEMA(macd, signalPeriod);
  
  // Calculate Histogram (MACD - Signal)
  const histogram: number[] = [];
  const histogramAlignmentOffset = Math.abs(macd.length - signal.length);

  if (macd.length > signal.length) {
    // MACD is longer, align from the end
    for (let i = 0; i < signal.length; i++) {
      histogram.push(macd[i + histogramAlignmentOffset] - signal[i]);
    }
  } else if (signal.length > macd.length) {
    // Signal is longer, align from the end
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signal[i + histogramAlignmentOffset]);
    }
  } else {
    // Same length
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signal[i]);
    }
  }
  
  return {
    macd,
    signal,
    histogram,
    ema12,
    ema26
  };
}

/**
 * Analyze MACD signals and provide trading insights
 * @param macdResult MACD calculation result
 * @returns Analysis object with signals and interpretations
 */
export function analyzeMACDSignals(macdResult: MACDResult): {
  currentSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  crossover: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NONE';
  momentum: 'INCREASING' | 'DECREASING' | 'STABLE';
  divergence: 'BULLISH_DIVERGENCE' | 'BEARISH_DIVERGENCE' | 'NONE';
  strength: number; // 0-100 scale
} {
  const { macd, signal, histogram } = macdResult;
  
  if (macd.length === 0 || signal.length === 0) {
    return {
      currentSignal: 'NEUTRAL',
      crossover: 'NONE',
      momentum: 'STABLE',
      divergence: 'NONE',
      strength: 0
    };
  }
  
  const currentMACD = macd[macd.length - 1];
  const currentSignal = signal[signal.length - 1];
  const currentHistogram = histogram[histogram.length - 1];
  
  // Determine current signal
  let signalType: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (currentMACD > currentSignal) {
    signalType = 'BULLISH';
  } else if (currentMACD < currentSignal) {
    signalType = 'BEARISH';
  }
  
  // Check for crossovers (need at least 2 data points)
  let crossover: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NONE' = 'NONE';
  if (macd.length >= 2 && signal.length >= 2) {
    const prevMACD = macd[macd.length - 2];
    const prevSignal = signal[signal.length - 2];
    
    if (prevMACD <= prevSignal && currentMACD > currentSignal) {
      crossover = 'BULLISH_CROSSOVER';
    } else if (prevMACD >= prevSignal && currentMACD < currentSignal) {
      crossover = 'BEARISH_CROSSOVER';
    }
  }
  
  // Analyze momentum (histogram trend)
  let momentum: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
  if (histogram.length >= 2) {
    const prevHistogram = histogram[histogram.length - 2];
    if (currentHistogram > prevHistogram) {
      momentum = 'INCREASING';
    } else if (currentHistogram < prevHistogram) {
      momentum = 'DECREASING';
    }
  }
  
  // Calculate signal strength (0-100)
  const maxHistogram = Math.max(...histogram.map(Math.abs));
  const strength = maxHistogram > 0 ? Math.min(100, (Math.abs(currentHistogram) / maxHistogram) * 100) : 0;
  
  return {
    currentSignal: signalType,
    crossover,
    momentum,
    divergence: 'NONE', // Would need price data comparison for divergence analysis
    strength: Math.round(strength)
  };
}

/**
 * Get MACD trading recommendations
 * @param analysis MACD analysis result
 * @returns Trading recommendation
 */
export function getMACDRecommendation(analysis: ReturnType<typeof analyzeMACDSignals>): {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
} {
  const { currentSignal, crossover, momentum, strength } = analysis;
  
  // Strong buy signals
  if (crossover === 'BULLISH_CROSSOVER' && strength > 60) {
    return {
      action: 'BUY',
      confidence: 'HIGH',
      reason: 'Bullish MACD crossover with strong momentum'
    };
  }
  
  // Strong sell signals
  if (crossover === 'BEARISH_CROSSOVER' && strength > 60) {
    return {
      action: 'SELL',
      confidence: 'HIGH',
      reason: 'Bearish MACD crossover with strong momentum'
    };
  }
  
  // Medium confidence signals
  if (currentSignal === 'BULLISH' && momentum === 'INCREASING') {
    return {
      action: 'BUY',
      confidence: 'MEDIUM',
      reason: 'MACD above signal line with increasing momentum'
    };
  }
  
  if (currentSignal === 'BEARISH' && momentum === 'DECREASING') {
    return {
      action: 'SELL',
      confidence: 'MEDIUM',
      reason: 'MACD below signal line with decreasing momentum'
    };
  }
  
  // Default to hold
  return {
    action: 'HOLD',
    confidence: 'LOW',
    reason: 'No clear MACD signal'
  };
}
