/**
 * Intraday Momentum Index (IMI) Implementation
 * Based on Tushar Chande's definition - combines RSI with candlestick analysis
 * 
 * IMI = (Sum of Gains / (Sum of Gains + Sum of Losses)) × 100
 * 
 * Where:
 * - Gains = Close - Open (on up days where Close > Open)
 * - Losses = Open - Close (on down days where Open > Close)
 * - Typically calculated over 14 periods
 * 
 * The IMI focuses on intraday price movement (open to close) rather than
 * day-to-day price changes, making it useful for intraday momentum analysis.
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface IMIResult {
  values: number[];
  current: number;
  previous: number;
  period: number;
  totalGains: number;
  totalLosses: number;
  upDays: number;
  downDays: number;
}

export interface IMIAnalysis {
  imi: IMIResult;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'EXTREMELY_OVERSOLD' | 'OVERSOLD' | 'UNDERSOLD' | 'NEUTRAL' | 'OVERBOUGHT' | 'EXTREMELY_OVERBOUGHT';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum: 'INCREASING' | 'DECREASING' | 'STABLE';
  divergence: 'BULLISH' | 'BEARISH' | 'NONE';
  intradayBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  interpretation: string[];
  tradingLevels: {
    oversoldThreshold: number;
    overboughtThreshold: number;
    extremeOversold: number;
    extremeOverbought: number;
  };
}

/**
 * Calculate Intraday Momentum Index
 * @param candles Array of price candles
 * @param period IMI period (default: 14)
 * @returns IMI values array
 */
export function calculateIMI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period) {
    return [];
  }

  const imi: number[] = [];

  // Calculate IMI for each period
  for (let i = period - 1; i < candles.length; i++) {
    let totalGains = 0;
    let totalLosses = 0;

    // Look at the last 'period' number of candles
    for (let j = i - period + 1; j <= i; j++) {
      const candle = candles[j];
      const intradayChange = candle.close - candle.open;

      if (intradayChange > 0) {
        // Up day: close > open
        totalGains += intradayChange;
      } else if (intradayChange < 0) {
        // Down day: open > close
        totalLosses += Math.abs(intradayChange);
      }
      // If open == close, no gain or loss
    }

    // Calculate IMI
    let imiValue: number;
    if (totalGains + totalLosses === 0) {
      // No intraday movement
      imiValue = 50;
    } else {
      imiValue = (totalGains / (totalGains + totalLosses)) * 100;
    }

    imi.push(imiValue);
  }

  return imi;
}

/**
 * Get IMI result with detailed information
 * @param candles Array of price candles
 * @param period IMI period (default: 14)
 * @returns Detailed IMI result
 */
export function getIMI(candles: Candle[], period: number = 14): IMIResult {
  const values = calculateIMI(candles, period);
  
  if (values.length === 0) {
    return {
      values: [],
      current: 50,
      previous: 50,
      period,
      totalGains: 0,
      totalLosses: 0,
      upDays: 0,
      downDays: 0
    };
  }

  // Calculate current period's detailed information
  let totalGains = 0;
  let totalLosses = 0;
  let upDays = 0;
  let downDays = 0;
  
  const startIndex = candles.length - period;
  
  for (let j = startIndex; j < candles.length; j++) {
    const candle = candles[j];
    const intradayChange = candle.close - candle.open;

    if (intradayChange > 0) {
      totalGains += intradayChange;
      upDays++;
    } else if (intradayChange < 0) {
      totalLosses += Math.abs(intradayChange);
      downDays++;
    }
  }

  return {
    values,
    current: values[values.length - 1],
    previous: values.length > 1 ? values[values.length - 2] : values[0],
    period,
    totalGains,
    totalLosses,
    upDays,
    downDays
  };
}

/**
 * Analyze IMI for trading signals and market conditions
 * @param candles Array of price candles
 * @param period IMI period (default: 14)
 * @param customLevels Custom overbought/oversold levels
 * @returns Complete IMI analysis
 */
export function analyzeIMI(
  candles: Candle[], 
  period: number = 14,
  customLevels?: {
    oversold?: number;
    overbought?: number;
    extremeOversold?: number;
    extremeOverbought?: number;
  }
): IMIAnalysis {
  const imi = getIMI(candles, period);
  const interpretation: string[] = [];
  
  // Default trading levels (IMI typically uses 30/70 like RSI)
  const tradingLevels = {
    oversoldThreshold: customLevels?.oversold ?? 30,
    overboughtThreshold: customLevels?.overbought ?? 70,
    extremeOversold: customLevels?.extremeOversold ?? 20,
    extremeOverbought: customLevels?.extremeOverbought ?? 80
  };

  // Determine IMI strength level
  let strength: IMIAnalysis['strength'] = 'NEUTRAL';
  if (imi.current <= tradingLevels.extremeOversold) {
    strength = 'EXTREMELY_OVERSOLD';
    interpretation.push(`IMI at ${imi.current.toFixed(1)} indicates extremely oversold intraday conditions`);
  } else if (imi.current <= tradingLevels.oversoldThreshold) {
    strength = 'OVERSOLD';
    interpretation.push(`IMI at ${imi.current.toFixed(1)} indicates oversold intraday conditions`);
  } else if (imi.current < 40) {
    strength = 'UNDERSOLD';
    interpretation.push(`IMI at ${imi.current.toFixed(1)} shows weak intraday momentum`);
  } else if (imi.current >= tradingLevels.extremeOverbought) {
    strength = 'EXTREMELY_OVERBOUGHT';
    interpretation.push(`IMI at ${imi.current.toFixed(1)} indicates extremely overbought intraday conditions`);
  } else if (imi.current >= tradingLevels.overboughtThreshold) {
    strength = 'OVERBOUGHT';
    interpretation.push(`IMI at ${imi.current.toFixed(1)} indicates overbought intraday conditions`);
  } else {
    interpretation.push(`IMI at ${imi.current.toFixed(1)} is in neutral territory`);
  }

  // Determine trend
  let trend: IMIAnalysis['trend'] = 'NEUTRAL';
  if (imi.current > 50 && imi.previous > 50) {
    trend = 'BULLISH';
    interpretation.push('IMI trend is bullish (above 50) - intraday buying pressure dominates');
  } else if (imi.current < 50 && imi.previous < 50) {
    trend = 'BEARISH';
    interpretation.push('IMI trend is bearish (below 50) - intraday selling pressure dominates');
  } else {
    interpretation.push('IMI trend is neutral or transitioning');
  }

  // Determine momentum
  let momentum: IMIAnalysis['momentum'] = 'STABLE';
  const momentumChange = imi.current - imi.previous;
  if (Math.abs(momentumChange) > 5) {
    if (momentumChange > 0) {
      momentum = 'INCREASING';
      interpretation.push(`IMI momentum increasing (+${momentumChange.toFixed(1)}) - strengthening intraday momentum`);
    } else {
      momentum = 'DECREASING';
      interpretation.push(`IMI momentum decreasing (${momentumChange.toFixed(1)}) - weakening intraday momentum`);
    }
  } else {
    interpretation.push('IMI momentum is stable');
  }

  // Determine intraday bias
  let intradayBias: IMIAnalysis['intradayBias'] = 'NEUTRAL';
  const upDayPercentage = imi.upDays / (imi.upDays + imi.downDays) * 100;
  
  if (upDayPercentage > 65) {
    intradayBias = 'BULLISH';
    interpretation.push(`Strong intraday bullish bias: ${imi.upDays} up days vs ${imi.downDays} down days`);
  } else if (upDayPercentage < 35) {
    intradayBias = 'BEARISH';
    interpretation.push(`Strong intraday bearish bias: ${imi.downDays} down days vs ${imi.upDays} up days`);
  } else {
    interpretation.push(`Balanced intraday activity: ${imi.upDays} up days, ${imi.downDays} down days`);
  }

  // Generate trading signal
  let signal: IMIAnalysis['signal'] = 'HOLD';
  
  // Buy signals
  if (imi.current <= tradingLevels.oversoldThreshold && imi.current > imi.previous) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: IMI oversold and turning up - intraday momentum shifting bullish');
  } else if (imi.current > tradingLevels.oversoldThreshold && imi.previous <= tradingLevels.oversoldThreshold) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: IMI breaking out of oversold territory');
  }
  
  // Sell signals
  else if (imi.current >= tradingLevels.overboughtThreshold && imi.current < imi.previous) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: IMI overbought and turning down - intraday momentum shifting bearish');
  } else if (imi.current < tradingLevels.overboughtThreshold && imi.previous >= tradingLevels.overboughtThreshold) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: IMI breaking down from overbought territory');
  }
  
  // Hold conditions
  else {
    interpretation.push('🟡 HOLD: No clear IMI signal at current levels');
  }

  // Check for divergence (simplified version)
  let divergence: IMIAnalysis['divergence'] = 'NONE';
  if (imi.values.length >= 20 && candles.length >= 20) {
    const recentIMI = imi.values.slice(-10);
    const recentPrices = candles.slice(-10).map(c => c.close);
    
    const recentIMITrend = recentIMI[recentIMI.length - 1] - recentIMI[0];
    const recentPriceTrend = recentPrices[recentPrices.length - 1] - recentPrices[0];
    
    // Bullish divergence: price declining but IMI rising
    if (recentPriceTrend < 0 && recentIMITrend > 5) {
      divergence = 'BULLISH';
      interpretation.push('📈 Bullish divergence detected: Price declining but intraday momentum strengthening');
    }
    // Bearish divergence: price rising but IMI declining
    else if (recentPriceTrend > 0 && recentIMITrend < -5) {
      divergence = 'BEARISH';
      interpretation.push('📉 Bearish divergence detected: Price rising but intraday momentum weakening');
    }
  }

  // Add intraday analysis
  const avgGainPerUpDay = imi.upDays > 0 ? imi.totalGains / imi.upDays : 0;
  const avgLossPerDownDay = imi.downDays > 0 ? imi.totalLosses / imi.downDays : 0;
  
  if (avgGainPerUpDay > avgLossPerDownDay * 1.5) {
    interpretation.push('💪 Strong intraday gains: Up days show significantly larger moves than down days');
  } else if (avgLossPerDownDay > avgGainPerUpDay * 1.5) {
    interpretation.push('⚠️ Strong intraday losses: Down days show significantly larger moves than up days');
  }

  return {
    imi,
    signal,
    strength,
    trend,
    momentum,
    divergence,
    intradayBias,
    interpretation,
    tradingLevels
  };
}
