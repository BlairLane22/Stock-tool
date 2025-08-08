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
}
export interface WatchlistItem {
    id: string;
    symbol: string;
    notes?: string;
    addedDate: string;
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