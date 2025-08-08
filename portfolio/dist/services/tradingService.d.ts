export interface TradingAnalysis {
    symbol: string;
    currentPrice: number;
    recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string[];
    indicators: {
        rsi?: any;
        macd?: any;
        bollingerBands?: any;
        headAndShoulders?: any;
        cupAndHandle?: any;
    };
    targetPrice?: number;
    stopLoss?: number;
    recommendedQuantity?: number;
    riskReward?: number;
}
export declare class TradingService {
    private portfolioService;
    private backendApiUrl;
    constructor();
    analyzeStock(symbol: string): Promise<TradingAnalysis>;
    private getIndicator;
    private makeDecision;
    private calculatePositionSize;
    analyzePortfolioOpportunities(symbols: string[]): Promise<TradingAnalysis[]>;
    getPopularStocks(): string[];
}
//# sourceMappingURL=tradingService.d.ts.map