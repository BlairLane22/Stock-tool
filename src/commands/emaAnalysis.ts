import { analyzeEMA, calculateMultipleEMAs, EMAAnalysis, EMAResult } from '../indicators/ema';
import { getCandles } from './helper/getCandles';
import { generateMockCandles } from './helper/mockData';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

/**
 * Perform comprehensive EMA analysis for a given symbol
 * @param symbol Stock symbol to analyze
 * @param period EMA period (default: 12)
 * @param priceType Price type to use for calculation
 * @returns Complete EMA analysis
 */
export async function performEMAAnalysis(
  symbol: string, 
  period: number = 12,
  priceType: 'close' | 'high' | 'low' | 'open' | 'median' = 'close'
): Promise<EMAAnalysis> {
  try {
    const candles = await getCandles(symbol);
    
    if (!candles || candles.length === 0) {
      throw new Error(`No data available for symbol ${symbol}`);
    }

    if (candles.length < period) {
      throw new Error(`Insufficient data: need at least ${period} periods, got ${candles.length}`);
    }

    return analyzeEMA(candles, period, priceType);
  } catch (error) {
    throw new Error(`Failed to calculate EMA for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Quick EMA calculation for API responses
 * @param symbol Stock symbol to analyze
 * @param period EMA period (default: 12)
 * @returns Quick EMA result
 */
export async function quickEMA(symbol: string, period: number = 12): Promise<{
  symbol: string;
  ema: number;
  signal: string;
  trend: string;
  pricePosition: string;
  timestamp: number;
}> {
  const analysis = await performEMAAnalysis(symbol, period);
  
  return {
    symbol: symbol.toUpperCase(),
    ema: parseFloat(analysis.ema.current.toFixed(2)),
    signal: analysis.signal,
    trend: analysis.trend,
    pricePosition: analysis.pricePosition,
    timestamp: Math.floor(Date.now() / 1000)
  };
}

/**
 * Multi-timeframe EMA analysis
 * @param symbol Stock symbol to analyze
 * @param periods Array of periods to analyze (default: [12, 26, 50])
 * @returns Multi-timeframe EMA analysis
 */
export async function multiTimeframeEMA(
  symbol: string, 
  periods: number[] = [12, 26, 50]
): Promise<{
  symbol: string;
  emas: { [key: number]: { value: number; signal: string; trend: string } };
  overallSignal: string;
  alignment: string;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    
    if (!candles || candles.length === 0) {
      throw new Error(`No data available for symbol ${symbol}`);
    }

    const maxPeriod = Math.max(...periods);
    if (candles.length < maxPeriod) {
      throw new Error(`Insufficient data: need at least ${maxPeriod} periods, got ${candles.length}`);
    }

    const emaResults = calculateMultipleEMAs(candles, periods);
    const emas: { [key: number]: { value: number; signal: string; trend: string } } = {};
    
    let bullishCount = 0;
    let bearishCount = 0;

    // Analyze each EMA period
    for (const period of periods) {
      const analysis = analyzeEMA(candles, period);
      emas[period] = {
        value: parseFloat(analysis.ema.current.toFixed(2)),
        signal: analysis.signal,
        trend: analysis.trend
      };

      if (analysis.signal === 'BUY' || analysis.trend === 'BULLISH') {
        bullishCount++;
      } else if (analysis.signal === 'SELL' || analysis.trend === 'BEARISH') {
        bearishCount++;
      }
    }

    // Determine overall signal and alignment
    let overallSignal = 'HOLD';
    let alignment = 'MIXED';

    if (bullishCount > bearishCount) {
      overallSignal = 'BUY';
      alignment = bullishCount === periods.length ? 'FULLY_BULLISH' : 'MOSTLY_BULLISH';
    } else if (bearishCount > bullishCount) {
      overallSignal = 'SELL';
      alignment = bearishCount === periods.length ? 'FULLY_BEARISH' : 'MOSTLY_BEARISH';
    }

    return {
      symbol: symbol.toUpperCase(),
      emas,
      overallSignal,
      alignment,
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate multi-timeframe EMA for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Display detailed EMA analysis in console
 * @param symbol Stock symbol
 * @param period EMA period
 * @param priceType Price type to use
 */
export async function displayEMAAnalysis(
  symbol: string,
  period: number = 12,
  priceType: 'close' | 'high' | 'low' | 'open' | 'median' = 'close',
  useMockData: boolean = true
): Promise<void> {
  try {
    console.log(`\n📊 EMA Analysis for ${symbol.toUpperCase()}`);
    console.log('='.repeat(50));

    let analysis: any;
    let candles: any[];
    let currentPrice: number;

    if (useMockData) {
      console.log('📊 Using mock data for demonstration\n');

      // Generate mock candles
      candles = generateMockCandles(symbol, 200);
      currentPrice = candles[candles.length - 1].close;

      // Generate mock EMA analysis
      const mockEmaValue = currentPrice * (0.95 + Math.random() * 0.1);
      const mockPreviousEma = mockEmaValue * (0.98 + Math.random() * 0.04);

      analysis = {
        ema: {
          current: mockEmaValue,
          previous: mockPreviousEma,
          period: period,
          multiplier: 2 / (period + 1)
        },
        signal: currentPrice > mockEmaValue ? (Math.random() > 0.5 ? 'BUY' : 'HOLD') : (Math.random() > 0.5 ? 'SELL' : 'HOLD'),
        trend: mockEmaValue > mockPreviousEma ? 'BULLISH' : mockEmaValue < mockPreviousEma ? 'BEARISH' : 'NEUTRAL',
        momentum: Math.random() > 0.6 ? 'INCREASING' : Math.random() > 0.3 ? 'STABLE' : 'DECREASING',
        pricePosition: currentPrice > mockEmaValue ? 'ABOVE_EMA' : currentPrice < mockEmaValue ? 'BELOW_EMA' : 'AT_EMA',
        crossover: Math.random() > 0.8 ? 'BULLISH_CROSSOVER' : Math.random() > 0.9 ? 'BEARISH_CROSSOVER' : 'NONE',
        strength: Math.random() > 0.6 ? 'STRONG' : Math.random() > 0.3 ? 'MODERATE' : 'WEAK',
        interpretation: [
          `EMA-${period} at $${mockEmaValue.toFixed(2)} provides trend guidance`,
          `Price at $${currentPrice.toFixed(2)} is ${currentPrice > mockEmaValue ? 'above' : 'below'} EMA`,
          `EMA trend is ${mockEmaValue > mockPreviousEma ? 'bullish' : 'bearish'} based on recent movement`
        ],
        tradingStrategy: {
          entry: 'Monitor EMA crossovers for entry signals',
          exit: 'Exit when price crosses opposite side of EMA',
          stopLoss: mockEmaValue * (currentPrice > mockEmaValue ? 0.98 : 1.02),
          target: currentPrice * (currentPrice > mockEmaValue ? 1.05 : 0.95)
        }
      };
    } else {
      analysis = await performEMAAnalysis(symbol, period, priceType);
      candles = await getCandles(symbol);
      currentPrice = candles[candles.length - 1].close;
    }

    // Basic EMA Information
    console.log(`\n🔢 EMA Details:`);
    console.log(`   Period: ${analysis.ema.period} days`);
    console.log(`   Current EMA: $${analysis.ema.current.toFixed(2)}`);
    console.log(`   Previous EMA: $${analysis.ema.previous.toFixed(2)}`);
    console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`   Multiplier: ${analysis.ema.multiplier.toFixed(4)}`);

    // Price Position and Trend
    console.log(`\n📈 Market Analysis:`);
    console.log(`   Price Position: ${analysis.pricePosition.replace('_', ' ')}`);
    console.log(`   Trend: ${analysis.trend}`);
    console.log(`   Momentum: ${analysis.momentum}`);
    console.log(`   Signal Strength: ${analysis.strength}`);

    // Trading Signal
    console.log(`\n🎯 Trading Signal:`);
    const signalEmoji = analysis.signal === 'BUY' ? '🟢' : analysis.signal === 'SELL' ? '🔴' : '🟡';
    console.log(`   ${signalEmoji} Signal: ${analysis.signal}`);
    
    if (analysis.crossover !== 'NONE') {
      const crossoverEmoji = analysis.crossover === 'BULLISH_CROSSOVER' ? '📈' : '📉';
      console.log(`   ${crossoverEmoji} Crossover: ${analysis.crossover.replace('_', ' ')}`);
    }

    // Interpretation
    console.log(`\n💡 Analysis:`);
    analysis.interpretation.forEach((point: string) => {
      console.log(`   • ${point}`);
    });

    // Trading Strategy
    console.log(`\n📋 Trading Strategy:`);
    console.log(`   Entry: ${analysis.tradingStrategy.entry}`);
    console.log(`   Exit: ${analysis.tradingStrategy.exit}`);
    if (analysis.tradingStrategy.stopLoss) {
      console.log(`   Stop Loss: $${analysis.tradingStrategy.stopLoss.toFixed(2)}`);
    }
    if (analysis.tradingStrategy.target) {
      console.log(`   Target: $${analysis.tradingStrategy.target.toFixed(2)}`);
    }

    console.log(`\n⏰ Analysis completed at ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error(`❌ Error analyzing EMA for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Display multi-timeframe EMA analysis in console
 * @param symbol Stock symbol
 * @param periods Array of periods to analyze
 */
export async function displayMultiTimeframeEMA(
  symbol: string,
  periods: number[] = [12, 26, 50],
  useMockData: boolean = true
): Promise<void> {
  try {
    console.log(`\n📊 Multi-Timeframe EMA Analysis for ${symbol.toUpperCase()}`);
    console.log('='.repeat(60));

    let analysis: any;

    if (useMockData) {
      console.log('📊 Using mock data for demonstration\n');

      // Generate mock multi-timeframe EMA analysis
      const basePrice = 100 + Math.random() * 100;
      const emas: any = {};
      let bullishCount = 0;
      let bearishCount = 0;

      periods.forEach(period => {
        const emaValue = basePrice * (0.95 + Math.random() * 0.1);
        const signal = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL';
        const trend = Math.random() > 0.5 ? 'BULLISH' : Math.random() > 0.25 ? 'NEUTRAL' : 'BEARISH';

        emas[period] = {
          value: parseFloat(emaValue.toFixed(2)),
          signal: signal,
          trend: trend
        };

        if (signal === 'BUY' || trend === 'BULLISH') {
          bullishCount++;
        } else if (signal === 'SELL' || trend === 'BEARISH') {
          bearishCount++;
        }
      });

      let overallSignal = 'HOLD';
      let alignment = 'MIXED';

      if (bullishCount > bearishCount) {
        overallSignal = 'BUY';
        alignment = bullishCount === periods.length ? 'FULLY_BULLISH' : 'MOSTLY_BULLISH';
      } else if (bearishCount > bullishCount) {
        overallSignal = 'SELL';
        alignment = bearishCount === periods.length ? 'FULLY_BEARISH' : 'MOSTLY_BEARISH';
      }

      analysis = {
        symbol: symbol.toUpperCase(),
        emas,
        overallSignal,
        alignment,
        timestamp: Math.floor(Date.now() / 1000)
      };
    } else {
      analysis = await multiTimeframeEMA(symbol, periods);
    }

    console.log(`\n🔢 EMA Values:`);
    periods.forEach(period => {
      const ema = analysis.emas[period];
      const signalEmoji = ema.signal === 'BUY' ? '🟢' : ema.signal === 'SELL' ? '🔴' : '🟡';
      const trendEmoji = ema.trend === 'BULLISH' ? '📈' : ema.trend === 'BEARISH' ? '📉' : '➡️';
      console.log(`   EMA-${period}: $${ema.value} ${signalEmoji} ${ema.signal} ${trendEmoji} ${ema.trend}`);
    });

    console.log(`\n🎯 Overall Assessment:`);
    const overallEmoji = analysis.overallSignal === 'BUY' ? '🟢' : analysis.overallSignal === 'SELL' ? '🔴' : '🟡';
    console.log(`   ${overallEmoji} Overall Signal: ${analysis.overallSignal}`);
    console.log(`   📊 Alignment: ${analysis.alignment.replace('_', ' ')}`);

    // Provide interpretation based on alignment
    console.log(`\n💡 Interpretation:`);
    if (analysis.alignment === 'FULLY_BULLISH') {
      console.log(`   • All EMAs are bullish - strong uptrend confirmed`);
      console.log(`   • High confidence buy signal across all timeframes`);
    } else if (analysis.alignment === 'FULLY_BEARISH') {
      console.log(`   • All EMAs are bearish - strong downtrend confirmed`);
      console.log(`   • High confidence sell signal across all timeframes`);
    } else if (analysis.alignment === 'MOSTLY_BULLISH') {
      console.log(`   • Majority of EMAs are bullish - uptrend likely`);
      console.log(`   • Consider bullish positions with caution`);
    } else if (analysis.alignment === 'MOSTLY_BEARISH') {
      console.log(`   • Majority of EMAs are bearish - downtrend likely`);
      console.log(`   • Consider bearish positions with caution`);
    } else {
      console.log(`   • Mixed signals across timeframes - trend unclear`);
      console.log(`   • Wait for clearer alignment before taking positions`);
    }

    console.log(`\n⏰ Analysis completed at ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error(`❌ Error in multi-timeframe EMA analysis for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}
