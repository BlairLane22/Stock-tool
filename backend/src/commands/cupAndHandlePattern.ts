import { cupAndHandle, analyzeCupAndHandle, generateCupAndHandleMockData } from '../chartPatterns/cupAndHandle';
import { getCandles } from './helper/getCandles';
import { getQuote } from '../util/rest';
import { loadTestData, validateTestResult, listTestDataFiles } from '../util/testDataLoader';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export async function cupAndHandlePattern(
  symbol: string,
  useMockData: boolean = false,
  testDataFile?: string
): Promise<void> {
  console.log(`\n=== Cup and Handle Pattern Analysis for ${symbol.toUpperCase()} ===\n`);

  try {
    let candles: Candle[];
    let currentPrice: number;
    let testData: any = null;

    if (testDataFile) {
      console.log(`📊 Using test data file: ${testDataFile}.json\n`);
      testData = loadTestData(testDataFile);
      candles = testData.candles;
      currentPrice = candles[candles.length - 1].close;
      console.log(`📋 Test Description: ${testData.description}\n`);
    } else if (useMockData) {
      console.log('📊 Using generated mock data for demonstration\n');
      candles = generateCupAndHandleMockData(100, 25, 60);
      currentPrice = candles[candles.length - 1].close;
    } else {
      // Get current quote
      const quote = await getQuote(symbol.toUpperCase());
      currentPrice = quote.current;
      
      // Try to get historical data, fall back to mock data if API fails
      try {
        candles = await getCandles(symbol);
        if (candles.length < 40) {
          console.log('⚠️  Insufficient historical data from API, using mock data for demonstration');
          candles = generateCupAndHandleMockData(currentPrice, 25, 60);
        }
      } catch (error) {
        console.log('⚠️  API error fetching historical data, using mock data for demonstration');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        candles = generateCupAndHandleMockData(currentPrice, 25, 60);
      }
    }
    
    console.log(`📈 Analyzing ${candles.length} periods of price data`);
    console.log(`💰 Current Price: $${currentPrice.toFixed(2)}\n`);
    
    // Perform cup and handle analysis
    const startTime = new Date();
    const analysis = analyzeCupAndHandle(candles);
    const duration = ((new Date().valueOf() - startTime.valueOf()) / 1000).toFixed(4);
    console.log(`⏱️  Analysis completed in ${duration} seconds\n`);
    
    // Display analysis results
    analysis.analysis.forEach(line => console.log(line));

    // If using test data, validate results
    if (testData) {
      console.log('\n🧪 Test Data Validation:');
      const validation = validateTestResult(testData, analysis.result);
      validation.details.forEach(detail => console.log(`  ${detail}`));
      console.log('');
    }
    
    // Additional technical details
    if (analysis.result.isPattern) {
      console.log('🔍 Technical Details:');
      console.log(`  Cup Formation: Periods ${analysis.result.cupStart} to ${analysis.result.cupEnd}`);
      console.log(`  Cup Bottom: Period ${analysis.result.cupBottom}`);
      console.log(`  Handle Formation: Periods ${analysis.result.handleStart} to ${analysis.result.handleEnd}`);
      console.log(`  Pattern Duration: ${analysis.result.patternDuration} periods`);
      console.log('');
      
      console.log('📊 Price Levels:');
      const cupStartPrice = candles[analysis.result.cupStart]?.close || 0;
      const cupBottomPrice = candles[analysis.result.cupBottom]?.close || 0;
      const cupEndPrice = candles[analysis.result.cupEnd]?.close || 0;
      const handleStartPrice = candles[analysis.result.handleStart]?.close || 0;
      const handleEndPrice = candles[analysis.result.handleEnd]?.close || 0;
      
      console.log(`  Cup Start Price: $${cupStartPrice.toFixed(2)}`);
      console.log(`  Cup Bottom Price: $${cupBottomPrice.toFixed(2)}`);
      console.log(`  Cup End Price: $${cupEndPrice.toFixed(2)}`);
      console.log(`  Handle Start Price: $${handleStartPrice.toFixed(2)}`);
      console.log(`  Handle End Price: $${handleEndPrice.toFixed(2)}`);
      console.log('');
    }
    
    // Trading strategy recommendations
    console.log('📋 Trading Strategy:');
    if (analysis.tradingRecommendation.action === 'BUY') {
      console.log('  🟢 BULLISH SETUP DETECTED');
      console.log('  📈 Strong cup and handle pattern formation');
      console.log('  💡 Consider entering on breakout above resistance');
      console.log('  ⚠️  Wait for volume confirmation on breakout');
      console.log('  🎯 Use trailing stops to protect profits');
    } else if (analysis.tradingRecommendation.action === 'HOLD') {
      console.log('  🟡 MODERATE SETUP');
      console.log('  📊 Pattern shows potential but needs confirmation');
      console.log('  👀 Monitor for volume increase and price breakout');
      console.log('  ⏳ Wait for stronger signals before entering');
    } else {
      console.log('  🔴 NO CLEAR SETUP');
      console.log('  📉 Pattern not strong enough for immediate action');
      console.log('  🔍 Continue monitoring for pattern development');
      console.log('  📚 Consider other technical analysis methods');
    }
    console.log('');
    
    // Risk management guidelines
    // console.log('⚠️  Risk Management Guidelines:');
    // console.log('  • Never risk more than 1-2% of account on single trade');
    // console.log('  • Set stop loss immediately after entry');
    // console.log('  • Consider partial profit taking at resistance levels');
    // console.log('  • Monitor volume for breakout confirmation');
    // console.log('  • Be prepared for false breakouts');
    // console.log('');
    
    // Educational information
    // console.log('📚 Cup and Handle Pattern Education:');
    // console.log('  • Bullish continuation pattern discovered by William O\'Neil');
    // console.log('  • Cup: U-shaped decline and recovery (not V-shaped)');
    // console.log('  • Handle: Slight downward drift after cup completion');
    // console.log('  • Breakout: Price breaks above resistance with volume');
    // console.log('  • Target: Cup depth added to breakout level');
    // console.log('  • Best in uptrending markets with strong fundamentals');
    // console.log('');
    
    // Pattern statistics
    if (analysis.result.isPattern) {
      console.log('📊 Pattern Statistics:');
      console.log(`  Success Rate: ~65-70% (historical average)`);
      console.log(`  Average Gain: ~20-30% from breakout`);
      console.log(`  Time to Target: 3-6 months typically`);
      console.log(`  False Breakout Rate: ~25-30%`);
      console.log('');
    }
    
  } catch (error) {
    console.error(`Error analyzing cup and handle pattern for ${symbol}:`, 
                  error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Utility function to run pattern analysis with different parameters
export async function cupAndHandleAnalysis(
  symbol: string,
  minCupPeriods: number = 15,
  maxCupPeriods: number = 130,
  minHandlePeriods: number = 5,
  maxHandlePeriods: number = 25
): Promise<void> {
  console.log(`\n=== Advanced Cup and Handle Analysis for ${symbol.toUpperCase()} ===\n`);
  console.log(`Parameters: Cup(${minCupPeriods}-${maxCupPeriods}), Handle(${minHandlePeriods}-${maxHandlePeriods})\n`);
  
  try {
    // Get data
    const quote = await getQuote(symbol.toUpperCase());
    let candles: Candle[];
    
    try {
      candles = await getCandles(symbol);
      if (candles.length < minCupPeriods + minHandlePeriods + 10) {
        console.log('⚠️  Using mock data due to insufficient historical data');
        candles = generateCupAndHandleMockData(quote.current, 25, 80);
      }
    } catch (error) {
      console.log('⚠️  Using mock data due to API error');
      candles = generateCupAndHandleMockData(quote.current, 25, 80);
    }
    
    // Run analysis with custom parameters
    const result = cupAndHandle(candles, minCupPeriods, maxCupPeriods, minHandlePeriods, maxHandlePeriods);
    
    console.log('🔍 Custom Parameter Analysis Results:');
    console.log(`Pattern Detected: ${result.isPattern ? 'YES' : 'NO'}`);
    console.log(`Confidence Level: ${result.confidence}`);
    console.log('');
    
    if (result.isPattern) {
      console.log('📊 Pattern Metrics:');
      console.log(`  Cup Depth: ${result.cupDepth.toFixed(1)}%`);
      console.log(`  Handle Depth: ${result.handleDepth.toFixed(1)}%`);
      console.log(`  Total Duration: ${result.patternDuration} periods`);
      console.log(`  Volume Confirmation: ${result.volumeConfirmation ? 'Yes' : 'No'}`);
      console.log('');
      
      console.log('💰 Trading Levels:');
      console.log(`  Entry (Breakout): $${result.breakoutLevel.toFixed(2)}`);
      console.log(`  Target Price: $${result.targetPrice.toFixed(2)}`);
      console.log(`  Stop Loss: $${result.stopLoss.toFixed(2)}`);
      
      const riskAmount = result.breakoutLevel - result.stopLoss;
      const rewardAmount = result.targetPrice - result.breakoutLevel;
      const riskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;
      console.log(`  Risk/Reward: ${riskReward.toFixed(2)}:1`);
      console.log('');
    }
    
    console.log('📝 Analysis Details:');
    result.reasons.forEach(reason => console.log(`  ${reason}`));
    
  } catch (error) {
    console.error(`Error in advanced analysis:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// List available test data files
export function listTestData(): void {
  console.log('\n=== Available Test Data Files ===\n');

  const testFiles = listTestDataFiles();

  if (testFiles.length === 0) {
    console.log('No test data files found in test-data directory.');
    return;
  }

  console.log('📁 Test Data Files:');
  testFiles.forEach(file => {
    try {
      const testData = loadTestData(file);
      const patternType = testData.expectedPattern.type;
      const confidence = testData.expectedPattern.confidence || 'N/A';
      const shouldDetect = testData.expectedPattern.shouldDetect !== false;

      console.log(`  📄 ${file}.json`);
      console.log(`     Symbol: ${testData.symbol}`);
      console.log(`     Pattern: ${patternType} (${confidence})`);
      console.log(`     Should Detect: ${shouldDetect ? 'Yes' : 'No'}`);
      console.log(`     Description: ${testData.description}`);
      console.log(`     Candles: ${testData.candles.length} periods`);
      console.log('');
    } catch (error) {
      console.log(`  ❌ ${file}.json - Error loading: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('');
    }
  });

  console.log('💡 Usage Examples:');
  console.log('  npm start cup-handle TEST --test-data cup-and-handle-strong');
  console.log('  npm start cup-handle TEST --test-data no-pattern-trending');
  console.log('  npm start cup-handle TEST --test-data false-v-shaped-recovery');
}
