import { calculateMACD, analyzeMACDSignals, getMACDRecommendation } from '../chartPatterns/helpers/macd';
import { getCandles } from './helper/getCandles';
import { getQuote } from '../util/rest';
import { loadTestData } from '../util/testDataLoader';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

// Mock data generator for when API fails
function generateMockCandles(currentPrice: number): Candle[] {
  const candles: Candle[] = [];
  const days = 100; // Enough data for MACD calculation
  let price = currentPrice * 0.9; // Start 10% lower
  
  for (let i = 0; i < days; i++) {
    // Create realistic price movement with trend
    const dailyChange = (Math.random() - 0.5) * 0.03; // 3% max daily change
    const trendFactor = 0.001; // Slight upward trend
    
    price = price * (1 + dailyChange + trendFactor);
    
    const open = i === 0 ? price : candles[i - 1].close;
    const volatility = 0.015; // 1.5% intraday volatility
    const high = price * (1 + Math.random() * volatility);
    const low = price * (1 - Math.random() * volatility);
    const close = price;
    const volume = Math.floor(Math.random() * 1000000 + 500000);
    
    candles.push({
      open,
      high,
      low,
      close,
      volume,
      timeStamp: Date.now() / 1000 - (days - i) * 24 * 60 * 60
    });
  }
  
  // Adjust the last candle to match current price
  if (candles.length > 0) {
    candles[candles.length - 1].close = currentPrice;
    candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, currentPrice);
    candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, currentPrice);
  }
  
  return candles;
}

export async function macd(
  symbol: string,
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  testData?: string,
  live: boolean = true,
  forceMock: boolean = false
): Promise<void> {
  console.log(`\n=== MACD Analysis for ${symbol.toUpperCase()} ===\n`);

  try {
    let candles: Candle[];
    let currentPrice: number;

    // Handle test data if provided
    if (testData) {
      console.log(`📊 Using test data file: ${testData}.json\n`);
      const testDataObj = loadTestData(testData);
      candles = testDataObj.candles;
      currentPrice = candles[candles.length - 1].close;

      if (testDataObj.description) {
        console.log(`📋 Test Description: ${testDataObj.description}\n`);
      }
    } else if (forceMock) {
      // Force mock data
      console.log('🎭 Using mock data for demonstration\n');
      currentPrice = 150; // Default price for mock data
      candles = generateMockCandles(currentPrice);
    } else {
      // Use live data (default behavior)
      console.log('📡 Fetching live market data...\n');

      // Get current quote
      const quote = await getQuote(symbol.toUpperCase());
      currentPrice = quote.current;

      // Try to get historical data, fall back to mock data if API fails
      try {
        candles = await getCandles(symbol);
        if (candles.length < Math.max(slowPeriod + signalPeriod, 50)) {
          console.log('⚠️  Insufficient historical data from API, using mock data for demonstration');
          candles = generateMockCandles(currentPrice);
        } else {
          console.log(`📈 Retrieved ${candles.length} periods of historical data\n`);
        }
      } catch (error) {
        console.log('⚠️  API error fetching historical data, using mock data for demonstration');
        candles = generateMockCandles(currentPrice);
      }
    }
    
    // Calculate MACD
    const startTime = new Date();
    const macdResult = calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod);
    const duration = ((new Date().valueOf() - startTime.valueOf()) / 1000).toFixed(4);
    console.log(`MACD calculation took: ${duration} seconds\n`);
    
    // Analyze signals
    const analysis = analyzeMACDSignals(macdResult);
    const recommendation = getMACDRecommendation(analysis);
    
    // Display current values
    console.log('📊 Current MACD Values:');
    console.log(`Current Price: $${currentPrice.toFixed(2)}`);
    
    if (macdResult.macd.length > 0) {
      const currentMACD = macdResult.macd[macdResult.macd.length - 1];
      console.log(`MACD Line: ${currentMACD.toFixed(4)}`);
    }
    
    if (macdResult.signal.length > 0) {
      const currentSignal = macdResult.signal[macdResult.signal.length - 1];
      console.log(`Signal Line: ${currentSignal.toFixed(4)}`);
    }
    
    if (macdResult.histogram.length > 0) {
      const currentHistogram = macdResult.histogram[macdResult.histogram.length - 1];
      console.log(`Histogram: ${currentHistogram.toFixed(4)}`);
    }
    
    // Display EMAs
    if (macdResult.ema12.length > 0 && macdResult.ema26.length > 0) {
      const currentEMA12 = macdResult.ema12[macdResult.ema12.length - 1];
      const currentEMA26 = macdResult.ema26[macdResult.ema26.length - 1];
      console.log(`12-period EMA: $${currentEMA12.toFixed(2)}`);
      console.log(`26-period EMA: $${currentEMA26.toFixed(2)}`);
    }
    
    // Display analysis
    console.log('\n🎯 MACD Analysis:');
    console.log(`Current Signal: ${analysis.currentSignal}`);
    console.log(`Crossover: ${analysis.crossover}`);
    console.log(`Momentum: ${analysis.momentum}`);
    console.log(`Signal Strength: ${analysis.strength}/100`);
    
    // Display recommendation
    console.log('\n💡 Trading Recommendation:');
    console.log(`Action: ${recommendation.action}`);
    console.log(`Confidence: ${recommendation.confidence}`);
    console.log(`Reason: ${recommendation.reason}`);
    
    // Display recent MACD history (last 10 values)
    console.log('\n📈 Recent MACD History:');
    const historyLength = Math.min(10, macdResult.macd.length);
    console.log('Date\t\tMACD\t\tSignal\t\tHistogram');
    console.log('─'.repeat(60));
    
    // Calculate the offset for proper alignment
    const macdStartIndex = candles.length - macdResult.macd.length;
    const signalStartIndex = candles.length - macdResult.signal.length;
    const histogramStartIndex = candles.length - macdResult.histogram.length;

    for (let i = macdResult.macd.length - historyLength; i < macdResult.macd.length; i++) {
      const candleIndex = macdStartIndex + i;
      const date = new Date((candles[candleIndex]?.timeStamp || 0) * 1000);
      const macdValue = macdResult.macd[i];

      // Calculate corresponding indices for signal and histogram
      const signalIndex = candleIndex - signalStartIndex;
      const histogramIndex = candleIndex - histogramStartIndex;

      const signalValue = (signalIndex >= 0 && signalIndex < macdResult.signal.length) ?
        macdResult.signal[signalIndex].toFixed(4) : 'N/A';
      const histogramValue = (histogramIndex >= 0 && histogramIndex < macdResult.histogram.length) ?
        macdResult.histogram[histogramIndex].toFixed(4) : 'N/A';

      console.log(`${date.toLocaleDateString()}\t${macdValue.toFixed(4)}\t\t${signalValue}\t\t${histogramValue}`);
    }
    
    // Educational information
    console.log('\n📚 MACD Interpretation Guide:');
    console.log('• MACD Line above Signal Line = Bullish momentum');
    console.log('• MACD Line below Signal Line = Bearish momentum');
    console.log('• MACD crossing above Signal = Potential buy signal');
    console.log('• MACD crossing below Signal = Potential sell signal');
    console.log('• Histogram above zero = MACD above Signal (bullish)');
    console.log('• Histogram below zero = MACD below Signal (bearish)');
    console.log('• Increasing histogram = Strengthening trend');
    console.log('• Decreasing histogram = Weakening trend');
    
    console.log('\n⚙️  MACD Parameters:');
    console.log(`Fast EMA Period: ${fastPeriod}`);
    console.log(`Slow EMA Period: ${slowPeriod}`);
    console.log(`Signal EMA Period: ${signalPeriod}`);
    
  } catch (error) {
    console.error(`Error analyzing MACD for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
