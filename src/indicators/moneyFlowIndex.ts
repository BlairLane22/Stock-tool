/**
 * Money Flow Index (MFI) Implementation
 * Based on the Investopedia definition - combines price and volume analysis
 * 
 * MFI = 100 - (100 / (1 + Money Flow Ratio))
 * Money Flow Ratio = 14-Period Positive Money Flow / 14-Period Negative Money Flow
 * Raw Money Flow = Typical Price × Volume
 * Typical Price = (High + Low + Close) / 3
 * 
 * The MFI is often called the "volume-weighted RSI" as it incorporates volume
 * into the momentum calculation, providing a more complete picture of market sentiment.
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface MFIResult {
  values: number[];
  current: number;
  previous: number;
  period: number;
  moneyFlowRatio: number;
  positiveMoneyFlow: number;
  negativeMoneyFlow: number;
}

export interface MFIAnalysis {
  mfi: MFIResult;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'EXTREMELY_OVERSOLD' | 'OVERSOLD' | 'UNDERSOLD' | 'NEUTRAL' | 'OVERBOUGHT' | 'EXTREMELY_OVERBOUGHT';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum: 'INCREASING' | 'DECREASING' | 'STABLE';
  divergence: 'BULLISH' | 'BEARISH' | 'NONE';
  volumeStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  interpretation: string[];
  tradingLevels: {
    oversoldThreshold: number;
    overboughtThreshold: number;
    extremeOversold: number;
    extremeOverbought: number;
  };
}

/**
 * Calculate Money Flow Index
 * @param candles Array of price candles
 * @param period MFI period (default: 14)
 * @returns MFI values array
 */
export function calculateMFI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return [];
  }

  const mfi: number[] = [];
  const typicalPrices: number[] = [];
  const rawMoneyFlows: number[] = [];

  // Step 1: Calculate typical prices and raw money flows
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const rawMoneyFlow = typicalPrice * candle.volume;
    
    typicalPrices.push(typicalPrice);
    rawMoneyFlows.push(rawMoneyFlow);
  }

  // Step 2: Calculate MFI for each period
  for (let i = period; i < candles.length; i++) {
    let positiveMoneyFlow = 0;
    let negativeMoneyFlow = 0;

    // Look at the last 'period' number of periods
    for (let j = i - period + 1; j <= i; j++) {
      const currentTypicalPrice = typicalPrices[j];
      const previousTypicalPrice = typicalPrices[j - 1];
      const currentRawMoneyFlow = rawMoneyFlows[j];

      // Determine if money flow is positive or negative
      if (currentTypicalPrice > previousTypicalPrice) {
        positiveMoneyFlow += currentRawMoneyFlow;
      } else if (currentTypicalPrice < previousTypicalPrice) {
        negativeMoneyFlow += currentRawMoneyFlow;
      }
      // If prices are equal, money flow is neither positive nor negative
    }

    // Step 3: Calculate Money Flow Ratio and MFI
    let moneyFlowRatio: number;
    let mfiValue: number;

    if (negativeMoneyFlow === 0) {
      // All money flow was positive
      mfiValue = 100;
    } else if (positiveMoneyFlow === 0) {
      // All money flow was negative
      mfiValue = 0;
    } else {
      moneyFlowRatio = positiveMoneyFlow / negativeMoneyFlow;
      mfiValue = 100 - (100 / (1 + moneyFlowRatio));
    }

    mfi.push(mfiValue);
  }

  return mfi;
}

/**
 * Get MFI result with detailed information
 * @param candles Array of price candles
 * @param period MFI period (default: 14)
 * @returns Detailed MFI result
 */
export function getMFI(candles: Candle[], period: number = 14): MFIResult {
  const values = calculateMFI(candles, period);
  
  if (values.length === 0) {
    return {
      values: [],
      current: 50,
      previous: 50,
      period,
      moneyFlowRatio: 1,
      positiveMoneyFlow: 0,
      negativeMoneyFlow: 0
    };
  }

  // Calculate current period's money flows for additional insight
  const typicalPrices: number[] = [];
  const rawMoneyFlows: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const rawMoneyFlow = typicalPrice * candle.volume;
    
    typicalPrices.push(typicalPrice);
    rawMoneyFlows.push(rawMoneyFlow);
  }

  // Calculate current period's positive and negative money flows
  let positiveMoneyFlow = 0;
  let negativeMoneyFlow = 0;
  const startIndex = candles.length - period;

  for (let j = startIndex; j < candles.length; j++) {
    if (j === 0) continue; // Skip first candle as we need previous price
    
    const currentTypicalPrice = typicalPrices[j];
    const previousTypicalPrice = typicalPrices[j - 1];
    const currentRawMoneyFlow = rawMoneyFlows[j];

    if (currentTypicalPrice > previousTypicalPrice) {
      positiveMoneyFlow += currentRawMoneyFlow;
    } else if (currentTypicalPrice < previousTypicalPrice) {
      negativeMoneyFlow += currentRawMoneyFlow;
    }
  }

  const moneyFlowRatio = negativeMoneyFlow === 0 ? 100 : positiveMoneyFlow / negativeMoneyFlow;

  return {
    values,
    current: values[values.length - 1],
    previous: values.length > 1 ? values[values.length - 2] : values[0],
    period,
    moneyFlowRatio,
    positiveMoneyFlow,
    negativeMoneyFlow
  };
}

/**
 * Analyze MFI for trading signals and market conditions
 * @param candles Array of price candles
 * @param period MFI period (default: 14)
 * @param customLevels Custom overbought/oversold levels
 * @returns Complete MFI analysis
 */
export function analyzeMFI(
  candles: Candle[], 
  period: number = 14,
  customLevels?: {
    oversold?: number;
    overbought?: number;
    extremeOversold?: number;
    extremeOverbought?: number;
  }
): MFIAnalysis {
  const mfi = getMFI(candles, period);
  const interpretation: string[] = [];
  
  // Default trading levels (can be customized)
  const tradingLevels = {
    oversoldThreshold: customLevels?.oversold ?? 20,
    overboughtThreshold: customLevels?.overbought ?? 80,
    extremeOversold: customLevels?.extremeOversold ?? 10,
    extremeOverbought: customLevels?.extremeOverbought ?? 90
  };

  // Determine MFI strength level
  let strength: MFIAnalysis['strength'] = 'NEUTRAL';
  if (mfi.current <= tradingLevels.extremeOversold) {
    strength = 'EXTREMELY_OVERSOLD';
    interpretation.push(`MFI at ${mfi.current.toFixed(1)} indicates extremely oversold conditions with very weak money flow`);
  } else if (mfi.current <= tradingLevels.oversoldThreshold) {
    strength = 'OVERSOLD';
    interpretation.push(`MFI at ${mfi.current.toFixed(1)} indicates oversold conditions - selling pressure may be exhausted`);
  } else if (mfi.current < 40) {
    strength = 'UNDERSOLD';
    interpretation.push(`MFI at ${mfi.current.toFixed(1)} shows weak money flow but not oversold`);
  } else if (mfi.current >= tradingLevels.extremeOverbought) {
    strength = 'EXTREMELY_OVERBOUGHT';
    interpretation.push(`MFI at ${mfi.current.toFixed(1)} indicates extremely overbought conditions with excessive buying pressure`);
  } else if (mfi.current >= tradingLevels.overboughtThreshold) {
    strength = 'OVERBOUGHT';
    interpretation.push(`MFI at ${mfi.current.toFixed(1)} indicates overbought conditions - buying pressure may be unsustainable`);
  } else {
    interpretation.push(`MFI at ${mfi.current.toFixed(1)} is in neutral territory`);
  }

  // Determine trend
  let trend: MFIAnalysis['trend'] = 'NEUTRAL';
  if (mfi.current > 50 && mfi.previous > 50) {
    trend = 'BULLISH';
    interpretation.push('MFI trend is bullish (above 50) - money flowing into the asset');
  } else if (mfi.current < 50 && mfi.previous < 50) {
    trend = 'BEARISH';
    interpretation.push('MFI trend is bearish (below 50) - money flowing out of the asset');
  } else {
    interpretation.push('MFI trend is neutral or transitioning');
  }

  // Determine momentum
  let momentum: MFIAnalysis['momentum'] = 'STABLE';
  const momentumChange = mfi.current - mfi.previous;
  if (Math.abs(momentumChange) > 5) {
    if (momentumChange > 0) {
      momentum = 'INCREASING';
      interpretation.push(`MFI momentum increasing (+${momentumChange.toFixed(1)}) - strengthening money flow`);
    } else {
      momentum = 'DECREASING';
      interpretation.push(`MFI momentum decreasing (${momentumChange.toFixed(1)}) - weakening money flow`);
    }
  } else {
    interpretation.push('MFI momentum is stable');
  }

  // Assess volume strength based on money flow ratio
  let volumeStrength: MFIAnalysis['volumeStrength'] = 'MODERATE';
  if (mfi.moneyFlowRatio > 3) {
    volumeStrength = 'STRONG';
    interpretation.push('Strong positive money flow - high volume supporting price moves');
  } else if (mfi.moneyFlowRatio < 0.33) {
    volumeStrength = 'STRONG';
    interpretation.push('Strong negative money flow - high volume opposing price moves');
  } else if (mfi.moneyFlowRatio > 1.5 || mfi.moneyFlowRatio < 0.67) {
    volumeStrength = 'MODERATE';
  } else {
    volumeStrength = 'WEAK';
    interpretation.push('Weak money flow - low volume conviction behind price moves');
  }

  // Generate trading signal
  let signal: MFIAnalysis['signal'] = 'HOLD';
  
  // Buy signals
  if (mfi.current <= tradingLevels.oversoldThreshold && mfi.current > mfi.previous) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: MFI oversold and turning up with volume support');
  } else if (mfi.current > tradingLevels.oversoldThreshold && mfi.previous <= tradingLevels.oversoldThreshold) {
    signal = 'BUY';
    interpretation.push('🟢 BUY signal: MFI breaking out of oversold territory');
  }
  
  // Sell signals
  else if (mfi.current >= tradingLevels.overboughtThreshold && mfi.current < mfi.previous) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: MFI overbought and turning down');
  } else if (mfi.current < tradingLevels.overboughtThreshold && mfi.previous >= tradingLevels.overboughtThreshold) {
    signal = 'SELL';
    interpretation.push('🔴 SELL signal: MFI breaking down from overbought territory');
  }
  
  // Hold conditions
  else {
    interpretation.push('🟡 HOLD: No clear MFI signal at current levels');
  }

  // Check for divergence (simplified version)
  let divergence: MFIAnalysis['divergence'] = 'NONE';
  if (mfi.values.length >= 20 && candles.length >= 20) {
    const recentMFI = mfi.values.slice(-10);
    const earlierMFI = mfi.values.slice(-20, -10);
    const recentPrices = candles.slice(-10).map(c => c.close);
    const earlierPrices = candles.slice(-20, -10).map(c => c.close);
    
    const recentMFITrend = recentMFI[recentMFI.length - 1] - recentMFI[0];
    const recentPriceTrend = recentPrices[recentPrices.length - 1] - recentPrices[0];
    
    // Bullish divergence: price declining but MFI rising
    if (recentPriceTrend < 0 && recentMFITrend > 5) {
      divergence = 'BULLISH';
      interpretation.push('📈 Bullish divergence detected: Price declining but money flow strengthening');
    }
    // Bearish divergence: price rising but MFI declining
    else if (recentPriceTrend > 0 && recentMFITrend < -5) {
      divergence = 'BEARISH';
      interpretation.push('📉 Bearish divergence detected: Price rising but money flow weakening');
    }
  }

  return {
    mfi,
    signal,
    strength,
    trend,
    momentum,
    divergence,
    volumeStrength,
    interpretation,
    tradingLevels
  };
}
