import { headAndShoulders, generateHeadAndShouldersMockData } from '../chartPatterns/headAndShoulders';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface HeadAndShouldersResult {
  isPattern: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  leftShoulderStart: number;
  leftShoulderPeak: number;
  leftShoulderEnd: number;
  headStart: number;
  headPeak: number;
  headEnd: number;
  rightShoulderStart: number;
  rightShoulderPeak: number;
  rightShoulderEnd: number;
  necklineLeft: number;
  necklineRight: number;
  necklineSlope: number;
  breakoutLevel: number;
  targetPrice: number;
  stopLoss: number;
  patternDuration: number;
  leftShoulderHeight: number;
  headHeight: number;
  rightShoulderHeight: number;
  volumeConfirmation: boolean;
  reasons: string[];
}

export interface HeadAndShouldersAnalysis {
  pattern: HeadAndShouldersResult;
  signal: 'SELL' | 'HOLD' | 'WAIT';
  stage: 'LEFT_SHOULDER' | 'HEAD_FORMING' | 'RIGHT_SHOULDER' | 'COMPLETED' | 'BREAKDOWN' | 'NONE';
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
    leftShoulderStartIndex: number;
    leftShoulderPeakIndex: number;
    leftShoulderEndIndex: number;
    headStartIndex: number;
    headPeakIndex: number;
    headEndIndex: number;
    rightShoulderStartIndex: number;
    rightShoulderPeakIndex: number;
    rightShoulderEndIndex: number;
    necklineLeftIndex: number;
    necklineRightIndex: number;
    breakoutLevel: number;
    targetPrice: number;
    stopLoss: number;
  };
}

/**
 * Calculate Head and Shoulders pattern detection
 * @param candles Array of price candles
 * @param minPatternPeriods Minimum periods for pattern formation (default: 20)
 * @param maxPatternPeriods Maximum periods for pattern formation (default: 100)
 * @returns Head and Shoulders result object
 */
export function calculateHeadAndShoulders(
  candles: Candle[],
  minPatternPeriods: number = 20,
  maxPatternPeriods: number = 100
): HeadAndShouldersResult {
  return headAndShoulders(candles, minPatternPeriods, maxPatternPeriods);
}

/**
 * Analyze Head and Shoulders pattern for trading signals and market conditions
 * @param candles Array of price candles
 * @param minPatternPeriods Minimum periods for pattern formation (default: 20)
 * @param maxPatternPeriods Maximum periods for pattern formation (default: 100)
 * @returns Complete Head and Shoulders analysis
 */
export function analyzeHeadAndShouldersPattern(
  candles: Candle[],
  minPatternPeriods: number = 20,
  maxPatternPeriods: number = 100
): HeadAndShouldersAnalysis {
  const patternResult = calculateHeadAndShoulders(candles, minPatternPeriods, maxPatternPeriods);
  const interpretation: string[] = [];
  
  if (!patternResult.isPattern) {
    return {
      pattern: patternResult,
      signal: 'WAIT',
      stage: 'NONE',
      strength: 0,
      riskReward: 0,
      interpretation: ['No Head and Shoulders pattern detected', ...patternResult.reasons],
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
        leftShoulderStartIndex: -1,
        leftShoulderPeakIndex: -1,
        leftShoulderEndIndex: -1,
        headStartIndex: -1,
        headPeakIndex: -1,
        headEndIndex: -1,
        rightShoulderStartIndex: -1,
        rightShoulderPeakIndex: -1,
        rightShoulderEndIndex: -1,
        necklineLeftIndex: -1,
        necklineRightIndex: -1,
        breakoutLevel: 0,
        targetPrice: 0,
        stopLoss: 0
      }
    };
  }

  // Determine current stage
  const currentIndex = candles.length - 1;
  let stage: HeadAndShouldersAnalysis['stage'] = 'NONE';
  let signal: HeadAndShouldersAnalysis['signal'] = 'WAIT';
  
  if (currentIndex <= patternResult.leftShoulderEnd) {
    stage = 'LEFT_SHOULDER';
    interpretation.push('📊 Currently in left shoulder formation phase');
  } else if (currentIndex <= patternResult.headEnd) {
    stage = 'HEAD_FORMING';
    interpretation.push('🔧 Currently in head formation phase');
  } else if (currentIndex <= patternResult.rightShoulderEnd) {
    stage = 'RIGHT_SHOULDER';
    interpretation.push('⚡ Currently in right shoulder formation phase');
  } else {
    const currentPrice = candles[currentIndex].close;
    if (currentPrice <= patternResult.breakoutLevel) {
      stage = 'BREAKDOWN';
      signal = 'SELL';
      interpretation.push('🚀 Breakdown completed - pattern fulfilled');
    } else {
      stage = 'COMPLETED';
      interpretation.push('⚡ Pattern complete - ready for breakdown');
    }
  }

  // Calculate pattern strength (0-100)
  let strength = 0;
  const headProminence = (patternResult.headHeight - Math.max(patternResult.leftShoulderHeight, patternResult.rightShoulderHeight)) / patternResult.headHeight * 100;
  const shoulderSymmetry = 100 - (Math.abs(patternResult.leftShoulderHeight - patternResult.rightShoulderHeight) / Math.max(patternResult.leftShoulderHeight, patternResult.rightShoulderHeight) * 100);
  
  strength = Math.min(100, (headProminence * 0.4) + (shoulderSymmetry * 0.3) + (patternResult.volumeConfirmation ? 30 : 0));

  // Calculate risk/reward ratio
  const riskAmount = patternResult.stopLoss - patternResult.breakoutLevel;
  const rewardAmount = patternResult.breakoutLevel - patternResult.targetPrice;
  const riskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  // Generate trading signal based on pattern completion and strength
  if (stage === 'COMPLETED' || stage === 'BREAKDOWN') {
    if (patternResult.confidence === 'HIGH' && strength >= 70) {
      signal = 'SELL';
      interpretation.push('💰 Strong bearish signal - consider short position');
    } else if (patternResult.confidence === 'MEDIUM' && strength >= 50) {
      signal = 'HOLD';
      interpretation.push('⚠️ Moderate bearish signal - wait for confirmation');
    }
  }

  // Add pattern-specific interpretations
  interpretation.push(`📈 Head prominence: ${headProminence.toFixed(1)}%`);
  interpretation.push(`⚖️ Shoulder symmetry: ${shoulderSymmetry.toFixed(1)}%`);
  interpretation.push(`📊 Pattern strength: ${strength.toFixed(0)}/100`);
  interpretation.push(`💹 Risk/Reward ratio: ${riskReward.toFixed(2)}:1`);

  if (patternResult.volumeConfirmation) {
    interpretation.push('📈 Volume pattern supports bearish reversal');
  } else {
    interpretation.push('⚠️ Volume pattern needs confirmation');
  }

  // Trading strategy
  let tradingStrategy = {
    entry: 'Wait for neckline breakdown',
    exit: 'Target reached or stop loss hit',
    stopLoss: patternResult.stopLoss,
    target: patternResult.targetPrice
  };

  if (signal === 'SELL') {
    tradingStrategy.entry = `Enter short position on break below $${patternResult.breakoutLevel.toFixed(2)}`;
  } else if (signal === 'HOLD') {
    tradingStrategy.entry = `Monitor for breakdown below $${patternResult.breakoutLevel.toFixed(2)} with volume`;
  }

  return {
    pattern: patternResult,
    signal,
    stage,
    strength: Math.round(strength),
    riskReward,
    interpretation,
    tradingStrategy,
    chartData: {
      timestamps: candles.map(c => c.timeStamp * 1000),
      prices: candles.map(c => c.close),
      volume: candles.map(c => c.volume),
      leftShoulderStartIndex: patternResult.leftShoulderStart,
      leftShoulderPeakIndex: patternResult.leftShoulderPeak,
      leftShoulderEndIndex: patternResult.leftShoulderEnd,
      headStartIndex: patternResult.headStart,
      headPeakIndex: patternResult.headPeak,
      headEndIndex: patternResult.headEnd,
      rightShoulderStartIndex: patternResult.rightShoulderStart,
      rightShoulderPeakIndex: patternResult.rightShoulderPeak,
      rightShoulderEndIndex: patternResult.rightShoulderEnd,
      necklineLeftIndex: patternResult.necklineLeft,
      necklineRightIndex: patternResult.necklineRight,
      breakoutLevel: patternResult.breakoutLevel,
      targetPrice: patternResult.targetPrice,
      stopLoss: patternResult.stopLoss
    }
  };
}

/**
 * Generate mock Head and Shoulders data for testing
 * @param basePrice Base price for the pattern (default: 100)
 * @param patternHeight Height of the pattern in percentage (default: 20)
 * @param totalPeriods Total periods for the pattern (default: 60)
 * @returns Array of mock candles with Head and Shoulders pattern
 */
export function generateMockHeadAndShouldersData(
  basePrice: number = 100,
  patternHeight: number = 20,
  totalPeriods: number = 60
): Candle[] {
  return generateHeadAndShouldersMockData(basePrice, patternHeight, totalPeriods);
}
