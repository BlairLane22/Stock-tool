import axios from 'axios';
import { DatabasePortfolioService } from './databasePortfolioService';
import { BackendService } from './backendService';

export interface TradingAnalysis {
  symbol: string;
  currentPrice: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string[];
  indicators: {
    rsi?: any;
    macd?: any;
    bollingerBands?: any;
    headAndShoulders?: any;
    cupAndHandle?: any;
  };
  targetPrice?: number;
  stopLoss?: number;
  recommendedQuantity?: number;
  riskReward?: number;
  metadata?: {
    dataSource: string;
    timestamp: string;
    candleCount: number;
    usedMockData: boolean;
  };
}

export class TradingService {
  private portfolioService: DatabasePortfolioService;
  private backendService: BackendService;
  private backendApiUrl: string;

  constructor() {
    this.portfolioService = new DatabasePortfolioService();
    this.backendService = new BackendService();
    this.backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
  }

  /**
   * Analyze historical data for backtesting
   */
  async analyzeHistoricalData(
    symbol: string,
    strategyId: string,
    historicalData: any,
    currentDate: string,
    lookbackDays: number = 50
  ): Promise<TradingAnalysis> {
    console.log(`🔍 Analyzing ${symbol} historical data for ${currentDate}...`);

    try {
      // Get strategy
      const strategy = await this.portfolioService.getTradingStrategy(strategyId);
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }

      console.log(`📋 Using strategy "${strategy.name}" with indicators: ${strategy.indicators.join(', ')}`);

      // Get historical price data for indicator calculation
      const sortedDates = Object.keys(historicalData).sort();
      const currentIndex = sortedDates.indexOf(currentDate);

      if (currentIndex < lookbackDays) {
        // Not enough historical data for analysis
        return {
          symbol,
          currentPrice: parseFloat(historicalData[currentDate]['4. close']),
          recommendation: 'HOLD',
          confidence: 'LOW',
          reasoning: ['Insufficient historical data for analysis'],
          indicators: {},
          metadata: {
            dataSource: 'Historical Data',
            timestamp: new Date().toISOString(),
            candleCount: 0,
            usedMockData: false
          }
        };
      }

      // Get price data for the lookback period
      const priceData = [];
      for (let i = currentIndex - lookbackDays; i <= currentIndex; i++) {
        const date = sortedDates[i];
        const dayData = historicalData[date];
        priceData.push({
          date,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          volume: parseInt(dayData['5. volume'])
        });
      }

      // Calculate indicators based on historical data
      const indicators = await this.calculateHistoricalIndicators(priceData, strategy.indicators);

      // Get current price info
      const currentPrice = parseFloat(historicalData[currentDate]['4. close']);
      const previousPrice = currentIndex > 0 ? parseFloat(historicalData[sortedDates[currentIndex - 1]]['4. close']) : currentPrice;
      const change = currentPrice - previousPrice;
      const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

      // Make trading decision based on calculated indicators
      const analysis = this.makeHistoricalTradingDecision(indicators, strategy, currentPrice);

      // Debug logging for first few days
      if (currentDate === '2000-03-15' || currentDate === '2000-06-15' || currentDate === '2001-01-15') {
        console.log(`🔍 DEBUG ${currentDate}: Price=${currentPrice}, EMA=${indicators.ema?.value?.toFixed(2)}, Signal=${analysis.recommendation}, Reasoning:`, analysis.reasoning);
      }

      // Debug logging for MACD-RSI strategy
      if (strategy.indicators.includes('macd') && strategy.indicators.includes('rsi') &&
          (currentDate === '2000-03-15' || currentDate === '2000-06-15' || currentDate === '2001-01-15')) {
        console.log(`🔍 MACD-RSI DEBUG ${currentDate}: MACD=${indicators.macd?.current?.toFixed(4)}, Signal=${indicators.macd?.signalCurrent?.toFixed(4)}, RSI=${indicators.rsi?.value?.toFixed(1)}, Decision=${analysis.recommendation}`);
      }

      return {
        symbol,
        currentPrice,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        indicators,
        metadata: {
          dataSource: 'Historical Data',
          timestamp: new Date().toISOString(),
          candleCount: priceData.length,
          usedMockData: false
        }
      };

    } catch (error) {
      console.error(`❌ Error analyzing historical data for ${symbol}:`, error);
      return {
        symbol,
        currentPrice: parseFloat(historicalData[currentDate]['4. close']),
        recommendation: 'HOLD',
        confidence: 'LOW',
        reasoning: [`Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        indicators: {},
        metadata: {
          dataSource: 'Historical Data',
          timestamp: new Date().toISOString(),
          candleCount: 0,
          usedMockData: false
        }
      };
    }
  }

  /**
   * Analyze a stock and make trading recommendation
   */
  async analyzeStock(symbol: string, strategyId?: string, useMockData: boolean = true): Promise<TradingAnalysis> {
    console.log(`🔍 Analyzing ${symbol} for trading opportunities...`);

    try {
      let indicatorsToFetch = ['rsi', 'macd', 'bollinger-bands', 'head-and-shoulders', 'cup-handle'];
      let strategy = null;

      // If strategy is specified, get it and use only its indicators
      if (strategyId) {
        strategy = await this.portfolioService.getTradingStrategy(strategyId);
        if (strategy) {
          indicatorsToFetch = strategy.indicators;
          console.log(`📋 Using strategy "${strategy.name}" with indicators: ${indicatorsToFetch.join(', ')}`);
        }
      }

      // OPTIMIZED: Fetch all indicators in a single API call
      console.log(`🚀 Using optimized multi-indicator analysis for ${symbol}`);

      const backendIndicators = this.backendService.convertStrategyIndicators(indicatorsToFetch);
      const multiIndicatorResult = await this.backendService.getOptimizedMultiIndicatorAnalysis(
        symbol,
        backendIndicators,
        useMockData
      );

      // Map results to indicator names for compatibility
      const indicators: any = {};
      if (multiIndicatorResult.indicators) {
        Object.keys(multiIndicatorResult.indicators).forEach(key => {
          const mappedName = this.mapBackendIndicatorName(key);
          indicators[mappedName] = multiIndicatorResult.indicators[key];
        });
      }

      // Handle any errors from the multi-indicator call
      if (multiIndicatorResult.errors && Object.keys(multiIndicatorResult.errors).length > 0) {
        console.warn(`⚠️ Some indicators failed for ${symbol}:`, multiIndicatorResult.errors);
      }

      // Make trading decision based on indicators and strategy
      const analysis = strategy
        ? this.makeStrategyDecision(symbol, indicators, strategy)
        : this.makeDecision(symbol, indicators);

      // Add metadata about data source
      const metadata = {
        dataSource: multiIndicatorResult.dataSource || (useMockData ? 'Mock Data' : 'Live API'),
        timestamp: multiIndicatorResult.timestamp || new Date().toISOString(),
        candleCount: multiIndicatorResult.candleCount || 0,
        usedMockData: useMockData
      };

      console.log(`📊 Analysis complete for ${symbol}: ${analysis.recommendation} (${analysis.confidence})`);

      return {
        ...analysis,
        metadata
      };

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error);

      return {
        symbol,
        currentPrice: 0,
        recommendation: 'HOLD',
        confidence: 'LOW',
        reasoning: ['Analysis failed due to API error'],
        indicators: {},
        recommendedQuantity: 0,
        metadata: {
          dataSource: useMockData ? 'Mock Data' : 'Live API',
          timestamp: new Date().toISOString(),
          candleCount: 0,
          usedMockData: useMockData
        }
      };
    }
  }

  /**
   * Map backend indicator names to analysis object keys
   */
  private mapIndicatorName(indicator: string): string {
    const mapping: { [key: string]: string } = {
      'rsi': 'rsi',
      'macd': 'macd',
      'bollinger-bands': 'bollingerBands',
      'head-and-shoulders': 'headAndShoulders',
      'cup-handle': 'cupAndHandle',
      'ema': 'ema'
    };
    return mapping[indicator] || indicator;
  }

  /**
   * Map backend multi-indicator response keys to analysis object keys
   */
  private mapBackendIndicatorName(backendKey: string): string {
    const mapping: { [key: string]: string } = {
      'rsi': 'rsi',
      'macd': 'macd',
      'bollinger': 'bollingerBands',
      'head-shoulders': 'headAndShoulders',
      'cup-handle': 'cupAndHandle',
      'ema': 'ema',
      'atr': 'atr',
      'mfi': 'mfi',
      'imi': 'imi'
    };
    return mapping[backendKey] || backendKey;
  }

  /**
   * LEGACY: Get indicator data from backend API (replaced by optimized multi-indicator)
   * Kept for fallback purposes
   */
  private async getIndicatorLegacy(indicator: string, symbol: string): Promise<any> {
    const url = `${this.backendApiUrl}/api/${indicator}/${symbol}/quick`;
    console.log(`📡 [LEGACY] Fetching ${indicator} for ${symbol}...`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'StockTrack-Portfolio-API/1.0.0'
      }
    });

    return response.data;
  }

  /**
   * Make trading decision based on custom strategy
   */
  private makeStrategyDecision(symbol: string, indicators: any, strategy: any): TradingAnalysis {
    const reasoning: string[] = [];
    let buySignals = 0;
    let sellSignals = 0;
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let currentPrice = 0;
    let targetPrice: number | undefined;
    let stopLoss: number | undefined;
    let riskReward: number | undefined;

    reasoning.push(`🎯 Using strategy: "${strategy.name}"`);
    reasoning.push(`📊 Indicators: ${strategy.indicators.join(', ')}`);

    // Analyze each indicator in the strategy
    for (const indicatorName of strategy.indicators) {
      const mappedName = this.mapIndicatorName(indicatorName);
      const indicatorData = indicators[mappedName];

      if (!indicatorData) {
        reasoning.push(`⚠️ ${indicatorName.toUpperCase()} data unavailable`);
        continue;
      }

      currentPrice = indicatorData.price || currentPrice;

      // Analyze based on indicator type
      if (indicatorName === 'rsi' && indicatorData) {
        // Handle both old format (rsi.rsi) and new format (rsi.rsi.current)
        const rsi = indicatorData.rsi?.current || indicatorData.rsi?.rsi?.current || indicatorData.rsi;
        if (typeof rsi === 'number') {
          if (rsi < 30) {
            buySignals++;
            reasoning.push(`🟢 RSI oversold (${rsi.toFixed(1)}) - buy signal`);
          } else if (rsi > 70) {
            sellSignals++;
            reasoning.push(`🔴 RSI overbought (${rsi.toFixed(1)}) - sell signal`);
          } else {
            reasoning.push(`⚪ RSI neutral (${rsi.toFixed(1)})`);
          }
        } else {
          reasoning.push(`⚠️ RSI data format issue`);
        }
      }

      if (indicatorName === 'macd' && indicatorData) {
        // Handle both old format (macd.signal) and new format (macd.macd.signal)
        const signal = indicatorData.signal || indicatorData.macd?.signal;
        if (signal) {
          if (signal === 'BUY') {
            buySignals++;
            reasoning.push(`🟢 MACD bullish signal`);
          } else if (signal === 'SELL') {
            sellSignals++;
            reasoning.push(`🔴 MACD bearish signal`);
          } else {
            reasoning.push(`⚪ MACD neutral`);
          }
        } else {
          reasoning.push(`⚠️ MACD data format issue`);
        }
      }

      if (indicatorName === 'bollinger-bands' && indicatorData.signal) {
        if (indicatorData.signal === 'BUY') {
          buySignals++;
          reasoning.push(`🟢 Bollinger Bands buy signal`);
        } else if (indicatorData.signal === 'SELL') {
          sellSignals++;
          reasoning.push(`🔴 Bollinger Bands sell signal`);
        }
      }

      if (indicatorName === 'head-and-shoulders' && indicatorData.isPattern) {
        if (indicatorData.signal === 'SELL' && indicatorData.confidence === 'HIGH') {
          sellSignals += 2;
          reasoning.push(`🔴 Head & Shoulders pattern - strong bearish signal`);
          targetPrice = indicatorData.targetPrice;
          stopLoss = indicatorData.stopLoss;
          riskReward = indicatorData.riskReward;
        }
      }

      if (indicatorName === 'cup-handle' && indicatorData.patternDetected) {
        if (indicatorData.signal === 'BUY' && indicatorData.confidence === 'HIGH') {
          buySignals += 2;
          reasoning.push(`🟢 Cup & Handle pattern - strong bullish signal`);
          targetPrice = indicatorData.targetPrice;
          stopLoss = indicatorData.stopLoss;
        }
      }

      if (indicatorName === 'ema' && indicatorData) {
        // EMA analysis for 50-day crossover strategy
        const signal = indicatorData.signal;
        const trend = indicatorData.trend;
        const pricePosition = indicatorData.pricePosition;
        const emaValue = indicatorData.ema?.current;
        const strength = indicatorData.strength;

        if (signal && trend) {
          if (signal === 'BUY' && trend === 'BULLISH') {
            buySignals++;
            reasoning.push(`🟢 EMA bullish signal - price above 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
          } else if (signal === 'SELL' && trend === 'BEARISH') {
            sellSignals++;
            reasoning.push(`🔴 EMA bearish signal - price below 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
          } else {
            reasoning.push(`⚪ EMA neutral - trend: ${trend}, position: ${pricePosition}`);
          }
        } else {
          reasoning.push(`⚠️ EMA data incomplete - signal: ${signal}, trend: ${trend}`);
        }
      }
    }

    // Apply strategy-specific conditions
    const buyConditions = strategy.buyConditions;
    const sellConditions = strategy.sellConditions;

    // Determine recommendation based on strategy rules
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH' = 'HOLD';

    // Handle individual indicator strategies with specific conditions
    console.log('🔍 DEBUG: Checking individual indicator strategy:', {
      strategyName: strategy.name,
      indicators: strategy.indicators,
      indicatorsType: typeof strategy.indicators,
      isIndividual: this.isIndividualIndicatorStrategy(strategy)
    });

    if (this.isIndividualIndicatorStrategy(strategy) || strategy.name?.includes('Turtle-Style Donchian + ATR')) {
      console.log('🎯 DEBUG: Using individual indicator strategy logic');
      recommendation = this.evaluateIndividualIndicatorStrategy(strategy, indicators, reasoning);
    }
    // Handle multi-indicator strategies
    else if (buyConditions.min_buy_signals && buySignals >= buyConditions.min_buy_signals) {
      recommendation = 'BUY';
      confidence = buySignals >= 3 ? 'HIGH' : 'MEDIUM';
    } else if (sellConditions.min_sell_signals && sellSignals >= sellConditions.min_sell_signals) {
      recommendation = 'SELL';
      confidence = sellSignals >= 3 ? 'HIGH' : 'MEDIUM';
    } else if (buySignals > sellSignals && buySignals > 0) {
      recommendation = 'WATCH';
      reasoning.push(`⚪ Weak buy signals - watching for better entry`);
    } else if (sellSignals > buySignals && sellSignals > 0) {
      recommendation = 'WATCH';
      reasoning.push(`⚪ Weak sell signals - watching for confirmation`);
    }

    // Apply risk management from strategy
    const riskMgmt = strategy.riskManagement;
    if (riskMgmt && currentPrice > 0) {
      if (!stopLoss && riskMgmt.stop_loss_percent) {
        stopLoss = recommendation === 'BUY'
          ? currentPrice * (1 - riskMgmt.stop_loss_percent / 100)
          : currentPrice * (1 + riskMgmt.stop_loss_percent / 100);
      }
      if (!targetPrice && riskMgmt.take_profit_percent) {
        targetPrice = recommendation === 'BUY'
          ? currentPrice * (1 + riskMgmt.take_profit_percent / 100)
          : currentPrice * (1 - riskMgmt.take_profit_percent / 100);
      }
    }

    const recommendedQuantity = this.calculatePositionSize(currentPrice, recommendation, confidence);

    return {
      symbol,
      currentPrice,
      recommendation,
      confidence,
      reasoning,
      indicators,
      targetPrice,
      stopLoss,
      recommendedQuantity,
      riskReward
    };
  }

  /**
   * Make trading decision based on multiple indicators
   */
  private makeDecision(symbol: string, indicators: any): TradingAnalysis {
    const reasoning: string[] = [];
    let buySignals = 0;
    let sellSignals = 0;
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let currentPrice = 0;
    let targetPrice: number | undefined;
    let stopLoss: number | undefined;
    let riskReward: number | undefined;

    // RSI Analysis
    if (indicators.rsi) {
      currentPrice = indicators.rsi.price || currentPrice;
      // Handle both old format (rsi.rsi) and new format (rsi.rsi.current)
      const rsi = indicators.rsi.rsi?.current || indicators.rsi.rsi;

      if (typeof rsi === 'number') {
        if (rsi < 30) {
          buySignals++;
          reasoning.push(`🟢 RSI oversold (${rsi.toFixed(1)}) - potential buy opportunity`);
        } else if (rsi > 70) {
          sellSignals++;
          reasoning.push(`🔴 RSI overbought (${rsi.toFixed(1)}) - potential sell signal`);
        } else {
          reasoning.push(`⚪ RSI neutral (${rsi.toFixed(1)})`);
        }
      } else {
        reasoning.push(`⚠️ RSI data format issue`);
      }
    }

    // MACD Analysis
    if (indicators.macd) {
      currentPrice = indicators.macd.price || currentPrice;
      const signal = indicators.macd.signal;
      
      if (signal === 'BUY') {
        buySignals++;
        reasoning.push(`🟢 MACD bullish signal - momentum increasing`);
      } else if (signal === 'SELL') {
        sellSignals++;
        reasoning.push(`🔴 MACD bearish signal - momentum decreasing`);
      } else {
        reasoning.push(`⚪ MACD neutral - no clear signal`);
      }
    }

    // Bollinger Bands Analysis
    if (indicators.bollingerBands) {
      currentPrice = indicators.bollingerBands.price || currentPrice;
      const signal = indicators.bollingerBands.signal;
      
      if (signal === 'BUY') {
        buySignals++;
        reasoning.push(`🟢 Bollinger Bands buy signal - price near lower band`);
      } else if (signal === 'SELL') {
        sellSignals++;
        reasoning.push(`🔴 Bollinger Bands sell signal - price near upper band`);
      }
    }

    // Head and Shoulders Analysis (Bearish pattern)
    if (indicators.headAndShoulders && indicators.headAndShoulders.isPattern) {
      const confidence = indicators.headAndShoulders.confidence;
      const signal = indicators.headAndShoulders.signal;
      
      if (signal === 'SELL' && confidence === 'HIGH') {
        sellSignals += 2; // Strong bearish signal
        reasoning.push(`🔴 Head & Shoulders pattern detected (${confidence}) - strong bearish reversal`);
        targetPrice = indicators.headAndShoulders.targetPrice;
        stopLoss = indicators.headAndShoulders.stopLoss;
        riskReward = indicators.headAndShoulders.riskReward;
      }
    }

    // Cup and Handle Analysis (Bullish pattern)
    if (indicators.cupAndHandle && indicators.cupAndHandle.patternDetected) {
      const confidence = indicators.cupAndHandle.confidence;
      const signal = indicators.cupAndHandle.signal;

      if (signal === 'BUY' && confidence === 'HIGH') {
        buySignals += 2; // Strong bullish signal
        reasoning.push(`🟢 Cup & Handle pattern detected (${confidence}) - strong bullish continuation`);
        targetPrice = indicators.cupAndHandle.targetPrice;
        stopLoss = indicators.cupAndHandle.stopLoss;
      }
    }

    // EMA Analysis (50-day moving average strategy)
    if (indicators.ema) {
      currentPrice = indicators.ema.price || currentPrice;
      const signal = indicators.ema.signal;
      const trend = indicators.ema.trend;
      const pricePosition = indicators.ema.pricePosition;
      const emaValue = indicators.ema.ema?.current;
      const strength = indicators.ema.strength;

      if (signal && trend) {
        if (signal === 'BUY' && trend === 'BULLISH') {
          buySignals++;
          reasoning.push(`🟢 EMA bullish trend - price above 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
        } else if (signal === 'SELL' && trend === 'BEARISH') {
          sellSignals++;
          reasoning.push(`🔴 EMA bearish trend - price below 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
        } else {
          reasoning.push(`⚪ EMA neutral - trend: ${trend}, position: ${pricePosition}`);
        }
      } else {
        reasoning.push(`⚠️ EMA analysis incomplete - signal: ${signal}, trend: ${trend}`);
      }
    }

    // Determine overall recommendation
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH' = 'HOLD';
    
    if (buySignals >= 3) {
      recommendation = 'BUY';
      confidence = 'HIGH';
    } else if (buySignals >= 2) {
      recommendation = 'BUY';
      confidence = 'MEDIUM';
    } else if (sellSignals >= 3) {
      recommendation = 'SELL';
      confidence = 'HIGH';
    } else if (sellSignals >= 2) {
      recommendation = 'SELL';
      confidence = 'MEDIUM';
    } else if (buySignals > sellSignals) {
      recommendation = 'WATCH';
      confidence = 'LOW';
      reasoning.push(`⚪ Weak bullish signals - consider watching for better entry`);
    } else if (sellSignals > buySignals) {
      recommendation = 'WATCH';
      confidence = 'LOW';
      reasoning.push(`⚪ Weak bearish signals - consider watching for confirmation`);
    } else {
      reasoning.push(`⚪ Mixed signals - holding current position recommended`);
    }

    // Calculate recommended quantity based on portfolio size and risk
    const recommendedQuantity = this.calculatePositionSize(currentPrice, recommendation, confidence);

    return {
      symbol,
      currentPrice,
      recommendation,
      confidence,
      reasoning,
      indicators,
      targetPrice,
      stopLoss,
      recommendedQuantity,
      riskReward
    };
  }

  /**
   * Check if strategy uses only a single indicator
   */
  private isIndividualIndicatorStrategy(strategy: any): boolean {
    // Parse indicators if it's a JSON string
    let indicators = strategy.indicators;
    if (typeof indicators === 'string') {
      try {
        indicators = JSON.parse(indicators);
      } catch (e) {
        console.warn('Failed to parse strategy indicators:', indicators);
        return false;
      }
    }

    return Array.isArray(indicators) && indicators.length === 1;
  }

  /**
   * Evaluate individual indicator strategies with specific conditions
   */
  private evaluateIndividualIndicatorStrategy(strategy: any, indicators: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    // Parse indicators if it's a JSON string
    let parsedIndicators = strategy.indicators;
    if (typeof parsedIndicators === 'string') {
      try {
        parsedIndicators = JSON.parse(parsedIndicators);
      } catch (e) {
        console.warn('Failed to parse strategy indicators:', parsedIndicators);
        return 'HOLD';
      }
    }

    const indicatorType = parsedIndicators[0];
    const buyConditions = strategy.buyConditions;
    const sellConditions = strategy.sellConditions;

    switch (indicatorType) {
      case 'bollinger-bands':
        return this.evaluateBollingerStrategy(indicators.bollingerBands, buyConditions, sellConditions, reasoning);

      case 'mfi':
        return this.evaluateMFIStrategy(indicators.mfi, buyConditions, sellConditions, reasoning);

      case 'rsi':
        return this.evaluateRSIStrategy(indicators.rsi, buyConditions, sellConditions, reasoning);

      case 'macd':
        return this.evaluateMACDStrategy(indicators.macd, buyConditions, sellConditions, reasoning);

      case 'ema':
        return this.evaluateEMAStrategy(indicators.ema, buyConditions, sellConditions, reasoning);

      case 'three-tier-trend':
        return this.evaluateThreeTierTrendStrategy(indicators, buyConditions, sellConditions, reasoning);

      case 'donchian':
        return this.evaluateDonchianBreakoutStrategy(indicators.donchian, buyConditions, sellConditions, reasoning);

      case 'turtle-donchian-atr':
        return this.evaluateTurtleDonchianATRStrategy(indicators, buyConditions, sellConditions, reasoning);

      default:
        reasoning.push(`⚠️ Unknown individual indicator strategy: ${indicatorType}`);
        return 'HOLD';
    }
  }

  /**
   * Evaluate Bollinger Bands strategy based on Investopedia trading rules
   */
  private evaluateBollingerStrategy(bollingerData: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    console.log('🔍 DEBUG evaluateBollingerStrategy: bollingerData structure:', JSON.stringify(bollingerData, null, 2));

    // Handle both backend API format (price) and historical format (currentPrice)
    const currentPrice = bollingerData.price || bollingerData.currentPrice;

    if (!bollingerData || !bollingerData.upper || !bollingerData.middle || !bollingerData.lower || !currentPrice) {
      reasoning.push(`⚠️ Bollinger Bands data incomplete - missing: ${!bollingerData.upper ? 'upper ' : ''}${!bollingerData.middle ? 'middle ' : ''}${!bollingerData.lower ? 'lower ' : ''}${!currentPrice ? 'price' : ''}`);
      return 'HOLD';
    }

    const { upper, middle, lower } = bollingerData;

    // Calculate band positions for better decision making
    const upperDistance = (currentPrice - upper) / upper * 100;
    const lowerDistance = (lower - currentPrice) / lower * 100;

    // BUY SIGNALS (Oversold conditions per Investopedia)
    // 1. Price touches or falls below lower band
    if (currentPrice <= lower * 1.005) { // 0.5% tolerance for touching lower band
      reasoning.push(`🟢 BUY: Price ${currentPrice.toFixed(2)} at/below lower band ${lower.toFixed(2)} - OVERSOLD condition`);
      return 'BUY';
    }

    // 2. Price bounces off lower band (within 2% of lower band and moving up)
    if (currentPrice <= lower * 1.02 && currentPrice > lower) {
      reasoning.push(`🟢 BUY: Price ${currentPrice.toFixed(2)} bouncing off lower band ${lower.toFixed(2)} - Mean reversion opportunity`);
      return 'BUY';
    }

    // SELL SIGNALS (Overbought conditions per Investopedia)
    // 1. Price touches or moves above upper band
    if (currentPrice >= upper * 0.995) { // 0.5% tolerance for touching upper band
      reasoning.push(`🔴 SELL: Price ${currentPrice.toFixed(2)} at/above upper band ${upper.toFixed(2)} - OVERBOUGHT condition`);
      return 'SELL';
    }

    // 2. Price near upper band (within 2% and likely to reverse)
    if (currentPrice >= upper * 0.98 && currentPrice < upper) {
      reasoning.push(`🔴 SELL: Price ${currentPrice.toFixed(2)} near upper band ${upper.toFixed(2)} - Potential reversal`);
      return 'SELL';
    }

    // WATCH signals for potential setups
    // Price moving toward lower band (potential buy setup)
    if (currentPrice <= lower * 1.05 && currentPrice > lower * 1.02) {
      reasoning.push(`👀 WATCH: Price ${currentPrice.toFixed(2)} approaching lower band ${lower.toFixed(2)} - Monitor for buy opportunity`);
      return 'WATCH';
    }

    // Price moving toward upper band (potential sell setup)
    if (currentPrice >= upper * 0.95 && currentPrice < upper * 0.98) {
      reasoning.push(`👀 WATCH: Price ${currentPrice.toFixed(2)} approaching upper band ${upper.toFixed(2)} - Monitor for sell opportunity`);
      return 'WATCH';
    }

    // HOLD if price is within normal range (middle area of bands)
    reasoning.push(`⚪ HOLD: Price ${currentPrice.toFixed(2)} in middle range [L:${lower.toFixed(2)} M:${middle.toFixed(2)} U:${upper.toFixed(2)}]`);
    return 'HOLD';
  }

  /**
   * Evaluate MFI strategy
   */
  private evaluateMFIStrategy(mfiData: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    if (!mfiData || typeof mfiData.mfi !== 'number') {
      reasoning.push(`⚠️ MFI data not available`);
      return 'HOLD';
    }

    const mfiValue = mfiData.mfi;

    // Check buy conditions (MFI below threshold)
    if (buyConditions.mfi_below && mfiValue < buyConditions.mfi_below) {
      reasoning.push(`🟢 MFI BUY signal - MFI ${mfiValue.toFixed(1)} below ${buyConditions.mfi_below} (oversold)`);
      return 'BUY';
    }

    // Check sell conditions (MFI above threshold)
    if (sellConditions.mfi_above && mfiValue > sellConditions.mfi_above) {
      reasoning.push(`🔴 MFI SELL signal - MFI ${mfiValue.toFixed(1)} above ${sellConditions.mfi_above} (overbought)`);
      return 'SELL';
    }

    reasoning.push(`⚪ MFI HOLD - value: ${mfiValue.toFixed(1)}`);
    return 'HOLD';
  }

  /**
   * Evaluate RSI strategy
   */
  private evaluateRSIStrategy(rsiData: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    // Handle both backend API format (rsi) and historical calculation format (value)
    const rsiValue = rsiData?.rsi || rsiData?.value;

    if (!rsiData || typeof rsiValue !== 'number') {
      reasoning.push(`⚠️ RSI data not available - received: ${JSON.stringify(rsiData)}`);
      return 'HOLD';
    }

    // Check buy conditions (RSI below threshold)
    if (buyConditions.rsi_below && rsiValue < buyConditions.rsi_below) {
      reasoning.push(`🟢 RSI BUY signal - RSI ${rsiValue.toFixed(1)} below ${buyConditions.rsi_below} (oversold)`);
      return 'BUY';
    }

    // Check sell conditions (RSI above threshold)
    if (sellConditions.rsi_above && rsiValue > sellConditions.rsi_above) {
      reasoning.push(`🔴 RSI SELL signal - RSI ${rsiValue.toFixed(1)} above ${sellConditions.rsi_above} (overbought)`);
      return 'SELL';
    }

    reasoning.push(`⚪ RSI HOLD - value: ${rsiValue.toFixed(1)}`);
    return 'HOLD';
  }

  /**
   * Evaluate MACD strategy
   */
  private evaluateMACDStrategy(macdData: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    if (!macdData) {
      reasoning.push(`⚠️ MACD data not available`);
      return 'HOLD';
    }

    const signal = macdData.signal || 'HOLD';
    const crossover = macdData.crossover;

    // Check buy conditions
    if (buyConditions.macd_signal === 'BUY' && signal === 'BUY') {
      reasoning.push(`🟢 MACD BUY signal - bullish crossover`);
      return 'BUY';
    }

    if (buyConditions.crossover === 'BULLISH_CROSSOVER' && crossover === 'BULLISH_CROSSOVER') {
      reasoning.push(`🟢 MACD BUY signal - bullish crossover detected`);
      return 'BUY';
    }

    // Check sell conditions
    if (sellConditions.macd_signal === 'SELL' && signal === 'SELL') {
      reasoning.push(`🔴 MACD SELL signal - bearish crossover`);
      return 'SELL';
    }

    if (sellConditions.crossover === 'BEARISH_CROSSOVER' && crossover === 'BEARISH_CROSSOVER') {
      reasoning.push(`🔴 MACD SELL signal - bearish crossover detected`);
      return 'SELL';
    }

    reasoning.push(`⚪ MACD HOLD - signal: ${signal}, crossover: ${crossover}`);
    return 'HOLD';
  }

  /**
   * Evaluate EMA strategy based on 50-day EMA crossover and trend analysis
   */
  private evaluateEMAStrategy(emaData: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    if (!emaData) {
      reasoning.push(`⚠️ EMA data not available`);
      return 'HOLD';
    }

    // Handle both backend API format and historical format
    const emaValue = emaData.value || emaData.ema || emaData.current;
    const currentPrice = emaData.price || emaData.currentPrice;
    const signal = emaData.signal;

    if (!emaValue || !currentPrice) {
      reasoning.push(`⚠️ EMA data incomplete - missing: ${!emaValue ? 'emaValue' : ''} ${!currentPrice ? 'currentPrice' : ''}`);
      return 'HOLD';
    }

    // Investopedia 50-day EMA Strategy Rules:
    // BUY: Price above EMA + bullish trend + strong signal
    // SELL: Price below EMA + bearish trend + strong signal

    const priceAboveEMA = currentPrice > emaValue;
    const priceBelowEMA = currentPrice < emaValue;

    // Check buy conditions based on Investopedia EMA crossover strategy
    // BUY: Price above EMA (simple crossover strategy)
    if (priceAboveEMA && signal === 'BUY') {
      reasoning.push(`🟢 EMA BUY: Price $${currentPrice.toFixed(2)} above 50-day EMA $${emaValue.toFixed(2)} (crossover signal)`);
      return 'BUY';
    }

    // Check sell conditions
    // SELL: Price below EMA (simple crossover strategy)
    if (priceBelowEMA && signal === 'SELL') {
      reasoning.push(`🔴 EMA SELL: Price $${currentPrice.toFixed(2)} below 50-day EMA $${emaValue.toFixed(2)} (crossover signal)`);
      return 'SELL';
    }

    // Hold conditions
    if (priceAboveEMA) {
      reasoning.push(`⚪ EMA HOLD: Price above EMA but no buy signal (signal: ${signal})`);
    } else {
      reasoning.push(`⚪ EMA HOLD: Price below EMA but no sell signal (signal: ${signal})`);
    }

    return 'HOLD';
  }

  /**
   * Evaluate Donchian Channels Breakout Strategy (Turtle Trading System)
   * Uses 20-day Donchian Channels for breakout signals
   * Based on Richard Dennis Turtle Trading methodology
   */
  private evaluateDonchianBreakoutStrategy(donchianData: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    if (!donchianData) {
      reasoning.push(`⚠️ Donchian Channels data not available`);
      return 'HOLD';
    }

    // Handle both backend API format and historical format
    const currentPrice = donchianData.price || donchianData.currentPrice || donchianData.current_price || 0;
    const upperChannel = donchianData.upperChannel || donchianData.upper_channel || donchianData.upper || 0;
    const lowerChannel = donchianData.lowerChannel || donchianData.lower_channel || donchianData.lower || 0;
    const middleChannel = donchianData.middleChannel || donchianData.middle_channel || donchianData.middle || 0;
    const position = donchianData.position || 'MIDDLE';
    const signal = donchianData.signal || 'HOLD';

    if (!currentPrice || !upperChannel || !lowerChannel) {
      reasoning.push(`❌ Missing Donchian Channels data: price=${currentPrice}, upper=${upperChannel}, lower=${lowerChannel}`);
      return 'HOLD';
    }

    reasoning.push(`📊 Donchian Analysis: Price=$${currentPrice.toFixed(2)}, Upper=$${upperChannel.toFixed(2)}, Lower=$${lowerChannel.toFixed(2)}, Middle=$${middleChannel.toFixed(2)}`);

    // BREAKOUT BUY SIGNAL
    if (position === 'UPPER_BREAKOUT' || (currentPrice >= upperChannel && signal === 'BUY')) {
      reasoning.push(`🚀 DONCHIAN BUY: Price broke above upper channel ($${currentPrice.toFixed(2)} >= $${upperChannel.toFixed(2)}) - Classic breakout signal`);
      return 'BUY';
    }

    // BREAKDOWN SELL SIGNAL
    if (position === 'LOWER_BREAKOUT' || (currentPrice <= lowerChannel && signal === 'SELL')) {
      reasoning.push(`📉 DONCHIAN SELL: Price broke below lower channel ($${currentPrice.toFixed(2)} <= $${lowerChannel.toFixed(2)}) - Classic breakdown signal`);
      return 'SELL';
    }

    // BULLISH BIAS (Upper half of channel)
    if (position === 'UPPER_HALF' || (currentPrice > middleChannel && currentPrice < upperChannel)) {
      const distanceToBreakout = ((upperChannel - currentPrice) / currentPrice * 100);
      reasoning.push(`📈 DONCHIAN WATCH: Price in upper half of channel, ${distanceToBreakout.toFixed(1)}% from breakout. Bullish bias but waiting for confirmation.`);
      return 'WATCH';
    }

    // BEARISH BIAS (Lower half of channel)
    if (position === 'LOWER_HALF' || (currentPrice < middleChannel && currentPrice > lowerChannel)) {
      const distanceToBreakdown = ((currentPrice - lowerChannel) / currentPrice * 100);
      reasoning.push(`📉 DONCHIAN WATCH: Price in lower half of channel, ${distanceToBreakdown.toFixed(1)}% from breakdown. Bearish bias but waiting for confirmation.`);
      return 'WATCH';
    }

    // NEUTRAL (Near middle channel)
    reasoning.push(`⚪ DONCHIAN HOLD: Price near middle channel ($${middleChannel.toFixed(2)}). Waiting for directional breakout.`);
    return 'HOLD';
  }

  /**
   * Evaluate Turtle-Style Donchian + ATR Strategy (Complete Turtle Trading System)
   * Based on original Turtle Trading rules with:
   * - 20-day Donchian breakout for entry
   * - 10-day Donchian breakout for exit
   * - ATR-based position sizing (1% risk per trade)
   * - 2×ATR volatility stops
   * - Pyramiding capability
   */
  private evaluateTurtleDonchianATRStrategy(indicators: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    const donchianData = indicators.donchian;
    const atrData = indicators.atr;

    if (!donchianData || !atrData) {
      reasoning.push(`⚠️ Turtle strategy requires both Donchian Channels and ATR data`);
      return 'HOLD';
    }

    // Extract Donchian data (20-day channels for entry)
    const currentPrice = donchianData.current_price || donchianData.price || 0;
    const upper20 = donchianData.upper || 0; // 20-day high for entry
    const lower20 = donchianData.lower || 0; // 20-day low for entry
    const middle = donchianData.middle || 0;

    // Calculate 10-day channels for exits (using recent 10-day data)
    const upper10 = this.calculate10DayHigh(donchianData, currentPrice);
    const lower10 = this.calculate10DayLow(donchianData, currentPrice);

    // Extract ATR data
    const atrValue = atrData.value || atrData.atr || atrData.current || 0;

    if (!currentPrice || !upper20 || !lower20 || !atrValue) {
      reasoning.push(`❌ Missing Turtle strategy data: price=${currentPrice}, upper=${upper20}, lower=${lower20}, ATR=${atrValue}`);
      return 'HOLD';
    }

    reasoning.push(`🐢 Turtle Analysis: Price=$${currentPrice.toFixed(2)}, 20H=$${upper20.toFixed(2)}, 20L=$${lower20.toFixed(2)}, 10H=$${upper10.toFixed(2)}, 10L=$${lower10.toFixed(2)}, ATR=$${atrValue.toFixed(2)}`);

    // Calculate key Turtle metrics
    const volatilityStop = 2 * atrValue; // 2N stop distance
    const pyramidIncrement = 0.5 * atrValue; // 0.5N for adding units
    const accountEquity = 100000; // Simplified: $100k account
    const riskPerTrade = 0.01; // 1% risk per trade
    const dollarRisk = accountEquity * riskPerTrade;
    const positionSize = Math.floor(dollarRisk / volatilityStop);

    // ENTRY SIGNALS (20-day breakout)

    // LONG ENTRY: Price closes above 20-day high
    if (currentPrice >= upper20) {
      const stopPrice = currentPrice - volatilityStop;
      const riskRewardRatio = (upper20 - stopPrice) / volatilityStop;

      reasoning.push(`🚀 TURTLE LONG ENTRY: 20-day breakout ($${currentPrice.toFixed(2)} >= $${upper20.toFixed(2)})`);
      reasoning.push(`📊 ATR Position Sizing: ${positionSize} shares (1% risk = $${dollarRisk.toFixed(0)})`);
      reasoning.push(`🛡️ 2×ATR Stop Loss: $${stopPrice.toFixed(2)} (risk $${volatilityStop.toFixed(2)}/share)`);
      reasoning.push(`📈 Risk/Reward: ${riskRewardRatio.toFixed(2)}:1`);
      return 'BUY';
    }

    // SHORT ENTRY: Price closes below 20-day low (for futures/ETFs)
    if (currentPrice <= lower20) {
      const stopPrice = currentPrice + volatilityStop;

      reasoning.push(`📉 TURTLE SHORT ENTRY: 20-day breakdown ($${currentPrice.toFixed(2)} <= $${lower20.toFixed(2)})`);
      reasoning.push(`📊 ATR Position Sizing: ${positionSize} shares (1% risk = $${dollarRisk.toFixed(0)})`);
      reasoning.push(`🛡️ 2×ATR Stop Loss: $${stopPrice.toFixed(2)} (risk $${volatilityStop.toFixed(2)}/share)`);
      return 'SELL';
    }

    // EXIT SIGNALS (10-day breakout for existing positions)

    // LONG EXIT: Price closes below 10-day low
    if (currentPrice <= lower10 && currentPrice > lower20) {
      reasoning.push(`🔻 TURTLE LONG EXIT: 10-day breakdown ($${currentPrice.toFixed(2)} <= $${lower10.toFixed(2)})`);
      reasoning.push(`📉 Exit signal: Close long positions on 10-day low break`);
      return 'SELL';
    }

    // SHORT EXIT: Price closes above 10-day high
    if (currentPrice >= upper10 && currentPrice < upper20) {
      reasoning.push(`🔺 TURTLE SHORT EXIT: 10-day breakout ($${currentPrice.toFixed(2)} >= $${upper10.toFixed(2)})`);
      reasoning.push(`📈 Exit signal: Cover short positions on 10-day high break`);
      return 'BUY';
    }

    // PYRAMIDING SIGNALS (add units on favorable moves)
    const distanceFromEntry = Math.abs(currentPrice - middle);
    const pyramidUnits = Math.floor(distanceFromEntry / pyramidIncrement);

    if (pyramidUnits > 0 && pyramidUnits <= 3) {
      if (currentPrice > upper20) {
        reasoning.push(`🔺 TURTLE PYRAMID LONG: Add unit ${pyramidUnits + 1} (+${(pyramidUnits * pyramidIncrement).toFixed(2)} from entry)`);
        reasoning.push(`📊 Pyramid Size: ${Math.floor(positionSize * 0.5)} shares (reduced size for additional units)`);
        return 'BUY';
      } else if (currentPrice < lower20) {
        reasoning.push(`🔻 TURTLE PYRAMID SHORT: Add unit ${pyramidUnits + 1} (-${(pyramidUnits * pyramidIncrement).toFixed(2)} from entry)`);
        reasoning.push(`📊 Pyramid Size: ${Math.floor(positionSize * 0.5)} shares (reduced size for additional units)`);
        return 'SELL';
      }
    }

    // WATCH SIGNALS (near breakout levels)
    const breakoutThreshold = atrValue * 0.25; // 25% of ATR as threshold

    if (Math.abs(currentPrice - upper20) <= breakoutThreshold) {
      reasoning.push(`👀 TURTLE WATCH LONG: Near 20-day high breakout (${Math.abs(currentPrice - upper20).toFixed(2)} from breakout)`);
      reasoning.push(`🎯 Breakout Level: $${upper20.toFixed(2)} | Current: $${currentPrice.toFixed(2)}`);
      return 'WATCH';
    }

    if (Math.abs(currentPrice - lower20) <= breakoutThreshold) {
      reasoning.push(`👀 TURTLE WATCH SHORT: Near 20-day low breakdown (${Math.abs(currentPrice - lower20).toFixed(2)} from breakdown)`);
      reasoning.push(`🎯 Breakdown Level: $${lower20.toFixed(2)} | Current: $${currentPrice.toFixed(2)}`);
      return 'WATCH';
    }

    // DEFAULT: HOLD
    const channelPosition = ((currentPrice - lower20) / (upper20 - lower20)) * 100;
    reasoning.push(`⚪ TURTLE HOLD: Price in ${channelPosition.toFixed(1)}% of 20-day channel, waiting for breakout`);
    reasoning.push(`📊 Next signals: Long>${upper20.toFixed(2)}, Short<${lower20.toFixed(2)}, Exit Long<${lower10.toFixed(2)}, Exit Short>${upper10.toFixed(2)}`);
    return 'HOLD';
  }

  /**
   * Calculate 10-day high for exit signals (simplified approximation)
   */
  private calculate10DayHigh(donchianData: any, currentPrice: number): number {
    // Simplified: Use 75% of the way from middle to upper as 10-day high approximation
    const upper20 = donchianData.upper || 0;
    const middle = donchianData.middle || 0;
    return middle + ((upper20 - middle) * 0.75);
  }

  /**
   * Calculate 10-day low for exit signals (simplified approximation)
   */
  private calculate10DayLow(donchianData: any, currentPrice: number): number {
    // Simplified: Use 75% of the way from middle to lower as 10-day low approximation
    const lower20 = donchianData.lower || 0;
    const middle = donchianData.middle || 0;
    return middle - ((middle - lower20) * 0.75);
  }

  /**
   * Evaluate Three-Tier Trend Trading Strategy (Pring-Inspired)
   * Uses EMA (as proxy for SMA), MACD, and RSI for comprehensive trend analysis
   * Adapted to work with available backend indicators
   */
  private evaluateThreeTierTrendStrategy(indicators: any, buyConditions: any, sellConditions: any, reasoning: string[]): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    try {
      // Extract available indicators (using EMA as proxy for SMA)
      const emaData = indicators.ema; // Will use as primary trend indicator
      const macdData = indicators.macd;
      const rsiData = indicators.rsi;

      if (!emaData || !macdData || !rsiData) {
        reasoning.push('❌ Three-Tier strategy requires EMA, MACD, and RSI indicators');
        return 'HOLD';
      }

      // Extract values from indicators
      const currentPrice = emaData.price || emaData.currentPrice || 0;
      const emaValue = emaData.value || emaData.ema || emaData.current || 0; // Primary trend (50-day EMA)
      const macdValue = macdData.macd || macdData.value || 0;
      const macdSignal = macdData.signal || macdData.signalLine || 0;
      const macdHistogram = macdData.histogram || macdData.hist || (macdValue - macdSignal);
      const rsiValue = rsiData.value || rsiData.rsi || rsiData.current || 0;

      if (!currentPrice || !emaValue || rsiValue === 0) {
        reasoning.push('❌ Missing required price, EMA, or RSI data for Three-Tier strategy');
        return 'HOLD';
      }

      // Step 1: Primary Trend (EMA as trend filter)
      const isPrimaryBullish = currentPrice > emaValue;
      const isPrimaryBearish = currentPrice < emaValue;

      // Step 2: Intermediate Trend (MACD confirmation)
      const isIntermediateBullish = macdHistogram > 0 && macdValue > macdSignal;
      const isIntermediateBearish = macdHistogram < 0 && macdValue < macdSignal;

      // Step 3: Momentum (RSI for entry timing)
      const isBullishRSI = rsiValue >= 40 && rsiValue <= 55; // RSI pullback zone for longs
      const isBearishRSI = rsiValue >= 45 && rsiValue <= 60; // RSI bounce zone for shorts

      // Step 4: Volume confirmation (simplified - use MACD histogram strength)
      const hasVolumeConfirmation = Math.abs(macdHistogram) > 0.1; // MACD histogram shows momentum

      reasoning.push(`📊 Three-Tier Analysis: Price=$${currentPrice.toFixed(2)}, EMA=$${emaValue.toFixed(2)}, RSI=${rsiValue.toFixed(1)}, MACD=${macdValue.toFixed(3)}, Hist=${macdHistogram.toFixed(3)}`);

      // LONG ENTRY CONDITIONS
      if (isPrimaryBullish && isIntermediateBullish && isBullishRSI && hasVolumeConfirmation) {
        reasoning.push(`🟢 THREE-TIER BUY: All conditions met - Price above EMA (${currentPrice.toFixed(2)} > ${emaValue.toFixed(2)}), MACD bullish, RSI pullback (${rsiValue.toFixed(1)})`);
        return 'BUY';
      }

      // SHORT ENTRY CONDITIONS
      if (isPrimaryBearish && isIntermediateBearish && isBearishRSI && hasVolumeConfirmation) {
        reasoning.push(`🔴 THREE-TIER SELL: All conditions met - Price below EMA (${currentPrice.toFixed(2)} < ${emaValue.toFixed(2)}), MACD bearish, RSI bounce (${rsiValue.toFixed(1)})`);
        return 'SELL';
      }

      // EXIT CONDITIONS
      // Momentum Exit: Extreme RSI levels
      if (rsiValue > 75) {
        reasoning.push(`🔴 THREE-TIER SELL: Momentum exit - RSI overbought (${rsiValue.toFixed(1)})`);
        return 'SELL';
      }

      if (rsiValue < 25) {
        reasoning.push(`🟢 THREE-TIER BUY: Momentum exit - RSI oversold (${rsiValue.toFixed(1)})`);
        return 'BUY';
      }

      // Trend Exit: Price crosses back through EMA with MACD confirmation
      if (isPrimaryBullish && !isIntermediateBullish) {
        reasoning.push(`🔴 THREE-TIER SELL: Trend exit - MACD turned bearish in uptrend`);
        return 'SELL';
      }

      if (isPrimaryBearish && !isIntermediateBearish) {
        reasoning.push(`🟢 THREE-TIER BUY: Trend exit - MACD turned bullish in downtrend`);
        return 'BUY';
      }

      // HOLD CONDITIONS
      let holdReason = '⚪ THREE-TIER HOLD: ';
      const conditions = [];

      if (!isPrimaryBullish && !isPrimaryBearish) conditions.push('Price near EMA');
      if (!isIntermediateBullish && !isIntermediateBearish) conditions.push('MACD neutral');
      if (!isBullishRSI && !isBearishRSI) conditions.push(`RSI not in entry zone (${rsiValue.toFixed(1)})`);
      if (!hasVolumeConfirmation) conditions.push('Weak momentum');

      reasoning.push(holdReason + (conditions.length > 0 ? conditions.join(', ') : 'Waiting for alignment'));
      return 'HOLD';

    } catch (error) {
      reasoning.push(`❌ Three-Tier Trend strategy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 'HOLD';
    }
  }

  /**
   * Calculate position size based on portfolio and risk management
   */
  private calculatePositionSize(price: number, recommendation: string, confidence: string): number {
    if (recommendation === 'HOLD' || recommendation === 'WATCH' || price <= 0) {
      return 0;
    }

    // Base position size as percentage of portfolio
    let positionPercent = 0.05; // 5% default
    
    if (confidence === 'HIGH') {
      positionPercent = 0.10; // 10% for high confidence
    } else if (confidence === 'MEDIUM') {
      positionPercent = 0.07; // 7% for medium confidence
    }

    // Assume $100,000 portfolio for calculation
    const portfolioValue = 100000;
    const positionValue = portfolioValue * positionPercent;
    const quantity = Math.floor(positionValue / price);

    return Math.max(1, quantity); // At least 1 share
  }

  /**
   * Analyze multiple stocks and save decisions
   */
  async analyzePortfolioOpportunities(symbols: string[]): Promise<TradingAnalysis[]> {
    console.log(`🎯 Analyzing ${symbols.length} stocks for trading opportunities...`);
    
    const analyses: TradingAnalysis[] = [];
    const portfolio = await this.portfolioService.getMainPortfolio();
    
    if (!portfolio) {
      throw new Error('Main portfolio not found');
    }

    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzeStock(symbol);
        analyses.push(analysis);

        // Save trading decision to database
        if (analysis.recommendation !== 'HOLD') {
          await this.portfolioService.saveTradingDecision({
            portfolioId: portfolio.id,
            symbol: analysis.symbol,
            decisionType: analysis.recommendation,
            confidenceLevel: analysis.confidence,
            recommendedQuantity: analysis.recommendedQuantity,
            recommendedPrice: analysis.currentPrice,
            reasoning: analysis.reasoning.join('; '),
            indicatorData: analysis.indicators
          });
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error analyzing ${symbol}:`, error);
      }
    }

    return analyses;
  }

  /**
   * Get popular stocks to analyze
   */
  getPopularStocks(): string[] {
    return [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
      'NVDA', 'META', 'NFLX', 'AMD', 'CRM',
      'UBER', 'SPOT', 'ZOOM', 'SQ', 'PYPL'
    ];
  }

  /**
   * Calculate indicators based on historical price data
   */
  private async calculateHistoricalIndicators(priceData: any[], indicators: string[]): Promise<any> {
    const result: any = {};

    for (const indicator of indicators) {
      try {
        switch (indicator) {
          case 'ema':
            result.ema = this.calculateEMA(priceData, 50);
            break;
          case 'rsi':
            result.rsi = this.calculateRSI(priceData, 14);
            break;
          case 'macd':
            result.macd = this.calculateMACD(priceData);
            break;
          case 'bollinger-bands':
            result.bollingerBands = this.calculateBollingerBands(priceData, 20, 2);
            break;
          case 'mfi':
            result.mfi = this.calculateMFI(priceData, 14);
            break;
          case 'donchian':
            result.donchian = this.calculateDonchianChannels(priceData, 20);
            break;
          case 'atr':
            result.atr = this.calculateATR(priceData, 20);
            break;
          default:
            console.warn(`Historical calculation not implemented for ${indicator}`);
            result[indicator] = { signal: 'HOLD', value: 0 };
        }
      } catch (error) {
        console.error(`Error calculating ${indicator}:`, error);
        result[indicator] = { signal: 'HOLD', value: 0 };
      }
    }

    return result;
  }

  /**
   * Make trading decision based on historical indicators
   */
  private makeHistoricalTradingDecision(indicators: any, strategy: any, currentPrice: number): {
    recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string[];
  } {
    const reasoning: string[] = [];

    // Check if this is an individual indicator strategy
    console.log('🔍 DEBUG makeHistoricalTradingDecision: Checking individual indicator strategy:', {
      strategyName: strategy.name,
      indicators: strategy.indicators,
      indicatorsType: typeof strategy.indicators,
      isIndividual: this.isIndividualIndicatorStrategy(strategy)
    });

    if (this.isIndividualIndicatorStrategy(strategy) || strategy.name?.includes('Turtle-Style Donchian + ATR')) {
      console.log('🎯 DEBUG makeHistoricalTradingDecision: Using individual indicator strategy logic');
      const recommendation = this.evaluateIndividualIndicatorStrategy(strategy, indicators, reasoning);
      return {
        recommendation,
        confidence: 'MEDIUM', // Default confidence for individual strategies
        reasoning
      };
    }

    console.log('🔄 DEBUG makeHistoricalTradingDecision: Using multi-indicator strategy logic');

    let buySignals = 0;
    let sellSignals = 0;

    // Analyze EMA signals (simplified crossover strategy)
    if (indicators.ema) {
      const ema = indicators.ema;
      if (currentPrice > ema.value) {
        buySignals++;
        reasoning.push(`🟢 Price above 50-day EMA ($${currentPrice.toFixed(2)} > $${ema.value.toFixed(2)})`);
      } else if (currentPrice < ema.value) {
        sellSignals++;
        reasoning.push(`🔴 Price below 50-day EMA ($${currentPrice.toFixed(2)} < $${ema.value.toFixed(2)})`);
      }
    }

    // Analyze RSI signals (more flexible for MACD-RSI strategy)
    if (indicators.rsi) {
      const rsi = indicators.rsi;
      if (rsi.value < 30) {
        buySignals++;
        reasoning.push(`🟢 RSI oversold (${rsi.value.toFixed(1)})`);
      } else if (rsi.value > 70) {
        sellSignals++;
        reasoning.push(`🔴 RSI overbought (${rsi.value.toFixed(1)})`);
      } else if (rsi.value < 50 && strategy.indicators.includes('macd')) {
        // For MACD-RSI strategy: RSI below 50 is bullish confirmation
        buySignals += 0.5;
        reasoning.push(`🟡 RSI below midline (${rsi.value.toFixed(1)}) - bullish bias`);
      } else if (rsi.value > 50 && strategy.indicators.includes('macd')) {
        // For MACD-RSI strategy: RSI above 50 is bearish confirmation
        sellSignals += 0.5;
        reasoning.push(`🟡 RSI above midline (${rsi.value.toFixed(1)}) - bearish bias`);
      }
    }

    // Analyze MACD signals (more flexible signal generation)
    if (indicators.macd) {
      const macd = indicators.macd;
      if (macd.signal === 'BUY') {
        buySignals++;
        reasoning.push(`🟢 MACD bullish crossover`);
      } else if (macd.signal === 'SELL') {
        sellSignals++;
        reasoning.push(`🔴 MACD bearish crossover`);
      } else if (macd.current > macd.signalCurrent) {
        // MACD above signal line is bullish
        buySignals += 0.5;
        reasoning.push(`🟡 MACD above signal line - bullish momentum`);
      } else if (macd.current < macd.signalCurrent) {
        // MACD below signal line is bearish
        sellSignals += 0.5;
        reasoning.push(`🟡 MACD below signal line - bearish momentum`);
      }
    }

    // Make decision
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH' = 'HOLD';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    // For single-indicator strategies (like EMA-only), be more decisive
    const isSingleIndicatorStrategy = strategy.indicators.length === 1;
    const isDoubleIndicatorStrategy = strategy.indicators.length === 2;

    if (buySignals >= 2) {
      recommendation = 'BUY';
      confidence = buySignals >= 3 ? 'HIGH' : 'MEDIUM';
    } else if (sellSignals >= 2) {
      recommendation = 'SELL';
      confidence = sellSignals >= 3 ? 'HIGH' : 'MEDIUM';
    } else if (buySignals >= 1.5 && isDoubleIndicatorStrategy) {
      // For dual-indicator strategies (like MACD-RSI), 1.5 signals is enough
      recommendation = 'BUY';
      confidence = 'MEDIUM';
    } else if (sellSignals >= 1.5 && isDoubleIndicatorStrategy) {
      // For dual-indicator strategies (like MACD-RSI), 1.5 signals is enough
      recommendation = 'SELL';
      confidence = 'MEDIUM';
    } else if (buySignals > sellSignals && buySignals > 0) {
      if (isSingleIndicatorStrategy) {
        // For single-indicator strategies, trust the signal
        recommendation = 'BUY';
        confidence = 'MEDIUM';
      } else {
        recommendation = 'WATCH';
        reasoning.push(`⚪ Weak bullish signals`);
      }
    } else if (sellSignals > buySignals && sellSignals > 0) {
      if (isSingleIndicatorStrategy) {
        // For single-indicator strategies, trust the signal
        recommendation = 'SELL';
        confidence = 'MEDIUM';
      } else {
        recommendation = 'WATCH';
        reasoning.push(`⚪ Weak bearish signals`);
      }
    }

    if (reasoning.length === 0) {
      reasoning.push(`⚪ No clear signals - holding position`);
    }

    return { recommendation, confidence, reasoning };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(priceData: any[], period: number): any {
    if (priceData.length < period) {
      return { value: 0, trend: 'NEUTRAL', signal: 'HOLD' };
    }

    const prices = priceData.map(d => d.close);
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    const currentPrice = prices[prices.length - 1];
    const previousEma = prices.length > period + 1 ?
      (prices[prices.length - 2] * multiplier) + (ema * (1 - multiplier)) : ema;

    const trend = ema > previousEma ? 'BULLISH' : ema < previousEma ? 'BEARISH' : 'NEUTRAL';
    const signal = currentPrice > ema ? 'BUY' : currentPrice < ema ? 'SELL' : 'HOLD';

    return { value: ema, trend, signal, price: currentPrice };
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(priceData: any[], period: number = 14): any {
    if (priceData.length < period + 1) {
      return { value: 50, signal: 'HOLD' };
    }

    const prices = priceData.map(d => d.close);
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (rsi < 30) signal = 'BUY';
    else if (rsi > 70) signal = 'SELL';

    return { value: rsi, signal };
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(priceData: any[]): any {
    if (priceData.length < 35) { // Need at least 35 days for proper MACD calculation
      return {
        signal: 'HOLD',
        current: 0,
        signalCurrent: 0,
        histogram: 0,
        macd: 0,
        signalLine: 0
      };
    }

    const prices = priceData.map(d => d.close);

    // Calculate MACD values for multiple periods to get proper signal line
    const macdValues: number[] = [];

    // Calculate MACD for the last 20 periods (enough for 9-period signal EMA)
    const startIndex = Math.max(0, prices.length - 20);

    for (let i = startIndex; i < prices.length; i++) {
      const periodPrices = prices.slice(0, i + 1);
      if (periodPrices.length >= 26) {
        const ema12 = this.calculateSimpleEMA(periodPrices, 12);
        const ema26 = this.calculateSimpleEMA(periodPrices, 26);
        macdValues.push(ema12 - ema26);
      }
    }

    if (macdValues.length < 9) {
      return {
        signal: 'HOLD',
        current: 0,
        signalCurrent: 0,
        histogram: 0,
        macd: 0,
        signalLine: 0
      };
    }

    // Current MACD value
    const currentMACD = macdValues[macdValues.length - 1];

    // Calculate signal line as 9-period EMA of MACD values
    const signalLine = this.calculateSimpleEMA(macdValues, 9);
    const histogram = currentMACD - signalLine;

    // Determine signal based on MACD crossover
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (currentMACD > signalLine && histogram > 0) signal = 'BUY';
    else if (currentMACD < signalLine && histogram < 0) signal = 'SELL';

    return {
      signal,
      current: currentMACD,
      signalCurrent: signalLine,
      histogram,
      // Keep legacy format for compatibility
      macd: currentMACD,
      signalLine
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(priceData: any[], period: number, multiplier: number): any {
    if (priceData.length < period) {
      return { signal: 'HOLD', upper: 0, middle: 0, lower: 0 };
    }

    const prices = priceData.map(d => d.close);
    const recentPrices = prices.slice(-period);

    const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = middle + (stdDev * multiplier);
    const lower = middle - (stdDev * multiplier);
    const currentPrice = prices[prices.length - 1];

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (currentPrice <= lower) signal = 'BUY';
    else if (currentPrice >= upper) signal = 'SELL';

    return { signal, upper, middle, lower, price: currentPrice };
  }

  /**
   * Calculate Money Flow Index (MFI)
   */
  private calculateMFI(priceData: any[], period: number): any {
    if (priceData.length < period + 1) {
      return { mfi: 50, signal: 'HOLD' };
    }

    const recentData = priceData.slice(-period - 1);
    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let i = 1; i < recentData.length; i++) {
      const current = recentData[i];
      const previous = recentData[i - 1];

      const typicalPrice = (current.high + current.low + current.close) / 3;
      const previousTypicalPrice = (previous.high + previous.low + previous.close) / 3;
      const rawMoneyFlow = typicalPrice * current.volume;

      if (typicalPrice > previousTypicalPrice) {
        positiveFlow += rawMoneyFlow;
      } else if (typicalPrice < previousTypicalPrice) {
        negativeFlow += rawMoneyFlow;
      }
    }

    const moneyFlowRatio = positiveFlow / (negativeFlow || 1);
    const mfi = 100 - (100 / (1 + moneyFlowRatio));

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (mfi < 20) signal = 'BUY';
    else if (mfi > 80) signal = 'SELL';

    return { mfi, signal };
  }

  /**
   * Helper method to calculate simple EMA
   */
  private calculateSimpleEMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    const multiplier = 2 / (period + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Calculate ATR (Average True Range) for volatility measurement
   */
  private calculateATR(priceData: any[], period: number = 20): any {
    if (priceData.length < period + 1) {
      return {
        value: 0,
        current: 0,
        signal: 'HOLD',
        period: period
      };
    }

    const trueRanges: number[] = [];

    // Calculate True Range for each day
    for (let i = 1; i < priceData.length; i++) {
      const current = priceData[i];
      const previous = priceData[i - 1];

      const high = current.high;
      const low = current.low;
      const prevClose = previous.close;

      // True Range = max(high-low, |high-prevClose|, |low-prevClose|)
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);

      const trueRange = Math.max(tr1, tr2, tr3);
      trueRanges.push(trueRange);
    }

    // Calculate ATR as simple moving average of True Ranges
    const recentTRs = trueRanges.slice(-period);
    const atrValue = recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;

    return {
      value: atrValue,
      current: atrValue,
      signal: 'NEUTRAL',
      period: period,
      interpretation: atrValue > 2 ? 'HIGH_VOLATILITY' : atrValue < 0.5 ? 'LOW_VOLATILITY' : 'NORMAL_VOLATILITY'
    };
  }

  /**
   * Calculate Donchian Channels (Turtle Trading System)
   */
  private calculateDonchianChannels(priceData: any[], period: number = 20): any {
    if (priceData.length < period) {
      return {
        upper: 0,
        lower: 0,
        middle: 0,
        current_price: 0,
        position: 'MIDDLE',
        signal: 'HOLD'
      };
    }

    // Get the last 'period' days for calculation
    const recentData = priceData.slice(-period);

    // Calculate highest high and lowest low over the period
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);

    const upperChannel = Math.max(...highs);
    const lowerChannel = Math.min(...lows);
    const middleChannel = (upperChannel + lowerChannel) / 2;

    // Current price is the most recent close
    const currentPrice = priceData[priceData.length - 1].close;

    // Determine position and signal
    let position = 'MIDDLE';
    let signal = 'HOLD';

    if (currentPrice >= upperChannel) {
      position = 'UPPER_BREAKOUT';
      signal = 'BUY';
    } else if (currentPrice <= lowerChannel) {
      position = 'LOWER_BREAKOUT';
      signal = 'SELL';
    } else if (currentPrice > middleChannel) {
      position = 'UPPER_HALF';
      signal = 'BULLISH';
    } else if (currentPrice < middleChannel) {
      position = 'LOWER_HALF';
      signal = 'BEARISH';
    }

    return {
      upper: upperChannel,
      lower: lowerChannel,
      middle: middleChannel,
      current_price: currentPrice,
      position: position,
      signal: signal,
      period: period
    };
  }
}
