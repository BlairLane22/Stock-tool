"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendService = void 0;
const axios_1 = __importDefault(require("axios"));
class BackendService {
    constructor() {
        const baseURL = process.env.BACKEND_API_URL || 'http://localhost:3000';
        this.api = axios_1.default.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.api.interceptors.request.use((config) => {
            console.log(`🔗 Backend API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('🚨 Backend API Request Error:', error);
            return Promise.reject(error);
        });
        this.api.interceptors.response.use((response) => {
            console.log(`✅ Backend API Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            console.error(`❌ Backend API Error: ${error.response?.status} ${error.config?.url}`, error.message);
            return Promise.reject(error);
        });
    }
    async healthCheck() {
        try {
            const response = await this.api.get('/health');
            return response.data;
        }
        catch (error) {
            throw new Error(`Backend health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getRSI(symbol, period) {
        try {
            const params = period ? { period } : {};
            const response = await this.api.get(`/api/rsi/${symbol}`, { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get RSI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQuickRSI(symbol) {
        try {
            const response = await this.api.get(`/api/rsi/${symbol}/quick`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get quick RSI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getBollingerBands(symbol, period, multiplier) {
        try {
            const params = {};
            if (period)
                params.period = period;
            if (multiplier)
                params.multiplier = multiplier;
            const response = await this.api.get(`/api/bollinger/${symbol}`, { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get Bollinger Bands for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQuickBollingerBands(symbol) {
        try {
            const response = await this.api.get(`/api/bollinger/${symbol}/quick`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get quick Bollinger Bands for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getMFI(symbol, period) {
        try {
            const params = period ? { period } : {};
            const response = await this.api.get(`/api/mfi/${symbol}`, { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get MFI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQuickMFI(symbol) {
        try {
            const response = await this.api.get(`/api/mfi/${symbol}/quick`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get quick MFI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getEMA(symbol, period) {
        try {
            const params = period ? { period } : {};
            const response = await this.api.get(`/api/ema/${symbol}`, { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get EMA for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQuickEMA(symbol) {
        try {
            const response = await this.api.get(`/api/ema/${symbol}/quick`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get quick EMA for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getATR(symbol, period) {
        try {
            const params = period ? { period } : {};
            const response = await this.api.get(`/api/atr/${symbol}`, { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get ATR for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQuickATR(symbol) {
        try {
            const response = await this.api.get(`/api/atr/${symbol}/quick`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get quick ATR for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQuickIMI(symbol) {
        try {
            const response = await this.api.get(`/api/imi/${symbol}/quick`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get quick IMI for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getMultiIndicatorAnalysis(symbols) {
        try {
            const promises = symbols.map(async (symbol) => {
                try {
                    const [rsi, bollinger, mfi, ema, atr] = await Promise.allSettled([
                        this.getQuickRSI(symbol),
                        this.getQuickBollingerBands(symbol),
                        this.getQuickMFI(symbol),
                        this.getQuickEMA(symbol),
                        this.getQuickATR(symbol)
                    ]);
                    return {
                        symbol,
                        rsi: rsi.status === 'fulfilled' ? rsi.value : null,
                        bollinger: bollinger.status === 'fulfilled' ? bollinger.value : null,
                        mfi: mfi.status === 'fulfilled' ? mfi.value : null,
                        ema: ema.status === 'fulfilled' ? ema.value : null,
                        atr: atr.status === 'fulfilled' ? atr.value : null,
                        timestamp: Date.now()
                    };
                }
                catch (error) {
                    return {
                        symbol,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: Date.now()
                    };
                }
            });
            return await Promise.all(promises);
        }
        catch (error) {
            throw new Error(`Failed to get multi-indicator analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getOptimizedMultiIndicatorAnalysis(symbol, indicators, useMockData = true) {
        try {
            console.log(`🚀 Optimized analysis for ${symbol} with ${indicators.length} indicators`);
            const response = await this.api.post(`/api/analyze/${symbol}/multi?mock=${useMockData}`, {
                indicators
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get optimized multi-indicator analysis for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getBatchOptimizedAnalysis(symbols, indicators, useMockData = true) {
        try {
            console.log(`🚀 Batch optimized analysis for ${symbols.length} symbols`);
            const promises = symbols.map(symbol => this.getOptimizedMultiIndicatorAnalysis(symbol, indicators, useMockData));
            const results = await Promise.allSettled(promises);
            return results.map((result, index) => ({
                symbol: symbols[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : null
            }));
        }
        catch (error) {
            throw new Error(`Failed to get batch optimized analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getBatchQuotes(symbols) {
        try {
            const promises = symbols.map(async (symbol) => {
                try {
                    const rsi = await this.getQuickRSI(symbol);
                    return {
                        symbol,
                        price: rsi.price || 0,
                        change: rsi.change || 0,
                        changePercent: rsi.changePercent || 0,
                        rsi: rsi.rsi,
                        signal: rsi.signal,
                        timestamp: rsi.timestamp
                    };
                }
                catch (error) {
                    return {
                        symbol,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: Date.now()
                    };
                }
            });
            return await Promise.all(promises);
        }
        catch (error) {
            throw new Error(`Failed to get batch quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getCacheStats() {
        try {
            const response = await this.api.get('/api/cache/stats');
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async clearCache(symbol) {
        try {
            const url = symbol ? `/api/cache/${symbol}` : '/api/cache';
            const response = await this.api.delete(url);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    convertStrategyIndicators(strategyIndicators) {
        return strategyIndicators.map(indicator => {
            switch (indicator) {
                case 'rsi':
                    return { type: 'rsi', params: { period: 14 } };
                case 'macd':
                    return { type: 'macd', params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } };
                case 'bollinger-bands':
                    return { type: 'bollinger', params: { period: 20, multiplier: 2 } };
                case 'ema':
                    return { type: 'ema', params: { period: 12 } };
                case 'atr':
                    return { type: 'atr', params: { period: 14 } };
                case 'mfi':
                    return { type: 'mfi', params: { period: 14 } };
                case 'imi':
                    return { type: 'imi', params: { period: 14 } };
                case 'cup-handle':
                    return { type: 'cup-handle' };
                case 'head-and-shoulders':
                    return { type: 'head-shoulders' };
                default:
                    console.warn(`Unknown indicator: ${indicator}`);
                    return { type: indicator };
            }
        });
    }
}
exports.BackendService = BackendService;
//# sourceMappingURL=backendService.js.map