"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioController = void 0;
const databasePortfolioService_1 = require("../services/databasePortfolioService");
const tradingService_1 = require("../services/tradingService");
const backendService_1 = require("../services/backendService");
class PortfolioController {
    constructor() {
        this.getAllPortfolios = async (req, res) => {
            try {
                const userId = req.headers['user-id'] || 'demo-user';
                const portfolios = await this.portfolioService.getUserPortfolios(userId);
                res.json({
                    success: true,
                    data: portfolios,
                    count: portfolios.length
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch portfolios'
                });
            }
        };
        this.createPortfolio = async (req, res) => {
            try {
                const userId = req.headers['user-id'] || 'demo-user';
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create portfolio'
                });
            }
        };
        this.getPortfolio = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch portfolio'
                });
            }
        };
        this.updatePortfolio = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update portfolio'
                });
            }
        };
        this.deletePortfolio = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to delete portfolio'
                });
            }
        };
        this.getHoldings = async (req, res) => {
            try {
                const { id } = req.params;
                const holdings = await this.portfolioService.getHoldings(id);
                const enrichedHoldings = await Promise.all(holdings.map(async (holding) => {
                    try {
                        const marketData = await this.backendService.getQuickRSI(holding.symbol);
                        return {
                            ...holding,
                            currentPrice: marketData.price || holding.averagePrice,
                            marketValue: (marketData.price || holding.averagePrice) * holding.quantity,
                            gainLoss: ((marketData.price || holding.averagePrice) - holding.averagePrice) * holding.quantity,
                            gainLossPercent: (((marketData.price || holding.averagePrice) - holding.averagePrice) / holding.averagePrice) * 100
                        };
                    }
                    catch (error) {
                        return {
                            ...holding,
                            currentPrice: holding.averagePrice,
                            marketValue: holding.averagePrice * holding.quantity,
                            gainLoss: 0,
                            gainLossPercent: 0
                        };
                    }
                }));
                res.json({
                    success: true,
                    data: enrichedHoldings
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch holdings'
                });
            }
        };
        this.addHolding = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to add holding'
                });
            }
        };
        this.updateHolding = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update holding'
                });
            }
        };
        this.removeHolding = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to remove holding'
                });
            }
        };
        this.getPortfolioAnalysis = async (req, res) => {
            try {
                const { id } = req.params;
                const analysis = await this.portfolioService.getPortfolioAnalysis(id);
                res.json({
                    success: true,
                    data: analysis
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get portfolio analysis'
                });
            }
        };
        this.getPerformance = async (req, res) => {
            try {
                const { id } = req.params;
                const { period = '1M' } = req.query;
                const performance = await this.portfolioService.getPerformance(id, period);
                res.json({
                    success: true,
                    data: performance
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get portfolio performance'
                });
            }
        };
        this.getRiskAnalysis = async (req, res) => {
            try {
                const { id } = req.params;
                const riskAnalysis = await this.portfolioService.getRiskAnalysis(id);
                res.json({
                    success: true,
                    data: riskAnalysis
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get risk analysis'
                });
            }
        };
        this.getWatchlist = async (req, res) => {
            try {
                const { id } = req.params;
                const watchlist = await this.portfolioService.getWatchlist(id);
                const enrichedWatchlist = await Promise.all(watchlist.map(async (item) => {
                    try {
                        const marketData = await this.backendService.getQuickRSI(item.symbol);
                        return {
                            ...item,
                            currentPrice: marketData.price,
                            rsi: marketData.rsi,
                            signal: marketData.signal
                        };
                    }
                    catch (error) {
                        return item;
                    }
                }));
                res.json({
                    success: true,
                    data: enrichedWatchlist
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get watchlist'
                });
            }
        };
        this.addToWatchlist = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to add to watchlist'
                });
            }
        };
        this.removeFromWatchlist = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to remove from watchlist'
                });
            }
        };
        this.analyzeStock = async (req, res) => {
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to analyze stock'
                });
            }
        };
        this.analyzeMultipleStocks = async (req, res) => {
            try {
                const { symbols } = req.body;
                if (!symbols || !Array.isArray(symbols)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Symbols array is required'
                    });
                }
                const analyses = await this.tradingService.analyzePortfolioOpportunities(symbols.map((s) => s.toUpperCase()));
                res.json({
                    success: true,
                    data: analyses,
                    count: analyses.length
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to analyze stocks'
                });
            }
        };
        this.getPopularStocks = async (req, res) => {
            try {
                const symbols = this.tradingService.getPopularStocks();
                const analyses = await this.tradingService.analyzePortfolioOpportunities(symbols);
                res.json({
                    success: true,
                    data: analyses,
                    count: analyses.length,
                    message: 'Analysis of popular stocks completed'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to analyze popular stocks'
                });
            }
        };
        this.getTradingDecisions = async (req, res) => {
            try {
                const { id } = req.params;
                const { limit = '10' } = req.query;
                const decisions = await this.portfolioService.getTradingDecisions(id, parseInt(limit));
                res.json({
                    success: true,
                    data: decisions,
                    count: decisions.length
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get trading decisions'
                });
            }
        };
        this.getTradingStrategies = async (req, res) => {
            try {
                const { id } = req.params;
                const strategies = await this.portfolioService.getTradingStrategies(id);
                res.json({
                    success: true,
                    data: strategies,
                    count: strategies.length
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get trading strategies'
                });
            }
        };
        this.createTradingStrategy = async (req, res) => {
            try {
                const { id } = req.params;
                const { name, description, indicators, buyConditions, sellConditions, riskManagement } = req.body;
                if (!name || !indicators || !Array.isArray(indicators)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Name and indicators array are required'
                    });
                }
                const strategy = await this.portfolioService.createTradingStrategy({
                    portfolioId: id,
                    name,
                    description,
                    indicators,
                    buyConditions: buyConditions || {},
                    sellConditions: sellConditions || {},
                    riskManagement: riskManagement || {}
                });
                res.status(201).json({
                    success: true,
                    data: strategy
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create trading strategy'
                });
            }
        };
        this.updateTradingStrategy = async (req, res) => {
            try {
                const { strategyId } = req.params;
                const updates = req.body;
                const strategy = await this.portfolioService.updateTradingStrategy(strategyId, updates);
                if (!strategy) {
                    return res.status(404).json({
                        success: false,
                        error: 'Trading strategy not found'
                    });
                }
                res.json({
                    success: true,
                    data: strategy
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update trading strategy'
                });
            }
        };
        this.deleteTradingStrategy = async (req, res) => {
            try {
                const { strategyId } = req.params;
                const success = await this.portfolioService.deleteTradingStrategy(strategyId);
                if (!success) {
                    return res.status(404).json({
                        success: false,
                        error: 'Trading strategy not found'
                    });
                }
                res.json({
                    success: true,
                    message: 'Trading strategy deleted successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to delete trading strategy'
                });
            }
        };
        this.assignStrategyToWatchlist = async (req, res) => {
            try {
                const { id, symbol } = req.params;
                const { strategyId } = req.body;
                if (!strategyId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Strategy ID is required'
                    });
                }
                const success = await this.portfolioService.assignStrategyToWatchlist(id, symbol, strategyId);
                if (!success) {
                    return res.status(404).json({
                        success: false,
                        error: 'Watchlist item not found'
                    });
                }
                res.json({
                    success: true,
                    message: `Strategy assigned to ${symbol} in watchlist`
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to assign strategy to watchlist'
                });
            }
        };
        this.assignStrategyToHolding = async (req, res) => {
            try {
                const { id, holdingId } = req.params;
                const { strategyId } = req.body;
                if (!strategyId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Strategy ID is required'
                    });
                }
                const success = await this.portfolioService.assignStrategyToHolding(id, holdingId, strategyId);
                if (!success) {
                    return res.status(404).json({
                        success: false,
                        error: 'Holding not found'
                    });
                }
                res.json({
                    success: true,
                    message: 'Strategy assigned to holding'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to assign strategy to holding'
                });
            }
        };
        this.analyzeWithStrategy = async (req, res) => {
            try {
                const { symbol, strategyId } = req.params;
                if (!symbol || !strategyId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Symbol and strategy ID are required'
                    });
                }
                const analysis = await this.tradingService.analyzeStock(symbol.toUpperCase(), strategyId);
                res.json({
                    success: true,
                    data: analysis
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to analyze stock with strategy'
                });
            }
        };
        this.portfolioService = new databasePortfolioService_1.DatabasePortfolioService();
        this.tradingService = new tradingService_1.TradingService();
        this.backendService = new backendService_1.BackendService();
    }
}
exports.PortfolioController = PortfolioController;
//# sourceMappingURL=portfolioController.js.map