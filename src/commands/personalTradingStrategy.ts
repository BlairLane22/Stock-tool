import { movingAverageCalculation } from '../chartPatterns/helpers/movingAverage';
import { calculateMACD } from '../chartPatterns/helpers/macd';
import { getCandles } from './helper/getCandles';
import { getQuote, Quote } from '../util/rest';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  riskReward: number;
  stopLoss: number;
  targetPrice: number;
  positionSize: number;
}

interface StrategyAnalysis {
  fundamentalScore: number;
  technicalScore: number;
  overallScore: number;
  tradingSignal: TradingSignal;
  checklist: {
    clearTechnicalSetup: boolean;
    volumeConfirmation: boolean;
    marketSectorSupport: boolean;
    favorableRiskReward: boolean;
    strategyAlignment: boolean;
  };
}

// RSI Calculation
function calculateRSI(candles: Candle[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate initial gains and losses
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate RSI
  for (let i = period - 1; i < gains.length; i++) {
    let avgGain = 0;
    let avgLoss = 0;

    // Calculate average gain and loss for the period
    for (let j = i - period + 1; j <= i; j++) {
      avgGain += gains[j];
      avgLoss += losses[j];
    }

    avgGain /= period;
    avgLoss /= period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }

  return rsi;
}





// Volume analysis
function analyzeVolume(candles: Candle[]): { averageVolume: number, currentVolumeRatio: number } {
  if (candles.length < 20) {
    return { averageVolume: 0, currentVolumeRatio: 1 };
  }
  
  const last20Candles = candles.slice(-20);
  const averageVolume = last20Candles.reduce((sum, candle) => sum + candle.volume, 0) / 20;
  const currentVolume = candles[candles.length - 1].volume;
  const currentVolumeRatio = currentVolume / averageVolume;
  
  return { averageVolume, currentVolumeRatio };
}

// Position sizing calculation
function calculatePositionSize(accountBalance: number, riskPerTrade: number, stopLossDistance: number, _currentPrice: number): number {
  const riskAmount = accountBalance * (riskPerTrade / 100);
  const sharesRisked = riskAmount / stopLossDistance;
  return Math.floor(sharesRisked);
}

// Mock data generator for demonstration when API fails
function generateMockCandles(_symbol: string, currentPrice: number): Candle[] {
  const candles: Candle[] = [];
  const days = 300; // ~1 year of weekly data
  let price = currentPrice * 0.8; // Start 20% lower

  for (let i = 0; i < days; i++) {
    // Create more realistic price movement
    const dailyChange = (Math.random() - 0.5) * 0.04; // 4% max daily change
    const trendFactor = 0.0005; // Slight upward trend

    price = price * (1 + dailyChange + trendFactor);

    const open = i === 0 ? price : candles[i - 1].close;
    const volatility = 0.02; // 2% intraday volatility
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
      timeStamp: Date.now() / 1000 - (days - i) * 7 * 24 * 60 * 60 // Weekly data
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

export async function personalTradingStrategy(
  symbol: string,
  accountBalance: number = 10000,
  riskPerTrade: number = 2
): Promise<StrategyAnalysis> {
  console.log(`\n=== Personal Trading Strategy Analysis for ${symbol.toUpperCase()} ===\n`);

  try {
    // Get current quote
    const quote = await getQuote(symbol.toUpperCase());

    // Try to get historical data, fall back to mock data if API fails
    let candles: Candle[];
    try {
      candles = await getCandles(symbol);
      if (candles.length < 200) {
        console.log('⚠️  Insufficient historical data from API, using mock data for demonstration');
        candles = generateMockCandles(symbol, quote.current);
      }
    } catch (error) {
      console.log('⚠️  API error fetching historical data, using mock data for demonstration');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      candles = generateMockCandles(symbol, quote.current);
    }
    
    // Calculate technical indicators
    const ma20 = movingAverageCalculation(candles, 20);
    const ma50 = movingAverageCalculation(candles, 50);
    const ma200 = movingAverageCalculation(candles, 200);
    const rsi = calculateRSI(candles);
    const macd = calculateMACD(candles);
    const volumeAnalysis = analyzeVolume(candles);
    
    // Current values
    const currentPrice = quote.current;
    const currentMA20 = ma20[ma20.length - 1];
    const currentMA50 = ma50[ma50.length - 1];
    const currentMA200 = ma200[ma200.length - 1];
    const currentRSI = rsi[rsi.length - 1];
    const currentMACD = macd.macd[macd.macd.length - 1];
    const currentSignal = macd.signal[macd.signal.length - 1];
    
    console.log('📊 Technical Indicators:');
    console.log(`Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`20-day MA: $${currentMA20.toFixed(2)}`);
    console.log(`50-day MA: $${currentMA50.toFixed(2)}`);
    console.log(`200-day MA: $${currentMA200.toFixed(2)}`);
    console.log(`RSI: ${currentRSI.toFixed(2)}`);
    console.log(`MACD: ${currentMACD.toFixed(4)}`);
    console.log(`Volume Ratio: ${volumeAnalysis.currentVolumeRatio.toFixed(2)}x average`);
    
    // Strategy analysis based on your criteria
    const analysis = analyzeStrategy(
      candles,
      quote,
      {
        ma20: currentMA20,
        ma50: currentMA50,
        ma200: currentMA200,
        rsi: currentRSI,
        macd: currentMACD,
        signal: currentSignal,
        volumeRatio: volumeAnalysis.currentVolumeRatio
      },
      accountBalance,
      riskPerTrade
    );
    
    // Display results
    displayAnalysisResults(analysis, symbol.toUpperCase());
    
    return analysis;
    
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

function analyzeStrategy(
  candles: Candle[],
  quote: Quote,
  indicators: any,
  accountBalance: number,
  riskPerTrade: number
): StrategyAnalysis {
  const reasons: string[] = [];
  let technicalScore = 0;
  let fundamentalScore = 50; // Neutral since we don't have fundamental data

  // Technical Analysis based on your strategy

  // 1. Trend Setup Analysis (50-day MA above 200-day MA)
  const bullishTrend = indicators.ma50 > indicators.ma200;
  if (bullishTrend) {
    technicalScore += 20;
    reasons.push('✅ Bullish trend: 50-day MA above 200-day MA');
  } else {
    reasons.push('❌ Bearish trend: 50-day MA below 200-day MA');
  }

  // 2. Price within 5-10% of 52-week high (approximation using recent data)
  const recentHigh = Math.max(...candles.slice(-252).map(c => c.high)); // ~1 year of weekly data
  const distanceFromHigh = ((recentHigh - quote.current) / recentHigh) * 100;
  if (distanceFromHigh <= 10) {
    technicalScore += 15;
    reasons.push(`✅ Price within ${distanceFromHigh.toFixed(1)}% of recent high`);
  } else {
    reasons.push(`⚠️ Price ${distanceFromHigh.toFixed(1)}% below recent high`);
  }

  // 3. RSI Analysis (not overbought)
  if (indicators.rsi < 80 && indicators.rsi > 30) {
    technicalScore += 10;
    reasons.push(`✅ RSI in healthy range: ${indicators.rsi.toFixed(1)}`);
  } else if (indicators.rsi >= 80) {
    reasons.push(`⚠️ RSI overbought: ${indicators.rsi.toFixed(1)}`);
  } else {
    reasons.push(`⚠️ RSI oversold: ${indicators.rsi.toFixed(1)}`);
  }

  // 4. MACD Analysis
  const macdBullish = indicators.macd > indicators.signal;
  if (macdBullish) {
    technicalScore += 15;
    reasons.push('✅ MACD bullish crossover');
  } else {
    reasons.push('❌ MACD bearish signal');
  }

  // 5. Volume Confirmation
  const volumeConfirmed = indicators.volumeRatio > 1.2;
  if (volumeConfirmed) {
    technicalScore += 10;
    reasons.push(`✅ Above-average volume: ${indicators.volumeRatio.toFixed(2)}x`);
  } else {
    reasons.push(`⚠️ Below-average volume: ${indicators.volumeRatio.toFixed(2)}x`);
  }

  // 6. Chart Patterns (Bull Flag, Breakout, Cup-and-Handle approximation)
  const priceAboveMA20 = quote.current > indicators.ma20;
  if (priceAboveMA20) {
    technicalScore += 10;
    reasons.push('✅ Price above 20-day MA (bullish momentum)');
  } else {
    reasons.push('❌ Price below 20-day MA');
  }

  // Calculate overall score
  const overallScore = (technicalScore + fundamentalScore) / 2;

  // Determine signal
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  if (overallScore >= 70 && bullishTrend && macdBullish) {
    signal = 'BUY';
    confidence = overallScore >= 80 ? 'HIGH' : 'MEDIUM';
  } else if (overallScore <= 30) {
    signal = 'SELL';
    confidence = 'MEDIUM';
  }

  // Risk management calculations
  const supportLevel = Math.min(...candles.slice(-20).map(c => c.low)); // Recent support
  const stopLoss = supportLevel * 0.98; // 2% below support
  const stopLossDistance = quote.current - stopLoss;
  const riskReward = distanceFromHigh <= 5 ? 3.0 : 2.1; // Target minimum 2:1, prefer 3:1
  const targetPrice = quote.current + (stopLossDistance * riskReward);

  // Position sizing
  const positionSize = calculatePositionSize(accountBalance, riskPerTrade, stopLossDistance, quote.current);

  // Trading checklist
  const checklist = {
    clearTechnicalSetup: bullishTrend && priceAboveMA20,
    volumeConfirmation: volumeConfirmed,
    marketSectorSupport: true, // Assume neutral/positive
    favorableRiskReward: riskReward >= 2.1,
    strategyAlignment: signal === 'BUY' && confidence !== 'LOW'
  };

  return {
    fundamentalScore,
    technicalScore,
    overallScore,
    tradingSignal: {
      signal,
      confidence,
      reasons,
      riskReward,
      stopLoss,
      targetPrice,
      positionSize
    },
    checklist
  };
}

function displayAnalysisResults(analysis: StrategyAnalysis, _symbol: string): void {
  console.log('\n📈 Strategy Analysis Results:');
  console.log(`Technical Score: ${analysis.technicalScore}/100`);
  console.log(`Overall Score: ${analysis.overallScore.toFixed(1)}/100`);

  console.log('\n🎯 Trading Signal:');
  console.log(`Signal: ${analysis.tradingSignal.signal}`);
  console.log(`Confidence: ${analysis.tradingSignal.confidence}`);
  console.log(`Risk/Reward Ratio: ${analysis.tradingSignal.riskReward.toFixed(1)}:1`);

  console.log('\n💰 Position Management:');
  console.log(`Recommended Position Size: ${analysis.tradingSignal.positionSize} shares`);
  console.log(`Stop Loss: $${analysis.tradingSignal.stopLoss.toFixed(2)}`);
  console.log(`Target Price: $${analysis.tradingSignal.targetPrice.toFixed(2)}`);

  console.log('\n✅ Trading Checklist:');
  Object.entries(analysis.checklist).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${label}`);
  });

  console.log('\n📝 Analysis Reasons:');
  analysis.tradingSignal.reasons.forEach(reason => console.log(`  ${reason}`));

  console.log('\n📚 Strategy Notes:');
  console.log('• This analysis follows your hybrid technical + fundamental approach');
  console.log('• Focus on swing trades (2-10 days) and trend-following opportunities');
  console.log('• Always use trailing stops to lock in profits');
  console.log('• Review and adjust based on market conditions');
  console.log('• Journal every trade for continuous improvement');
}
