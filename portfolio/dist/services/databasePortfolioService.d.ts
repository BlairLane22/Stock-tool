import { Portfolio, Holding, WatchlistItem, User } from '../types/portfolio';
export interface TradingDecision {
    id: string;
    portfolioId: string;
    symbol: string;
    decisionType: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendedQuantity?: number;
    recommendedPrice?: number;
    reasoning: string;
    indicatorData: string;
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
export declare class DatabasePortfolioService {
    getUser(userId: string): Promise<User | null>;
    getUserPortfolios(userId: string): Promise<Portfolio[]>;
    createPortfolio(data: {
        userId: string;
        name: string;
        description?: string;
        initialCash: number;
    }): Promise<Portfolio>;
    getPortfolio(id: string): Promise<Portfolio | null>;
    updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | null>;
    deletePortfolio(id: string): Promise<boolean>;
    getHoldings(portfolioId: string): Promise<Holding[]>;
    addHolding(portfolioId: string, holdingData: {
        symbol: string;
        quantity: number;
        averagePrice: number;
        purchaseDate: string;
    }): Promise<Holding>;
    updateHolding(portfolioId: string, holdingId: string, updates: Partial<Holding>): Promise<Holding | null>;
    removeHolding(portfolioId: string, holdingId: string): Promise<boolean>;
    getWatchlist(portfolioId: string): Promise<WatchlistItem[]>;
    addToWatchlist(portfolioId: string, itemData: {
        symbol: string;
        notes?: string;
        addedDate: string;
    }): Promise<WatchlistItem>;
    removeFromWatchlist(portfolioId: string, symbol: string): Promise<boolean>;
    getPortfolioAnalysis(portfolioId: string): Promise<any>;
    getPerformance(portfolioId: string, period?: string): Promise<any>;
    getRiskAnalysis(portfolioId: string): Promise<any>;
    recordTransaction(transactionData: {
        portfolioId: string;
        symbol: string;
        transactionType: 'BUY' | 'SELL';
        quantity: number;
        price: number;
        totalAmount: number;
        fees: number;
        notes?: string;
    }): Promise<Transaction>;
    getMainUser(): Promise<User | null>;
    getMainPortfolio(): Promise<Portfolio | null>;
    saveTradingDecision(decision: {
        portfolioId: string;
        symbol: string;
        decisionType: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
        confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
        recommendedQuantity?: number;
        recommendedPrice?: number;
        reasoning: string;
        indicatorData: any;
    }): Promise<TradingDecision>;
    getTradingDecisions(portfolioId: string, limit?: number): Promise<TradingDecision[]>;
}
//# sourceMappingURL=databasePortfolioService.d.ts.map