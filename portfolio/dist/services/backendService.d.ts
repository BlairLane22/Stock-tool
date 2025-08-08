export declare class BackendService {
    private api;
    constructor();
    healthCheck(): Promise<any>;
    getRSI(symbol: string, period?: number): Promise<any>;
    getQuickRSI(symbol: string): Promise<any>;
    getBollingerBands(symbol: string, period?: number, multiplier?: number): Promise<any>;
    getQuickBollingerBands(symbol: string): Promise<any>;
    getMFI(symbol: string, period?: number): Promise<any>;
    getQuickMFI(symbol: string): Promise<any>;
    getEMA(symbol: string, period?: number): Promise<any>;
    getQuickEMA(symbol: string): Promise<any>;
    getATR(symbol: string, period?: number): Promise<any>;
    getQuickATR(symbol: string): Promise<any>;
    getQuickIMI(symbol: string): Promise<any>;
    getMultiIndicatorAnalysis(symbols: string[]): Promise<any[]>;
    getBatchQuotes(symbols: string[]): Promise<any[]>;
}
//# sourceMappingURL=backendService.d.ts.map