import { analyzeHeadAndShouldersPattern, generateMockHeadAndShouldersData } from '../indicators/headAndShoulders';
import { getCandles } from './helper/getCandles';
import { loadTestData } from '../util/testDataLoader';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

/**
 * Head and Shoulders pattern analysis command
 */
export async function headAndShouldersPattern(
  symbol: string,
  options: {
    minPatternPeriods?: number;
    maxPatternPeriods?: number;
    testData?: string;
    live?: boolean;
    mock?: boolean;
  } = {}
): Promise<void> {
  try {
    console.log(`\n🔍 Head and Shoulders Pattern Analysis for ${symbol.toUpperCase()}`);
    console.log('=' .repeat(60));

    let candles: Candle[];
    let dataSource = '';

    // Determine data source
    if (options.live) {
      console.log('📡 Fetching live market data...');
      candles = await getCandles(symbol);
      dataSource = 'Live API Data';
    } else if (options.testData) {
      console.log(`📊 Loading test data: ${options.testData}`);
      const testData = loadTestData(options.testData);
      candles = testData.candles;
      dataSource = `Test Data: ${options.testData}`;
    } else {
      console.log('🎭 Generating mock data with Head and Shoulders pattern...');
      candles = generateMockHeadAndShouldersData(150, 25, 80);
      dataSource = 'Mock Data';
    }

    console.log(`📈 Data loaded: ${candles.length} candles from ${dataSource}`);
    console.log('');

    // Perform analysis
    const analysis = analyzeHeadAndShouldersPattern(
      candles,
      options.minPatternPeriods || 20,
      options.maxPatternPeriods || 100
    );

    // Display results
    displayHeadAndShouldersAnalysis(analysis, symbol.toUpperCase());

  } catch (error) {
    console.error('❌ Error analyzing Head and Shoulders pattern:', error);
    process.exit(1);
  }
}

/**
 * Quick Head and Shoulders analysis for JSON output
 */
export async function quickHeadAndShoulders(
  symbol: string,
  options: {
    minPatternPeriods?: number;
    maxPatternPeriods?: number;
    testData?: string;
    live?: boolean;
  } = {}
): Promise<void> {
  try {
    let candles: Candle[];

    if (options.live) {
      candles = await getCandles(symbol);
    } else if (options.testData) {
      const testData = loadTestData(options.testData);
      candles = testData.candles;
    } else {
      candles = generateMockHeadAndShouldersData(150, 25, 80);
    }

    const analysis = analyzeHeadAndShouldersPattern(
      candles,
      options.minPatternPeriods || 20,
      options.maxPatternPeriods || 100
    );

    // Output JSON for API consumption
    const result = {
      symbol: symbol.toUpperCase(),
      isPattern: analysis.pattern.isPattern,
      confidence: analysis.pattern.confidence,
      signal: analysis.signal,
      stage: analysis.stage,
      strength: analysis.strength,
      breakoutLevel: analysis.pattern.breakoutLevel,
      targetPrice: analysis.pattern.targetPrice,
      stopLoss: analysis.pattern.stopLoss,
      riskReward: analysis.riskReward,
      timestamp: Math.floor(Date.now() / 1000)
    };

    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error in quick Head and Shoulders analysis:', error);
    process.exit(1);
  }
}

/**
 * Head and Shoulders analysis with detailed breakdown
 */
export async function headAndShouldersAnalysis(
  symbol: string,
  options: {
    minPatternPeriods?: number;
    maxPatternPeriods?: number;
    testData?: string;
    live?: boolean;
  } = {}
): Promise<void> {
  try {
    let candles: Candle[];
    let dataSource = '';

    if (options.live) {
      candles = await getCandles(symbol);
      dataSource = 'Live API Data';
    } else if (options.testData) {
      const testData = loadTestData(options.testData);
      candles = testData.candles;
      dataSource = `Test Data: ${options.testData}`;
    } else {
      candles = generateMockHeadAndShouldersData(150, 25, 80);
      dataSource = 'Mock Data';
    }

    const analysis = analyzeHeadAndShouldersPattern(
      candles,
      options.minPatternPeriods || 20,
      options.maxPatternPeriods || 100
    );

    // Display comprehensive analysis
    console.log(`\n📊 Head and Shoulders Pattern Analysis for ${symbol.toUpperCase()}`);
    console.log('=' .repeat(70));
    console.log(`Data Source: ${dataSource} (${candles.length} periods)`);
    console.log('');

    displayHeadAndShouldersAnalysis(analysis, symbol.toUpperCase());

    // Additional technical details
    console.log('\n🔧 Technical Details:');
    console.log('-' .repeat(40));
    console.log(`Pattern Duration: ${analysis.pattern.patternDuration} periods`);
    console.log(`Left Shoulder Height: $${analysis.pattern.leftShoulderHeight.toFixed(2)}`);
    console.log(`Head Height: $${analysis.pattern.headHeight.toFixed(2)}`);
    console.log(`Right Shoulder Height: $${analysis.pattern.rightShoulderHeight.toFixed(2)}`);
    console.log(`Neckline Slope: ${analysis.pattern.necklineSlope.toFixed(4)}`);
    console.log(`Volume Confirmation: ${analysis.pattern.volumeConfirmation ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('Error in Head and Shoulders analysis:', error);
    process.exit(1);
  }
}

/**
 * Display Head and Shoulders analysis results
 */
function displayHeadAndShouldersAnalysis(analysis: any, symbol: string): void {
  if (!analysis.pattern.isPattern) {
    console.log('❌ No Head and Shoulders Pattern Detected');
    console.log('');
    console.log('Reasons:');
    analysis.pattern.reasons.forEach((reason: string) => {
      console.log(`  ${reason}`);
    });
    return;
  }

  console.log(`✅ Head and Shoulders Pattern Detected - ${analysis.pattern.confidence} Confidence`);
  console.log('');

  // Pattern Status
  console.log('📊 Pattern Status:');
  console.log('-' .repeat(30));
  console.log(`Current Stage: ${analysis.stage}`);
  console.log(`Signal: ${analysis.signal}`);
  console.log(`Strength: ${analysis.strength}/100`);
  console.log('');

  // Trading Levels
  console.log('🎯 Trading Levels:');
  console.log('-' .repeat(30));
  console.log(`Neckline (Entry): $${analysis.pattern.breakoutLevel.toFixed(2)}`);
  console.log(`Target Price: $${analysis.pattern.targetPrice.toFixed(2)}`);
  console.log(`Stop Loss: $${analysis.pattern.stopLoss.toFixed(2)}`);
  console.log(`Risk/Reward: ${analysis.riskReward.toFixed(2)}:1`);
  console.log('');

  // Trading Strategy
  console.log('💡 Trading Strategy:');
  console.log('-' .repeat(30));
  console.log(`Entry: ${analysis.tradingStrategy.entry}`);
  console.log(`Exit: ${analysis.tradingStrategy.exit}`);
  console.log('');

  // Pattern Analysis
  console.log('🔍 Pattern Analysis:');
  console.log('-' .repeat(30));
  analysis.interpretation.forEach((line: string) => {
    console.log(`  ${line}`);
  });
  console.log('');

  // Pattern Validation
  console.log('✅ Pattern Validation:');
  console.log('-' .repeat(30));
  analysis.pattern.reasons.forEach((reason: string) => {
    console.log(`  ${reason}`);
  });
}

/**
 * List available test data files
 */
export function listTestData(): void {
  console.log('\n📁 Available Test Data Files:');
  console.log('-' .repeat(40));
  console.log('  ibm-recent-data     - IBM recent market data');
  console.log('  ibm-full-data       - IBM full historical data');
  console.log('  aapl-jan-apr-2025-mock - AAPL mock data (Jan-Apr 2025)');
  console.log('');
  console.log('Usage: --test-data <filename>');
  console.log('Example: npm start head-and-shoulders AAPL --test-data ibm-recent-data');
}
