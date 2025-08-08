import { Request, Response } from 'express';
import { DatabasePortfolioService } from '../services/databasePortfolioService';
import { TradingService } from '../services/tradingService';
import { BackendService } from '../services/backendService';

export class PortfolioController {
  private portfolioService: DatabasePortfolioService;
  private tradingService: TradingService;
  private backendService: BackendService;

  constructor() {
    this.portfolioService = new DatabasePortfolioService();
    this.tradingService = new TradingService();
    this.backendService = new BackendService();
  }

  // Get all portfolios for a user
  getAllPortfolios = async (req: Request, res: Response) => {
    try {
      // TODO: Get user ID from auth middleware
      const userId = req.headers['user-id'] as string || 'demo-user';
      const portfolios = await this.portfolioService.getUserPortfolios(userId);
      
      res.json({
        success: true,
        data: portfolios,
        count: portfolios.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolios'
      });
    }
  };

  // Create a new portfolio
  createPortfolio = async (req: Request, res: Response) => {
    try {
      const userId = req.headers['user-id'] as string || 'demo-user';
      const { name, description, initialCash } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Portfolio name is required'
        });
      }

      const portfolio = await this.portfolioService.createPortfolio({
        userId,
        name,
        description,
        initialCash: initialCash || 10000
      });

      res.status(201).json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create portfolio'
      });
    }
  };

  // Get a specific portfolio
  getPortfolio = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = await this.portfolioService.getPortfolio(id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio'
      });
    }
  };

  // Update portfolio
  updatePortfolio = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const portfolio = await this.portfolioService.updatePortfolio(id, updates);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update portfolio'
      });
    }
  };

  // Delete portfolio
  deletePortfolio = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.portfolioService.deletePortfolio(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete portfolio'
      });
    }
  };

  // Get portfolio holdings
  getHoldings = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const holdings = await this.portfolioService.getHoldings(id);

      // Enrich holdings with current market data
      const enrichedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const marketData = await this.backendService.getQuickRSI(holding.symbol);
            return {
              ...holding,
              currentPrice: marketData.price || holding.averagePrice,
              marketValue: (marketData.price || holding.averagePrice) * holding.quantity,
              gainLoss: ((marketData.price || holding.averagePrice) - holding.averagePrice) * holding.quantity,
              gainLossPercent: (((marketData.price || holding.averagePrice) - holding.averagePrice) / holding.averagePrice) * 100
            };
          } catch (error) {
            return {
              ...holding,
              currentPrice: holding.averagePrice,
              marketValue: holding.averagePrice * holding.quantity,
              gainLoss: 0,
              gainLossPercent: 0
            };
          }
        })
      );

      res.json({
        success: true,
        data: enrichedHoldings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch holdings'
      });
    }
  };

  // Add holding to portfolio
  addHolding = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { symbol, quantity, averagePrice, purchaseDate } = req.body;

      if (!symbol || !quantity || !averagePrice) {
        return res.status(400).json({
          success: false,
          error: 'Symbol, quantity, and average price are required'
        });
      }

      const holding = await this.portfolioService.addHolding(id, {
        symbol: symbol.toUpperCase(),
        quantity,
        averagePrice,
        purchaseDate: purchaseDate || new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        data: holding
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add holding'
      });
    }
  };

  // Update holding
  updateHolding = async (req: Request, res: Response) => {
    try {
      const { id, holdingId } = req.params;
      const updates = req.body;

      const holding = await this.portfolioService.updateHolding(id, holdingId, updates);

      if (!holding) {
        return res.status(404).json({
          success: false,
          error: 'Holding not found'
        });
      }

      res.json({
        success: true,
        data: holding
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update holding'
      });
    }
  };

  // Remove holding from portfolio
  removeHolding = async (req: Request, res: Response) => {
    try {
      const { id, holdingId } = req.params;
      const success = await this.portfolioService.removeHolding(id, holdingId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Holding not found'
        });
      }

      res.json({
        success: true,
        message: 'Holding removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove holding'
      });
    }
  };

  // Get portfolio analysis
  getPortfolioAnalysis = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const analysis = await this.portfolioService.getPortfolioAnalysis(id);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get portfolio analysis'
      });
    }
  };

  // Get portfolio performance
  getPerformance = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { period = '1M' } = req.query;
      
      const performance = await this.portfolioService.getPerformance(id, period as string);

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get portfolio performance'
      });
    }
  };

  // Get risk analysis
  getRiskAnalysis = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const riskAnalysis = await this.portfolioService.getRiskAnalysis(id);

      res.json({
        success: true,
        data: riskAnalysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get risk analysis'
      });
    }
  };

  // Get watchlist
  getWatchlist = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const watchlist = await this.portfolioService.getWatchlist(id);

      // Enrich with market data
      const enrichedWatchlist = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const marketData = await this.backendService.getQuickRSI(item.symbol);
            return {
              ...item,
              currentPrice: marketData.price,
              rsi: marketData.rsi,
              signal: marketData.signal
            };
          } catch (error) {
            return item;
          }
        })
      );

      res.json({
        success: true,
        data: enrichedWatchlist
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get watchlist'
      });
    }
  };

  // Add to watchlist
  addToWatchlist = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { symbol, notes } = req.body;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol is required'
        });
      }

      const watchlistItem = await this.portfolioService.addToWatchlist(id, {
        symbol: symbol.toUpperCase(),
        notes,
        addedDate: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        data: watchlistItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to watchlist'
      });
    }
  };

  // Remove from watchlist
  removeFromWatchlist = async (req: Request, res: Response) => {
    try {
      const { id, symbol } = req.params;
      const success = await this.portfolioService.removeFromWatchlist(id, symbol.toUpperCase());

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Watchlist item not found'
        });
      }

      res.json({
        success: true,
        message: 'Removed from watchlist successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove from watchlist'
      });
    }
  };

  // Trading analysis endpoints
  analyzeStock = async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol is required'
        });
      }

      const analysis = await this.tradingService.analyzeStock(symbol.toUpperCase());

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze stock'
      });
    }
  };

  analyzeMultipleStocks = async (req: Request, res: Response) => {
    try {
      const { symbols } = req.body;

      if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({
          success: false,
          error: 'Symbols array is required'
        });
      }

      const analyses = await this.tradingService.analyzePortfolioOpportunities(
        symbols.map((s: string) => s.toUpperCase())
      );

      res.json({
        success: true,
        data: analyses,
        count: analyses.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze stocks'
      });
    }
  };

  getPopularStocks = async (req: Request, res: Response) => {
    try {
      const symbols = this.tradingService.getPopularStocks();
      const analyses = await this.tradingService.analyzePortfolioOpportunities(symbols);

      res.json({
        success: true,
        data: analyses,
        count: analyses.length,
        message: 'Analysis of popular stocks completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze popular stocks'
      });
    }
  };

  getTradingDecisions = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = '10' } = req.query;

      const decisions = await this.portfolioService.getTradingDecisions(id, parseInt(limit as string));

      res.json({
        success: true,
        data: decisions,
        count: decisions.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trading decisions'
      });
    }
  };
}
