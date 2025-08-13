import axios from 'axios';
import { TradingService } from './tradingService';

export interface BacktestResult {
  symbol: string;
  strategy: string;
  startingCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  dailyReturns: DailyReturn[];
  summary: {
    bestTrade: BacktestTrade;
    worstTrade: BacktestTrade;
    avgTradeReturn: number;
    avgHoldingPeriod: number;
    profitFactor: number;
  };
}

export interface BacktestTrade {
  date: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  value: number;
  reason: string;
  portfolioValue: number;
  returnPercent?: number;
  holdingDays?: number;
}

export interface DailyReturn {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

export interface BacktestConfig {
  symbol: string;
  strategyId: string;
  startingCapital: number;
  startDate?: string;
  endDate?: string;
  commission?: number;
  slippage?: number;
}

export class BacktestingService {
  private backendApiUrl: string;
  private tradingService: TradingService;

  constructor() {
    this.backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    this.tradingService = new TradingService();
  }

  /**
   * Run a backtest simulation on historical data
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log(`🔄 Starting backtest for ${config.symbol} with strategy ${config.strategyId}`);
    console.log(`💰 Starting capital: $${config.startingCapital.toLocaleString()}`);

    try {
      // Get historical data from backend
      const historicalData = await this.getHistoricalData(config.symbol);
      
      // Initialize backtest state
      let cash = config.startingCapital;
      let shares = 0;
      let portfolioValue = config.startingCapital;
      let maxPortfolioValue = config.startingCapital;
      let maxDrawdown = 0;
      
      const trades: BacktestTrade[] = [];
      const dailyReturns: DailyReturn[] = [];
      let lastTradePrice = 0;
      let lastTradeDate = '';
      
      // Sort dates chronologically (oldest first)
      const sortedDates = Object.keys(historicalData).sort();
      
      console.log(`📊 Processing ${sortedDates.length} days of historical data`);
      
      // Process each day
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const dayData = historicalData[date];
        const closePrice = parseFloat(dayData['4. close']);
        
        // Calculate current portfolio value
        portfolioValue = cash + (shares * closePrice);
        
        // Calculate drawdown
        if (portfolioValue > maxPortfolioValue) {
          maxPortfolioValue = portfolioValue;
        }
        const currentDrawdown = (maxPortfolioValue - portfolioValue) / maxPortfolioValue;
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
        }
        
        // Calculate daily return
        const dailyReturn = i > 0 ? (portfolioValue - dailyReturns[i-1].portfolioValue) / dailyReturns[i-1].portfolioValue : 0;
        const cumulativeReturn = (portfolioValue - config.startingCapital) / config.startingCapital;
        
        dailyReturns.push({
          date,
          portfolioValue,
          dailyReturn,
          cumulativeReturn,
          drawdown: currentDrawdown
        });
        
        // Skip first 50 days to allow indicators to stabilize
        if (i < 50) continue;
        
        try {
          // Get trading signal for this day using historical data
          const analysis = await this.tradingService.analyzeHistoricalData(
            config.symbol,
            config.strategyId,
            historicalData,
            date,
            50 // lookback period for indicators
          );
          
          // Execute trades based on signals
          if (analysis.recommendation === 'BUY' && cash > closePrice && shares === 0) {
            // Buy signal - enter position
            const quantity = Math.floor(cash / closePrice);
            const cost = quantity * closePrice;
            const commission = config.commission || 0;
            
            if (quantity > 0) {
              cash -= (cost + commission);
              shares = quantity;
              lastTradePrice = closePrice;
              lastTradeDate = date;
              
              trades.push({
                date,
                action: 'BUY',
                price: closePrice,
                quantity,
                value: cost,
                reason: analysis.reasoning.join('; '),
                portfolioValue
              });
              
              console.log(`🟢 BUY: ${quantity} shares at $${closePrice.toFixed(2)} on ${date}`);
            }
          } else if ((analysis.recommendation === 'SELL' || analysis.recommendation === 'HOLD') && shares > 0) {
            // Sell signal or hold with stop loss - exit position
            const revenue = shares * closePrice;
            const commission = config.commission || 0;
            const returnPercent = ((closePrice - lastTradePrice) / lastTradePrice) * 100;
            const holdingDays = this.calculateDaysBetween(lastTradeDate, date);
            
            cash += (revenue - commission);
            
            trades.push({
              date,
              action: 'SELL',
              price: closePrice,
              quantity: shares,
              value: revenue,
              reason: analysis.reasoning.join('; '),
              portfolioValue,
              returnPercent,
              holdingDays
            });
            
            console.log(`🔴 SELL: ${shares} shares at $${closePrice.toFixed(2)} on ${date} (${returnPercent.toFixed(2)}% return)`);
            shares = 0;
          }
        } catch (error) {
          // Skip this day if analysis fails
          console.warn(`⚠️ Analysis failed for ${date}: ${error}`);
        }
      }
      
      // Close any remaining position at the end
      if (shares > 0) {
        const lastDate = sortedDates[sortedDates.length - 1];
        const lastPrice = parseFloat(historicalData[lastDate]['4. close']);
        const revenue = shares * lastPrice;
        const returnPercent = ((lastPrice - lastTradePrice) / lastTradePrice) * 100;
        const holdingDays = this.calculateDaysBetween(lastTradeDate, lastDate);
        
        cash += revenue;
        
        trades.push({
          date: lastDate,
          action: 'SELL',
          price: lastPrice,
          quantity: shares,
          value: revenue,
          reason: 'End of backtest period',
          portfolioValue: cash,
          returnPercent,
          holdingDays
        });
        
        shares = 0;
      }
      
      // Calculate final metrics
      const finalCapital = cash;
      const totalReturn = finalCapital - config.startingCapital;
      const totalReturnPercent = (totalReturn / config.startingCapital) * 100;
      
      const buyTrades = trades.filter(t => t.action === 'BUY');
      const sellTrades = trades.filter(t => t.action === 'SELL');
      const completedTrades = sellTrades.filter(t => t.returnPercent !== undefined);
      
      const winningTrades = completedTrades.filter(t => t.returnPercent! > 0).length;
      const losingTrades = completedTrades.filter(t => t.returnPercent! <= 0).length;
      const winRate = completedTrades.length > 0 ? winningTrades / completedTrades.length : 0;
      
      // Calculate summary statistics
      const bestTrade = completedTrades.length > 0
        ? completedTrades.reduce((best, trade) =>
            (trade.returnPercent || 0) > (best.returnPercent || 0) ? trade : best, completedTrades[0])
        : null;
      const worstTrade = completedTrades.length > 0
        ? completedTrades.reduce((worst, trade) =>
            (trade.returnPercent || 0) < (worst.returnPercent || 0) ? trade : worst, completedTrades[0])
        : null;

      const avgTradeReturn = completedTrades.length > 0
        ? completedTrades.reduce((sum, t) => sum + (t.returnPercent || 0), 0) / completedTrades.length
        : 0;
      
      const avgHoldingPeriod = completedTrades.length > 0
        ? completedTrades.reduce((sum, t) => sum + (t.holdingDays || 0), 0) / completedTrades.length
        : 0;
      
      const grossProfit = completedTrades.filter(t => t.returnPercent! > 0).reduce((sum, t) => sum + (t.returnPercent! * t.value / 100), 0);
      const grossLoss = Math.abs(completedTrades.filter(t => t.returnPercent! <= 0).reduce((sum, t) => sum + (t.returnPercent! * t.value / 100), 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
      
      // Calculate Sharpe ratio (simplified)
      const dailyReturnValues = dailyReturns.slice(1).map(d => d.dailyReturn);
      const avgDailyReturn = dailyReturnValues.reduce((sum, r) => sum + r, 0) / dailyReturnValues.length;
      const dailyReturnStd = Math.sqrt(dailyReturnValues.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturnValues.length);
      const sharpeRatio = dailyReturnStd > 0 ? (avgDailyReturn / dailyReturnStd) * Math.sqrt(252) : 0; // Annualized
      
      console.log(`✅ Backtest complete: ${totalReturnPercent.toFixed(2)}% return, ${completedTrades.length} trades, ${(winRate * 100).toFixed(1)}% win rate`);
      
      return {
        symbol: config.symbol,
        strategy: config.strategyId,
        startingCapital: config.startingCapital,
        finalCapital,
        totalReturn,
        totalReturnPercent,
        totalTrades: completedTrades.length,
        winningTrades,
        losingTrades,
        winRate,
        maxDrawdown,
        sharpeRatio,
        trades,
        dailyReturns,
        summary: {
          bestTrade: bestTrade || { date: '', action: 'BUY', price: 0, quantity: 0, value: 0, reason: 'No trades', portfolioValue: 0, returnPercent: 0, holdingDays: 0 },
          worstTrade: worstTrade || { date: '', action: 'SELL', price: 0, quantity: 0, value: 0, reason: 'No trades', portfolioValue: 0, returnPercent: 0, holdingDays: 0 },
          avgTradeReturn,
          avgHoldingPeriod,
          profitFactor
        }
      };
      
    } catch (error) {
      console.error(`❌ Backtest failed for ${config.symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get historical data from backend
   */
  private async getHistoricalData(symbol: string): Promise<any> {
    const url = `${this.backendApiUrl}/api/backtest/data/${symbol}`;
    console.log(`📡 Fetching historical data from: ${url}`);

    try {
      const response = await axios.get(url);

      // Check if the response indicates an error
      if (response.data.success === false) {
        throw new Error(`Backend API error: ${response.data.error}`);
      }

      // Check if Time Series data exists
      const timeSeriesData = response.data['Time Series (Daily)'];
      if (!timeSeriesData) {
        throw new Error(`No historical data available for ${symbol}. Response: ${JSON.stringify(response.data)}`);
      }

      console.log(`✅ Successfully loaded ${Object.keys(timeSeriesData).length} days of data for ${symbol}`);
      return timeSeriesData;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ HTTP error fetching data for ${symbol}:`, error.response?.status, error.response?.data);
        throw new Error(`Failed to fetch historical data for ${symbol}: ${error.response?.data?.error || error.message}`);
      } else {
        console.error(`❌ Error processing data for ${symbol}:`, error);
        throw error;
      }
    }
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
