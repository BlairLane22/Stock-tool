import axios from 'axios';
import { DatabasePortfolioService } from './databasePortfolioService';

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
}

export class TradingService {
  private portfolioService: DatabasePortfolioService;
  private backendApiUrl: string;

  constructor() {
    this.portfolioService = new DatabasePortfolioService();
    this.backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
  }

  /**
   * Analyze a stock and make trading recommendation
   */
  async analyzeStock(symbol: string): Promise<TradingAnalysis> {
    console.log(`🔍 Analyzing ${symbol} for trading opportunities...`);

    try {
      // Get multiple technical indicators from backend API
      const [rsiData, macdData, bollingerData, headShouldersData, cupHandleData] = await Promise.allSettled([
        this.getIndicator('rsi', symbol),
        this.getIndicator('macd', symbol), 
        this.getIndicator('bollinger-bands', symbol),
        this.getIndicator('head-and-shoulders', symbol),
        this.getIndicator('cup-handle', symbol)
      ]);

      // Extract successful results
      const indicators = {
        rsi: rsiData.status === 'fulfilled' ? rsiData.value : null,
        macd: macdData.status === 'fulfilled' ? macdData.value : null,
        bollingerBands: bollingerData.status === 'fulfilled' ? bollingerData.value : null,
        headAndShoulders: headShouldersData.status === 'fulfilled' ? headShouldersData.value : null,
        cupAndHandle: cupHandleData.status === 'fulfilled' ? cupHandleData.value : null
      };

      // Make trading decision based on indicators
      const analysis = this.makeDecision(symbol, indicators);
      
      console.log(`📊 Analysis complete for ${symbol}: ${analysis.recommendation} (${analysis.confidence})`);
      
      return analysis;

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error);
      
      return {
        symbol,
        currentPrice: 0,
        recommendation: 'HOLD',
        confidence: 'LOW',
        reasoning: ['Analysis failed due to API error'],
        indicators: {},
        recommendedQuantity: 0
      };
    }
  }

  /**
   * Get indicator data from backend API
   */
  private async getIndicator(indicator: string, symbol: string): Promise<any> {
    const url = `${this.backendApiUrl}/api/${indicator}/${symbol}/quick`;
    console.log(`📡 Fetching ${indicator} for ${symbol}...`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'StockTrack-Portfolio-API/1.0.0'
      }
    });
    
    return response.data;
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
      const rsi = indicators.rsi.rsi;
      
      if (rsi < 30) {
        buySignals++;
        reasoning.push(`🟢 RSI oversold (${rsi.toFixed(1)}) - potential buy opportunity`);
      } else if (rsi > 70) {
        sellSignals++;
        reasoning.push(`🔴 RSI overbought (${rsi.toFixed(1)}) - potential sell signal`);
      } else {
        reasoning.push(`⚪ RSI neutral (${rsi.toFixed(1)})`);
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
