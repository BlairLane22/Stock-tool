import { Portfolio, Holding, WatchlistItem } from '../types/portfolio';
export declare class PortfolioService {
    private portfolios;
    constructor();
    private initializeDemoData;
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
    getPortfolioAnalysis(portfolioId: string): Promise<any>;
    getPerformance(portfolioId: string, period: string): Promise<any>;
    getRiskAnalysis(portfolioId: string): Promise<any>;
    getWatchlist(portfolioId: string): Promise<WatchlistItem[]>;
    addToWatchlist(portfolioId: string, itemData: {
        symbol: string;
        notes?: string;
        addedDate: string;
    }): Promise<WatchlistItem>;
    removeFromWatchlist(portfolioId: string, symbol: string): Promise<boolean>;
}
//# sourceMappingURL=portfolioService.d.ts.map