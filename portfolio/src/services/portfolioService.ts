import { v4 as uuidv4 } from 'uuid';
import { Portfolio, Holding, WatchlistItem } from '../types/portfolio';

export class PortfolioService {
  private portfolios: Map<string, Portfolio> = new Map();

  constructor() {
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    const demoPortfolio: Portfolio = {
      id: 'demo-portfolio-1',
      userId: 'demo-user',
      name: 'My Investment Portfolio',
      description: 'Main investment portfolio for long-term growth',
      initialCash: 10000,
      currentCash: 2500,
      createdDate: new Date('2024-01-01').toISOString(),
      lastUpdated: new Date().toISOString(),
      holdings: [
        {
          id: 'holding-1',
          symbol: 'AAPL',
          quantity: 10,
          averagePrice: 150.00,
          purchaseDate: new Date('2024-01-15').toISOString()
        },
        {
          id: 'holding-2',
          symbol: 'GOOGL',
          quantity: 5,
          averagePrice: 2800.00,
          purchaseDate: new Date('2024-02-01').toISOString()
        },
        {
          id: 'holding-3',
          symbol: 'MSFT',
          quantity: 8,
          averagePrice: 400.00,
          purchaseDate: new Date('2024-01-20').toISOString()
        }
      ],
      watchlist: [
        {
          id: 'watch-1',
          symbol: 'TSLA',
          notes: 'Waiting for better entry point',
          addedDate: new Date('2024-03-01').toISOString()
        },
        {
          id: 'watch-2',
          symbol: 'NVDA',
          notes: 'Strong AI growth potential',
          addedDate: new Date('2024-03-05').toISOString()
        }
      ]
    };

    this.portfolios.set(demoPortfolio.id, demoPortfolio);
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const userPortfolios = Array.from(this.portfolios.values())
      .filter(portfolio => portfolio.userId === userId);
    return userPortfolios;
  }

  async createPortfolio(data: {
    userId: string;
    name: string;
    description?: string;
    initialCash: number;
  }): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: uuidv4(),
      userId: data.userId,
      name: data.name,
      description: data.description,
      initialCash: data.initialCash,
      currentCash: data.initialCash,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      holdings: [],
      watchlist: []
    };

    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  async getPortfolio(id: string): Promise<Portfolio | null> {
    return this.portfolios.get(id) || null;
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return null;

    const updatedPortfolio = {
      ...portfolio,
      ...updates,
      id: portfolio.id, // Ensure ID cannot be changed
      userId: portfolio.userId, // Ensure userId cannot be changed
      lastUpdated: new Date().toISOString()
    };

    this.portfolios.set(id, updatedPortfolio);
    return updatedPortfolio;
  }

  async deletePortfolio(id: string): Promise<boolean> {
    return this.portfolios.delete(id);
  }

  async getHoldings(portfolioId: string): Promise<Holding[]> {
    const portfolio = this.portfolios.get(portfolioId);
    return portfolio?.holdings || [];
  }

  async addHolding(portfolioId: string, holdingData: {
    symbol: string;
    quantity: number;
    averagePrice: number;
    purchaseDate: string;
  }): Promise<Holding> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    const holding: Holding = {
      id: uuidv4(),
      ...holdingData
    };

    portfolio.holdings.push(holding);
    portfolio.lastUpdated = new Date().toISOString();
    
    // Update cash balance
    const totalCost = holding.quantity * holding.averagePrice;
    portfolio.currentCash = Math.max(0, portfolio.currentCash - totalCost);

    this.portfolios.set(portfolioId, portfolio);
    return holding;
  }

  async updateHolding(portfolioId: string, holdingId: string, updates: Partial<Holding>): Promise<Holding | null> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return null;

    const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);
    if (holdingIndex === -1) return null;

    const updatedHolding = {
      ...portfolio.holdings[holdingIndex],
      ...updates,
      id: holdingId // Ensure ID cannot be changed
    };

    portfolio.holdings[holdingIndex] = updatedHolding;
    portfolio.lastUpdated = new Date().toISOString();

    this.portfolios.set(portfolioId, portfolio);
    return updatedHolding;
  }

  async removeHolding(portfolioId: string, holdingId: string): Promise<boolean> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return false;

    const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);
    if (holdingIndex === -1) return false;

    const holding = portfolio.holdings[holdingIndex];
    
    // Add back to cash balance
    const saleValue = holding.quantity * holding.averagePrice; // Simplified - using average price
    portfolio.currentCash += saleValue;

    portfolio.holdings.splice(holdingIndex, 1);
    portfolio.lastUpdated = new Date().toISOString();

    this.portfolios.set(portfolioId, portfolio);
    return true;
  }

  async getPortfolioAnalysis(portfolioId: string): Promise<any> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    const totalInvested = portfolio.initialCash - portfolio.currentCash;
    const totalHoldings = portfolio.holdings.length;
    
    // Calculate basic metrics (simplified)
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

  async getPerformance(portfolioId: string, period: string): Promise<any> {
    // Mock performance data
    return {
      period,
      totalReturn: 12.5,
      totalReturnPercent: 8.3,
      dailyReturns: [0.5, -0.2, 1.1, 0.8, -0.3], // Mock daily returns
      benchmarkComparison: {
        portfolio: 8.3,
        sp500: 7.1,
        outperformance: 1.2
      }
    };
  }

  async getRiskAnalysis(portfolioId: string): Promise<any> {
    // Mock risk analysis
    return {
      volatility: 15.2,
      sharpeRatio: 1.1,
      maxDrawdown: -8.5,
      beta: 1.05,
      riskLevel: 'MODERATE',
      recommendations: [
        'Consider diversifying into defensive sectors',
        'Current allocation shows moderate risk exposure',
        'Portfolio beta suggests market-like volatility'
      ]
    };
  }

  async getWatchlist(portfolioId: string): Promise<WatchlistItem[]> {
    const portfolio = this.portfolios.get(portfolioId);
    return portfolio?.watchlist || [];
  }

  async addToWatchlist(portfolioId: string, itemData: {
    symbol: string;
    notes?: string;
    addedDate: string;
  }): Promise<WatchlistItem> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    const watchlistItem: WatchlistItem = {
      id: uuidv4(),
      ...itemData
    };

    portfolio.watchlist.push(watchlistItem);
    portfolio.lastUpdated = new Date().toISOString();

    this.portfolios.set(portfolioId, portfolio);
    return watchlistItem;
  }

  async removeFromWatchlist(portfolioId: string, symbol: string): Promise<boolean> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return false;

    const itemIndex = portfolio.watchlist.findIndex(item => item.symbol === symbol);
    if (itemIndex === -1) return false;

    portfolio.watchlist.splice(itemIndex, 1);
    portfolio.lastUpdated = new Date().toISOString();

    this.portfolios.set(portfolioId, portfolio);
    return true;
  }
}
