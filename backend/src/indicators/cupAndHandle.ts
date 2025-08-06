import { cupAndHandle, analyzeCupAndHandle, generateCupAndHandleMockData } from '../chartPatterns/cupAndHandle';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface CupAndHandleResult {
  isPattern: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  cupStart: number;
  cupBottom: number;
  cupEnd: number;
  handleStart: number;
  handleEnd: number;
  breakoutLevel: number;
  targetPrice: number;
  stopLoss: number;
  patternDuration: number;
  cupDepth: number;
  handleDepth: number;
  volumeConfirmation: boolean;
  reasons: string[];
}

export interface CupAndHandleAnalysis {
  pattern: CupAndHandleResult;
  signal: 'BUY' | 'HOLD' | 'WAIT';
  stage: 'CUP_FORMING' | 'HANDLE_FORMING' | 'BREAKOUT_READY' | 'COMPLETED' | 'NONE';
  strength: number;
  riskReward: number;
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
    volume: number[];
    cupStartIndex: number;
    cupBottomIndex: number;
    cupEndIndex: number;
    handleStartIndex: number;
    handleEndIndex: number;
    breakoutLevel: number;
    targetPrice: number;
    stopLoss: number;
  };
}

/**
 * Calculate Cup and Handle pattern detection
 * @param candles Array of price candles
 * @param minCupPeriods Minimum periods for cup formation (default: 15)
 * @param maxCupPeriods Maximum periods for cup formation (default: 130)
 * @param minHandlePeriods Minimum periods for handle formation (default: 5)
 * @param maxHandlePeriods Maximum periods for handle formation (default: 25)
 * @returns Cup and Handle result object
 */
export function calculateCupAndHandle(
  candles: Candle[],
  minCupPeriods: number = 15,
  maxCupPeriods: number = 130,
  minHandlePeriods: number = 5,
  maxHandlePeriods: number = 25
): CupAndHandleResult {
  return cupAndHandle(candles, minCupPeriods, maxCupPeriods, minHandlePeriods, maxHandlePeriods);
}

/**
 * Get Cup and Handle pattern result
 * @param candles Array of price candles
 * @param minCupPeriods Minimum periods for cup formation (default: 15)
 * @param maxCupPeriods Maximum periods for cup formation (default: 130)
 * @param minHandlePeriods Minimum periods for handle formation (default: 5)
 * @param maxHandlePeriods Maximum periods for handle formation (default: 25)
 * @returns Cup and Handle result object
 */
export function getCupAndHandleResult(
  candles: Candle[],
  minCupPeriods: number = 15,
  maxCupPeriods: number = 130,
  minHandlePeriods: number = 5,
  maxHandlePeriods: number = 25
): CupAndHandleResult {
  return calculateCupAndHandle(candles, minCupPeriods, maxCupPeriods, minHandlePeriods, maxHandlePeriods);
}

/**
 * Analyze Cup and Handle pattern for trading signals and market conditions
 * @param candles Array of price candles
 * @param minCupPeriods Minimum periods for cup formation (default: 15)
 * @param maxCupPeriods Maximum periods for cup formation (default: 130)
 * @param minHandlePeriods Minimum periods for handle formation (default: 5)
 * @param maxHandlePeriods Maximum periods for handle formation (default: 25)
 * @returns Complete Cup and Handle analysis
 */
export function analyzeCupAndHandlePattern(
  candles: Candle[],
  minCupPeriods: number = 15,
  maxCupPeriods: number = 130,
  minHandlePeriods: number = 5,
  maxHandlePeriods: number = 25
): CupAndHandleAnalysis {
  const patternResult = calculateCupAndHandle(candles, minCupPeriods, maxCupPeriods, minHandlePeriods, maxHandlePeriods);
  const interpretation: string[] = [];
  
  if (!patternResult.isPattern) {
    return {
      pattern: patternResult,
      signal: 'WAIT',
      stage: 'NONE',
      strength: 0,
      riskReward: 0,
      interpretation: ['No Cup and Handle pattern detected', ...patternResult.reasons],
      tradingStrategy: {
        entry: 'Wait for pattern formation',
        exit: 'N/A',
        stopLoss: 0,
        target: 0
      },
      chartData: {
        timestamps: candles.map(c => c.timeStamp * 1000),
        prices: candles.map(c => c.close),
        volume: candles.map(c => c.volume),
        cupStartIndex: -1,
        cupBottomIndex: -1,
        cupEndIndex: -1,
        handleStartIndex: -1,
        handleEndIndex: -1,
        breakoutLevel: 0,
        targetPrice: 0,
        stopLoss: 0
      }
    };
  }

  // Pattern detected - analyze details
  interpretation.push(`✅ Cup and Handle pattern detected with ${patternResult.confidence} confidence`);
  
  // Determine current stage
  let stage: 'CUP_FORMING' | 'HANDLE_FORMING' | 'BREAKOUT_READY' | 'COMPLETED' | 'NONE' = 'COMPLETED';
  const currentIndex = candles.length - 1;
  
  if (currentIndex <= patternResult.cupEnd) {
    stage = 'CUP_FORMING';
    interpretation.push('📊 Currently in cup formation phase');
  } else if (currentIndex <= patternResult.handleEnd) {
    stage = 'HANDLE_FORMING';
    interpretation.push('🔧 Currently in handle formation phase');
  } else {
    const currentPrice = candles[currentIndex].close;
    if (currentPrice >= patternResult.breakoutLevel) {
      stage = 'COMPLETED';
      interpretation.push('🚀 Breakout completed - pattern fulfilled');
    } else {
      stage = 'BREAKOUT_READY';
      interpretation.push('⚡ Pattern complete - ready for breakout');
    }
  }

  // Calculate risk/reward ratio
  const riskAmount = patternResult.breakoutLevel - patternResult.stopLoss;
  const rewardAmount = patternResult.targetPrice - patternResult.breakoutLevel;
  const riskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  // Calculate pattern strength (0-100)
  let strength = 0;
  if (patternResult.confidence === 'HIGH') strength = 80;
  else if (patternResult.confidence === 'MEDIUM') strength = 60;
  else strength = 40;

  // Adjust strength based on risk/reward
  if (riskReward >= 3.0) strength += 10;
  else if (riskReward >= 2.0) strength += 5;
  else if (riskReward < 1.0) strength -= 10;

  // Adjust strength based on volume confirmation
  if (patternResult.volumeConfirmation) strength += 5;
  else strength -= 5;

  strength = Math.max(0, Math.min(100, strength));

  // Determine trading signal
  let signal: 'BUY' | 'HOLD' | 'WAIT' = 'WAIT';
  if (stage === 'BREAKOUT_READY' && strength >= 70 && riskReward >= 2.0) {
    signal = 'BUY';
    interpretation.push('🟢 Strong buy signal - high-quality pattern ready for breakout');
  } else if (stage === 'BREAKOUT_READY' && strength >= 50 && riskReward >= 1.5) {
    signal = 'HOLD';
    interpretation.push('🟡 Moderate signal - pattern ready but wait for confirmation');
  } else if (stage === 'COMPLETED') {
    signal = 'HOLD';
    interpretation.push('✅ Pattern completed - monitor for continuation');
  } else {
    interpretation.push('⏳ Pattern forming - wait for completion');
  }

  // Add pattern details to interpretation
  interpretation.push(`📏 Cup depth: ${patternResult.cupDepth.toFixed(1)}%`);
  interpretation.push(`🔧 Handle depth: ${patternResult.handleDepth.toFixed(1)}%`);
  interpretation.push(`⏱️ Pattern duration: ${patternResult.patternDuration} periods`);
  interpretation.push(`🎯 Risk/Reward ratio: ${riskReward.toFixed(2)}:1`);

  // Generate trading strategy
  const currentPrice = candles[candles.length - 1].close;
  let tradingStrategy = {
    entry: 'Wait for pattern completion',
    exit: 'Monitor pattern development',
    stopLoss: patternResult.stopLoss,
    target: patternResult.targetPrice
  };

  if (signal === 'BUY') {
    tradingStrategy = {
      entry: `Enter long position on breakout above $${patternResult.breakoutLevel.toFixed(2)}`,
      exit: `Exit if price falls below $${patternResult.stopLoss.toFixed(2)} or reaches target`,
      stopLoss: patternResult.stopLoss,
      target: patternResult.targetPrice
    };
  } else if (signal === 'HOLD') {
    tradingStrategy = {
      entry: `Monitor for breakout above $${patternResult.breakoutLevel.toFixed(2)} with volume`,
      exit: `Exit if pattern fails below $${patternResult.stopLoss.toFixed(2)}`,
      stopLoss: patternResult.stopLoss,
      target: patternResult.targetPrice
    };
  }

  // Prepare chart data
  const chartData = {
    timestamps: candles.map(c => c.timeStamp * 1000),
    prices: candles.map(c => c.close),
    volume: candles.map(c => c.volume),
    cupStartIndex: patternResult.cupStart,
    cupBottomIndex: patternResult.cupBottom,
    cupEndIndex: patternResult.cupEnd,
    handleStartIndex: patternResult.handleStart,
    handleEndIndex: patternResult.handleEnd,
    breakoutLevel: patternResult.breakoutLevel,
    targetPrice: patternResult.targetPrice,
    stopLoss: patternResult.stopLoss
  };

  return {
    pattern: patternResult,
    signal,
    stage,
    strength,
    riskReward,
    interpretation,
    tradingStrategy,
    chartData
  };
}

/**
 * Generate mock Cup and Handle data for testing
 * @param basePrice Base price for the pattern (default: 100)
 * @param cupDepth Depth of the cup in percentage (default: 20)
 * @param totalPeriods Total periods for the pattern (default: 50)
 * @returns Array of mock candles with Cup and Handle pattern
 */
export function generateMockCupAndHandleData(
  basePrice: number = 100,
  cupDepth: number = 20,
  totalPeriods: number = 50
): Candle[] {
  return generateCupAndHandleMockData(basePrice, cupDepth, totalPeriods);
}
