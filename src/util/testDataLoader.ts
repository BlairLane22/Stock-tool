import * as fs from 'fs';
import * as path from 'path';

interface TestCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface ExpectedPattern {
  type: string;
  confidence?: string;
  cupStart?: number;
  cupBottom?: number;
  cupEnd?: number;
  handleStart?: number;
  handleEnd?: number;
  cupDepth?: number;
  handleDepth?: number;
  breakoutLevel?: number;
  targetPrice?: number;
  riskReward?: number;
  shouldDetect?: boolean;
  reason?: string;
}

interface TestDataFile {
  symbol: string;
  timeframe: string;
  description: string;
  expectedPattern: ExpectedPattern;
  candles: TestCandle[];
}

/**
 * Load test data from JSON file
 * @param filename Name of the test data file (without .json extension)
 * @returns Test data object
 */
export function loadTestData(filename: string): TestDataFile {
  // Try multiple possible paths for test data
  const possiblePaths = [
    path.join(__dirname, '../../test-data'),
    path.join(process.cwd(), 'test-data'),
    path.join(__dirname, '../../../test-data')
  ];

  let filePath: string | null = null;
  for (const testDataDir of possiblePaths) {
    const candidatePath = path.join(testDataDir, `${filename}.json`);
    if (fs.existsSync(candidatePath)) {
      filePath = candidatePath;
      break;
    }
  }

  if (!filePath) {
    throw new Error(`Test data file not found: ${filename}.json. Searched in: ${possiblePaths.join(', ')}`);
  }
  

  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testData: TestDataFile = JSON.parse(fileContent);
    
    // Validate required fields
    if (!testData.candles || !Array.isArray(testData.candles)) {
      throw new Error(`Invalid test data: candles array is required`);
    }
    
    if (testData.candles.length === 0) {
      throw new Error(`Invalid test data: candles array cannot be empty`);
    }
    
    // Validate candle structure
    testData.candles.forEach((candle, index) => {
      const requiredFields = ['open', 'high', 'low', 'close', 'volume', 'timeStamp'];
      for (const field of requiredFields) {
        if (!(field in candle) || typeof candle[field as keyof TestCandle] !== 'number') {
          throw new Error(`Invalid candle at index ${index}: missing or invalid ${field}`);
        }
      }
      
      // Basic OHLC validation
      if (candle.high < Math.max(candle.open, candle.close)) {
        throw new Error(`Invalid candle at index ${index}: high must be >= max(open, close)`);
      }
      
      if (candle.low > Math.min(candle.open, candle.close)) {
        throw new Error(`Invalid candle at index ${index}: low must be <= min(open, close)`);
      }
      
      if (candle.volume < 0) {
        throw new Error(`Invalid candle at index ${index}: volume must be >= 0`);
      }
    });
    
    return testData;
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in test data file: ${filePath}`);
    }
    throw error;
  }
}

/**
 * List available test data files
 * @returns Array of available test data file names (without .json extension)
 */
export function listTestDataFiles(): string[] {
  // Try multiple possible paths for test data
  const possiblePaths = [
    path.join(__dirname, '../../test-data'),
    path.join(process.cwd(), 'test-data'),
    path.join(__dirname, '../../../test-data')
  ];

  for (const testDataDir of possiblePaths) {
    if (fs.existsSync(testDataDir)) {
      try {
        const files = fs.readdirSync(testDataDir);
        return files
          .filter(file => file.endsWith('.json') && file !== 'README.md')
          .map(file => file.replace('.json', ''))
          .sort();
      } catch (error) {
        console.warn(`Warning: Could not read test data directory: ${error}`);
        continue;
      }
    }
  }

  return [];
}

/**
 * Validate test data against expected pattern results
 * @param testData Test data with expected results
 * @param actualResult Actual pattern detection result
 * @returns Validation result with details
 */
export function validateTestResult(
  testData: TestDataFile, 
  actualResult: any
): {
  passed: boolean;
  details: string[];
  score: number;
} {
  const details: string[] = [];
  let score = 0;
  const maxScore = 100;
  
  const expected = testData.expectedPattern;
  
  // Test pattern detection
  if (expected.shouldDetect !== undefined) {
    if (actualResult.isPattern === expected.shouldDetect) {
      score += 30;
      details.push(`✅ Pattern detection: ${actualResult.isPattern} (expected: ${expected.shouldDetect})`);
    } else {
      details.push(`❌ Pattern detection: ${actualResult.isPattern} (expected: ${expected.shouldDetect})`);
    }
  }
  
  // Test confidence level (only if pattern should be detected)
  if (expected.shouldDetect && expected.confidence && actualResult.isPattern) {
    if (actualResult.confidence === expected.confidence) {
      score += 20;
      details.push(`✅ Confidence level: ${actualResult.confidence} (expected: ${expected.confidence})`);
    } else {
      details.push(`⚠️ Confidence level: ${actualResult.confidence} (expected: ${expected.confidence})`);
    }
  }
  
  // Test pattern measurements (only if pattern detected)
  if (actualResult.isPattern && expected.shouldDetect) {
    // Cup depth tolerance: ±2%
    if (expected.cupDepth !== undefined) {
      const depthDiff = Math.abs(actualResult.cupDepth - expected.cupDepth);
      if (depthDiff <= 2.0) {
        score += 15;
        details.push(`✅ Cup depth: ${actualResult.cupDepth.toFixed(1)}% (expected: ~${expected.cupDepth}%)`);
      } else {
        details.push(`⚠️ Cup depth: ${actualResult.cupDepth.toFixed(1)}% (expected: ~${expected.cupDepth}%, diff: ${depthDiff.toFixed(1)}%)`);
      }
    }
    
    // Handle depth tolerance: ±3%
    if (expected.handleDepth !== undefined) {
      const handleDiff = Math.abs(actualResult.handleDepth - expected.handleDepth);
      if (handleDiff <= 3.0) {
        score += 15;
        details.push(`✅ Handle depth: ${actualResult.handleDepth.toFixed(1)}% (expected: ~${expected.handleDepth}%)`);
      } else {
        details.push(`⚠️ Handle depth: ${actualResult.handleDepth.toFixed(1)}% (expected: ~${expected.handleDepth}%, diff: ${handleDiff.toFixed(1)}%)`);
      }
    }
    
    // Pattern points tolerance: ±3 periods
    if (expected.cupStart !== undefined) {
      const startDiff = Math.abs(actualResult.cupStart - expected.cupStart);
      if (startDiff <= 3) {
        score += 5;
        details.push(`✅ Cup start: ${actualResult.cupStart} (expected: ~${expected.cupStart})`);
      } else {
        details.push(`⚠️ Cup start: ${actualResult.cupStart} (expected: ~${expected.cupStart}, diff: ${startDiff})`);
      }
    }
    
    if (expected.cupBottom !== undefined) {
      const bottomDiff = Math.abs(actualResult.cupBottom - expected.cupBottom);
      if (bottomDiff <= 3) {
        score += 5;
        details.push(`✅ Cup bottom: ${actualResult.cupBottom} (expected: ~${expected.cupBottom})`);
      } else {
        details.push(`⚠️ Cup bottom: ${actualResult.cupBottom} (expected: ~${expected.cupBottom}, diff: ${bottomDiff})`);
      }
    }
    
    // Risk/reward ratio tolerance: ±0.5
    if (expected.riskReward !== undefined && actualResult.breakoutLevel && actualResult.targetPrice && actualResult.stopLoss) {
      const riskAmount = actualResult.breakoutLevel - actualResult.stopLoss;
      const rewardAmount = actualResult.targetPrice - actualResult.breakoutLevel;
      const actualRR = riskAmount > 0 ? rewardAmount / riskAmount : 0;
      const rrDiff = Math.abs(actualRR - expected.riskReward);
      
      if (rrDiff <= 0.5) {
        score += 10;
        details.push(`✅ Risk/Reward: ${actualRR.toFixed(1)}:1 (expected: ~${expected.riskReward}:1)`);
      } else {
        details.push(`⚠️ Risk/Reward: ${actualRR.toFixed(1)}:1 (expected: ~${expected.riskReward}:1, diff: ${rrDiff.toFixed(1)})`);
      }
    }
  }
  
  // Add reason if pattern not detected as expected
  if (!actualResult.isPattern && expected.reason) {
    details.push(`📝 Expected reason: ${expected.reason}`);
    if (actualResult.reasons && actualResult.reasons.length > 0) {
      details.push(`📝 Actual reasons: ${actualResult.reasons.join(', ')}`);
    }
  }
  
  const passed = score >= 70; // 70% threshold for passing
  
  details.unshift(`📊 Validation Score: ${score}/${maxScore} (${(score/maxScore*100).toFixed(1)}%)`);
  details.unshift(`🎯 Test Result: ${passed ? 'PASSED' : 'FAILED'}`);
  
  return {
    passed,
    details,
    score
  };
}

/**
 * Run pattern analysis on test data and validate results
 * @param filename Test data filename
 * @param patternAnalysisFunction Function to run pattern analysis
 * @returns Test results with validation
 */
export function runTestDataAnalysis(
  filename: string,
  patternAnalysisFunction: (candles: TestCandle[]) => any
): {
  testData: TestDataFile;
  result: any;
  validation: ReturnType<typeof validateTestResult>;
} {
  const testData = loadTestData(filename);
  const result = patternAnalysisFunction(testData.candles);
  const validation = validateTestResult(testData, result);
  
  return {
    testData,
    result,
    validation
  };
}
