"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const uuid_1 = require("uuid");
class PortfolioService {
    constructor() {
        this.portfolios = new Map();
        this.initializeDemoData();
    }
    initializeDemoData() {
        const demoPortfolio = {
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
    async getUserPortfolios(userId) {
        const userPortfolios = Array.from(this.portfolios.values())
            .filter(portfolio => portfolio.userId === userId);
        return userPortfolios;
    }
    async createPortfolio(data) {
        const portfolio = {
            id: (0, uuid_1.v4)(),
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
    async getPortfolio(id) {
        return this.portfolios.get(id) || null;
    }
    async updatePortfolio(id, updates) {
        const portfolio = this.portfolios.get(id);
        if (!portfolio)
            return null;
        const updatedPortfolio = {
            ...portfolio,
            ...updates,
            id: portfolio.id,
            userId: portfolio.userId,
            lastUpdated: new Date().toISOString()
        };
        this.portfolios.set(id, updatedPortfolio);
        return updatedPortfolio;
    }
    async deletePortfolio(id) {
        return this.portfolios.delete(id);
    }
    async getHoldings(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        return portfolio?.holdings || [];
    }
    async addHolding(portfolioId, holdingData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio)
            throw new Error('Portfolio not found');
        const holding = {
            id: (0, uuid_1.v4)(),
            ...holdingData
        };
        portfolio.holdings.push(holding);
        portfolio.lastUpdated = new Date().toISOString();
        const totalCost = holding.quantity * holding.averagePrice;
        portfolio.currentCash = Math.max(0, portfolio.currentCash - totalCost);
        this.portfolios.set(portfolioId, portfolio);
        return holding;
    }
    async updateHolding(portfolioId, holdingId, updates) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio)
            return null;
        const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);
        if (holdingIndex === -1)
            return null;
        const updatedHolding = {
            ...portfolio.holdings[holdingIndex],
            ...updates,
            id: holdingId
        };
        portfolio.holdings[holdingIndex] = updatedHolding;
        portfolio.lastUpdated = new Date().toISOString();
        this.portfolios.set(portfolioId, portfolio);
        return updatedHolding;
    }
    async removeHolding(portfolioId, holdingId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio)
            return false;
        const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);
        if (holdingIndex === -1)
            return false;
        const holding = portfolio.holdings[holdingIndex];
        const saleValue = holding.quantity * holding.averagePrice;
        portfolio.currentCash += saleValue;
        portfolio.holdings.splice(holdingIndex, 1);
        portfolio.lastUpdated = new Date().toISOString();
        this.portfolios.set(portfolioId, portfolio);
        return true;
    }
    async getPortfolioAnalysis(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio)
            throw new Error('Portfolio not found');
        const totalInvested = portfolio.initialCash - portfolio.currentCash;
        const totalHoldings = portfolio.holdings.length;
        const analysis = {
            totalValue: totalInvested + portfolio.currentCash,
            totalInvested,
            availableCash: portfolio.currentCash,
            totalHoldings,
            diversification: {
                stockCount: totalHoldings,
                sectors: ['Technology', 'Healthcare', 'Finance'],
                concentration: totalHoldings > 0 ? (1 / totalHoldings * 100) : 0
            },
            allocation: {
                stocks: totalInvested,
                cash: portfolio.currentCash
            }
        };
        return analysis;
    }
    async getPerformance(portfolioId, period) {
        return {
            period,
            totalReturn: 12.5,
            totalReturnPercent: 8.3,
            dailyReturns: [0.5, -0.2, 1.1, 0.8, -0.3],
            benchmarkComparison: {
                portfolio: 8.3,
                sp500: 7.1,
                outperformance: 1.2
            }
        };
    }
    async getRiskAnalysis(portfolioId) {
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
    async getWatchlist(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        return portfolio?.watchlist || [];
    }
    async addToWatchlist(portfolioId, itemData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio)
            throw new Error('Portfolio not found');
        const watchlistItem = {
            id: (0, uuid_1.v4)(),
            ...itemData
        };
        portfolio.watchlist.push(watchlistItem);
        portfolio.lastUpdated = new Date().toISOString();
        this.portfolios.set(portfolioId, portfolio);
        return watchlistItem;
    }
    async removeFromWatchlist(portfolioId, symbol) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio)
            return false;
        const itemIndex = portfolio.watchlist.findIndex(item => item.symbol === symbol);
        if (itemIndex === -1)
            return false;
        portfolio.watchlist.splice(itemIndex, 1);
        portfolio.lastUpdated = new Date().toISOString();
        this.portfolios.set(portfolioId, portfolio);
        return true;
    }
}
exports.PortfolioService = PortfolioService;
//# sourceMappingURL=portfolioService.js.map