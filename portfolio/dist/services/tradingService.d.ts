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
    metadata?: {
        dataSource: string;
        timestamp: string;
        candleCount: number;
        usedMockData: boolean;
    };
}
export declare class TradingService {
    private portfolioService;
    private backendService;
    private backendApiUrl;
    constructor();
    analyzeHistoricalData(symbol: string, strategyId: string, historicalData: any, currentDate: string, lookbackDays?: number): Promise<TradingAnalysis>;
    analyzeStock(symbol: string, strategyId?: string, useMockData?: boolean): Promise<TradingAnalysis>;
    private mapIndicatorName;
    private mapBackendIndicatorName;
    private getIndicatorLegacy;
    private makeStrategyDecision;
    private makeDecision;
    private isIndividualIndicatorStrategy;
    private evaluateIndividualIndicatorStrategy;
    private evaluateBollingerStrategy;
    private evaluateMFIStrategy;
    private evaluateRSIStrategy;
    private evaluateMACDStrategy;
    private evaluateEMAStrategy;
    private evaluateDonchianBreakoutStrategy;
    private evaluateThreeTierTrendStrategy;
    private calculatePositionSize;
    analyzePortfolioOpportunities(symbols: string[]): Promise<TradingAnalysis[]>;
    getPopularStocks(): string[];
    private calculateHistoricalIndicators;
    private makeHistoricalTradingDecision;
    private calculateEMA;
    private calculateRSI;
    private calculateMACD;
    private calculateBollingerBands;
    private calculateMFI;
    private calculateSimpleEMA;
    private calculateDonchianChannels;
}
//# sourceMappingURL=tradingService.d.ts.map