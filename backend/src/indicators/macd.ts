export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
  ema12: number[];
  ema26: number[];
  current: number;
  previous: number;
  signalCurrent: number;
  signalPrevious: number;
  histogramCurrent: number;
  histogramPrevious: number;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export interface MACDAnalysis {
  macd: MACDResult;
  signal: 'BUY' | 'SELL' | 'HOLD';
  crossover: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NONE';
  momentum: 'INCREASING' | 'DECREASING' | 'STABLE';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  divergence: 'BULLISH_DIVERGENCE' | 'BEARISH_DIVERGENCE' | 'NONE';
  interpretation: string[];
  tradingStrategy: {
    entry: string;
    exit: string;
    stopLoss: number;
    target: number;
  };
  chartData: {
    timestamps: number[];
    prices: number[];
    macdValues: number[];
    signalValues: number[];
    histogramValues: number[];
    volume: number[];
    levels: {
      zero: number;
    };
  };
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
 * @param candles Array of price candles
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line EMA period (default: 9)
 * @returns MACD result object
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
      ema26: [],
      current: 0,
      previous: 0,
      signalCurrent: 0,
      signalPrevious: 0,
      histogramCurrent: 0,
      histogramPrevious: 0,
      fastPeriod,
      slowPeriod,
      signalPeriod
    };
  }
  
  // Extract closing prices
  const closePrices = candles.map(candle => candle.close);
  
  // Calculate EMAs
  const ema12 = calculateEMA(closePrices, fastPeriod);
  const ema26 = calculateEMA(closePrices, slowPeriod);
  
  // Calculate MACD line (12-period EMA - 26-period EMA)
  const macd: number[] = [];
  const alignmentOffset = Math.abs(ema12.length - ema26.length);

  if (ema12.length > ema26.length) {
    for (let i = 0; i < ema26.length; i++) {
      macd.push(ema12[i + alignmentOffset] - ema26[i]);
    }
  } else if (ema26.length > ema12.length) {
    for (let i = 0; i < ema12.length; i++) {
      macd.push(ema12[i] - ema26[i + alignmentOffset]);
    }
  } else {
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
    for (let i = 0; i < signal.length; i++) {
      histogram.push(macd[i + histogramAlignmentOffset] - signal[i]);
    }
  } else if (signal.length > macd.length) {
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signal[i + histogramAlignmentOffset]);
    }
  } else {
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signal[i]);
    }
  }
  
  return {
    macd,
    signal,
    histogram,
    ema12,
    ema26,
    current: macd.length > 0 ? macd[macd.length - 1] : 0,
    previous: macd.length > 1 ? macd[macd.length - 2] : 0,
    signalCurrent: signal.length > 0 ? signal[signal.length - 1] : 0,
    signalPrevious: signal.length > 1 ? signal[signal.length - 2] : 0,
    histogramCurrent: histogram.length > 0 ? histogram[histogram.length - 1] : 0,
    histogramPrevious: histogram.length > 1 ? histogram[histogram.length - 2] : 0,
    fastPeriod,
    slowPeriod,
    signalPeriod
  };
}

/**
 * Get MACD result with current and previous values
 * @param candles Array of price candles
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line EMA period (default: 9)
 * @returns MACD result object
 */
export function getMACDResult(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  return calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod);
}

/**
 * Analyze MACD for trading signals and market conditions
 * @param candles Array of price candles
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line EMA period (default: 9)
 * @returns Complete MACD analysis
 */
export function analyzeMACDSignals(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDAnalysis {
  const macdResult = calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod);
  const interpretation: string[] = [];

  if (macdResult.macd.length === 0) {
    return {
      macd: macdResult,
      signal: 'HOLD',
      crossover: 'NONE',
      momentum: 'STABLE',
      trend: 'NEUTRAL',
      strength: 0,
      divergence: 'NONE',
      interpretation: ['Insufficient data for MACD analysis'],
      tradingStrategy: {
        entry: 'Wait for more data',
        exit: 'N/A',
        stopLoss: 0,
        target: 0
      },
      chartData: {
        timestamps: [],
        prices: [],
        macdValues: [],
        signalValues: [],
        histogramValues: [],
        volume: [],
        levels: { zero: 0 }
      }
    };
  }

  const currentMACD = macdResult.current;
  const currentSignal = macdResult.signalCurrent;
  const currentHistogram = macdResult.histogramCurrent;
  const previousMACD = macdResult.previous;
  const previousSignal = macdResult.signalPrevious;
  const previousHistogram = macdResult.histogramPrevious;

  // Determine current signal
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (currentMACD > currentSignal) {
    trend = 'BULLISH';
    interpretation.push('🟢 MACD line above signal line - bullish momentum');
  } else if (currentMACD < currentSignal) {
    trend = 'BEARISH';
    interpretation.push('🔴 MACD line below signal line - bearish momentum');
  } else {
    interpretation.push('🟡 MACD line at signal line - neutral momentum');
  }

  // Check for crossovers
  let crossover: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NONE' = 'NONE';
  if (macdResult.macd.length >= 2 && macdResult.signal.length >= 2) {
    if (previousMACD <= previousSignal && currentMACD > currentSignal) {
      crossover = 'BULLISH_CROSSOVER';
      signal = 'BUY';
      interpretation.push('🚀 Bullish crossover detected - MACD crossed above signal line');
    } else if (previousMACD >= previousSignal && currentMACD < currentSignal) {
      crossover = 'BEARISH_CROSSOVER';
      signal = 'SELL';
      interpretation.push('📉 Bearish crossover detected - MACD crossed below signal line');
    }
  }

  // Analyze momentum (histogram trend)
  let momentum: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
  if (macdResult.histogram.length >= 2) {
    if (currentHistogram > previousHistogram) {
      momentum = 'INCREASING';
      interpretation.push('📈 Histogram increasing - momentum strengthening');
    } else if (currentHistogram < previousHistogram) {
      momentum = 'DECREASING';
      interpretation.push('📉 Histogram decreasing - momentum weakening');
    } else {
      interpretation.push('➡️ Histogram stable - momentum unchanged');
    }
  }

  // Calculate signal strength (0-100)
  const maxHistogram = Math.max(...macdResult.histogram.map(Math.abs));
  const strength = maxHistogram > 0 ? Math.min(100, (Math.abs(currentHistogram) / maxHistogram) * 100) : 0;

  // Zero line analysis
  if (currentMACD > 0) {
    interpretation.push('✅ MACD above zero line - overall bullish trend');
  } else if (currentMACD < 0) {
    interpretation.push('❌ MACD below zero line - overall bearish trend');
  } else {
    interpretation.push('🟡 MACD at zero line - trend transition');
  }

  // Generate trading strategy
  const currentPrice = candles[candles.length - 1].close;
  const priceRange = Math.max(...candles.slice(-20).map(c => c.high)) - Math.min(...candles.slice(-20).map(c => c.low));
  const stopLossDistance = priceRange * 0.02; // 2% of recent range
  const targetDistance = priceRange * 0.05; // 5% of recent range

  let tradingStrategy = {
    entry: 'Hold current position',
    exit: 'Monitor for trend changes',
    stopLoss: currentPrice - stopLossDistance,
    target: currentPrice + targetDistance
  };

  if (signal === 'BUY') {
    tradingStrategy = {
      entry: 'Consider long position on bullish crossover',
      exit: 'Exit when MACD crosses below signal line',
      stopLoss: currentPrice - stopLossDistance,
      target: currentPrice + targetDistance
    };
  } else if (signal === 'SELL') {
    tradingStrategy = {
      entry: 'Consider short position on bearish crossover',
      exit: 'Exit when MACD crosses above signal line',
      stopLoss: currentPrice + stopLossDistance,
      target: currentPrice - targetDistance
    };
  }

  // Prepare chart data
  const chartData = {
    timestamps: candles.slice(-Math.min(200, candles.length)).map(c => c.timeStamp * 1000),
    prices: candles.slice(-Math.min(200, candles.length)).map(c => c.close),
    macdValues: macdResult.macd.slice(-Math.min(200, macdResult.macd.length)),
    signalValues: macdResult.signal.slice(-Math.min(200, macdResult.signal.length)),
    histogramValues: macdResult.histogram.slice(-Math.min(200, macdResult.histogram.length)),
    volume: candles.slice(-Math.min(200, candles.length)).map(c => c.volume),
    levels: { zero: 0 }
  };

  return {
    macd: macdResult,
    signal,
    crossover,
    momentum,
    trend,
    strength: Math.round(strength),
    divergence: 'NONE', // Would need price comparison for divergence analysis
    interpretation,
    tradingStrategy,
    chartData
  };
}
