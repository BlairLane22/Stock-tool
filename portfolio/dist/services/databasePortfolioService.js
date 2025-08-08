"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabasePortfolioService = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class DatabasePortfolioService {
    async getUser(userId) {
        const user = await (0, connection_1.queryOne)('SELECT * FROM users WHERE id = ? AND is_active = 1', [userId]);
        return user || null;
    }
    async getUserPortfolios(userId) {
        const portfolios = await (0, connection_1.query)('SELECT * FROM portfolios WHERE user_id = ? AND is_active = 1 ORDER BY created_date DESC', [userId]);
        const enrichedPortfolios = await Promise.all(portfolios.map(async (portfolio) => {
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
            };
        }));
        return enrichedPortfolios;
    }
    async createPortfolio(data) {
        const portfolioId = (0, uuid_1.v4)();
        await (0, connection_1.execute)(`INSERT INTO portfolios (id, user_id, name, description, initial_cash, current_cash) 
       VALUES (?, ?, ?, ?, ?, ?)`, [portfolioId, data.userId, data.name, data.description, data.initialCash, data.initialCash]);
        const portfolio = await (0, connection_1.queryOne)('SELECT * FROM portfolios WHERE id = ?', [portfolioId]);
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
        };
    }
    async getPortfolio(id) {
        const portfolio = await (0, connection_1.queryOne)('SELECT * FROM portfolios WHERE id = ? AND is_active = 1', [id]);
        if (!portfolio)
            return null;
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
        };
    }
    async updatePortfolio(id, updates) {
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
        await (0, connection_1.execute)(`UPDATE portfolios SET ${setClause.join(', ')} WHERE id = ?`, params);
        return this.getPortfolio(id);
    }
    async deletePortfolio(id) {
        const result = await (0, connection_1.execute)('UPDATE portfolios SET is_active = 0 WHERE id = ?', [id]);
        return result.changes > 0;
    }
    async getHoldings(portfolioId) {
        const holdings = await (0, connection_1.query)('SELECT * FROM holdings WHERE portfolio_id = ? ORDER BY symbol', [portfolioId]);
        return holdings.map(holding => ({
            id: holding.id,
            symbol: holding.symbol,
            quantity: holding.quantity,
            averagePrice: holding.average_price,
            purchaseDate: holding.purchase_date
        }));
    }
    async addHolding(portfolioId, holdingData) {
        return (0, connection_1.transaction)(async () => {
            const holdingId = (0, uuid_1.v4)();
            await (0, connection_1.execute)(`INSERT INTO holdings (id, portfolio_id, symbol, quantity, average_price, purchase_date) 
         VALUES (?, ?, ?, ?, ?, ?)`, [holdingId, portfolioId, holdingData.symbol, holdingData.quantity, holdingData.averagePrice, holdingData.purchaseDate]);
            const totalCost = holdingData.quantity * holdingData.averagePrice;
            await (0, connection_1.execute)('UPDATE portfolios SET current_cash = current_cash - ? WHERE id = ?', [totalCost, portfolioId]);
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
    async updateHolding(portfolioId, holdingId, updates) {
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
            const holding = await (0, connection_1.queryOne)('SELECT * FROM holdings WHERE id = ? AND portfolio_id = ?', [holdingId, portfolioId]);
            return holding ? {
                id: holding.id,
                symbol: holding.symbol,
                quantity: holding.quantity,
                averagePrice: holding.average_price,
                purchaseDate: holding.purchase_date
            } : null;
        }
        params.push(holdingId, portfolioId);
        await (0, connection_1.execute)(`UPDATE holdings SET ${setClause.join(', ')} WHERE id = ? AND portfolio_id = ?`, params);
        const holding = await (0, connection_1.queryOne)('SELECT * FROM holdings WHERE id = ? AND portfolio_id = ?', [holdingId, portfolioId]);
        return holding ? {
            id: holding.id,
            symbol: holding.symbol,
            quantity: holding.quantity,
            averagePrice: holding.average_price,
            purchaseDate: holding.purchase_date
        } : null;
    }
    async removeHolding(portfolioId, holdingId) {
        const result = await (0, connection_1.execute)('DELETE FROM holdings WHERE id = ? AND portfolio_id = ?', [holdingId, portfolioId]);
        return result.changes > 0;
    }
    async getWatchlist(portfolioId) {
        const watchlist = await (0, connection_1.query)('SELECT * FROM watchlist WHERE portfolio_id = ? ORDER BY added_date DESC', [portfolioId]);
        return watchlist.map(item => ({
            id: item.id,
            symbol: item.symbol,
            notes: item.notes,
            addedDate: item.added_date
        }));
    }
    async addToWatchlist(portfolioId, itemData) {
        const itemId = (0, uuid_1.v4)();
        await (0, connection_1.execute)(`INSERT INTO watchlist (id, portfolio_id, symbol, notes, added_date) 
       VALUES (?, ?, ?, ?, ?)`, [itemId, portfolioId, itemData.symbol, itemData.notes, itemData.addedDate]);
        return {
            id: itemId,
            symbol: itemData.symbol,
            notes: itemData.notes,
            addedDate: itemData.addedDate
        };
    }
    async removeFromWatchlist(portfolioId, symbol) {
        const result = await (0, connection_1.execute)('DELETE FROM watchlist WHERE portfolio_id = ? AND symbol = ?', [portfolioId, symbol.toUpperCase()]);
        return result.changes > 0;
    }
    async getPortfolioAnalysis(portfolioId) {
        const portfolio = await this.getPortfolio(portfolioId);
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
    async getPerformance(portfolioId, period = '1M') {
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
    async getRiskAnalysis(portfolioId) {
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
    async recordTransaction(transactionData) {
        const transactionId = (0, uuid_1.v4)();
        await (0, connection_1.execute)(`INSERT INTO transactions (id, portfolio_id, symbol, transaction_type, quantity, price, total_amount, fees, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            transactionId,
            transactionData.portfolioId,
            transactionData.symbol,
            transactionData.transactionType,
            transactionData.quantity,
            transactionData.price,
            transactionData.totalAmount,
            transactionData.fees,
            transactionData.notes
        ]);
        const transaction = await (0, connection_1.queryOne)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
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
    async getMainUser() {
        return this.getUser('user-blair-1');
    }
    async getMainPortfolio() {
        return this.getPortfolio('portfolio-blair-main');
    }
    async saveTradingDecision(decision) {
        const decisionId = (0, uuid_1.v4)();
        await (0, connection_1.execute)(`INSERT INTO trading_decisions (id, portfolio_id, symbol, decision_type, confidence_level,
       recommended_quantity, recommended_price, reasoning, indicator_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            decisionId,
            decision.portfolioId,
            decision.symbol,
            decision.decisionType,
            decision.confidenceLevel,
            decision.recommendedQuantity,
            decision.recommendedPrice,
            decision.reasoning,
            JSON.stringify(decision.indicatorData)
        ]);
        const savedDecision = await (0, connection_1.queryOne)('SELECT * FROM trading_decisions WHERE id = ?', [decisionId]);
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
    async getTradingDecisions(portfolioId, limit = 10) {
        const decisions = await (0, connection_1.query)(`SELECT * FROM trading_decisions WHERE portfolio_id = ?
       ORDER BY decision_date DESC LIMIT ?`, [portfolioId, limit]);
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
}
exports.DatabasePortfolioService = DatabasePortfolioService;
//# sourceMappingURL=databasePortfolioService.js.map