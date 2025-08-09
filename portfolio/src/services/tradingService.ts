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
    }

    // Apply strategy-specific conditions
    const buyConditions = strategy.buyConditions;
    const sellConditions = strategy.sellConditions;

    // Determine recommendation based on strategy rules
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH' = 'HOLD';

    if (buyConditions.min_buy_signals && buySignals >= buyConditions.min_buy_signals) {
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
}
