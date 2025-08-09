import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute, transaction } from '../database/connection';
import { Portfolio, Holding, WatchlistItem, User, TradingStrategy } from '../types/portfolio';

export interface TradingDecision {
  id: string;
  portfolioId: string;
  symbol: string;
  decisionType: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedQuantity?: number;
  recommendedPrice?: number;
  reasoning: string;
  indicatorData: string; // JSON string
  decisionDate: string;
  executed: boolean;
  executedDate?: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  transactionDate: string;
  notes?: string;
}

export class DatabasePortfolioService {
  
  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );
    return user || null;
  }

  /**
   * Get all portfolios for a user
   */
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const portfolios = await query<any>(
      'SELECT * FROM portfolios WHERE user_id = ? AND is_active = 1 ORDER BY created_date DESC',
      [userId]
    );

    // Get holdings and watchlist for each portfolio
    const enrichedPortfolios = await Promise.all(
      portfolios.map(async (portfolio) => {
        const holdings = await this.getHoldings(portfolio.id);
        const watchlist = await this.getWatchlist(portfolio.id);

        return {
          id: portfolio.id,
          userId: portfolio.user_id,
          name: portfolio.name,
          description: portfolio.description,
          initialCash: portfolio.initial_cash,
          currentCash: portfolio.current_cash,
          createdDate: portfolio.created_date,
          lastUpdated: portfolio.last_updated,
          holdings,
          watchlist
        } as Portfolio;
      })
    );

    return enrichedPortfolios;
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(data: {
    userId: string;
    name: string;
    description?: string;
    initialCash: number;
  }): Promise<Portfolio> {
    const portfolioId = uuidv4();
    
    await execute(
      `INSERT INTO portfolios (id, user_id, name, description, initial_cash, current_cash) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [portfolioId, data.userId, data.name, data.description, data.initialCash, data.initialCash]
    );

    const portfolio = await queryOne<any>(
      'SELECT * FROM portfolios WHERE id = ?',
      [portfolioId]
    );

    return {
      id: portfolio.id,
      userId: portfolio.user_id,
      name: portfolio.name,
      description: portfolio.description,
      initialCash: portfolio.initial_cash,
      currentCash: portfolio.current_cash,
      createdDate: portfolio.created_date,
      lastUpdated: portfolio.last_updated,
      holdings: [],
      watchlist: []
    } as Portfolio;
  }

  /**
   * Get a specific portfolio
   */
  async getPortfolio(id: string): Promise<Portfolio | null> {
    const portfolio = await queryOne<any>(
      'SELECT * FROM portfolios WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!portfolio) return null;

    const holdings = await this.getHoldings(id);
    const watchlist = await this.getWatchlist(id);

    return {
      id: portfolio.id,
      userId: portfolio.user_id,
      name: portfolio.name,
      description: portfolio.description,
      initialCash: portfolio.initial_cash,
      currentCash: portfolio.current_cash,
      createdDate: portfolio.created_date,
      lastUpdated: portfolio.last_updated,
      holdings,
      watchlist
    } as Portfolio;
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
    const setClause = [];
    const params = [];

    if (updates.name) {
      setClause.push('name = ?');
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push('description = ?');
      params.push(updates.description);
    }
    if (updates.currentCash !== undefined) {
      setClause.push('current_cash = ?');
      params.push(updates.currentCash);
    }

    if (setClause.length === 0) {
      return this.getPortfolio(id);
    }

    params.push(id);
    
    await execute(
      `UPDATE portfolios SET ${setClause.join(', ')} WHERE id = ?`,
      params
    );

    return this.getPortfolio(id);
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(id: string): Promise<boolean> {
    const result = await execute(
      'UPDATE portfolios SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Get holdings for a portfolio
   */
  async getHoldings(portfolioId: string): Promise<Holding[]> {
    const holdings = await query<any>(
      `SELECT h.*, ts.name as strategy_name, ts.description as strategy_description, ts.indicators as strategy_indicators
       FROM holdings h
       LEFT JOIN trading_strategies ts ON h.trading_strategy_id = ts.id
       WHERE h.portfolio_id = ?
       ORDER BY h.symbol`,
      [portfolioId]
    );

    return holdings.map(holding => ({
      id: holding.id,
      symbol: holding.symbol,
      quantity: holding.quantity,
      averagePrice: holding.average_price,
      purchaseDate: holding.purchase_date,
      tradingStrategyId: holding.trading_strategy_id,
      tradingStrategy: holding.strategy_name ? {
        id: holding.trading_strategy_id,
        portfolioId: portfolioId,
        name: holding.strategy_name,
        description: holding.strategy_description,
        indicators: holding.strategy_indicators ? JSON.parse(holding.strategy_indicators) : [],
        buyConditions: {},
        sellConditions: {},
        riskManagement: {},
        isActive: true,
        createdDate: '',
        updatedDate: ''
      } : undefined
    }));
  }

  /**
   * Add holding to portfolio
   */
  async addHolding(portfolioId: string, holdingData: {
    symbol: string;
    quantity: number;
    averagePrice: number;
    purchaseDate: string;
  }): Promise<Holding> {
    return transaction(async () => {
      const holdingId = uuidv4();
      
      // Insert holding
      await execute(
        `INSERT INTO holdings (id, portfolio_id, symbol, quantity, average_price, purchase_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [holdingId, portfolioId, holdingData.symbol, holdingData.quantity, holdingData.averagePrice, holdingData.purchaseDate]
      );

      // Update portfolio cash
      const totalCost = holdingData.quantity * holdingData.averagePrice;
      await execute(
        'UPDATE portfolios SET current_cash = current_cash - ? WHERE id = ?',
        [totalCost, portfolioId]
      );

      // Record transaction
      await this.recordTransaction({
        portfolioId,
        symbol: holdingData.symbol,
        transactionType: 'BUY',
        quantity: holdingData.quantity,
        price: holdingData.averagePrice,
        totalAmount: totalCost,
        fees: 0,
        notes: 'Manual purchase'
      });

      return {
        id: holdingId,
        symbol: holdingData.symbol,
        quantity: holdingData.quantity,
        averagePrice: holdingData.averagePrice,
        purchaseDate: holdingData.purchaseDate
      };
    });
  }

  /**
   * Update holding
   */
  async updateHolding(portfolioId: string, holdingId: string, updates: Partial<Holding>): Promise<Holding | null> {
    const setClause = [];
    const params = [];

    if (updates.quantity !== undefined) {
      setClause.push('quantity = ?');
      params.push(updates.quantity);
    }
    if (updates.averagePrice !== undefined) {
      setClause.push('average_price = ?');
      params.push(updates.averagePrice);
    }

    if (setClause.length === 0) {
      const holding = await queryOne<any>('SELECT * FROM holdings WHERE id = ? AND portfolio_id = ?', [holdingId, portfolioId]);
      return holding ? {
        id: holding.id,
        symbol: holding.symbol,
        quantity: holding.quantity,
        averagePrice: holding.average_price,
        purchaseDate: holding.purchase_date
      } : null;
    }

    params.push(holdingId, portfolioId);

    await execute(
      `UPDATE holdings SET ${setClause.join(', ')} WHERE id = ? AND portfolio_id = ?`,
      params
    );

    const holding = await queryOne<any>('SELECT * FROM holdings WHERE id = ? AND portfolio_id = ?', [holdingId, portfolioId]);
    return holding ? {
      id: holding.id,
      symbol: holding.symbol,
      quantity: holding.quantity,
      averagePrice: holding.average_price,
      purchaseDate: holding.purchase_date
    } : null;
  }

  /**
   * Remove holding
   */
  async removeHolding(portfolioId: string, holdingId: string): Promise<boolean> {
    const result = await execute(
      'DELETE FROM holdings WHERE id = ? AND portfolio_id = ?',
      [holdingId, portfolioId]
    );
    return result.changes > 0;
  }

  /**
   * Get watchlist for a portfolio
   */
  async getWatchlist(portfolioId: string): Promise<WatchlistItem[]> {
    const watchlist = await query<any>(
      `SELECT w.*, ts.name as strategy_name, ts.description as strategy_description, ts.indicators as strategy_indicators
       FROM watchlist w
       LEFT JOIN trading_strategies ts ON w.trading_strategy_id = ts.id
       WHERE w.portfolio_id = ?
       ORDER BY w.added_date DESC`,
      [portfolioId]
    );

    return watchlist.map(item => ({
      id: item.id,
      symbol: item.symbol,
      notes: item.notes,
      addedDate: item.added_date,
      tradingStrategyId: item.trading_strategy_id,
      tradingStrategy: item.strategy_name ? {
        id: item.trading_strategy_id,
        portfolioId: portfolioId,
        name: item.strategy_name,
        description: item.strategy_description,
        indicators: item.strategy_indicators ? JSON.parse(item.strategy_indicators) : [],
        buyConditions: {},
        sellConditions: {},
        riskManagement: {},
        isActive: true,
        createdDate: '',
        updatedDate: ''
      } : undefined
    }));
  }

  /**
   * Add to watchlist
   */
  async addToWatchlist(portfolioId: string, itemData: {
    symbol: string;
    notes?: string;
    addedDate: string;
  }): Promise<WatchlistItem> {
    const itemId = uuidv4();
    
    await execute(
      `INSERT INTO watchlist (id, portfolio_id, symbol, notes, added_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [itemId, portfolioId, itemData.symbol, itemData.notes, itemData.addedDate]
    );

    return {
      id: itemId,
      symbol: itemData.symbol,
      notes: itemData.notes,
      addedDate: itemData.addedDate
    };
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(portfolioId: string, symbol: string): Promise<boolean> {
    const result = await execute(
      'DELETE FROM watchlist WHERE portfolio_id = ? AND symbol = ?',
      [portfolioId, symbol.toUpperCase()]
    );
    return result.changes > 0;
  }

  /**
   * Get portfolio analysis
   */
  async getPortfolioAnalysis(portfolioId: string): Promise<any> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    const totalInvested = portfolio.initialCash - portfolio.currentCash;
    const totalHoldings = portfolio.holdings.length;

    // Calculate basic metrics
    const analysis = {
      totalValue: totalInvested + portfolio.currentCash,
      totalInvested,
      availableCash: portfolio.currentCash,
      totalHoldings,
      diversification: {
        stockCount: totalHoldings,
        sectors: ['Technology', 'Healthcare', 'Finance'], // Mock data
        concentration: totalHoldings > 0 ? (1 / totalHoldings * 100) : 0
      },
      allocation: {
        stocks: totalInvested,
        cash: portfolio.currentCash
      }
    };

    return analysis;
  }

  /**
   * Get portfolio performance
   */
  async getPerformance(portfolioId: string, period: string = '1M'): Promise<any> {
    // Mock performance data for now
    return {
      period,
      totalReturn: 5.2,
      totalReturnPercent: 5.2,
      dailyReturns: [],
      benchmarkComparison: {
        portfolio: 5.2,
        sp500: 4.1,
        outperformance: 1.1
      }
    };
  }

  /**
   * Get risk analysis
   */
  async getRiskAnalysis(portfolioId: string): Promise<any> {
    // Mock risk analysis for now
    return {
      riskScore: 6.5,
      riskLevel: 'MODERATE',
      volatility: 18.2,
      sharpeRatio: 1.15,
      maxDrawdown: -12.3,
      betaToMarket: 1.08,
      recommendations: [
        'Consider diversifying across more sectors',
        'Current risk level is appropriate for growth-oriented portfolio'
      ]
    };
  }

  /**
   * Record a transaction
   */
  async recordTransaction(transactionData: {
    portfolioId: string;
    symbol: string;
    transactionType: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    totalAmount: number;
    fees: number;
    notes?: string;
  }): Promise<Transaction> {
    const transactionId = uuidv4();
    
    await execute(
      `INSERT INTO transactions (id, portfolio_id, symbol, transaction_type, quantity, price, total_amount, fees, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        transactionData.portfolioId,
        transactionData.symbol,
        transactionData.transactionType,
        transactionData.quantity,
        transactionData.price,
        transactionData.totalAmount,
        transactionData.fees,
        transactionData.notes
      ]
    );

    const transaction = await queryOne<any>(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );

    return {
      id: transaction.id,
      portfolioId: transaction.portfolio_id,
      symbol: transaction.symbol,
      transactionType: transaction.transaction_type,
      quantity: transaction.quantity,
      price: transaction.price,
      totalAmount: transaction.total_amount,
      fees: transaction.fees,
      transactionDate: transaction.transaction_date,
      notes: transaction.notes
    };
  }

  /**
   * Get portfolio's main user (Blair)
   */
  async getMainUser(): Promise<User | null> {
    return this.getUser('user-blair-1');
  }

  /**
   * Get Blair's main portfolio
   */
  async getMainPortfolio(): Promise<Portfolio | null> {
    return this.getPortfolio('portfolio-blair-main');
  }

  /**
   * Save trading decision
   */
  async saveTradingDecision(decision: {
    portfolioId: string;
    symbol: string;
    decisionType: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendedQuantity?: number;
    recommendedPrice?: number;
    reasoning: string;
    indicatorData: any;
  }): Promise<TradingDecision> {
    const decisionId = uuidv4();

    await execute(
      `INSERT INTO trading_decisions (id, portfolio_id, symbol, decision_type, confidence_level,
       recommended_quantity, recommended_price, reasoning, indicator_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        decisionId,
        decision.portfolioId,
        decision.symbol,
        decision.decisionType,
        decision.confidenceLevel,
        decision.recommendedQuantity,
        decision.recommendedPrice,
        decision.reasoning,
        JSON.stringify(decision.indicatorData)
      ]
    );

    const savedDecision = await queryOne<any>(
      'SELECT * FROM trading_decisions WHERE id = ?',
      [decisionId]
    );

    return {
      id: savedDecision.id,
      portfolioId: savedDecision.portfolio_id,
      symbol: savedDecision.symbol,
      decisionType: savedDecision.decision_type,
      confidenceLevel: savedDecision.confidence_level,
      recommendedQuantity: savedDecision.recommended_quantity,
      recommendedPrice: savedDecision.recommended_price,
      reasoning: savedDecision.reasoning,
      indicatorData: savedDecision.indicator_data,
      decisionDate: savedDecision.decision_date,
      executed: savedDecision.executed,
      executedDate: savedDecision.executed_date
    };
  }

  /**
   * Get recent trading decisions
   */
  async getTradingDecisions(portfolioId: string, limit: number = 10): Promise<TradingDecision[]> {
    const decisions = await query<any>(
      `SELECT * FROM trading_decisions WHERE portfolio_id = ?
       ORDER BY decision_date DESC LIMIT ?`,
      [portfolioId, limit]
    );

    return decisions.map(decision => ({
      id: decision.id,
      portfolioId: decision.portfolio_id,
      symbol: decision.symbol,
      decisionType: decision.decision_type,
      confidenceLevel: decision.confidence_level,
      recommendedQuantity: decision.recommended_quantity,
      recommendedPrice: decision.recommended_price,
      reasoning: decision.reasoning,
      indicatorData: decision.indicator_data,
      decisionDate: decision.decision_date,
      executed: decision.executed,
      executedDate: decision.executed_date
    }));
  }

  /**
   * Get all trading strategies for a portfolio
   */
  async getTradingStrategies(portfolioId: string): Promise<TradingStrategy[]> {
    const strategies = await query<any>(
      'SELECT * FROM trading_strategies WHERE portfolio_id = ? AND is_active = 1 ORDER BY name',
      [portfolioId]
    );

    return strategies.map(strategy => ({
      id: strategy.id,
      portfolioId: strategy.portfolio_id,
      name: strategy.name,
      description: strategy.description,
      indicators: JSON.parse(strategy.indicators),
      buyConditions: JSON.parse(strategy.buy_conditions),
      sellConditions: JSON.parse(strategy.sell_conditions),
      riskManagement: JSON.parse(strategy.risk_management),
      isActive: strategy.is_active,
      createdDate: strategy.created_date,
      updatedDate: strategy.updated_date
    }));
  }

  /**
   * Get a specific trading strategy
   */
  async getTradingStrategy(id: string): Promise<TradingStrategy | null> {
    const strategy = await queryOne<any>(
      'SELECT * FROM trading_strategies WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!strategy) return null;

    return {
      id: strategy.id,
      portfolioId: strategy.portfolio_id,
      name: strategy.name,
      description: strategy.description,
      indicators: JSON.parse(strategy.indicators),
      buyConditions: JSON.parse(strategy.buy_conditions),
      sellConditions: JSON.parse(strategy.sell_conditions),
      riskManagement: JSON.parse(strategy.risk_management),
      isActive: strategy.is_active,
      createdDate: strategy.created_date,
      updatedDate: strategy.updated_date
    };
  }

  /**
   * Create a new trading strategy
   */
  async createTradingStrategy(data: {
    portfolioId: string;
    name: string;
    description?: string;
    indicators: string[];
    buyConditions: any;
    sellConditions: any;
    riskManagement: any;
  }): Promise<TradingStrategy> {
    const strategyId = uuidv4();

    await execute(
      `INSERT INTO trading_strategies (id, portfolio_id, name, description, indicators, buy_conditions, sell_conditions, risk_management)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        strategyId,
        data.portfolioId,
        data.name,
        data.description,
        JSON.stringify(data.indicators),
        JSON.stringify(data.buyConditions),
        JSON.stringify(data.sellConditions),
        JSON.stringify(data.riskManagement)
      ]
    );

    const strategy = await this.getTradingStrategy(strategyId);
    if (!strategy) throw new Error('Failed to create trading strategy');
    return strategy;
  }

  /**
   * Update a trading strategy
   */
  async updateTradingStrategy(id: string, updates: Partial<TradingStrategy>): Promise<TradingStrategy | null> {
    const setClause = [];
    const params = [];

    if (updates.name) {
      setClause.push('name = ?');
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push('description = ?');
      params.push(updates.description);
    }
    if (updates.indicators) {
      setClause.push('indicators = ?');
      params.push(JSON.stringify(updates.indicators));
    }
    if (updates.buyConditions) {
      setClause.push('buy_conditions = ?');
      params.push(JSON.stringify(updates.buyConditions));
    }
    if (updates.sellConditions) {
      setClause.push('sell_conditions = ?');
      params.push(JSON.stringify(updates.sellConditions));
    }
    if (updates.riskManagement) {
      setClause.push('risk_management = ?');
      params.push(JSON.stringify(updates.riskManagement));
    }
    if (updates.isActive !== undefined) {
      setClause.push('is_active = ?');
      params.push(updates.isActive);
    }

    if (setClause.length === 0) {
      return this.getTradingStrategy(id);
    }

    params.push(id);

    await execute(
      `UPDATE trading_strategies SET ${setClause.join(', ')}, updated_date = datetime('now') WHERE id = ?`,
      params
    );

    return this.getTradingStrategy(id);
  }

  /**
   * Delete a trading strategy
   */
  async deleteTradingStrategy(id: string): Promise<boolean> {
    const result = await execute(
      'UPDATE trading_strategies SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Assign trading strategy to watchlist item
   */
  async assignStrategyToWatchlist(portfolioId: string, symbol: string, strategyId: string): Promise<boolean> {
    const result = await execute(
      'UPDATE watchlist SET trading_strategy_id = ? WHERE portfolio_id = ? AND symbol = ?',
      [strategyId, portfolioId, symbol.toUpperCase()]
    );
    return result.changes > 0;
  }

  /**
   * Assign trading strategy to holding
   */
  async assignStrategyToHolding(portfolioId: string, holdingId: string, strategyId: string): Promise<boolean> {
    const result = await execute(
      'UPDATE holdings SET trading_strategy_id = ? WHERE id = ? AND portfolio_id = ?',
      [strategyId, holdingId, portfolioId]
    );
    return result.changes > 0;
  }
}
