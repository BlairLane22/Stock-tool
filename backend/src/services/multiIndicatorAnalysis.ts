import { candleCache } from './candleCache';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

export interface IndicatorRequest {
  type: 'rsi' | 'macd' | 'bollinger' | 'ema' | 'atr' | 'mfi' | 'imi' | 'cup-handle' | 'head-shoulders';
  params?: any;
}

export interface MultiIndicatorResult {
  symbol: string;
  timestamp: string;
  candleCount: number;
  dataSource: string;
  indicators: {
    [key: string]: any;
  };
  errors: {
    [key: string]: string;
  };
}

class MultiIndicatorAnalysisService {
  
  /**
   * Analyze multiple indicators for a single symbol using one candle dataset
   */
  async analyzeMultipleIndicators(
    symbol: string, 
    indicators: IndicatorRequest[],
    useMockData: boolean = true
  ): Promise<MultiIndicatorResult> {
    
    const result: MultiIndicatorResult = {
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      candleCount: 0,
      dataSource: useMockData ? 'Mock Data' : 'Live API',
      indicators: {},
      errors: {}
    };

    try {
      // Get candles once for all indicators
      let candles: Candle[];
      
      if (useMockData) {
        // Generate mock data for demonstration
        candles = this.generateMockCandles(symbol, 200);
        result.dataSource = 'Mock Data';
      } else {
        // Use cached candle service for live data
        candles = await candleCache.getCandles(symbol);
        result.dataSource = 'Live API (Cached)';
      }

      result.candleCount = candles.length;

      // Process each requested indicator
      for (const indicatorRequest of indicators) {
        try {
          const indicatorResult = await this.calculateIndicator(candles, indicatorRequest);
          result.indicators[indicatorRequest.type] = indicatorResult;
        } catch (error) {
          result.errors[indicatorRequest.type] = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error calculating ${indicatorRequest.type}:`, error);
        }
      }

      return result;

    } catch (error) {
      console.error(`❌ Error in multi-indicator analysis for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Calculate a specific indicator from candle data
   */
  private async calculateIndicator(candles: Candle[], request: IndicatorRequest): Promise<any> {
    switch (request.type) {
      case 'rsi':
        return this.calculateRSI(candles, request.params);
      
      case 'macd':
        return this.calculateMACD(candles, request.params);
      
      case 'bollinger':
        return this.calculateBollingerBands(candles, request.params);
      
      case 'ema':
        return this.calculateEMA(candles, request.params);
      
      case 'atr':
        return this.calculateATR(candles, request.params);
      
      case 'mfi':
        return this.calculateMFI(candles, request.params);
      
      case 'imi':
        return this.calculateIMI(candles, request.params);
      
      case 'cup-handle':
        return this.analyzeCupHandle(candles, request.params);
      
      case 'head-shoulders':
        return this.analyzeHeadShoulders(candles, request.params);
      
      default:
        throw new Error(`Unknown indicator type: ${request.type}`);
    }
  }

  private async calculateRSI(candles: Candle[], params: any = {}): Promise<any> {
    const { analyzeRSI } = await import('../indicators/rsi');
    const period = params?.period || 14;
    return analyzeRSI(candles, period, {
      oversold: 30,
      overbought: 70,
      extremeOversold: 20,
      extremeOverbought: 80
    });
  }

  private async calculateMACD(candles: Candle[], params: any = {}): Promise<any> {
    const { getMACDResult } = await import('../indicators/macd');
    return getMACDResult(candles, params?.fastPeriod, params?.slowPeriod, params?.signalPeriod);
  }

  private async calculateBollingerBands(candles: Candle[], params: any = {}): Promise<any> {
    const { analyzeBollingerBands } = await import('../indicators/bollingerBands');
    const period = params?.period || 20;
    const multiplier = params?.multiplier || 2;
    return analyzeBollingerBands(candles, period, multiplier);
  }

  private async calculateEMA(candles: Candle[], params: any = {}): Promise<any> {
    const { analyzeEMA } = await import('../indicators/ema');
    const period = params?.period || 12;
    return analyzeEMA(candles, period);
  }

  private async calculateATR(candles: Candle[], params: any = {}): Promise<any> {
    const { analyzeATR } = await import('../indicators/atr');
    const period = params?.period || 14;
    return analyzeATR(candles, period);
  }

  private async calculateMFI(candles: Candle[], params: any = {}): Promise<any> {
    const { analyzeMFI } = await import('../indicators/moneyFlowIndex');
    const period = params?.period || 14;
    return analyzeMFI(candles, period);
  }

  private async calculateIMI(candles: Candle[], params: any = {}): Promise<any> {
    const { analyzeIMI } = await import('../indicators/intradayMomentumIndex');
    const period = params?.period || 14;
    return analyzeIMI(candles, period);
  }

  private async analyzeCupHandle(candles: Candle[], _params: any = {}): Promise<any> {
    const { analyzeCupAndHandlePattern } = await import('../indicators/cupAndHandle');
    return analyzeCupAndHandlePattern(candles);
  }

  private async analyzeHeadShoulders(candles: Candle[], _params: any = {}): Promise<any> {
    const { analyzeHeadAndShouldersPattern } = await import('../indicators/headAndShoulders');
    return analyzeHeadAndShouldersPattern(candles);
  }

  /**
   * Generate mock candle data for testing
   */
  private generateMockCandles(symbol: string, count: number): Candle[] {
    const candles: Candle[] = [];
    let price = 100 + Math.random() * 100; // Random starting price between 100-200
    const now = Date.now();
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = Math.floor((now - (i * 24 * 60 * 60 * 1000)) / 1000);
      const volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
      
      const open = price;
      const change = (Math.random() - 0.5) * price * volatility;
      const close = Math.max(0.01, open + change);
      
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(1000000 + Math.random() * 5000000);
      
      candles.push({
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
        timeStamp: timestamp
      });
      
      price = close; // Next day starts where this day ended
    }
    
    return candles.sort((a, b) => a.timeStamp - b.timeStamp);
  }
}

// Export singleton instance
export const multiIndicatorAnalysis = new MultiIndicatorAnalysisService();
