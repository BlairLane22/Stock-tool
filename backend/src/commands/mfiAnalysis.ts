import { analyzeMFI, getMFI, Candle } from '../indicators/moneyFlowIndex';
import { getCandles } from './helper/getCandles';
import { getQuote } from '../util/rest';
import { loadTestData } from '../util/testDataLoader';

/**
 * Money Flow Index (MFI) Analysis Command - API endpoint for MFI calculations
 * Can be called from other projects as a trading indicator service
 */

interface MFICommandOptions {
  period?: number;
  customLevels?: {
    oversold?: number;
    overbought?: number;
    extremeOversold?: number;
    extremeOverbought?: number;
  };
  testData?: string;
  mock?: boolean;
}

/**
 * Main MFI Analysis function - API entry point
 * @param symbol Stock symbol to analyze
 * @param options MFI analysis options
 * @returns Complete MFI analysis results
 */
export async function mfiAnalysis(
  symbol: string,
  options: MFICommandOptions = {}
): Promise<any> {
  console.log(`\n=== Money Flow Index (MFI) Analysis for ${symbol.toUpperCase()} ===\n`);
  
  const {
    period = 14,
    customLevels,
    testData,
    mock = false
  } = options;

  try {
    let candles: Candle[];
    let currentPrice: number;
    let dataSource = 'API';

    // Get candle data
    if (testData) {
      console.log(`📊 Using test data: ${testData}.json\n`);
      const testDataObj = loadTestData(testData);
      candles = testDataObj.candles;
      currentPrice = candles[candles.length - 1].close;
      dataSource = 'Test Data';
    } else if (mock) {
      console.log('📊 Using mock data for demonstration\n');
      candles = generateMockCandles(symbol, 200);
      currentPrice = candles[candles.length - 1].close;
      dataSource = 'Mock Data';
    } else {
      // Get real market data
      const quote = await getQuote(symbol.toUpperCase());
      candles = await getCandles(symbol);
      currentPrice = quote.current;
      
      if (candles.length < period + 10) {
        console.log('⚠️ Insufficient historical data, using mock data');
        candles = generateMockCandles(symbol, 200);
        dataSource = 'Mock Data (API insufficient)';
      }
    }

    console.log(`📈 Data Source: ${dataSource}`);
    console.log(`📊 Candles: ${candles.length} periods`);
    console.log(`💰 Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`⚙️ Settings: ${period}-period MFI\n`);

    // Perform MFI analysis
    const analysis = analyzeMFI(candles, period, customLevels);
    
    // Display current MFI values
    console.log('📊 Current Money Flow Index:');
    console.log(`   MFI Value: ${analysis.mfi.current.toFixed(1)} (Previous: ${analysis.mfi.previous.toFixed(1)})`);
    console.log(`   Money Flow Ratio: ${analysis.mfi.moneyFlowRatio.toFixed(2)}`);
    console.log(`   Positive Money Flow: $${(analysis.mfi.positiveMoneyFlow / 1000000).toFixed(1)}M`);
    console.log(`   Negative Money Flow: $${(analysis.mfi.negativeMoneyFlow / 1000000).toFixed(1)}M`);
    console.log('');
    
    // Display key metrics
    console.log('📈 Key Metrics:');
    console.log(`   Signal: ${analysis.signal}`);
    console.log(`   Strength: ${analysis.strength.replace(/_/g, ' ')}`);
    console.log(`   Trend: ${analysis.trend}`);
    console.log(`   Momentum: ${analysis.momentum}`);
    console.log(`   Volume Strength: ${analysis.volumeStrength}`);
    
    if (analysis.divergence !== 'NONE') {
      console.log(`   Divergence: ${analysis.divergence}`);
    }
    console.log('');
    
    // Display trading levels
    console.log('📋 Trading Levels:');
    console.log(`   Oversold: ${analysis.tradingLevels.oversoldThreshold}`);
    console.log(`   Overbought: ${analysis.tradingLevels.overboughtThreshold}`);
    console.log(`   Extreme Oversold: ${analysis.tradingLevels.extremeOversold}`);
    console.log(`   Extreme Overbought: ${analysis.tradingLevels.extremeOverbought}`);
    console.log('');
    
    // Display interpretation
    console.log('💡 Analysis Interpretation:');
    analysis.interpretation.forEach(line => console.log(`   ${line}`));
    console.log('');
    
    // Display MFI chart
    displayMFIChart(candles, analysis, period);
    
    // Educational information
    // displayMFIEducation();
    
    return analysis;

  } catch (error) {
    console.error(`❌ Error analyzing MFI for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Generate mock candle data for testing
 */
function generateMockCandles(symbol: string, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 100 + Math.random() * 100;
  
  for (let i = 0; i < count; i++) {
    const dailyChange = (Math.random() - 0.5) * 0.05;
    const trendFactor = Math.sin(i / 25) * 0.002;
    
    price = price * (1 + dailyChange + trendFactor);
    
    const volatility = 0.02;
    const open = i === 0 ? price : candles[i - 1].close;
    const high = Math.max(open, price) * (1 + Math.random() * volatility);
    const low = Math.min(open, price) * (1 - Math.random() * volatility);
    const close = price;
    
    // Volume correlates with price movement for more realistic MFI
    const priceChange = Math.abs(close - open);
    const baseVolume = 1000000;
    const volumeMultiplier = 1 + (priceChange / price) * 5; // Higher volume on bigger moves
    const volume = Math.floor(baseVolume * volumeMultiplier * (0.5 + Math.random()));
    
    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      timeStamp: Date.now() / 1000 - (count - i) * 24 * 60 * 60
    });
  }
  
  return candles;
}

/**
 * Display a simple text-based MFI chart
 */
function displayMFIChart(candles: Candle[], analysis: any, period: number): void {
  if (analysis.mfi.values.length < 20) return;
  
  console.log('📈 MFI Chart (Last 20 periods):');
  console.log('   0    20   40   50   60   80   100');
  console.log('   |    |    |    |    |    |    |');
  
  const recent = analysis.mfi.values.slice(-20);
  recent.forEach((mfi: number, index: number) => {
    const position = Math.round(mfi / 100 * 30);
    const bar = ' '.repeat(position) + '●';
    const value = mfi.toFixed(1).padStart(5);
    console.log(`${value} ${bar}`);
  });
  
  console.log('   |    |    |    |    |    |    |');
  console.log('   0    20   40   50   60   80   100');
  console.log('        ↑         ↑         ↑');
  console.log('    Oversold   Neutral  Overbought\n');
}

/**
 * Display MFI educational information
 */
function displayMFIEducation(): void {
  console.log('📚 Money Flow Index (MFI) Education:');
  console.log('');
  console.log('🔍 What is MFI?');
  console.log('   The Money Flow Index combines price and volume to measure buying/selling pressure');
  console.log('   Often called "volume-weighted RSI" - oscillates between 0 and 100');
  console.log('   Uses typical price (H+L+C)/3 multiplied by volume for money flow calculation');
  console.log('');
  console.log('📊 MFI Calculation:');
  console.log('   • Typical Price = (High + Low + Close) / 3');
  console.log('   • Raw Money Flow = Typical Price × Volume');
  console.log('   • Positive/Negative Money Flow based on typical price direction');
  console.log('   • MFI = 100 - (100 / (1 + Money Flow Ratio))');
  console.log('');
  console.log('🎯 Trading Strategies:');
  console.log('   • Buy when MFI crosses above 20 (oversold with volume support)');
  console.log('   • Sell when MFI crosses below 80 (overbought with volume confirmation)');
  console.log('   • Look for divergences between price and MFI');
  console.log('   • Strong volume confirms price movements');
  console.log('');
  console.log('📈 MFI vs RSI:');
  console.log('   • MFI includes volume data, RSI uses only price');
  console.log('   • MFI typically more sensitive to market changes');
  console.log('   • MFI better at confirming breakouts with volume');
  console.log('   • Use together for comprehensive momentum analysis');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('   • MFI can remain overbought/oversold during strong trends');
  console.log('   • Volume spikes can cause temporary MFI distortions');
  console.log('   • Always combine with price action and other indicators');
  console.log('   • Consider market context and overall trend direction');
}

/**
 * Quick MFI calculation for API calls
 * @param symbol Stock symbol
 * @param period MFI period (default: 14)
 * @returns Simple MFI result
 */
export async function quickMFI(symbol: string, period: number = 14): Promise<{
  symbol: string;
  mfi: number;
  signal: string;
  moneyFlowRatio: number;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    const analysis = analyzeMFI(candles, period);
    
    return {
      symbol: symbol.toUpperCase(),
      mfi: parseFloat(analysis.mfi.current.toFixed(2)),
      signal: analysis.signal,
      moneyFlowRatio: parseFloat(analysis.mfi.moneyFlowRatio.toFixed(2)),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate MFI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
