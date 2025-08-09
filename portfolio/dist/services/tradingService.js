"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const axios_1 = __importDefault(require("axios"));
const databasePortfolioService_1 = require("./databasePortfolioService");
class TradingService {
    constructor() {
        this.portfolioService = new databasePortfolioService_1.DatabasePortfolioService();
        this.backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    }
    async analyzeStock(symbol, strategyId) {
        console.log(`🔍 Analyzing ${symbol} for trading opportunities...`);
        try {
            let indicatorsToFetch = ['rsi', 'macd', 'bollinger-bands', 'head-and-shoulders', 'cup-handle'];
            let strategy = null;
            if (strategyId) {
                strategy = await this.portfolioService.getTradingStrategy(strategyId);
                if (strategy) {
                    indicatorsToFetch = strategy.indicators;
                    console.log(`📋 Using strategy "${strategy.name}" with indicators: ${indicatorsToFetch.join(', ')}`);
                }
            }
            const indicatorPromises = indicatorsToFetch.map(indicator => this.getIndicator(indicator, symbol).catch(error => {
                console.warn(`⚠️ Failed to fetch ${indicator} for ${symbol}:`, error.message);
                return null;
            }));
            const indicatorResults = await Promise.all(indicatorPromises);
            const indicators = {};
            indicatorsToFetch.forEach((indicator, index) => {
                indicators[this.mapIndicatorName(indicator)] = indicatorResults[index];
            });
            const analysis = strategy
                ? this.makeStrategyDecision(symbol, indicators, strategy)
                : this.makeDecision(symbol, indicators);
            console.log(`📊 Analysis complete for ${symbol}: ${analysis.recommendation} (${analysis.confidence})`);
            return analysis;
        }
        catch (error) {
            console.error(`❌ Error analyzing ${symbol}:`, error);
            return {
                symbol,
                currentPrice: 0,
                recommendation: 'HOLD',
                confidence: 'LOW',
                reasoning: ['Analysis failed due to API error'],
                indicators: {},
                recommendedQuantity: 0
            };
        }
    }
    mapIndicatorName(indicator) {
        const mapping = {
            'rsi': 'rsi',
            'macd': 'macd',
            'bollinger-bands': 'bollingerBands',
            'head-and-shoulders': 'headAndShoulders',
            'cup-handle': 'cupAndHandle',
            'ema': 'ema'
        };
        return mapping[indicator] || indicator;
    }
    async getIndicator(indicator, symbol) {
        const url = `${this.backendApiUrl}/api/${indicator}/${symbol}/quick`;
        console.log(`📡 Fetching ${indicator} for ${symbol}...`);
        const response = await axios_1.default.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'StockTrack-Portfolio-API/1.0.0'
            }
        });
        return response.data;
    }
    makeStrategyDecision(symbol, indicators, strategy) {
        const reasoning = [];
        let buySignals = 0;
        let sellSignals = 0;
        let confidence = 'LOW';
        let currentPrice = 0;
        let targetPrice;
        let stopLoss;
        let riskReward;
        reasoning.push(`🎯 Using strategy: "${strategy.name}"`);
        reasoning.push(`📊 Indicators: ${strategy.indicators.join(', ')}`);
        for (const indicatorName of strategy.indicators) {
            const mappedName = this.mapIndicatorName(indicatorName);
            const indicatorData = indicators[mappedName];
            if (!indicatorData) {
                reasoning.push(`⚠️ ${indicatorName.toUpperCase()} data unavailable`);
                continue;
            }
            currentPrice = indicatorData.price || currentPrice;
            if (indicatorName === 'rsi' && indicatorData.rsi) {
                const rsi = indicatorData.rsi;
                if (rsi < 30) {
                    buySignals++;
                    reasoning.push(`🟢 RSI oversold (${rsi.toFixed(1)}) - buy signal`);
                }
                else if (rsi > 70) {
                    sellSignals++;
                    reasoning.push(`🔴 RSI overbought (${rsi.toFixed(1)}) - sell signal`);
                }
                else {
                    reasoning.push(`⚪ RSI neutral (${rsi.toFixed(1)})`);
                }
            }
            if (indicatorName === 'macd' && indicatorData.signal) {
                if (indicatorData.signal === 'BUY') {
                    buySignals++;
                    reasoning.push(`🟢 MACD bullish signal`);
                }
                else if (indicatorData.signal === 'SELL') {
                    sellSignals++;
                    reasoning.push(`🔴 MACD bearish signal`);
                }
                else {
                    reasoning.push(`⚪ MACD neutral`);
                }
            }
            if (indicatorName === 'bollinger-bands' && indicatorData.signal) {
                if (indicatorData.signal === 'BUY') {
                    buySignals++;
                    reasoning.push(`🟢 Bollinger Bands buy signal`);
                }
                else if (indicatorData.signal === 'SELL') {
                    sellSignals++;
                    reasoning.push(`🔴 Bollinger Bands sell signal`);
                }
            }
            if (indicatorName === 'head-and-shoulders' && indicatorData.isPattern) {
                if (indicatorData.signal === 'SELL' && indicatorData.confidence === 'HIGH') {
                    sellSignals += 2;
                    reasoning.push(`🔴 Head & Shoulders pattern - strong bearish signal`);
                    targetPrice = indicatorData.targetPrice;
                    stopLoss = indicatorData.stopLoss;
                    riskReward = indicatorData.riskReward;
                }
            }
            if (indicatorName === 'cup-handle' && indicatorData.patternDetected) {
                if (indicatorData.signal === 'BUY' && indicatorData.confidence === 'HIGH') {
                    buySignals += 2;
                    reasoning.push(`🟢 Cup & Handle pattern - strong bullish signal`);
                    targetPrice = indicatorData.targetPrice;
                    stopLoss = indicatorData.stopLoss;
                }
            }
        }
        const buyConditions = strategy.buyConditions;
        const sellConditions = strategy.sellConditions;
        let recommendation = 'HOLD';
        if (buyConditions.min_buy_signals && buySignals >= buyConditions.min_buy_signals) {
            recommendation = 'BUY';
            confidence = buySignals >= 3 ? 'HIGH' : 'MEDIUM';
        }
        else if (sellConditions.min_sell_signals && sellSignals >= sellConditions.min_sell_signals) {
            recommendation = 'SELL';
            confidence = sellSignals >= 3 ? 'HIGH' : 'MEDIUM';
        }
        else if (buySignals > sellSignals && buySignals > 0) {
            recommendation = 'WATCH';
            reasoning.push(`⚪ Weak buy signals - watching for better entry`);
        }
        else if (sellSignals > buySignals && sellSignals > 0) {
            recommendation = 'WATCH';
            reasoning.push(`⚪ Weak sell signals - watching for confirmation`);
        }
        const riskMgmt = strategy.riskManagement;
        if (riskMgmt && currentPrice > 0) {
            if (!stopLoss && riskMgmt.stop_loss_percent) {
                stopLoss = recommendation === 'BUY'
                    ? currentPrice * (1 - riskMgmt.stop_loss_percent / 100)
                    : currentPrice * (1 + riskMgmt.stop_loss_percent / 100);
            }
            if (!targetPrice && riskMgmt.take_profit_percent) {
                targetPrice = recommendation === 'BUY'
                    ? currentPrice * (1 + riskMgmt.take_profit_percent / 100)
                    : currentPrice * (1 - riskMgmt.take_profit_percent / 100);
            }
        }
        const recommendedQuantity = this.calculatePositionSize(currentPrice, recommendation, confidence);
        return {
            symbol,
            currentPrice,
            recommendation,
            confidence,
            reasoning,
            indicators,
            targetPrice,
            stopLoss,
            recommendedQuantity,
            riskReward
        };
    }
    makeDecision(symbol, indicators) {
        const reasoning = [];
        let buySignals = 0;
        let sellSignals = 0;
        let confidence = 'LOW';
        let currentPrice = 0;
        let targetPrice;
        let stopLoss;
        let riskReward;
        if (indicators.rsi) {
            currentPrice = indicators.rsi.price || currentPrice;
            const rsi = indicators.rsi.rsi;
            if (rsi < 30) {
                buySignals++;
                reasoning.push(`🟢 RSI oversold (${rsi.toFixed(1)}) - potential buy opportunity`);
            }
            else if (rsi > 70) {
                sellSignals++;
                reasoning.push(`🔴 RSI overbought (${rsi.toFixed(1)}) - potential sell signal`);
            }
            else {
                reasoning.push(`⚪ RSI neutral (${rsi.toFixed(1)})`);
            }
        }
        if (indicators.macd) {
            currentPrice = indicators.macd.price || currentPrice;
            const signal = indicators.macd.signal;
            if (signal === 'BUY') {
                buySignals++;
                reasoning.push(`🟢 MACD bullish signal - momentum increasing`);
            }
            else if (signal === 'SELL') {
                sellSignals++;
                reasoning.push(`🔴 MACD bearish signal - momentum decreasing`);
            }
            else {
                reasoning.push(`⚪ MACD neutral - no clear signal`);
            }
        }
        if (indicators.bollingerBands) {
            currentPrice = indicators.bollingerBands.price || currentPrice;
            const signal = indicators.bollingerBands.signal;
            if (signal === 'BUY') {
                buySignals++;
                reasoning.push(`🟢 Bollinger Bands buy signal - price near lower band`);
            }
            else if (signal === 'SELL') {
                sellSignals++;
                reasoning.push(`🔴 Bollinger Bands sell signal - price near upper band`);
            }
        }
        if (indicators.headAndShoulders && indicators.headAndShoulders.isPattern) {
            const confidence = indicators.headAndShoulders.confidence;
            const signal = indicators.headAndShoulders.signal;
            if (signal === 'SELL' && confidence === 'HIGH') {
                sellSignals += 2;
                reasoning.push(`🔴 Head & Shoulders pattern detected (${confidence}) - strong bearish reversal`);
                targetPrice = indicators.headAndShoulders.targetPrice;
                stopLoss = indicators.headAndShoulders.stopLoss;
                riskReward = indicators.headAndShoulders.riskReward;
            }
        }
        if (indicators.cupAndHandle && indicators.cupAndHandle.patternDetected) {
            const confidence = indicators.cupAndHandle.confidence;
            const signal = indicators.cupAndHandle.signal;
            if (signal === 'BUY' && confidence === 'HIGH') {
                buySignals += 2;
                reasoning.push(`🟢 Cup & Handle pattern detected (${confidence}) - strong bullish continuation`);
                targetPrice = indicators.cupAndHandle.targetPrice;
                stopLoss = indicators.cupAndHandle.stopLoss;
            }
        }
        let recommendation = 'HOLD';
        if (buySignals >= 3) {
            recommendation = 'BUY';
            confidence = 'HIGH';
        }
        else if (buySignals >= 2) {
            recommendation = 'BUY';
            confidence = 'MEDIUM';
        }
        else if (sellSignals >= 3) {
            recommendation = 'SELL';
            confidence = 'HIGH';
        }
        else if (sellSignals >= 2) {
            recommendation = 'SELL';
            confidence = 'MEDIUM';
        }
        else if (buySignals > sellSignals) {
            recommendation = 'WATCH';
            confidence = 'LOW';
            reasoning.push(`⚪ Weak bullish signals - consider watching for better entry`);
        }
        else if (sellSignals > buySignals) {
            recommendation = 'WATCH';
            confidence = 'LOW';
            reasoning.push(`⚪ Weak bearish signals - consider watching for confirmation`);
        }
        else {
            reasoning.push(`⚪ Mixed signals - holding current position recommended`);
        }
        const recommendedQuantity = this.calculatePositionSize(currentPrice, recommendation, confidence);
        return {
            symbol,
            currentPrice,
            recommendation,
            confidence,
            reasoning,
            indicators,
            targetPrice,
            stopLoss,
            recommendedQuantity,
            riskReward
        };
    }
    calculatePositionSize(price, recommendation, confidence) {
        if (recommendation === 'HOLD' || recommendation === 'WATCH' || price <= 0) {
            return 0;
        }
        let positionPercent = 0.05;
        if (confidence === 'HIGH') {
            positionPercent = 0.10;
        }
        else if (confidence === 'MEDIUM') {
            positionPercent = 0.07;
        }
        const portfolioValue = 100000;
        const positionValue = portfolioValue * positionPercent;
        const quantity = Math.floor(positionValue / price);
        return Math.max(1, quantity);
    }
    async analyzePortfolioOpportunities(symbols) {
        console.log(`🎯 Analyzing ${symbols.length} stocks for trading opportunities...`);
        const analyses = [];
        const portfolio = await this.portfolioService.getMainPortfolio();
        if (!portfolio) {
            throw new Error('Main portfolio not found');
        }
        for (const symbol of symbols) {
            try {
                const analysis = await this.analyzeStock(symbol);
                analyses.push(analysis);
                if (analysis.recommendation !== 'HOLD') {
                    await this.portfolioService.saveTradingDecision({
                        portfolioId: portfolio.id,
                        symbol: analysis.symbol,
                        decisionType: analysis.recommendation,
                        confidenceLevel: analysis.confidence,
                        recommendedQuantity: analysis.recommendedQuantity,
                        recommendedPrice: analysis.currentPrice,
                        reasoning: analysis.reasoning.join('; '),
                        indicatorData: analysis.indicators
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`❌ Error analyzing ${symbol}:`, error);
            }
        }
        return analyses;
    }
    getPopularStocks() {
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
            'NVDA', 'META', 'NFLX', 'AMD', 'CRM',
            'UBER', 'SPOT', 'ZOOM', 'SQ', 'PYPL'
        ];
    }
}
exports.TradingService = TradingService;
//# sourceMappingURL=tradingService.js.map