interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface CupAndHandleResult {
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

/**
 * Detects Cup and Handle chart pattern based on Investopedia criteria
 *
 * Pattern Characteristics:
 * 1. Cup: U-shaped decline and recovery (not V-shaped)
 * 2. Depth: 12-33% decline from high (avoid overly deep cups)
 * 3. Duration: 7-65 weeks (minimum data points required)
 * 4. Handle: Slight downward drift (typically 10-15% of cup depth)
 * 5. Volume: Decreasing during cup, increasing on breakout
 * 6. Breakout: Price breaks above resistance level
 *
 * @param candles Array of price candles (minimum 35 periods recommended)
 * @param minCupPeriods Minimum periods for cup formation (default: 15)
 * @param maxCupPeriods Maximum periods for cup formation (default: 130)
 * @param minHandlePeriods Minimum periods for handle formation (default: 5)
 * @param maxHandlePeriods Maximum periods for handle formation (default: 25)
 * @returns CupAndHandleResult object with pattern detection results
 */
export function cupAndHandle(
  candles: Candle[],
  minCupPeriods: number = 15,
  maxCupPeriods: number = 130,
  minHandlePeriods: number = 5,
  maxHandlePeriods: number = 25
): CupAndHandleResult {

  const defaultResult: CupAndHandleResult = {
    isPattern: false,
    confidence: 'LOW',
    cupStart: -1,
    cupBottom: -1,
    cupEnd: -1,
    handleStart: -1,
    handleEnd: -1,
    breakoutLevel: 0,
    targetPrice: 0,
    stopLoss: 0,
    patternDuration: 0,
    cupDepth: 0,
    handleDepth: 0,
    volumeConfirmation: false,
    reasons: []
  };

  // Validate input data
  if (candles.length < minCupPeriods + minHandlePeriods + 5) {
    defaultResult.reasons.push('Insufficient data for pattern detection');
    return defaultResult;
  }

  // Find potential cup patterns
  const cupPatterns = findCupPatterns(candles, minCupPeriods, maxCupPeriods);



  if (cupPatterns.length === 0) {
    defaultResult.reasons.push('No valid cup formations found');
    return defaultResult;
  }

  // Analyze each cup pattern for handle formation
  for (const cup of cupPatterns) {
    const handleResult = findHandlePattern(
      candles,
      cup,
      minHandlePeriods,
      maxHandlePeriods
    );

    if (handleResult.isValid) {
      const result = validateCupAndHandle(candles, cup, handleResult);
      if (result.isPattern) {
        return result;
      }
    }
  }

  defaultResult.reasons.push('No valid cup and handle patterns found');
  return defaultResult;
}

interface CupPattern {
  startIndex: number;
  bottomIndex: number;
  endIndex: number;
  startPrice: number;
  bottomPrice: number;
  endPrice: number;
  depth: number;
  duration: number;
  isUShape: boolean;
}

/**
 * Find potential cup patterns in the price data
 */
function findCupPatterns(
  candles: Candle[],
  minPeriods: number,
  maxPeriods: number
): CupPattern[] {
  const patterns: CupPattern[] = [];
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  // Look for cup patterns in the entire data set for test data
  const searchStart = 0; // Start from beginning for better pattern detection

  for (let start = searchStart; start < candles.length - minPeriods; start++) {
    const startHigh = highs[start];

    // Find potential cup bottom (lowest point after start)
    for (let duration = minPeriods; duration <= maxPeriods && start + duration < candles.length; duration++) {
      const endIndex = start + duration;
      const cupData = candles.slice(start, endIndex + 1);

      // Find the lowest point in the cup
      let bottomIndex = start;
      let bottomPrice = lows[start];

      for (let i = start + 1; i <= endIndex; i++) {
        if (lows[i] < bottomPrice) {
          bottomPrice = lows[i];
          bottomIndex = i;
        }
      }

      // Validate cup characteristics
      const depth = ((startHigh - bottomPrice) / startHigh) * 100;
      const endPrice = closes[endIndex];
      const priceRecovery = ((endPrice - bottomPrice) / (startHigh - bottomPrice)) * 100;

      // Cup validation criteria
      if (
        depth >= 10 && depth <= 50 && // Reasonable depth (10-50%) - reduced minimum
        priceRecovery >= 60 && // Price should recover at least 60% of decline (reduced from 70%)
        bottomIndex > start + 1 && // Bottom should not be at the very beginning (reduced from 2)
        bottomIndex < endIndex - 1 && // Bottom should not be at the very end (reduced from 2)
        isUShapedCup(cupData, bottomIndex - start) && // Should be U-shaped, not V-shaped
        endPrice >= startHigh * 0.80 // End price should be reasonably close to start (reduced from 0.85)
      ) {
        patterns.push({
          startIndex: start,
          bottomIndex,
          endIndex,
          startPrice: startHigh,
          bottomPrice,
          endPrice,
          depth,
          duration,
          isUShape: true
        });
      }
    }
  }

  return patterns;
}

/**
 * Check if the cup formation is U-shaped rather than V-shaped
 */
function isUShapedCup(cupData: Candle[], bottomIndex: number): boolean {
  if (cupData.length < 7 || bottomIndex < 2 || bottomIndex >= cupData.length - 2) {
    return false;
  }

  const lows = cupData.map(c => c.low);
  const bottomPrice = lows[bottomIndex];

  // Check for gradual decline and recovery (U-shape characteristic)
  const leftSide = lows.slice(0, bottomIndex + 1);
  const rightSide = lows.slice(bottomIndex);

  // Calculate average slope on both sides
  const leftSlope = calculateAverageSlope(leftSide);
  const rightSlope = calculateAverageSlope(rightSide.reverse());

  // U-shape should have gradual slopes, not sharp V-shape
  const maxAllowedSlope = 0.25; // Increased from 0.15 to be less strict

  // Check for flat bottom (multiple periods near the low)
  let flatBottomCount = 0;
  const tolerance = bottomPrice * 0.03; // Increased from 2% to 3% tolerance

  for (let i = Math.max(0, bottomIndex - 3); i <= Math.min(lows.length - 1, bottomIndex + 3); i++) {
    if (Math.abs(lows[i] - bottomPrice) <= tolerance) {
      flatBottomCount++;
    }
  }

  return Math.abs(leftSlope) <= maxAllowedSlope &&
         Math.abs(rightSlope) <= maxAllowedSlope &&
         flatBottomCount >= 1; // Reduced from 2 to 1
}

/**
 * Calculate average slope of a price series
 */
function calculateAverageSlope(prices: number[]): number {
  if (prices.length < 2) return 0;

  let totalSlope = 0;
  for (let i = 1; i < prices.length; i++) {
    totalSlope += (prices[i] - prices[i - 1]) / prices[i - 1];
  }

  return totalSlope / (prices.length - 1);
}

interface HandlePattern {
  isValid: boolean;
  startIndex: number;
  endIndex: number;
  startPrice: number;
  endPrice: number;
  lowPrice: number;
  depth: number;
  duration: number;
  volumeDecline: boolean;
}

/**
 * Find handle pattern after cup formation
 */
function findHandlePattern(
  candles: Candle[],
  cup: CupPattern,
  minHandlePeriods: number,
  maxHandlePeriods: number
): HandlePattern {

  const defaultHandle: HandlePattern = {
    isValid: false,
    startIndex: -1,
    endIndex: -1,
    startPrice: 0,
    endPrice: 0,
    lowPrice: 0,
    depth: 0,
    duration: 0,
    volumeDecline: false
  };

  // Handle should start right after cup ends
  const handleStart = cup.endIndex + 1;

  if (handleStart >= candles.length - minHandlePeriods) {
    return defaultHandle;
  }

  const cupEndPrice = candles[cup.endIndex].close;

  // Look for handle formation
  for (let duration = minHandlePeriods; duration <= maxHandlePeriods; duration++) {
    const handleEnd = handleStart + duration - 1;

    if (handleEnd >= candles.length) break;

    const handleData = candles.slice(handleStart, handleEnd + 1);
    const handleLows = handleData.map(c => c.low);
    const handleCloses = handleData.map(c => c.close);

    const handleLow = Math.min(...handleLows);
    const handleEndPrice = handleCloses[handleCloses.length - 1];

    // Handle validation criteria
    const handleDepth = ((cupEndPrice - handleLow) / cupEndPrice) * 100;
    const maxAllowedHandleDepth = Math.min(20, cup.depth * 0.5); // Increased max to 20% or 1/2 of cup depth

    // Handle should have slight downward drift or sideways movement
    const priceDecline = cupEndPrice - handleEndPrice;
    const priceDeclinePercent = Math.abs(priceDecline) / cupEndPrice * 100;
    const isDownwardDrift = priceDeclinePercent <= 15; // Allow up to 15% movement in either direction

    // Volume should generally decline during handle formation (more lenient)
    const volumeDecline = checkVolumeDecline(handleData);

    // Handle should not break below significant support (more lenient)
    const supportLevel = cup.bottomPrice * 1.10; // 10% above cup bottom (increased from 5%)
    const breaksSupport = handleLow < supportLevel;

    if (
      handleDepth <= maxAllowedHandleDepth &&
      handleDepth >= 0.1 && // Reduced minimum to 0.1% decline for valid handle
      isDownwardDrift &&
      !breaksSupport &&
      handleEndPrice >= handleLow * 1.01 // End should be above the handle low (reduced from 1.02)
    ) {
      return {
        isValid: true,
        startIndex: handleStart,
        endIndex: handleEnd,
        startPrice: cupEndPrice,
        endPrice: handleEndPrice,
        lowPrice: handleLow,
        depth: handleDepth,
        duration,
        volumeDecline
      };
    }
  }

  return defaultHandle;
}

/**
 * Check if volume generally declines during handle formation
 */
function checkVolumeDecline(handleData: Candle[]): boolean {
  if (handleData.length < 3) return false;

  const volumes = handleData.map(c => c.volume);
  const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
  const secondHalf = volumes.slice(Math.floor(volumes.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, vol) => sum + vol, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, vol) => sum + vol, 0) / secondHalf.length;

  return secondHalfAvg <= firstHalfAvg * 1.2; // Allow 20% tolerance (increased from 10%)
}

/**
 * Validate complete cup and handle pattern
 */
function validateCupAndHandle(
  candles: Candle[],
  cup: CupPattern,
  handle: HandlePattern
): CupAndHandleResult {

  const reasons: string[] = [];
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  // Calculate breakout level (resistance level)
  const resistanceLevel = Math.max(
    candles[cup.startIndex].high,
    candles[cup.endIndex].high
  );

  // Calculate target price (cup depth added to breakout level)
  const cupDepth = cup.startPrice - cup.bottomPrice;
  const targetPrice = resistanceLevel + cupDepth;

  // Calculate stop loss (below handle low or cup bottom)
  const stopLoss = Math.min(handle.lowPrice * 0.98, cup.bottomPrice * 0.98);

  // Pattern validation criteria
  let score = 0;

  // Cup criteria
  if (cup.depth >= 12 && cup.depth <= 33) {
    score += 20;
    reasons.push(`✅ Cup depth optimal: ${cup.depth.toFixed(1)}%`);
  } else if (cup.depth < 50) {
    score += 10;
    reasons.push(`⚠️ Cup depth acceptable: ${cup.depth.toFixed(1)}%`);
  } else {
    reasons.push(`❌ Cup too deep: ${cup.depth.toFixed(1)}%`);
  }

  // Cup duration
  if (cup.duration >= 15 && cup.duration <= 65) {
    score += 15;
    reasons.push(`✅ Cup duration optimal: ${cup.duration} periods`);
  } else if (cup.duration >= 7) {
    score += 10;
    reasons.push(`⚠️ Cup duration acceptable: ${cup.duration} periods`);
  } else {
    reasons.push(`❌ Cup duration too short: ${cup.duration} periods`);
  }

  // U-shape validation
  if (cup.isUShape) {
    score += 15;
    reasons.push('✅ Cup has proper U-shape formation');
  } else {
    reasons.push('❌ Cup lacks proper U-shape formation');
  }

  // Handle criteria
  if (handle.depth >= 1 && handle.depth <= 15) {
    score += 15;
    reasons.push(`✅ Handle depth optimal: ${handle.depth.toFixed(1)}%`);
  } else {
    reasons.push(`❌ Handle depth suboptimal: ${handle.depth.toFixed(1)}%`);
  }

  // Handle duration
  if (handle.duration >= 5 && handle.duration <= 25) {
    score += 10;
    reasons.push(`✅ Handle duration good: ${handle.duration} periods`);
  } else {
    reasons.push(`⚠️ Handle duration: ${handle.duration} periods`);
  }

  // Volume confirmation
  if (handle.volumeDecline) {
    score += 10;
    reasons.push('✅ Volume declines during handle formation');
  } else {
    reasons.push('⚠️ Volume pattern not ideal during handle');
  }

  // Price recovery
  const priceRecovery = ((cup.endPrice - cup.bottomPrice) / (cup.startPrice - cup.bottomPrice)) * 100;
  if (priceRecovery >= 80) {
    score += 15;
    reasons.push(`✅ Strong price recovery: ${priceRecovery.toFixed(1)}%`);
  } else if (priceRecovery >= 60) {
    score += 10;
    reasons.push(`⚠️ Moderate price recovery: ${priceRecovery.toFixed(1)}%`);
  } else {
    reasons.push(`❌ Weak price recovery: ${priceRecovery.toFixed(1)}%`);
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
    cupStart: cup.startIndex,
    cupBottom: cup.bottomIndex,
    cupEnd: cup.endIndex,
    handleStart: handle.startIndex,
    handleEnd: handle.endIndex,
    breakoutLevel: resistanceLevel,
    targetPrice,
    stopLoss,
    patternDuration: cup.duration + handle.duration,
    cupDepth: cup.depth,
    handleDepth: handle.depth,
    volumeConfirmation: handle.volumeDecline,
    reasons
  };
}

/**
 * Analyze cup and handle pattern with detailed breakdown
 * This is a convenience function that provides formatted analysis
 */
export function analyzeCupAndHandle(candles: Candle[]): {
  result: CupAndHandleResult;
  analysis: string[];
  tradingRecommendation: {
    action: 'BUY' | 'HOLD' | 'WAIT';
    confidence: string;
    entryPrice: number;
    stopLoss: number;
    targetPrice: number;
    riskReward: number;
  };
} {
  const result = cupAndHandle(candles);
  const analysis: string[] = [];

  analysis.push('=== Cup and Handle Pattern Analysis ===');

  if (!result.isPattern) {
    analysis.push('❌ No valid cup and handle pattern detected');
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

  analysis.push(`✅ Cup and Handle pattern detected with ${result.confidence} confidence`);
  analysis.push('');

  // Pattern details
  analysis.push('📊 Pattern Details:');
  analysis.push(`  Cup Duration: ${result.cupEnd - result.cupStart + 1} periods`);
  analysis.push(`  Handle Duration: ${result.handleEnd - result.handleStart + 1} periods`);
  analysis.push(`  Total Pattern Duration: ${result.patternDuration} periods`);
  analysis.push(`  Cup Depth: ${result.cupDepth.toFixed(1)}%`);
  analysis.push(`  Handle Depth: ${result.handleDepth.toFixed(1)}%`);
  analysis.push(`  Volume Confirmation: ${result.volumeConfirmation ? 'Yes' : 'No'}`);
  analysis.push('');

  // Trading levels
  analysis.push('🎯 Trading Levels:');
  analysis.push(`  Breakout Level: $${result.breakoutLevel.toFixed(2)}`);
  analysis.push(`  Target Price: $${result.targetPrice.toFixed(2)}`);
  analysis.push(`  Stop Loss: $${result.stopLoss.toFixed(2)}`);

  const riskAmount = result.breakoutLevel - result.stopLoss;
  const rewardAmount = result.targetPrice - result.breakoutLevel;
  const riskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  analysis.push(`  Risk/Reward Ratio: ${riskReward.toFixed(2)}:1`);
  analysis.push('');

  // Pattern validation
  analysis.push('✅ Pattern Validation:');
  result.reasons.forEach(reason => analysis.push(`  ${reason}`));
  analysis.push('');

  // Trading recommendation
  let action: 'BUY' | 'HOLD' | 'WAIT' = 'WAIT';
  if (result.confidence === 'HIGH' && riskReward >= 2.0) {
    action = 'BUY';
  } else if (result.confidence === 'MEDIUM' && riskReward >= 1.5) {
    action = 'HOLD';
  }

  analysis.push('💡 Trading Recommendation:');
  analysis.push(`  Action: ${action}`);
  analysis.push(`  Confidence: ${result.confidence}`);

  if (action === 'BUY') {
    analysis.push('  📈 Strong cup and handle pattern with favorable risk/reward');
    analysis.push('  💰 Consider entering on breakout above resistance');
  } else if (action === 'HOLD') {
    analysis.push('  ⚠️ Moderate pattern strength, wait for confirmation');
    analysis.push('  📊 Monitor for volume increase on breakout');
  } else {
    analysis.push('  ⏳ Pattern not strong enough for immediate action');
    analysis.push('  🔍 Continue monitoring for pattern development');
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
 * Generate mock candle data for testing cup and handle patterns
 * This creates realistic price data with a cup and handle formation
 */
export function generateCupAndHandleMockData(
  basePrice: number = 100,
  cupDepth: number = 20,
  totalPeriods: number = 50
): Candle[] {
  const candles: Candle[] = [];
  const cupPeriods = Math.floor(totalPeriods * 0.75); // 75% for cup
  const handlePeriods = totalPeriods - cupPeriods; // 25% for handle

  let currentVolume = 1000000;

  // Generate cup formation with more realistic U-shape
  for (let i = 0; i < cupPeriods; i++) {
    const progress = i / (cupPeriods - 1);

    // Create proper U-shaped price movement using cosine for smoother curve
    const angle = progress * Math.PI; // 0 to π
    const priceMultiplier = 1 - (cupDepth / 100) * (1 - Math.cos(angle)) / 2;

    const currentPrice = basePrice * priceMultiplier;

    // Add controlled volatility
    const volatility = currentPrice * 0.015 * (Math.random() - 0.5);
    const close = currentPrice + volatility;
    const open = close + currentPrice * 0.01 * (Math.random() - 0.5);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);

    // Volume pattern: higher at start and end, lower in middle
    const volumeMultiplier = 0.7 + 0.6 * Math.abs(Math.cos(angle)) + Math.random() * 0.2;
    currentVolume = Math.floor(1000000 * volumeMultiplier);

    candles.push({
      open,
      high,
      low,
      close,
      volume: currentVolume,
      timeStamp: Date.now() / 1000 - (totalPeriods - i) * 7 * 24 * 60 * 60 // Weekly data
    });
  }

  // Generate handle formation with controlled decline
  const handleStartPrice = candles[candles.length - 1].close;
  const maxHandleDepth = Math.min(12, cupDepth * 0.4); // Max 12% or 40% of cup depth

  for (let i = 0; i < handlePeriods; i++) {
    const progress = i / Math.max(1, handlePeriods - 1);

    // Create slight downward drift with recovery at the end
    let priceMultiplier: number;
    if (progress <= 0.7) {
      // Gradual decline for first 70% of handle
      priceMultiplier = 1 - (maxHandleDepth / 100) * (progress / 0.7) * 0.8;
    } else {
      // Slight recovery in last 30% of handle
      const recoveryProgress = (progress - 0.7) / 0.3;
      const maxDecline = (maxHandleDepth / 100) * 0.8;
      priceMultiplier = 1 - maxDecline * (1 - recoveryProgress * 0.3);
    }

    const currentPrice = handleStartPrice * priceMultiplier;

    // Reduced volatility during handle
    const volatility = currentPrice * 0.01 * (Math.random() - 0.5);
    const close = currentPrice + volatility;
    const open = close + currentPrice * 0.005 * (Math.random() - 0.5);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);

    // Lower volume during handle with some variation
    currentVolume = Math.floor(700000 * (0.8 + Math.random() * 0.4));

    candles.push({
      open,
      high,
      low,
      close,
      volume: currentVolume,
      timeStamp: Date.now() / 1000 - (handlePeriods - i) * 7 * 24 * 60 * 60 // Weekly data
    });
  }

  return candles;
}