/**
 * Relative Strength Index (RSI) Implementation
 * Based on J. Welles Wilder's definition from "New Concepts in Technical Trading Systems" (1978)
 * 
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 * 
 * Uses Wilder's smoothing method (modified exponential moving average)
 * Default period: 14 (as recommended by Wilder)
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface RSIResult {
  values: number[];
  current: number;
  previous: number;
  period: number;
}

export interface RSIAnalysis {
  rsi: RSIResult;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'EXTREMELY_OVERSOLD' | 'OVERSOLD' | 'UNDERSOLD' | 'NEUTRAL' | 'OVERBOUGHT' | 'EXTREMELY_OVERBOUGHT';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum: 'INCREASING' | 'DECREASING' | 'STABLE';
  divergence: 'BULLISH' | 'BEARISH' | 'NONE';
  interpretation: string[];
  tradingLevels: {
    oversoldThreshold: number;
    overboughtThreshold: number;
    extremeOversold: number;
    extremeOverbought: number;
  };
}

/**
 * Calculate RSI using Wilder's smoothing method
 * @param candles Array of price candles
 * @param period RSI period (default: 14)
 * @returns RSI values array
 */
export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return [];
  }

  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Step 1: Calculate price changes (gains and losses)
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  if (gains.length < period) {
    return [];
  }

  // Step 2: Calculate initial average gain and loss (simple average for first calculation)
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Step 3: Calculate first RSI value
  const rs1 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi1 = 100 - (100 / (1 + rs1));
  rsi.push(rsi1);

  // Step 4: Calculate subsequent RSI values using Wilder's smoothing
  // Wilder's smoothing: new_avg = ((old_avg * (period - 1)) + current_value) / period
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }

  return rsi;
}

/**
 * Get RSI result with current and previous values
 * @param candles Array of price candles
 * @param period RSI period (default: 14)
 * @returns RSI result object
 */
export function getRSI(candles: Candle[], period: number = 14): RSIResult {
  const values = calculateRSI(candles, period);
  
  return {
    values,
    current: values.length > 0 ? values[values.length - 1] : 50,
    previous: values.length > 1 ? values[values.length - 2] : 50,
    period
  };
}

/**
 * Analyze RSI for trading signals and market conditions
 * @param candles Array of price candles
 * @param period RSI period (default: 14)
 * @param customLevels Custom overbought/oversold levels
 * @returns Complete RSI analysis
 */
export function analyzeRSI(
  candles: Candle[], 
  period: number = 14,
  customLevels?: {
    oversold?: number;
    overbought?: number;
    extremeOversold?: number;
    extremeOverbought?: number;
  }
): RSIAnalysis {
  const rsi = getRSI(candles, period);
  const interpretation: string[] = [];
  
  // Default trading levels (can be customized)
  const tradingLevels = {
    oversoldThreshold: customLevels?.oversold ?? 30,
    overboughtThreshold: customLevels?.overbought ?? 70,
    extremeOversold: customLevels?.extremeOversold ?? 20,
    extremeOverbought: customLevels?.extremeOverbought ?? 80
  };

  // Determine RSI strength level
  let strength: RSIAnalysis['strength'] = 'NEUTRAL';
  if (rsi.current <= tradingLevels.extremeOversold) {
    strength = 'EXTREMELY_OVERSOLD';
    interpretation.push(`RSI at ${rsi.current.toFixed(1)} indicates extremely oversold conditions`);
  } else if (rsi.current <= tradingLevels.oversoldThreshold) {
    strength = 'OVERSOLD';
    interpretation.push(`RSI at ${rsi.current.toFixed(1)} indicates oversold conditions`);
  } else if (rsi.current < 40) {
    strength = 'UNDERSOLD';
    interpretation.push(`RSI at ${rsi.current.toFixed(1)} shows weak momentum but not oversold`);
  } else if (rsi.current >= tradingLevels.extremeOverbought) {
    strength = 'EXTREMELY_OVERBOUGHT';
    interpretation.push(`RSI at ${rsi.current.toFixed(1)} indicates extremely overbought conditions`);
  } else if (rsi.current >= tradingLevels.overboughtThreshold) {
    strength = 'OVERBOUGHT';
    interpretation.push(`RSI at ${rsi.current.toFixed(1)} indicates overbought conditions`);
  } else {
    interpretation.push(`RSI at ${rsi.current.toFixed(1)} is in neutral territory`);
  }

  // Determine trend
  let trend: RSIAnalysis['trend'] = 'NEUTRAL';
  if (rsi.current > 50 && rsi.previous > 50) {
    trend = 'BULLISH';
    interpretation.push('RSI trend is bullish (above 50)');
  } else if (rsi.current < 50 && rsi.previous < 50) {
    trend = 'BEARISH';
    interpretation.push('RSI trend is bearish (below 50)');
  } else {
    interpretation.push('RSI trend is neutral or transitioning');
  }

  // Determine momentum
  let momentum: RSIAnalysis['momentum'] = 'STABLE';
  const momentumChange = rsi.current - rsi.previous;
  if (Math.abs(momentumChange) > 3) {
    if (momentumChange > 0) {
      momentum = 'INCREASING';
      interpretation.push(`RSI momentum increasing (+${momentumChange.toFixed(1)})`);
    } else {
      momentum = 'DECREASING';
      interpretation.push(`RSI momentum decreasing (${momentumChange.toFixed(1)})`);
    }
  } else {
    interpretation.push('RSI momentum is stable');
  }

  // Generate trading signal
  let signal: RSIAnalysis['signal'] = 'HOLD';
  
  // Buy signals
  if (rsi.current <= tradingLevels.oversoldThreshold && rsi.current > rsi.previous) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: RSI oversold and turning up');
  } else if (rsi.current > tradingLevels.oversoldThreshold && rsi.previous <= tradingLevels.oversoldThreshold) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: RSI breaking out of oversold territory');
  }
  
  // Sell signals
  else if (rsi.current >= tradingLevels.overboughtThreshold && rsi.current < rsi.previous) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: RSI overbought and turning down');
  } else if (rsi.current < tradingLevels.overboughtThreshold && rsi.previous >= tradingLevels.overboughtThreshold) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: RSI breaking down from overbought territory');
  }
  
  // Hold conditions
  else {
    interpretation.push('🟡 HOLD: No clear RSI signal at current levels');
  }

  // Check for divergence (simplified version)
  let divergence: RSIAnalysis['divergence'] = 'NONE';
  if (rsi.values.length >= 20 && candles.length >= 20) {
    const recentRSI = rsi.values.slice(-10);
    const earlierRSI = rsi.values.slice(-20, -10);
    const recentPrices = candles.slice(-10).map(c => c.close);
    const earlierPrices = candles.slice(-20, -10).map(c => c.close);
    
    const recentRSITrend = recentRSI[recentRSI.length - 1] - recentRSI[0];
    const earlierRSITrend = earlierRSI[earlierRSI.length - 1] - earlierRSI[0];
    const recentPriceTrend = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const earlierPriceTrend = earlierPrices[earlierPrices.length - 1] - earlierPrices[0];
    
    // Bullish divergence: price declining but RSI rising
    if (recentPriceTrend < 0 && recentRSITrend > 0 && Math.abs(recentRSITrend) > 5) {
      divergence = 'BULLISH';
      interpretation.push('📈 Bullish divergence detected: Price declining but RSI rising');
    }
    // Bearish divergence: price rising but RSI declining
    else if (recentPriceTrend > 0 && recentRSITrend < 0 && Math.abs(recentRSITrend) > 5) {
      divergence = 'BEARISH';
      interpretation.push('📉 Bearish divergence detected: Price rising but RSI declining');
    }
  }

  return {
    rsi,
    signal,
    strength,
    trend,
    momentum,
    divergence,
    interpretation,
    tradingLevels
  };
}

/**
 * Get RSI trading recommendations based on multiple timeframes
 * @param candles Array of price candles
 * @param periods Array of RSI periods to analyze
 * @returns Multi-timeframe RSI analysis
 */
export function getMultiTimeframeRSI(candles: Candle[], periods: number[] = [14, 21, 50]): {
  analyses: RSIAnalysis[];
  consensus: 'BUY' | 'SELL' | 'HOLD';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
} {
  const analyses = periods.map(period => analyzeRSI(candles, period));
  
  // Calculate consensus
  const buySignals = analyses.filter(a => a.signal === 'BUY').length;
  const sellSignals = analyses.filter(a => a.signal === 'SELL').length;
  const holdSignals = analyses.filter(a => a.signal === 'HOLD').length;
  
  let consensus: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  
  if (buySignals > sellSignals && buySignals > holdSignals) {
    consensus = 'BUY';
    confidence = buySignals === analyses.length ? 'HIGH' : buySignals >= analyses.length * 0.7 ? 'MEDIUM' : 'LOW';
  } else if (sellSignals > buySignals && sellSignals > holdSignals) {
    consensus = 'SELL';
    confidence = sellSignals === analyses.length ? 'HIGH' : sellSignals >= analyses.length * 0.7 ? 'MEDIUM' : 'LOW';
  }
  
  return {
    analyses,
    consensus,
    confidence
  };
}
