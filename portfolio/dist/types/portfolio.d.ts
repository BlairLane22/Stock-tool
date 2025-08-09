export interface Portfolio {
    id: string;
    userId: string;
    name: string;
    description?: string;
    initialCash: number;
    currentCash: number;
    createdDate: string;
    lastUpdated: string;
    holdings: Holding[];
    watchlist: WatchlistItem[];
}
export interface Holding {
    id: string;
    symbol: string;
    quantity: number;
    averagePrice: number;
    purchaseDate: string;
    tradingStrategyId?: string;
    tradingStrategy?: TradingStrategy;
}
export interface WatchlistItem {
    id: string;
    symbol: string;
    notes?: string;
    addedDate: string;
    tradingStrategyId?: string;
    tradingStrategy?: TradingStrategy;
}
export interface TradingStrategy {
    id: string;
    portfolioId: string;
    name: string;
    description?: string;
    indicators: string[];
    buyConditions: any;
    sellConditions: any;
    riskManagement: any;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdDate: string;
    lastLogin?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
}
//# sourceMappingURL=portfolio.d.ts.map