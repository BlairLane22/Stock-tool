import { analyzeATR, calculateATRLevels, calculateATRPositionSize, ATRAnalysis } from '../indicators/atr';
import { getCandles } from './helper/getCandles';
import { generateMockCandles } from './helper/mockData';

/**
 * Perform comprehensive ATR analysis for a given symbol
 * @param symbol Stock symbol to analyze
 * @param period ATR period (default: 14)
 * @returns Complete ATR analysis
 */
export async function performATRAnalysis(
  symbol: string, 
  period: number = 14
): Promise<ATRAnalysis> {
  try {
    const candles = await getCandles(symbol);
    
    if (!candles || candles.length === 0) {
      throw new Error(`No data available for symbol ${symbol}`);
    }

    if (candles.length < period) {
      throw new Error(`Insufficient data: need at least ${period} periods, got ${candles.length}`);
    }

    return analyzeATR(candles, period);
  } catch (error) {
    throw new Error(`Failed to calculate ATR for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Quick ATR calculation for API responses
 * @param symbol Stock symbol to analyze
 * @param period ATR period (default: 14)
 * @returns Quick ATR result
 */
export async function quickATR(symbol: string, period: number = 14): Promise<{
  symbol: string;
  atr: number;
  volatility: string;
  percentageOfPrice: number;
  signal: string;
  timestamp: number;
}> {
  const analysis = await performATRAnalysis(symbol, period);
  
  return {
    symbol: symbol.toUpperCase(),
    atr: parseFloat(analysis.atr.current.toFixed(2)),
    volatility: analysis.volatility,
    percentageOfPrice: parseFloat(analysis.percentageOfPrice.toFixed(2)),
    signal: analysis.signal,
    timestamp: Math.floor(Date.now() / 1000)
  };
}

/**
 * Calculate ATR-based trading levels
 * @param symbol Stock symbol to analyze
 * @param period ATR period (default: 14)
 * @param multiplier ATR multiplier for levels (default: 2)
 * @returns ATR-based support and resistance levels
 */
export async function calculateTradingLevels(
  symbol: string, 
  period: number = 14, 
  multiplier: number = 2
): Promise<{
  symbol: string;
  support: number;
  resistance: number;
  currentPrice: number;
  atrValue: number;
  stopLossLong: number;
  stopLossShort: number;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    
    if (!candles || candles.length === 0) {
      throw new Error(`No data available for symbol ${symbol}`);
    }

    const levels = calculateATRLevels(candles, period, multiplier);
    
    return {
      symbol: symbol.toUpperCase(),
      support: parseFloat(levels.support.toFixed(2)),
      resistance: parseFloat(levels.resistance.toFixed(2)),
      currentPrice: parseFloat(levels.currentPrice.toFixed(2)),
      atrValue: parseFloat(levels.atrValue.toFixed(2)),
      stopLossLong: parseFloat((levels.currentPrice - levels.atrValue * multiplier).toFixed(2)),
      stopLossShort: parseFloat((levels.currentPrice + levels.atrValue * multiplier).toFixed(2)),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate trading levels for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate position size based on ATR and risk parameters
 * @param symbol Stock symbol to analyze
 * @param accountSize Total account size
 * @param riskPercent Risk percentage per trade (e.g., 0.02 for 2%)
 * @param atrMultiplier ATR multiplier for stop loss (default: 2)
 * @param period ATR period (default: 14)
 * @returns Position sizing recommendation
 */
export async function calculatePositionSize(
  symbol: string,
  accountSize: number,
  riskPercent: number,
  atrMultiplier: number = 2,
  period: number = 14
): Promise<{
  symbol: string;
  positionSize: number;
  stopLossDistance: number;
  riskAmount: number;
  atrValue: number;
  maxShares: number;
  riskPerShare: number;
  timestamp: number;
}> {
  try {
    const candles = await getCandles(symbol);
    
    if (!candles || candles.length === 0) {
      throw new Error(`No data available for symbol ${symbol}`);
    }

    const positionData = calculateATRPositionSize(candles, accountSize, riskPercent, atrMultiplier, period);
    
    return {
      symbol: symbol.toUpperCase(),
      positionSize: positionData.positionSize,
      stopLossDistance: parseFloat(positionData.stopLossDistance.toFixed(2)),
      riskAmount: parseFloat(positionData.riskAmount.toFixed(2)),
      atrValue: parseFloat(positionData.atrValue.toFixed(2)),
      maxShares: Math.floor(positionData.riskAmount / positionData.stopLossDistance),
      riskPerShare: parseFloat(positionData.stopLossDistance.toFixed(2)),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Failed to calculate position size for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Display detailed ATR analysis in console
 * @param symbol Stock symbol
 * @param period ATR period
 */
export async function displayATRAnalysis(
  symbol: string,
  period: number = 14,
  useMockData: boolean = true
): Promise<void> {
  try {
    console.log(`\n📊 ATR Analysis for ${symbol.toUpperCase()}`);
    console.log('='.repeat(50));

    let analysis: any;
    let candles: any[];
    let currentPrice: number;

    if (useMockData) {
      console.log('📊 Using mock data for demonstration\n');

      // Generate mock candles
      candles = generateMockCandles(symbol, 200);
      currentPrice = candles[candles.length - 1].close;

      // Generate mock ATR analysis
      const atrValue = currentPrice * (0.02 + Math.random() * 0.06); // ATR 2-8% of price
      const previousATR = atrValue * (0.95 + Math.random() * 0.1);
      const percentageOfPrice = (atrValue / currentPrice) * 100;

      const volatilityLevels = ['VERY_LOW', 'LOW', 'NORMAL', 'HIGH', 'VERY_HIGH'];
      const volatilityTrends = ['INCREASING', 'DECREASING', 'STABLE'];
      const signals = ['BREAKOUT_LIKELY', 'CONSOLIDATION', 'NORMAL_VOLATILITY'];

      analysis = {
        atr: {
          current: atrValue,
          previous: previousATR,
          period: period
        },
        volatility: volatilityLevels[Math.floor(Math.random() * volatilityLevels.length)],
        volatilityTrend: volatilityTrends[Math.floor(Math.random() * volatilityTrends.length)],
        percentageOfPrice: percentageOfPrice,
        signal: signals[Math.floor(Math.random() * signals.length)],
        interpretation: [
          `ATR at $${atrValue.toFixed(2)} represents ${percentageOfPrice.toFixed(2)}% of current price`,
          `Volatility is ${volatilityLevels[Math.floor(Math.random() * volatilityLevels.length)].toLowerCase().replace('_', ' ')} based on recent price movements`,
          `ATR trend suggests ${volatilityTrends[Math.floor(Math.random() * volatilityTrends.length)].toLowerCase()} volatility`
        ],
        tradingStrategy: {
          positionSizing: 'Use ATR for position sizing calculations',
          stopLoss: `Set stop loss at ${(atrValue * 2).toFixed(2)} (2x ATR) from entry`,
          entryStrategy: 'Monitor volatility for optimal entry timing',
          riskManagement: `Daily range typically ${atrValue.toFixed(2)} (${percentageOfPrice.toFixed(1)}% of price)`
        }
      };
    } else {
      analysis = await performATRAnalysis(symbol, period);
      candles = await getCandles(symbol);
      currentPrice = candles[candles.length - 1].close;
    }

    // Basic ATR Information
    console.log(`\n🔢 ATR Details:`);
    console.log(`   Period: ${analysis.atr.period} days`);
    console.log(`   Current ATR: $${analysis.atr.current.toFixed(2)}`);
    console.log(`   Previous ATR: $${analysis.atr.previous.toFixed(2)}`);
    console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`   ATR as % of Price: ${analysis.percentageOfPrice.toFixed(2)}%`);

    // Volatility Assessment
    console.log(`\n📈 Volatility Analysis:`);
    const volatilityEmoji = analysis.volatility === 'VERY_HIGH' ? '🔥' : 
                           analysis.volatility === 'HIGH' ? '📈' : 
                           analysis.volatility === 'NORMAL' ? '📊' : 
                           analysis.volatility === 'LOW' ? '📉' : '😴';
    console.log(`   ${volatilityEmoji} Volatility Level: ${analysis.volatility.replace('_', ' ')}`);
    
    const trendEmoji = analysis.volatilityTrend === 'INCREASING' ? '⬆️' : 
                      analysis.volatilityTrend === 'DECREASING' ? '⬇️' : '➡️';
    console.log(`   ${trendEmoji} Volatility Trend: ${analysis.volatilityTrend}`);

    // Market Signal
    console.log(`\n🎯 Market Signal:`);
    const signalEmoji = analysis.signal === 'BREAKOUT_LIKELY' ? '🚀' : 
                       analysis.signal === 'CONSOLIDATION' ? '⚠️' : '📊';
    console.log(`   ${signalEmoji} Signal: ${analysis.signal.replace('_', ' ')}`);

    // Interpretation
    console.log(`\n💡 Analysis:`);
    analysis.interpretation.forEach((point: string) => {
      console.log(`   • ${point}`);
    });

    // Trading Strategy
    console.log(`\n📋 Trading Strategy:`);
    console.log(`   Position Sizing: ${analysis.tradingStrategy.positionSizing}`);
    console.log(`   Stop Loss: ${analysis.tradingStrategy.stopLoss}`);
    console.log(`   Entry Strategy: ${analysis.tradingStrategy.entryStrategy}`);
    console.log(`   Risk Management: ${analysis.tradingStrategy.riskManagement}`);

    // Calculate trading levels
    const levels = calculateATRLevels(candles, period, 2);
    console.log(`\n🎯 ATR-Based Levels (2x multiplier):`);
    console.log(`   Support: $${levels.support.toFixed(2)}`);
    console.log(`   Resistance: $${levels.resistance.toFixed(2)}`);
    console.log(`   Expected Daily Range: $${(levels.atrValue * 2).toFixed(2)}`);

    console.log(`\n⏰ Analysis completed at ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error(`❌ Error analyzing ATR for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Display ATR-based position sizing analysis
 * @param symbol Stock symbol
 * @param accountSize Total account size
 * @param riskPercent Risk percentage per trade
 * @param period ATR period
 */
export async function displayPositionSizing(
  symbol: string,
  accountSize: number = 10000,
  riskPercent: number = 0.02,
  period: number = 14
): Promise<void> {
  try {
    console.log(`\n💰 ATR Position Sizing for ${symbol.toUpperCase()}`);
    console.log('='.repeat(50));

    const positionData = await calculatePositionSize(symbol, accountSize, riskPercent, 2, period);
    const candles = await getCandles(symbol);
    const currentPrice = candles[candles.length - 1].close;

    console.log(`\n📊 Account Parameters:`);
    console.log(`   Account Size: $${accountSize.toLocaleString()}`);
    console.log(`   Risk per Trade: ${(riskPercent * 100).toFixed(1)}%`);
    console.log(`   Risk Amount: $${positionData.riskAmount.toFixed(2)}`);

    console.log(`\n📈 Position Details:`);
    console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
    console.log(`   ATR Value: $${positionData.atrValue.toFixed(2)}`);
    console.log(`   Stop Loss Distance: $${positionData.stopLossDistance.toFixed(2)} (2x ATR)`);
    console.log(`   Risk per Share: $${positionData.riskPerShare.toFixed(2)}`);

    console.log(`\n🎯 Position Sizing:`);
    console.log(`   Recommended Shares: ${positionData.maxShares}`);
    console.log(`   Position Value: $${(positionData.maxShares * currentPrice).toFixed(2)}`);
    console.log(`   Stop Loss Price: $${(currentPrice - positionData.stopLossDistance).toFixed(2)}`);

    const positionPercent = (positionData.maxShares * currentPrice) / accountSize * 100;
    console.log(`   Position as % of Account: ${positionPercent.toFixed(1)}%`);

    console.log(`\n💡 Risk Management:`);
    if (positionPercent > 50) {
      console.log(`   ⚠️  Warning: Position size is ${positionPercent.toFixed(1)}% of account - consider reducing risk`);
    } else if (positionPercent < 5) {
      console.log(`   ℹ️  Position size is conservative at ${positionPercent.toFixed(1)}% of account`);
    } else {
      console.log(`   ✅ Position size is appropriate at ${positionPercent.toFixed(1)}% of account`);
    }

    console.log(`\n⏰ Analysis completed at ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error(`❌ Error calculating position sizing for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}
