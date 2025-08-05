import { analyzeBollingerBands, detectBollingerSqueeze, Candle } from '../indicators/bollingerBands';
import { getCandles } from './helper/getCandles';
import { getQuote } from '../util/rest';
import { loadTestData } from '../util/testDataLoader';

/**
 * Bollinger Bands Analysis Command - API endpoint for Bollinger Bands calculations
 * Can be called from other projects as a trading indicator service
 */

interface BollingerBandsCommandOptions {
  period?: number;
  multiplier?: number;
  testData?: string;
  mock?: boolean;
  squeeze?: boolean;
}

/**
 * Main Bollinger Bands Analysis function - API entry point
 * @param symbol Stock symbol to analyze
 * @param options Bollinger Bands analysis options
 * @returns Complete Bollinger Bands analysis results
 */
export async function bollingerBandsAnalysis(
  symbol: string,
  options: BollingerBandsCommandOptions = {}
): Promise<any> {
  console.log(`\n=== Bollinger Bands Analysis for ${symbol.toUpperCase()} ===\n`);
  
  const {
    period = 20,
    multiplier = 2,
    testData,
    mock = false,
    squeeze = false
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
    console.log(`⚙️ Settings: ${period}-period, ${multiplier}σ multiplier\n`);

    // Perform Bollinger Bands analysis
    const analysis = analyzeBollingerBands(candles, period, multiplier);
    
    // Display current band values
    console.log('📊 Current Bollinger Bands:');
    console.log(`   Upper Band: $${analysis.current.upper.toFixed(2)}`);
    console.log(`   Middle Band (SMA): $${analysis.current.middle.toFixed(2)}`);
    console.log(`   Lower Band: $${analysis.current.lower.toFixed(2)}`);
    console.log(`   Current Price: $${analysis.current.price.toFixed(2)}`);
    console.log('');
    
    // Display key metrics
    console.log('📈 Key Metrics:');
    console.log(`   %B (Percent B): ${(analysis.current.percentB * 100).toFixed(1)}%`);
    console.log(`   Bandwidth: ${(analysis.current.bandwidth * 100).toFixed(2)}%`);
    console.log(`   Position: ${analysis.position.replace(/_/g, ' ')}`);
    console.log(`   Volatility: ${analysis.volatility}`);
    console.log(`   Trend: ${analysis.trend}`);
    console.log('');
    
    // Display trading signal
    console.log(`🎯 Trading Signal: ${analysis.signal}`);
    console.log('');
    
    // Display trading strategy
    console.log('💡 Trading Strategy:');
    console.log(`   Entry: ${analysis.tradingStrategy.entry}`);
    console.log(`   Exit: ${analysis.tradingStrategy.exit}`);
    if (analysis.tradingStrategy.stopLoss) {
      console.log(`   Stop Loss: $${analysis.tradingStrategy.stopLoss.toFixed(2)}`);
    }
    if (analysis.tradingStrategy.target) {
      console.log(`   Target: $${analysis.tradingStrategy.target.toFixed(2)}`);
    }
    console.log('');
    
    // Display interpretation
    console.log('💭 Analysis Interpretation:');
    analysis.interpretation.forEach(line => console.log(`   ${line}`));
    console.log('');
    
    // Squeeze analysis if requested
    if (squeeze) {
      console.log('🔥 Bollinger Band Squeeze Analysis:');
      const squeezeAnalysis = detectBollingerSqueeze(candles, period);
      console.log(`   Currently Squeezing: ${squeezeAnalysis.isSqueezing ? 'YES' : 'NO'}`);
      console.log(`   Squeeze Strength: ${(squeezeAnalysis.squeezeStrength * 100).toFixed(1)}%`);
      console.log(`   Days Since Last Squeeze: ${squeezeAnalysis.daysSinceLastSqueeze}`);
      console.log(`   Breakout Potential: ${squeezeAnalysis.potentialBreakout}`);
      console.log('');
    }

    // Display visual chart
    displayBollingerBandsChart(candles, analysis, period);
    
    // Educational information
    // displayBollingerBandsEducation();
    
    return analysis;

  } catch (error) {
    console.error(`❌ Error analyzing Bollinger Bands for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
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
    // Create realistic price movement with volatility cycles
    const volatilityCycle = Math.sin(i / 30) * 0.5 + 1; // Volatility cycles
    const dailyChange = (Math.random() - 0.5) * 0.04 * volatilityCycle; // Variable volatility
    const trendFactor = Math.sin(i / 50) * 0.001; // Long-term trend
    
    price = price * (1 + dailyChange + trendFactor);
    
    const volatility = 0.02 * volatilityCycle; // Intraday volatility
    const open = i === 0 ? price : candles[i - 1].close;
    const high = Math.max(open, price) * (1 + Math.random() * volatility);
    const low = Math.min(open, price) * (1 - Math.random() * volatility);
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
 * Display a simple text-based Bollinger Bands chart
 */
function displayBollingerBandsChart(candles: Candle[], analysis: any, period: number): void {
  if (analysis.bands.middleBand.length < 20) return;
  
  console.log('📈 Bollinger Bands Chart (Last 20 periods):');
  
  const recent = analysis.bands.middleBand.length >= 20 ? 20 : analysis.bands.middleBand.length;
  const upperBands = analysis.bands.upperBand.slice(-recent);
  const middleBands = analysis.bands.middleBand.slice(-recent);
  const lowerBands = analysis.bands.lowerBand.slice(-recent);
  const prices = candles.slice(-recent).map(c => c.close);
  
  const minPrice = Math.min(...lowerBands);
  const maxPrice = Math.max(...upperBands);
  const range = maxPrice - minPrice;
  
  console.log('   Price    Lower    Middle   Upper    Position');
  console.log('   -----    -----    ------   -----    --------');
  
  for (let i = 0; i < recent; i++) {
    const price = prices[i];
    const lower = lowerBands[i];
    const middle = middleBands[i];
    const upper = upperBands[i];
    
    // Create visual representation
    const pricePos = Math.round(((price - minPrice) / range) * 30);
    const lowerPos = Math.round(((lower - minPrice) / range) * 30);
    const middlePos = Math.round(((middle - minPrice) / range) * 30);
    const upperPos = Math.round(((upper - minPrice) / range) * 30);
    
    let chart = ' '.repeat(31);
    chart = chart.substring(0, lowerPos) + '|' + chart.substring(lowerPos + 1);
    chart = chart.substring(0, middlePos) + '-' + chart.substring(middlePos + 1);
    chart = chart.substring(0, upperPos) + '|' + chart.substring(upperPos + 1);
    chart = chart.substring(0, pricePos) + '●' + chart.substring(pricePos + 1);
    
    console.log(`   ${price.toFixed(2).padStart(6)}   ${lower.toFixed(2).padStart(6)}   ${middle.toFixed(2).padStart(6)}   ${upper.toFixed(2).padStart(6)}   ${chart}`);
  }
  
  console.log('   Legend: | = Bands, - = Middle, ● = Price\n');
}

/**
 * Display Bollinger Bands educational information
 */
function displayBollingerBandsEducation(): void {
  console.log('📚 Bollinger Bands Education:');
  console.log('');
  console.log('🔍 What are Bollinger Bands?');
  console.log('   Developed by John Bollinger in the 1980s to measure volatility');
  console.log('   Consist of three lines: Upper Band, Middle Band (SMA), Lower Band');
  console.log('   Bands expand with high volatility, contract with low volatility');
  console.log('');
  console.log('📊 Key Components:');
  console.log('   • Middle Band: 20-period Simple Moving Average');
  console.log('   • Upper Band: Middle Band + (2 × Standard Deviation)');
  console.log('   • Lower Band: Middle Band - (2 × Standard Deviation)');
  console.log('   • %B: Shows where price is relative to bands (0-100%)');
  console.log('   • Bandwidth: Measures band width relative to middle band');
  console.log('');
  console.log('🎯 Trading Strategies:');
  console.log('   • Bollinger Bounce: Buy at lower band, sell at upper band');
  console.log('   • Bollinger Squeeze: Low volatility precedes high volatility');
  console.log('   • Band Breakouts: Price moves outside bands signal trend changes');
  console.log('   • Mean Reversion: Price tends to return to middle band');
  console.log('');
  console.log('📈 Interpretation:');
  console.log('   • Price near upper band: Potentially overbought');
  console.log('   • Price near lower band: Potentially oversold');
  console.log('   • Narrow bands: Low volatility, potential breakout coming');
  console.log('   • Wide bands: High volatility, potential consolidation ahead');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('   • Bollinger Bands are not predictive, they are reactive');
  console.log('   • Price can "walk the bands" during strong trends');
  console.log('   • Always combine with other indicators for confirmation');
  console.log('   • Adjust period and multiplier based on market conditions');
}

/**
 * Quick Bollinger Bands calculation for API calls
 * @param symbol Stock symbol
 * @param period Period for calculation (default: 20)
 * @param multiplier Standard deviation multiplier (default: 2)
 * @returns Simple Bollinger Bands result
 */
export async function quickBollingerBands(
  symbol: string, 
  period: number = 20, 
  multiplier: number = 2
): Promise<{
  symbol: string;
  upper: number;
  middle: number;
  lower: number;
  price: number;
  percentB: number;
  signal: string;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    const analysis = analyzeBollingerBands(candles, period, multiplier);
    
    return {
      symbol: symbol.toUpperCase(),
      upper: parseFloat(analysis.current.upper.toFixed(2)),
      middle: parseFloat(analysis.current.middle.toFixed(2)),
      lower: parseFloat(analysis.current.lower.toFixed(2)),
      price: parseFloat(analysis.current.price.toFixed(2)),
      percentB: parseFloat((analysis.current.percentB * 100).toFixed(1)),
      signal: analysis.signal,
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate Bollinger Bands for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
