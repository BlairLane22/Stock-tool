import { analyzeIMI, getIMI, Candle } from '../indicators/intradayMomentumIndex';
import { getCandles } from './helper/getCandles';
import { getQuote } from '../util/rest';
import { loadTestData } from '../util/testDataLoader';

/**
 * Intraday Momentum Index (IMI) Analysis Command - API endpoint for IMI calculations
 * Can be called from other projects as a trading indicator service
 */

interface IMICommandOptions {
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
 * Main IMI Analysis function - API entry point
 * @param symbol Stock symbol to analyze
 * @param options IMI analysis options
 * @returns Complete IMI analysis results
 */
export async function imiAnalysis(
  symbol: string,
  options: IMICommandOptions = {}
): Promise<any> {
  console.log(`\n=== Intraday Momentum Index (IMI) Analysis for ${symbol.toUpperCase()} ===\n`);
  
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
    console.log(`⚙️ Settings: ${period}-period IMI\n`);

    // Perform IMI analysis
    const analysis = analyzeIMI(candles, period, customLevels);
    
    // Display current IMI values
    console.log('📊 Current Intraday Momentum Index:');
    console.log(`   IMI Value: ${analysis.imi.current.toFixed(1)} (Previous: ${analysis.imi.previous.toFixed(1)})`);
    console.log(`   Total Intraday Gains: $${analysis.imi.totalGains.toFixed(2)}`);
    console.log(`   Total Intraday Losses: $${analysis.imi.totalLosses.toFixed(2)}`);
    console.log(`   Up Days: ${analysis.imi.upDays} | Down Days: ${analysis.imi.downDays}`);
    console.log('');
    
    // Display key metrics
    console.log('📈 Key Metrics:');
    console.log(`   Signal: ${analysis.signal}`);
    console.log(`   Strength: ${analysis.strength.replace(/_/g, ' ')}`);
    console.log(`   Trend: ${analysis.trend}`);
    console.log(`   Momentum: ${analysis.momentum}`);
    console.log(`   Intraday Bias: ${analysis.intradayBias}`);
    
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
    
    // Display IMI chart
    displayIMIChart(candles, analysis, period);
    
    // Display intraday analysis
    displayIntradayAnalysis(candles, analysis, period);
    
    // Educational information
    displayIMIEducation();
    
    return analysis;

  } catch (error) {
    console.error(`❌ Error analyzing IMI for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Generate mock candle data for testing with realistic intraday patterns
 */
function generateMockCandles(symbol: string, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 100 + Math.random() * 100;
  
  for (let i = 0; i < count; i++) {
    const dailyChange = (Math.random() - 0.5) * 0.04;
    const trendFactor = Math.sin(i / 30) * 0.002;
    
    price = price * (1 + dailyChange + trendFactor);
    
    // Create realistic intraday patterns
    const intradayVolatility = 0.015 + Math.random() * 0.01;
    const open = i === 0 ? price : candles[i - 1].close;
    
    // Simulate intraday momentum - some days have strong intraday moves
    const intradayMomentum = (Math.random() - 0.5) * 0.03;
    const close = open * (1 + intradayMomentum);
    
    // High and low based on open/close range
    const high = Math.max(open, close) * (1 + Math.random() * intradayVolatility);
    const low = Math.min(open, close) * (1 - Math.random() * intradayVolatility);
    
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
 * Display a simple text-based IMI chart
 */
function displayIMIChart(candles: Candle[], analysis: any, period: number): void {
  if (analysis.imi.values.length < 20) return;
  
  console.log('📈 IMI Chart (Last 20 periods):');
  console.log('   0    20   30   50   70   80   100');
  console.log('   |    |    |    |    |    |    |');
  
  const recent = analysis.imi.values.slice(-20);
  recent.forEach((imi: number, index: number) => {
    const position = Math.round(imi / 100 * 30);
    const bar = ' '.repeat(position) + '●';
    const value = imi.toFixed(1).padStart(5);
    console.log(`${value} ${bar}`);
  });
  
  console.log('   |    |    |    |    |    |    |');
  console.log('   0    20   30   50   70   80   100');
  console.log('        ↑    ↑    ↑    ↑    ↑');
  console.log('    Oversold  |  Neutral |  Overbought\n');
}

/**
 * Display detailed intraday analysis
 */
function displayIntradayAnalysis(candles: Candle[], analysis: any, period: number): void {
  console.log('🕐 Intraday Movement Analysis (Last 20 periods):');
  console.log('   Day   Open    Close   Change   IMI    Pattern');
  console.log('   ---   ----    -----   ------   ---    -------');
  
  const recentCandles = candles.slice(-20);
  const recentIMI = analysis.imi.values.slice(-20);
  
  recentCandles.forEach((candle: Candle, index: number) => {
    const intradayChange = candle.close - candle.open;
    const changePercent = (intradayChange / candle.open) * 100;
    const imi = recentIMI[index] || 50;
    
    let pattern = '';
    if (Math.abs(changePercent) < 0.5) {
      pattern = 'Doji';
    } else if (changePercent > 1.5) {
      pattern = 'Strong Up';
    } else if (changePercent < -1.5) {
      pattern = 'Strong Down';
    } else if (changePercent > 0) {
      pattern = 'Up Day';
    } else {
      pattern = 'Down Day';
    }
    
    const dayNum = (index + 1).toString().padStart(3);
    const open = candle.open.toFixed(2).padStart(7);
    const close = candle.close.toFixed(2).padStart(7);
    const change = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`.padStart(7);
    const imiStr = imi.toFixed(1).padStart(6);
    
    console.log(`   ${dayNum}   ${open}   ${close}   ${change}   ${imiStr}   ${pattern}`);
  });
  
  console.log('');
}

/**
 * Display IMI educational information
 */
function displayIMIEducation(): void {
  console.log('📚 Intraday Momentum Index (IMI) Education:');
  console.log('');
  console.log('🔍 What is IMI?');
  console.log('   Developed by Tushar Chande, combines RSI concepts with candlestick analysis');
  console.log('   Focuses on intraday price movement (open to close) rather than day-to-day changes');
  console.log('   Oscillates between 0 and 100, similar to RSI but for intraday momentum');
  console.log('');
  console.log('📊 IMI Calculation:');
  console.log('   • Gains = Close - Open (on up days where Close > Open)');
  console.log('   • Losses = Open - Close (on down days where Open > Close)');
  console.log('   • IMI = (Sum of Gains / (Sum of Gains + Sum of Losses)) × 100');
  console.log('   • Typically calculated over 14 periods');
  console.log('');
  console.log('🎯 Trading Strategies:');
  console.log('   • Buy when IMI crosses above 30 (oversold intraday conditions)');
  console.log('   • Sell when IMI crosses below 70 (overbought intraday conditions)');
  console.log('   • Look for divergences between price and IMI');
  console.log('   • Useful for intraday trading and short-term momentum');
  console.log('');
  console.log('📈 IMI vs RSI:');
  console.log('   • IMI uses intraday movement (open to close)');
  console.log('   • RSI uses day-to-day closing price changes');
  console.log('   • IMI better for intraday momentum analysis');
  console.log('   • RSI better for longer-term trend analysis');
  console.log('');
  console.log('🕐 Intraday Applications:');
  console.log('   • Identify intraday reversal points');
  console.log('   • Confirm intraday breakouts');
  console.log('   • Assess intraday momentum strength');
  console.log('   • Time entry/exit points within trading day');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('   • IMI is more sensitive to intraday volatility');
  console.log('   • Works best in conjunction with other indicators');
  console.log('   • Consider overall market trend and context');
  console.log('   • Adjust thresholds based on asset volatility');
}

/**
 * Quick IMI calculation for API calls
 * @param symbol Stock symbol
 * @param period IMI period (default: 14)
 * @returns Simple IMI result
 */
export async function quickIMI(symbol: string, period: number = 14): Promise<{
  symbol: string;
  imi: number;
  signal: string;
  intradayBias: string;
  upDays: number;
  downDays: number;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    const analysis = analyzeIMI(candles, period);
    
    return {
      symbol: symbol.toUpperCase(),
      imi: parseFloat(analysis.imi.current.toFixed(2)),
      signal: analysis.signal,
      intradayBias: analysis.intradayBias,
      upDays: analysis.imi.upDays,
      downDays: analysis.imi.downDays,
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate IMI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
