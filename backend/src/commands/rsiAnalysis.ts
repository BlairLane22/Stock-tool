import { analyzeRSI, calculateRSI, getMultiTimeframeRSI, Candle } from '../indicators/rsi';
import { getCandles } from './helper/getCandles';
import { getQuote } from '../util/rest';
import { loadTestData } from '../util/testDataLoader';

/**
 * RSI Analysis Command - API endpoint for RSI calculations and analysis
 * Can be called from other projects as a trading indicator service
 */

interface RSICommandOptions {
  period?: number;
  customLevels?: {
    oversold?: number;
    overbought?: number;
    extremeOversold?: number;
    extremeOverbought?: number;
  };
  multiTimeframe?: boolean;
  periods?: number[];
  testData?: string;
  mock?: boolean;
}

/**
 * Main RSI Analysis function - API entry point
 * @param symbol Stock symbol to analyze
 * @param options RSI analysis options
 * @returns Complete RSI analysis results
 */
export async function rsiAnalysis(
  symbol: string,
  options: RSICommandOptions = {}
): Promise<any> {
  console.log(`\n=== RSI Analysis for ${symbol.toUpperCase()} ===\n`);
  
  const {
    period = 14,
    customLevels,
    multiTimeframe = false,
    periods = [14, 21, 50],
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
    console.log(`💰 Current Price: $${currentPrice.toFixed(2)}\n`);

    // Perform RSI analysis
    let results;
    
    if (multiTimeframe) {
      console.log('🔍 Multi-Timeframe RSI Analysis:\n');
      results = getMultiTimeframeRSI(candles, periods);
      
      // Display multi-timeframe results
      results.analyses.forEach((analysis, index) => {
        console.log(`📊 RSI-${periods[index]}:`);
        console.log(`   Current: ${analysis.rsi.current.toFixed(1)}`);
        console.log(`   Signal: ${analysis.signal}`);
        console.log(`   Strength: ${analysis.strength}`);
        console.log(`   Trend: ${analysis.trend}`);
        console.log('');
      });
      
      console.log(`🎯 Consensus Signal: ${results.consensus} (${results.confidence} confidence)\n`);
      
    } else {
      console.log(`🔍 RSI-${period} Analysis:\n`);
      results = analyzeRSI(candles, period, customLevels);
      
      // Display single timeframe results
      console.log(`📊 RSI Value: ${results.rsi.current.toFixed(1)} (Previous: ${results.rsi.previous.toFixed(1)})`);
      console.log(`🎯 Signal: ${results.signal}`);
      console.log(`💪 Strength: ${results.strength}`);
      console.log(`📈 Trend: ${results.trend}`);
      console.log(`⚡ Momentum: ${results.momentum}`);
      
      if (results.divergence !== 'NONE') {
        console.log(`🔄 Divergence: ${results.divergence}`);
      }
      
      console.log('\n📋 Trading Levels:');
      console.log(`   Oversold: ${results.tradingLevels.oversoldThreshold}`);
      console.log(`   Overbought: ${results.tradingLevels.overboughtThreshold}`);
      console.log(`   Extreme Oversold: ${results.tradingLevels.extremeOversold}`);
      console.log(`   Extreme Overbought: ${results.tradingLevels.extremeOverbought}`);
      
      console.log('\n💡 Interpretation:');
      results.interpretation.forEach(line => console.log(`   ${line}`));
    }

    // Display RSI chart (text-based)
    displayRSIChart(candles, period);
    
    // Educational information
    // displayRSIEducation();
    
    return results;

  } catch (error) {
    console.error(`❌ Error analyzing RSI for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Generate mock candle data for testing
 */
function generateMockCandles(symbol: string, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 100 + Math.random() * 100; // Start between $100-200
  
  for (let i = 0; i < count; i++) {
    // Create realistic price movement with some trend
    const dailyChange = (Math.random() - 0.5) * 0.06; // ±3% daily change
    const trendFactor = Math.sin(i / 20) * 0.002; // Cyclical trend
    
    price = price * (1 + dailyChange + trendFactor);
    
    const volatility = 0.015; // 1.5% intraday volatility
    const open = i === 0 ? price : candles[i - 1].close;
    const high = price * (1 + Math.random() * volatility);
    const low = price * (1 - Math.random() * volatility);
    const close = price;
    const volume = Math.floor(Math.random() * 2000000 + 500000);
    
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
 * Display a simple text-based RSI chart
 */
function displayRSIChart(candles: Candle[], period: number): void {
  const rsiValues = calculateRSI(candles, period);
  
  if (rsiValues.length < 20) return;
  
  console.log('\n📈 RSI Chart (Last 20 periods):');
  console.log('   0    20   40   50   60   80   100');
  console.log('   |    |    |    |    |    |    |');
  
  const recent = rsiValues.slice(-20);
  recent.forEach((rsi, index) => {
    const position = Math.round(rsi / 100 * 30);
    const bar = ' '.repeat(position) + '●';
    const value = rsi.toFixed(1).padStart(5);
    console.log(`${value} ${bar}`);
  });
  
  console.log('   |    |    |    |    |    |    |');
  console.log('   0    20   40   50   60   80   100');
  console.log('        ↑         ↑         ↑');
  console.log('    Oversold   Neutral  Overbought\n');
}

/**
 * Display RSI educational information
 */
function displayRSIEducation(): void {
  console.log('📚 RSI Education:');
  console.log('');
  console.log('🔍 What is RSI?');
  console.log('   The Relative Strength Index measures the speed and change of price movements');
  console.log('   Developed by J. Welles Wilder in 1978, it oscillates between 0 and 100');
  console.log('');
  console.log('📊 RSI Levels:');
  console.log('   • 70-100: Overbought (potential sell signal)');
  console.log('   • 30-70:  Neutral territory');
  console.log('   • 0-30:   Oversold (potential buy signal)');
  console.log('');
  console.log('🎯 Trading Strategies:');
  console.log('   • Buy when RSI crosses above 30 (oversold recovery)');
  console.log('   • Sell when RSI crosses below 70 (overbought decline)');
  console.log('   • Look for divergences between price and RSI');
  console.log('   • Use multiple timeframes for confirmation');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('   • RSI can remain overbought/oversold for extended periods');
  console.log('   • Always combine with other indicators and analysis');
  console.log('   • Consider market context and overall trend');
  console.log('   • Use proper risk management and position sizing');
}

/**
 * Quick RSI calculation function for API calls
 * @param symbol Stock symbol
 * @param period RSI period (default: 14)
 * @returns Simple RSI result
 */
export async function quickRSI(symbol: string, period: number = 14): Promise<{
  symbol: string;
  rsi: number;
  signal: string;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    const rsiValues = calculateRSI(candles, period);
    const current = rsiValues[rsiValues.length - 1];
    
    let signal = 'HOLD';
    if (current <= 30) signal = 'BUY';
    else if (current >= 70) signal = 'SELL';
    
    return {
      symbol: symbol.toUpperCase(),
      rsi: parseFloat(current.toFixed(2)),
      signal,
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate RSI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
