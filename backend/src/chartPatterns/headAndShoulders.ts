interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface HeadAndShouldersResult {
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

/**
 * Detects Head and Shoulders chart pattern based on Investopedia criteria
 *
 * Pattern Characteristics:
 * 1. Left Shoulder: Price rises to a peak and then declines
 * 2. Head: Price rises again to form a higher peak than the left shoulder
 * 3. Right Shoulder: Price rises a third time but not as high as the head
 * 4. Neckline: Support line connecting the lows between shoulders and head
 * 5. Volume: Should decrease during head formation and increase on breakdown
 * 6. Breakdown: Price breaks below neckline with volume confirmation
 *
 * @param candles Array of price candles (minimum 30 periods recommended)
 * @param minPatternPeriods Minimum periods for pattern formation (default: 20)
 * @param maxPatternPeriods Maximum periods for pattern formation (default: 100)
 * @returns HeadAndShouldersResult object with pattern detection results
 */
export function headAndShoulders(
  candles: Candle[],
  minPatternPeriods: number = 20,
  maxPatternPeriods: number = 100
): HeadAndShouldersResult {

  const defaultResult: HeadAndShouldersResult = {
    isPattern: false,
    confidence: 'LOW',
    leftShoulderStart: -1,
    leftShoulderPeak: -1,
    leftShoulderEnd: -1,
    headStart: -1,
    headPeak: -1,
    headEnd: -1,
    rightShoulderStart: -1,
    rightShoulderPeak: -1,
    rightShoulderEnd: -1,
    necklineLeft: -1,
    necklineRight: -1,
    necklineSlope: 0,
    breakoutLevel: 0,
    targetPrice: 0,
    stopLoss: 0,
    patternDuration: 0,
    leftShoulderHeight: 0,
    headHeight: 0,
    rightShoulderHeight: 0,
    volumeConfirmation: false,
    reasons: []
  };

  // Validate input data
  if (candles.length < minPatternPeriods + 10) {
    defaultResult.reasons.push('Insufficient data for pattern detection');
    return defaultResult;
  }

  // Find potential head and shoulders patterns
  const patterns = findHeadAndShouldersPatterns(candles, minPatternPeriods, maxPatternPeriods);

  if (patterns.length === 0) {
    defaultResult.reasons.push('No valid head and shoulders formations found');
    return defaultResult;
  }

  // Return the best pattern found
  const bestPattern = patterns[0];
  const result = validateHeadAndShoulders(candles, bestPattern);
  
  if (result.isPattern) {
    return result;
  }

  defaultResult.reasons.push('No valid head and shoulders patterns found');
  return defaultResult;
}

interface HeadAndShouldersPattern {
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
  leftShoulderHeight: number;
  headHeight: number;
  rightShoulderHeight: number;
  duration: number;
}

/**
 * Find potential head and shoulders patterns in the price data
 */
function findHeadAndShouldersPatterns(
  candles: Candle[],
  minPeriods: number,
  maxPeriods: number
): HeadAndShouldersPattern[] {
  const patterns: HeadAndShouldersPattern[] = [];
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // Look for patterns in the data
  for (let start = 0; start < candles.length - minPeriods; start++) {
    for (let duration = minPeriods; duration <= maxPeriods && start + duration < candles.length; duration++) {
      const endIndex = start + duration;
      const patternData = candles.slice(start, endIndex + 1);
      
      // Find peaks and troughs in the pattern
      const peaks = findPeaks(patternData.map(c => c.high));
      const troughs = findTroughs(patternData.map(c => c.low));
      
      // Need at least 3 peaks and 2 troughs for head and shoulders
      if (peaks.length >= 3 && troughs.length >= 2) {
        const pattern = analyzeHeadAndShouldersStructure(patternData, peaks, troughs, start);
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }
  }

  return patterns.sort((a, b) => b.headHeight - a.headHeight); // Sort by head height (prominence)
}

/**
 * Find peaks in price data using local maxima
 */
function findPeaks(prices: number[], minProminence: number = 0.02): number[] {
  const peaks: number[] = [];
  
  for (let i = 2; i < prices.length - 2; i++) {
    const current = prices[i];
    const left1 = prices[i - 1];
    const left2 = prices[i - 2];
    const right1 = prices[i + 1];
    const right2 = prices[i + 2];
    
    // Check if current point is a local maximum
    if (current > left1 && current > left2 && current > right1 && current > right2) {
      // Check prominence (height above surrounding valleys)
      const leftValley = Math.min(left1, left2);
      const rightValley = Math.min(right1, right2);
      const prominence = (current - Math.max(leftValley, rightValley)) / current;
      
      if (prominence >= minProminence) {
        peaks.push(i);
      }
    }
  }
  
  return peaks;
}

/**
 * Find troughs in price data using local minima
 */
function findTroughs(prices: number[], minProminence: number = 0.02): number[] {
  const troughs: number[] = [];
  
  for (let i = 2; i < prices.length - 2; i++) {
    const current = prices[i];
    const left1 = prices[i - 1];
    const left2 = prices[i - 2];
    const right1 = prices[i + 1];
    const right2 = prices[i + 2];
    
    // Check if current point is a local minimum
    if (current < left1 && current < left2 && current < right1 && current < right2) {
      // Check prominence (depth below surrounding peaks)
      const leftPeak = Math.max(left1, left2);
      const rightPeak = Math.max(right1, right2);
      const prominence = (Math.min(leftPeak, rightPeak) - current) / Math.min(leftPeak, rightPeak);
      
      if (prominence >= minProminence) {
        troughs.push(i);
      }
    }
  }
  
  return troughs;
}

/**
 * Analyze potential head and shoulders structure
 */
function analyzeHeadAndShouldersStructure(
  patternData: Candle[],
  peaks: number[],
  troughs: number[],
  startOffset: number
): HeadAndShouldersPattern | null {

  // Need at least 3 peaks for head and shoulders
  if (peaks.length < 3) return null;

  const highs = patternData.map(c => c.high);
  const lows = patternData.map(c => c.low);

  // Try different combinations of 3 peaks
  for (let i = 0; i < peaks.length - 2; i++) {
    for (let j = i + 1; j < peaks.length - 1; j++) {
      for (let k = j + 1; k < peaks.length; k++) {
        const leftPeak = peaks[i];
        const headPeak = peaks[j];
        const rightPeak = peaks[k];

        const leftHeight = highs[leftPeak];
        const headHeight = highs[headPeak];
        const rightHeight = highs[rightPeak];

        // Head should be higher than both shoulders
        if (headHeight > leftHeight && headHeight > rightHeight) {
          // Shoulders should be roughly similar height (within 15%)
          const shoulderDifference = Math.abs(leftHeight - rightHeight) / Math.max(leftHeight, rightHeight);

          if (shoulderDifference <= 0.15) {
            // Find troughs between peaks for neckline
            const leftTrough = findTroughBetween(lows, leftPeak, headPeak);
            const rightTrough = findTroughBetween(lows, headPeak, rightPeak);

            if (leftTrough !== -1 && rightTrough !== -1) {
              // Calculate pattern boundaries
              const leftShoulderStart = Math.max(0, leftPeak - 5);
              const leftShoulderEnd = leftTrough;
              const headStart = leftTrough;
              const headEnd = rightTrough;
              const rightShoulderStart = rightTrough;
              const rightShoulderEnd = Math.min(patternData.length - 1, rightPeak + 5);

              return {
                leftShoulderStart: startOffset + leftShoulderStart,
                leftShoulderPeak: startOffset + leftPeak,
                leftShoulderEnd: startOffset + leftShoulderEnd,
                headStart: startOffset + headStart,
                headPeak: startOffset + headPeak,
                headEnd: startOffset + headEnd,
                rightShoulderStart: startOffset + rightShoulderStart,
                rightShoulderPeak: startOffset + rightPeak,
                rightShoulderEnd: startOffset + rightShoulderEnd,
                necklineLeft: startOffset + leftTrough,
                necklineRight: startOffset + rightTrough,
                leftShoulderHeight: leftHeight,
                headHeight: headHeight,
                rightShoulderHeight: rightHeight,
                duration: rightShoulderEnd - leftShoulderStart + 1
              };
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Find trough between two peaks
 */
function findTroughBetween(lows: number[], startPeak: number, endPeak: number): number {
  let minIndex = -1;
  let minValue = Infinity;

  for (let i = startPeak + 1; i < endPeak; i++) {
    if (lows[i] < minValue) {
      minValue = lows[i];
      minIndex = i;
    }
  }

  return minIndex;
}

/**
 * Validate complete head and shoulders pattern
 */
function validateHeadAndShoulders(
  candles: Candle[],
  pattern: HeadAndShouldersPattern
): HeadAndShouldersResult {

  const reasons: string[] = [];
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  // Calculate neckline slope
  const leftNecklinePrice = candles[pattern.necklineLeft].low;
  const rightNecklinePrice = candles[pattern.necklineRight].low;
  const necklineSlope = (rightNecklinePrice - leftNecklinePrice) / (pattern.necklineRight - pattern.necklineLeft);

  // Calculate breakout level (neckline at the right end)
  const breakoutLevel = rightNecklinePrice;

  // Calculate target price (distance from head to neckline projected downward)
  const headToNecklineDistance = pattern.headHeight - Math.max(leftNecklinePrice, rightNecklinePrice);
  const targetPrice = breakoutLevel - headToNecklineDistance;

  // Calculate stop loss (above right shoulder)
  const stopLoss = pattern.rightShoulderHeight * 1.02;

  // Pattern validation criteria
  let score = 0;

  // Head height validation
  const headProminence = (pattern.headHeight - Math.max(pattern.leftShoulderHeight, pattern.rightShoulderHeight)) / pattern.headHeight * 100;
  if (headProminence >= 5 && headProminence <= 25) {
    score += 25;
    reasons.push(`✅ Head prominence optimal: ${headProminence.toFixed(1)}%`);
  } else if (headProminence >= 3) {
    score += 15;
    reasons.push(`⚠️ Head prominence acceptable: ${headProminence.toFixed(1)}%`);
  } else {
    reasons.push(`❌ Head prominence too low: ${headProminence.toFixed(1)}%`);
  }

  // Shoulder symmetry
  const shoulderSymmetry = Math.abs(pattern.leftShoulderHeight - pattern.rightShoulderHeight) / Math.max(pattern.leftShoulderHeight, pattern.rightShoulderHeight) * 100;
  if (shoulderSymmetry <= 10) {
    score += 20;
    reasons.push(`✅ Shoulder symmetry excellent: ${shoulderSymmetry.toFixed(1)}% difference`);
  } else if (shoulderSymmetry <= 15) {
    score += 15;
    reasons.push(`⚠️ Shoulder symmetry good: ${shoulderSymmetry.toFixed(1)}% difference`);
  } else {
    reasons.push(`❌ Shoulder symmetry poor: ${shoulderSymmetry.toFixed(1)}% difference`);
  }

  // Pattern duration
  if (pattern.duration >= 20 && pattern.duration <= 100) {
    score += 15;
    reasons.push(`✅ Pattern duration optimal: ${pattern.duration} periods`);
  } else if (pattern.duration >= 15) {
    score += 10;
    reasons.push(`⚠️ Pattern duration acceptable: ${pattern.duration} periods`);
  } else {
    reasons.push(`❌ Pattern duration too short: ${pattern.duration} periods`);
  }

  // Neckline slope (should be relatively flat or slightly declining)
  const slopePercent = Math.abs(necklineSlope) / leftNecklinePrice * 100;
  if (slopePercent <= 2) {
    score += 15;
    reasons.push(`✅ Neckline slope ideal: ${slopePercent.toFixed(2)}%`);
  } else if (slopePercent <= 5) {
    score += 10;
    reasons.push(`⚠️ Neckline slope acceptable: ${slopePercent.toFixed(2)}%`);
  } else {
    reasons.push(`❌ Neckline slope too steep: ${slopePercent.toFixed(2)}%`);
  }

  // Volume confirmation (simplified - would need more sophisticated analysis)
  const volumeConfirmation = checkVolumePattern(candles, pattern);
  if (volumeConfirmation) {
    score += 15;
    reasons.push('✅ Volume pattern supports the formation');
  } else {
    reasons.push('⚠️ Volume pattern not ideal');
  }

  // Risk/reward ratio
  const riskAmount = stopLoss - breakoutLevel;
  const rewardAmount = breakoutLevel - targetPrice;
  const riskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  if (riskReward >= 2.0) {
    score += 10;
    reasons.push(`✅ Favorable risk/reward ratio: ${riskReward.toFixed(2)}:1`);
  } else if (riskReward >= 1.5) {
    score += 5;
    reasons.push(`⚠️ Moderate risk/reward ratio: ${riskReward.toFixed(2)}:1`);
  } else {
    reasons.push(`❌ Poor risk/reward ratio: ${riskReward.toFixed(2)}:1`);
  }

  // Determine confidence level
  if (score >= 80) {
    confidence = 'HIGH';
  } else if (score >= 60) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  const isPattern = score >= 50; // Minimum threshold for valid pattern

  if (!isPattern) {
    reasons.push(`❌ Pattern score too low: ${score}/100`);
  } else {
    reasons.push(`✅ Pattern score: ${score}/100`);
  }

  return {
    isPattern,
    confidence,
    leftShoulderStart: pattern.leftShoulderStart,
    leftShoulderPeak: pattern.leftShoulderPeak,
    leftShoulderEnd: pattern.leftShoulderEnd,
    headStart: pattern.headStart,
    headPeak: pattern.headPeak,
    headEnd: pattern.headEnd,
    rightShoulderStart: pattern.rightShoulderStart,
    rightShoulderPeak: pattern.rightShoulderPeak,
    rightShoulderEnd: pattern.rightShoulderEnd,
    necklineLeft: pattern.necklineLeft,
    necklineRight: pattern.necklineRight,
    necklineSlope,
    breakoutLevel,
    targetPrice,
    stopLoss,
    patternDuration: pattern.duration,
    leftShoulderHeight: pattern.leftShoulderHeight,
    headHeight: pattern.headHeight,
    rightShoulderHeight: pattern.rightShoulderHeight,
    volumeConfirmation,
    reasons
  };
}

/**
 * Check volume pattern for head and shoulders confirmation
 */
function checkVolumePattern(candles: Candle[], pattern: HeadAndShouldersPattern): boolean {
  // Volume should generally decrease during head formation and increase on breakdown
  const leftShoulderVolumes = candles.slice(pattern.leftShoulderStart, pattern.leftShoulderEnd + 1).map(c => c.volume);
  const headVolumes = candles.slice(pattern.headStart, pattern.headEnd + 1).map(c => c.volume);
  const rightShoulderVolumes = candles.slice(pattern.rightShoulderStart, pattern.rightShoulderEnd + 1).map(c => c.volume);

  const leftShoulderAvgVolume = leftShoulderVolumes.reduce((sum, vol) => sum + vol, 0) / leftShoulderVolumes.length;
  const headAvgVolume = headVolumes.reduce((sum, vol) => sum + vol, 0) / headVolumes.length;
  const rightShoulderAvgVolume = rightShoulderVolumes.reduce((sum, vol) => sum + vol, 0) / rightShoulderVolumes.length;

  // Ideal pattern: Left shoulder has high volume, head has lower volume, right shoulder has moderate volume
  const headVolumeDecline = headAvgVolume < leftShoulderAvgVolume;
  const rightShoulderIncrease = rightShoulderAvgVolume > headAvgVolume;

  return headVolumeDecline && rightShoulderIncrease;
}

/**
 * Analyze head and shoulders pattern with detailed breakdown
 */
export function analyzeHeadAndShoulders(candles: Candle[]): {
  result: HeadAndShouldersResult;
  analysis: string[];
  tradingRecommendation: {
    action: 'SELL' | 'HOLD' | 'WAIT';
    confidence: string;
    entryPrice: number;
    stopLoss: number;
    targetPrice: number;
    riskReward: number;
  };
} {
  const result = headAndShoulders(candles);
  const analysis: string[] = [];

  analysis.push('=== Head and Shoulders Pattern Analysis ===');

  if (!result.isPattern) {
    analysis.push('❌ No valid head and shoulders pattern detected');
    analysis.push('');
    analysis.push('Reasons:');
    result.reasons.forEach(reason => analysis.push(`  ${reason}`));

    return {
      result,
      analysis,
      tradingRecommendation: {
        action: 'WAIT',
        confidence: 'N/A',
        entryPrice: 0,
        stopLoss: 0,
        targetPrice: 0,
        riskReward: 0
      }
    };
  }

  analysis.push(`✅ Head and Shoulders pattern detected with ${result.confidence} confidence`);
  analysis.push('');

  // Pattern details
  analysis.push('📊 Pattern Details:');
  analysis.push(`  Left Shoulder Height: $${result.leftShoulderHeight.toFixed(2)}`);
  analysis.push(`  Head Height: $${result.headHeight.toFixed(2)}`);
  analysis.push(`  Right Shoulder Height: $${result.rightShoulderHeight.toFixed(2)}`);
  analysis.push(`  Pattern Duration: ${result.patternDuration} periods`);
  analysis.push(`  Neckline Slope: ${result.necklineSlope.toFixed(4)}`);
  analysis.push(`  Volume Confirmation: ${result.volumeConfirmation ? 'Yes' : 'No'}`);
  analysis.push('');

  // Trading levels
  analysis.push('🎯 Trading Levels:');
  analysis.push(`  Neckline (Entry): $${result.breakoutLevel.toFixed(2)}`);
  analysis.push(`  Target Price: $${result.targetPrice.toFixed(2)}`);
  analysis.push(`  Stop Loss: $${result.stopLoss.toFixed(2)}`);

  const riskAmount = result.stopLoss - result.breakoutLevel;
  const rewardAmount = result.breakoutLevel - result.targetPrice;
  const riskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  analysis.push(`  Risk/Reward Ratio: ${riskReward.toFixed(2)}:1`);
  analysis.push('');

  // Pattern validation
  analysis.push('✅ Pattern Validation:');
  result.reasons.forEach(reason => analysis.push(`  ${reason}`));
  analysis.push('');

  // Trading recommendation
  let action: 'SELL' | 'HOLD' | 'WAIT' = 'WAIT';
  if (result.confidence === 'HIGH' && riskReward >= 2.0) {
    action = 'SELL';
  } else if (result.confidence === 'MEDIUM' && riskReward >= 1.5) {
    action = 'HOLD';
  }

  analysis.push('💡 Trading Recommendation:');
  analysis.push(`  Action: ${action}`);
  analysis.push(`  Confidence: ${result.confidence}`);

  if (action === 'SELL') {
    analysis.push('  📉 Strong head and shoulders pattern with favorable risk/reward');
    analysis.push('  💰 Consider entering short position on neckline break');
  } else if (action === 'HOLD') {
    analysis.push('  ⚠️ Moderate pattern strength, wait for confirmation');
    analysis.push('  📊 Monitor for volume increase on neckline break');
  } else {
    analysis.push('  ⏳ Pattern not strong enough for immediate action');
    analysis.push('  🔍 Continue monitoring for pattern completion');
  }

  return {
    result,
    analysis,
    tradingRecommendation: {
      action,
      confidence: result.confidence,
      entryPrice: result.breakoutLevel,
      stopLoss: result.stopLoss,
      targetPrice: result.targetPrice,
      riskReward
    }
  };
}

/**
 * Generate mock head and shoulders data for testing
 */
export function generateHeadAndShouldersMockData(
  basePrice: number = 100,
  patternHeight: number = 20,
  totalPeriods: number = 60
): Candle[] {
  const candles: Candle[] = [];
  let currentVolume = 1000000;

  // Generate head and shoulders formation
  for (let i = 0; i < totalPeriods; i++) {
    const progress = i / (totalPeriods - 1);
    let priceMultiplier = 1;

    // Create head and shoulders shape using multiple sine waves
    if (progress <= 0.25) {
      // Left shoulder formation
      const shoulderProgress = progress / 0.25;
      priceMultiplier = 1 + (patternHeight / 100) * 0.6 * Math.sin(shoulderProgress * Math.PI);
    } else if (progress <= 0.6) {
      // Head formation
      const headProgress = (progress - 0.25) / 0.35;
      priceMultiplier = 1 + (patternHeight / 100) * Math.sin(headProgress * Math.PI);
    } else {
      // Right shoulder formation
      const rightShoulderProgress = (progress - 0.6) / 0.4;
      priceMultiplier = 1 + (patternHeight / 100) * 0.6 * Math.sin(rightShoulderProgress * Math.PI);
    }

    const currentPrice = basePrice * priceMultiplier;

    // Add controlled volatility
    const volatility = currentPrice * 0.01 * (Math.random() - 0.5);
    const close = currentPrice + volatility;
    const open = close + currentPrice * 0.005 * (Math.random() - 0.5);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);

    // Volume pattern: higher at shoulders, lower at head
    let volumeMultiplier = 1;
    if (progress <= 0.25 || progress >= 0.6) {
      // Higher volume at shoulders
      volumeMultiplier = 1.2 + Math.random() * 0.3;
    } else {
      // Lower volume at head
      volumeMultiplier = 0.7 + Math.random() * 0.2;
    }

    currentVolume = Math.floor(1000000 * volumeMultiplier);

    candles.push({
      open,
      high,
      low,
      close,
      volume: currentVolume,
      timeStamp: Date.now() / 1000 - (totalPeriods - i) * 24 * 60 * 60 // Daily data
    });
  }

  return candles;
}
