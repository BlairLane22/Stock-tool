"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const axios_1 = __importDefault(require("axios"));
const databasePortfolioService_1 = require("./databasePortfolioService");
const backendService_1 = require("./backendService");
class TradingService {
    constructor() {
        this.portfolioService = new databasePortfolioService_1.DatabasePortfolioService();
        this.backendService = new backendService_1.BackendService();
        this.backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    }
    async analyzeHistoricalData(symbol, strategyId, historicalData, currentDate, lookbackDays = 50) {
        console.log(`🔍 Analyzing ${symbol} historical data for ${currentDate}...`);
        try {
            const strategy = await this.portfolioService.getTradingStrategy(strategyId);
            if (!strategy) {
                throw new Error(`Strategy ${strategyId} not found`);
            }
            console.log(`📋 Using strategy "${strategy.name}" with indicators: ${strategy.indicators.join(', ')}`);
            const sortedDates = Object.keys(historicalData).sort();
            const currentIndex = sortedDates.indexOf(currentDate);
            if (currentIndex < lookbackDays) {
                return {
                    symbol,
                    currentPrice: parseFloat(historicalData[currentDate]['4. close']),
                    recommendation: 'HOLD',
                    confidence: 'LOW',
                    reasoning: ['Insufficient historical data for analysis'],
                    indicators: {},
                    metadata: {
                        dataSource: 'Historical Data',
                        timestamp: new Date().toISOString(),
                        candleCount: 0,
                        usedMockData: false
                    }
                };
            }
            const priceData = [];
            for (let i = currentIndex - lookbackDays; i <= currentIndex; i++) {
                const date = sortedDates[i];
                const dayData = historicalData[date];
                priceData.push({
                    date,
                    open: parseFloat(dayData['1. open']),
                    high: parseFloat(dayData['2. high']),
                    low: parseFloat(dayData['3. low']),
                    close: parseFloat(dayData['4. close']),
                    volume: parseInt(dayData['5. volume'])
                });
            }
            const indicators = await this.calculateHistoricalIndicators(priceData, strategy.indicators);
            const currentPrice = parseFloat(historicalData[currentDate]['4. close']);
            const previousPrice = currentIndex > 0 ? parseFloat(historicalData[sortedDates[currentIndex - 1]]['4. close']) : currentPrice;
            const change = currentPrice - previousPrice;
            const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
            const analysis = this.makeHistoricalTradingDecision(indicators, strategy, currentPrice);
            if (currentDate === '2000-03-15' || currentDate === '2000-06-15' || currentDate === '2001-01-15') {
                console.log(`🔍 DEBUG ${currentDate}: Price=${currentPrice}, EMA=${indicators.ema?.value?.toFixed(2)}, Signal=${analysis.recommendation}, Reasoning:`, analysis.reasoning);
            }
            if (strategy.indicators.includes('macd') && strategy.indicators.includes('rsi') &&
                (currentDate === '2000-03-15' || currentDate === '2000-06-15' || currentDate === '2001-01-15')) {
                console.log(`🔍 MACD-RSI DEBUG ${currentDate}: MACD=${indicators.macd?.current?.toFixed(4)}, Signal=${indicators.macd?.signalCurrent?.toFixed(4)}, RSI=${indicators.rsi?.value?.toFixed(1)}, Decision=${analysis.recommendation}`);
            }
            return {
                symbol,
                currentPrice,
                recommendation: analysis.recommendation,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                indicators,
                metadata: {
                    dataSource: 'Historical Data',
                    timestamp: new Date().toISOString(),
                    candleCount: priceData.length,
                    usedMockData: false
                }
            };
        }
        catch (error) {
            console.error(`❌ Error analyzing historical data for ${symbol}:`, error);
            return {
                symbol,
                currentPrice: parseFloat(historicalData[currentDate]['4. close']),
                recommendation: 'HOLD',
                confidence: 'LOW',
                reasoning: [`Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                indicators: {},
                metadata: {
                    dataSource: 'Historical Data',
                    timestamp: new Date().toISOString(),
                    candleCount: 0,
                    usedMockData: false
                }
            };
        }
    }
    async analyzeStock(symbol, strategyId, useMockData = true) {
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
            console.log(`🚀 Using optimized multi-indicator analysis for ${symbol}`);
            const backendIndicators = this.backendService.convertStrategyIndicators(indicatorsToFetch);
            const multiIndicatorResult = await this.backendService.getOptimizedMultiIndicatorAnalysis(symbol, backendIndicators, useMockData);
            const indicators = {};
            if (multiIndicatorResult.indicators) {
                Object.keys(multiIndicatorResult.indicators).forEach(key => {
                    const mappedName = this.mapBackendIndicatorName(key);
                    indicators[mappedName] = multiIndicatorResult.indicators[key];
                });
            }
            if (multiIndicatorResult.errors && Object.keys(multiIndicatorResult.errors).length > 0) {
                console.warn(`⚠️ Some indicators failed for ${symbol}:`, multiIndicatorResult.errors);
            }
            const analysis = strategy
                ? this.makeStrategyDecision(symbol, indicators, strategy)
                : this.makeDecision(symbol, indicators);
            const metadata = {
                dataSource: multiIndicatorResult.dataSource || (useMockData ? 'Mock Data' : 'Live API'),
                timestamp: multiIndicatorResult.timestamp || new Date().toISOString(),
                candleCount: multiIndicatorResult.candleCount || 0,
                usedMockData: useMockData
            };
            console.log(`📊 Analysis complete for ${symbol}: ${analysis.recommendation} (${analysis.confidence})`);
            return {
                ...analysis,
                metadata
            };
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
                recommendedQuantity: 0,
                metadata: {
                    dataSource: useMockData ? 'Mock Data' : 'Live API',
                    timestamp: new Date().toISOString(),
                    candleCount: 0,
                    usedMockData: useMockData
                }
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
    mapBackendIndicatorName(backendKey) {
        const mapping = {
            'rsi': 'rsi',
            'macd': 'macd',
            'bollinger': 'bollingerBands',
            'head-shoulders': 'headAndShoulders',
            'cup-handle': 'cupAndHandle',
            'ema': 'ema',
            'atr': 'atr',
            'mfi': 'mfi',
            'imi': 'imi'
        };
        return mapping[backendKey] || backendKey;
    }
    async getIndicatorLegacy(indicator, symbol) {
        const url = `${this.backendApiUrl}/api/${indicator}/${symbol}/quick`;
        console.log(`📡 [LEGACY] Fetching ${indicator} for ${symbol}...`);
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
            if (indicatorName === 'rsi' && indicatorData) {
                const rsi = indicatorData.rsi?.current || indicatorData.rsi?.rsi?.current || indicatorData.rsi;
                if (typeof rsi === 'number') {
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
                else {
                    reasoning.push(`⚠️ RSI data format issue`);
                }
            }
            if (indicatorName === 'macd' && indicatorData) {
                const signal = indicatorData.signal || indicatorData.macd?.signal;
                if (signal) {
                    if (signal === 'BUY') {
                        buySignals++;
                        reasoning.push(`🟢 MACD bullish signal`);
                    }
                    else if (signal === 'SELL') {
                        sellSignals++;
                        reasoning.push(`🔴 MACD bearish signal`);
                    }
                    else {
                        reasoning.push(`⚪ MACD neutral`);
                    }
                }
                else {
                    reasoning.push(`⚠️ MACD data format issue`);
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
            if (indicatorName === 'ema' && indicatorData) {
                const signal = indicatorData.signal;
                const trend = indicatorData.trend;
                const pricePosition = indicatorData.pricePosition;
                const emaValue = indicatorData.ema?.current;
                const strength = indicatorData.strength;
                if (signal && trend) {
                    if (signal === 'BUY' && trend === 'BULLISH') {
                        buySignals++;
                        reasoning.push(`🟢 EMA bullish signal - price above 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
                    }
                    else if (signal === 'SELL' && trend === 'BEARISH') {
                        sellSignals++;
                        reasoning.push(`🔴 EMA bearish signal - price below 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
                    }
                    else {
                        reasoning.push(`⚪ EMA neutral - trend: ${trend}, position: ${pricePosition}`);
                    }
                }
                else {
                    reasoning.push(`⚠️ EMA data incomplete - signal: ${signal}, trend: ${trend}`);
                }
            }
        }
        const buyConditions = strategy.buyConditions;
        const sellConditions = strategy.sellConditions;
        let recommendation = 'HOLD';
        console.log('🔍 DEBUG: Checking individual indicator strategy:', {
            strategyName: strategy.name,
            indicators: strategy.indicators,
            indicatorsType: typeof strategy.indicators,
            isIndividual: this.isIndividualIndicatorStrategy(strategy)
        });
        if (this.isIndividualIndicatorStrategy(strategy)) {
            console.log('🎯 DEBUG: Using individual indicator strategy logic');
            recommendation = this.evaluateIndividualIndicatorStrategy(strategy, indicators, reasoning);
        }
        else if (buyConditions.min_buy_signals && buySignals >= buyConditions.min_buy_signals) {
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
            const rsi = indicators.rsi.rsi?.current || indicators.rsi.rsi;
            if (typeof rsi === 'number') {
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
            else {
                reasoning.push(`⚠️ RSI data format issue`);
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
        if (indicators.ema) {
            currentPrice = indicators.ema.price || currentPrice;
            const signal = indicators.ema.signal;
            const trend = indicators.ema.trend;
            const pricePosition = indicators.ema.pricePosition;
            const emaValue = indicators.ema.ema?.current;
            const strength = indicators.ema.strength;
            if (signal && trend) {
                if (signal === 'BUY' && trend === 'BULLISH') {
                    buySignals++;
                    reasoning.push(`🟢 EMA bullish trend - price above 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
                }
                else if (signal === 'SELL' && trend === 'BEARISH') {
                    sellSignals++;
                    reasoning.push(`🔴 EMA bearish trend - price below 50-day EMA ($${emaValue?.toFixed(2)}) - ${strength} signal`);
                }
                else {
                    reasoning.push(`⚪ EMA neutral - trend: ${trend}, position: ${pricePosition}`);
                }
            }
            else {
                reasoning.push(`⚠️ EMA analysis incomplete - signal: ${signal}, trend: ${trend}`);
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
    isIndividualIndicatorStrategy(strategy) {
        let indicators = strategy.indicators;
        if (typeof indicators === 'string') {
            try {
                indicators = JSON.parse(indicators);
            }
            catch (e) {
                console.warn('Failed to parse strategy indicators:', indicators);
                return false;
            }
        }
        return Array.isArray(indicators) && indicators.length === 1;
    }
    evaluateIndividualIndicatorStrategy(strategy, indicators, reasoning) {
        let parsedIndicators = strategy.indicators;
        if (typeof parsedIndicators === 'string') {
            try {
                parsedIndicators = JSON.parse(parsedIndicators);
            }
            catch (e) {
                console.warn('Failed to parse strategy indicators:', parsedIndicators);
                return 'HOLD';
            }
        }
        const indicatorType = parsedIndicators[0];
        const buyConditions = strategy.buyConditions;
        const sellConditions = strategy.sellConditions;
        switch (indicatorType) {
            case 'bollinger-bands':
                return this.evaluateBollingerStrategy(indicators.bollingerBands, buyConditions, sellConditions, reasoning);
            case 'mfi':
                return this.evaluateMFIStrategy(indicators.mfi, buyConditions, sellConditions, reasoning);
            case 'rsi':
                return this.evaluateRSIStrategy(indicators.rsi, buyConditions, sellConditions, reasoning);
            case 'macd':
                return this.evaluateMACDStrategy(indicators.macd, buyConditions, sellConditions, reasoning);
            case 'ema':
                return this.evaluateEMAStrategy(indicators.ema, buyConditions, sellConditions, reasoning);
            case 'three-tier-trend':
                return this.evaluateThreeTierTrendStrategy(indicators, buyConditions, sellConditions, reasoning);
            case 'donchian':
                return this.evaluateDonchianBreakoutStrategy(indicators.donchian, buyConditions, sellConditions, reasoning);
            default:
                reasoning.push(`⚠️ Unknown individual indicator strategy: ${indicatorType}`);
                return 'HOLD';
        }
    }
    evaluateBollingerStrategy(bollingerData, buyConditions, sellConditions, reasoning) {
        console.log('🔍 DEBUG evaluateBollingerStrategy: bollingerData structure:', JSON.stringify(bollingerData, null, 2));
        const currentPrice = bollingerData.price || bollingerData.currentPrice;
        if (!bollingerData || !bollingerData.upper || !bollingerData.middle || !bollingerData.lower || !currentPrice) {
            reasoning.push(`⚠️ Bollinger Bands data incomplete - missing: ${!bollingerData.upper ? 'upper ' : ''}${!bollingerData.middle ? 'middle ' : ''}${!bollingerData.lower ? 'lower ' : ''}${!currentPrice ? 'price' : ''}`);
            return 'HOLD';
        }
        const { upper, middle, lower } = bollingerData;
        const upperDistance = (currentPrice - upper) / upper * 100;
        const lowerDistance = (lower - currentPrice) / lower * 100;
        if (currentPrice <= lower * 1.005) {
            reasoning.push(`🟢 BUY: Price ${currentPrice.toFixed(2)} at/below lower band ${lower.toFixed(2)} - OVERSOLD condition`);
            return 'BUY';
        }
        if (currentPrice <= lower * 1.02 && currentPrice > lower) {
            reasoning.push(`🟢 BUY: Price ${currentPrice.toFixed(2)} bouncing off lower band ${lower.toFixed(2)} - Mean reversion opportunity`);
            return 'BUY';
        }
        if (currentPrice >= upper * 0.995) {
            reasoning.push(`🔴 SELL: Price ${currentPrice.toFixed(2)} at/above upper band ${upper.toFixed(2)} - OVERBOUGHT condition`);
            return 'SELL';
        }
        if (currentPrice >= upper * 0.98 && currentPrice < upper) {
            reasoning.push(`🔴 SELL: Price ${currentPrice.toFixed(2)} near upper band ${upper.toFixed(2)} - Potential reversal`);
            return 'SELL';
        }
        if (currentPrice <= lower * 1.05 && currentPrice > lower * 1.02) {
            reasoning.push(`👀 WATCH: Price ${currentPrice.toFixed(2)} approaching lower band ${lower.toFixed(2)} - Monitor for buy opportunity`);
            return 'WATCH';
        }
        if (currentPrice >= upper * 0.95 && currentPrice < upper * 0.98) {
            reasoning.push(`👀 WATCH: Price ${currentPrice.toFixed(2)} approaching upper band ${upper.toFixed(2)} - Monitor for sell opportunity`);
            return 'WATCH';
        }
        reasoning.push(`⚪ HOLD: Price ${currentPrice.toFixed(2)} in middle range [L:${lower.toFixed(2)} M:${middle.toFixed(2)} U:${upper.toFixed(2)}]`);
        return 'HOLD';
    }
    evaluateMFIStrategy(mfiData, buyConditions, sellConditions, reasoning) {
        if (!mfiData || typeof mfiData.mfi !== 'number') {
            reasoning.push(`⚠️ MFI data not available`);
            return 'HOLD';
        }
        const mfiValue = mfiData.mfi;
        if (buyConditions.mfi_below && mfiValue < buyConditions.mfi_below) {
            reasoning.push(`🟢 MFI BUY signal - MFI ${mfiValue.toFixed(1)} below ${buyConditions.mfi_below} (oversold)`);
            return 'BUY';
        }
        if (sellConditions.mfi_above && mfiValue > sellConditions.mfi_above) {
            reasoning.push(`🔴 MFI SELL signal - MFI ${mfiValue.toFixed(1)} above ${sellConditions.mfi_above} (overbought)`);
            return 'SELL';
        }
        reasoning.push(`⚪ MFI HOLD - value: ${mfiValue.toFixed(1)}`);
        return 'HOLD';
    }
    evaluateRSIStrategy(rsiData, buyConditions, sellConditions, reasoning) {
        if (!rsiData || typeof rsiData.rsi !== 'number') {
            reasoning.push(`⚠️ RSI data not available`);
            return 'HOLD';
        }
        const rsiValue = rsiData.rsi;
        if (buyConditions.rsi_below && rsiValue < buyConditions.rsi_below) {
            reasoning.push(`🟢 RSI BUY signal - RSI ${rsiValue.toFixed(1)} below ${buyConditions.rsi_below} (oversold)`);
            return 'BUY';
        }
        if (sellConditions.rsi_above && rsiValue > sellConditions.rsi_above) {
            reasoning.push(`🔴 RSI SELL signal - RSI ${rsiValue.toFixed(1)} above ${sellConditions.rsi_above} (overbought)`);
            return 'SELL';
        }
        reasoning.push(`⚪ RSI HOLD - value: ${rsiValue.toFixed(1)}`);
        return 'HOLD';
    }
    evaluateMACDStrategy(macdData, buyConditions, sellConditions, reasoning) {
        if (!macdData) {
            reasoning.push(`⚠️ MACD data not available`);
            return 'HOLD';
        }
        const signal = macdData.signal || 'HOLD';
        const crossover = macdData.crossover;
        if (buyConditions.macd_signal === 'BUY' && signal === 'BUY') {
            reasoning.push(`🟢 MACD BUY signal - bullish crossover`);
            return 'BUY';
        }
        if (buyConditions.crossover === 'BULLISH_CROSSOVER' && crossover === 'BULLISH_CROSSOVER') {
            reasoning.push(`🟢 MACD BUY signal - bullish crossover detected`);
            return 'BUY';
        }
        if (sellConditions.macd_signal === 'SELL' && signal === 'SELL') {
            reasoning.push(`🔴 MACD SELL signal - bearish crossover`);
            return 'SELL';
        }
        if (sellConditions.crossover === 'BEARISH_CROSSOVER' && crossover === 'BEARISH_CROSSOVER') {
            reasoning.push(`🔴 MACD SELL signal - bearish crossover detected`);
            return 'SELL';
        }
        reasoning.push(`⚪ MACD HOLD - signal: ${signal}, crossover: ${crossover}`);
        return 'HOLD';
    }
    evaluateEMAStrategy(emaData, buyConditions, sellConditions, reasoning) {
        if (!emaData) {
            reasoning.push(`⚠️ EMA data not available`);
            return 'HOLD';
        }
        const emaValue = emaData.value || emaData.ema || emaData.current;
        const currentPrice = emaData.price || emaData.currentPrice;
        const signal = emaData.signal;
        if (!emaValue || !currentPrice) {
            reasoning.push(`⚠️ EMA data incomplete - missing: ${!emaValue ? 'emaValue' : ''} ${!currentPrice ? 'currentPrice' : ''}`);
            return 'HOLD';
        }
        const priceAboveEMA = currentPrice > emaValue;
        const priceBelowEMA = currentPrice < emaValue;
        if (priceAboveEMA && signal === 'BUY') {
            reasoning.push(`🟢 EMA BUY: Price $${currentPrice.toFixed(2)} above 50-day EMA $${emaValue.toFixed(2)} (crossover signal)`);
            return 'BUY';
        }
        if (priceBelowEMA && signal === 'SELL') {
            reasoning.push(`🔴 EMA SELL: Price $${currentPrice.toFixed(2)} below 50-day EMA $${emaValue.toFixed(2)} (crossover signal)`);
            return 'SELL';
        }
        if (priceAboveEMA) {
            reasoning.push(`⚪ EMA HOLD: Price above EMA but no buy signal (signal: ${signal})`);
        }
        else {
            reasoning.push(`⚪ EMA HOLD: Price below EMA but no sell signal (signal: ${signal})`);
        }
        return 'HOLD';
    }
    evaluateDonchianBreakoutStrategy(donchianData, buyConditions, sellConditions, reasoning) {
        if (!donchianData) {
            reasoning.push(`⚠️ Donchian Channels data not available`);
            return 'HOLD';
        }
        const currentPrice = donchianData.price || donchianData.currentPrice || donchianData.current_price || 0;
        const upperChannel = donchianData.upperChannel || donchianData.upper_channel || donchianData.upper || 0;
        const lowerChannel = donchianData.lowerChannel || donchianData.lower_channel || donchianData.lower || 0;
        const middleChannel = donchianData.middleChannel || donchianData.middle_channel || donchianData.middle || 0;
        const position = donchianData.position || 'MIDDLE';
        const signal = donchianData.signal || 'HOLD';
        if (!currentPrice || !upperChannel || !lowerChannel) {
            reasoning.push(`❌ Missing Donchian Channels data: price=${currentPrice}, upper=${upperChannel}, lower=${lowerChannel}`);
            return 'HOLD';
        }
        reasoning.push(`📊 Donchian Analysis: Price=$${currentPrice.toFixed(2)}, Upper=$${upperChannel.toFixed(2)}, Lower=$${lowerChannel.toFixed(2)}, Middle=$${middleChannel.toFixed(2)}`);
        if (position === 'UPPER_BREAKOUT' || (currentPrice >= upperChannel && signal === 'BUY')) {
            reasoning.push(`🚀 DONCHIAN BUY: Price broke above upper channel ($${currentPrice.toFixed(2)} >= $${upperChannel.toFixed(2)}) - Classic breakout signal`);
            return 'BUY';
        }
        if (position === 'LOWER_BREAKOUT' || (currentPrice <= lowerChannel && signal === 'SELL')) {
            reasoning.push(`📉 DONCHIAN SELL: Price broke below lower channel ($${currentPrice.toFixed(2)} <= $${lowerChannel.toFixed(2)}) - Classic breakdown signal`);
            return 'SELL';
        }
        if (position === 'UPPER_HALF' || (currentPrice > middleChannel && currentPrice < upperChannel)) {
            const distanceToBreakout = ((upperChannel - currentPrice) / currentPrice * 100);
            reasoning.push(`📈 DONCHIAN WATCH: Price in upper half of channel, ${distanceToBreakout.toFixed(1)}% from breakout. Bullish bias but waiting for confirmation.`);
            return 'WATCH';
        }
        if (position === 'LOWER_HALF' || (currentPrice < middleChannel && currentPrice > lowerChannel)) {
            const distanceToBreakdown = ((currentPrice - lowerChannel) / currentPrice * 100);
            reasoning.push(`📉 DONCHIAN WATCH: Price in lower half of channel, ${distanceToBreakdown.toFixed(1)}% from breakdown. Bearish bias but waiting for confirmation.`);
            return 'WATCH';
        }
        reasoning.push(`⚪ DONCHIAN HOLD: Price near middle channel ($${middleChannel.toFixed(2)}). Waiting for directional breakout.`);
        return 'HOLD';
    }
    evaluateThreeTierTrendStrategy(indicators, buyConditions, sellConditions, reasoning) {
        try {
            const emaData = indicators.ema;
            const macdData = indicators.macd;
            const rsiData = indicators.rsi;
            if (!emaData || !macdData || !rsiData) {
                reasoning.push('❌ Three-Tier strategy requires EMA, MACD, and RSI indicators');
                return 'HOLD';
            }
            const currentPrice = emaData.price || emaData.currentPrice || 0;
            const emaValue = emaData.value || emaData.ema || emaData.current || 0;
            const macdValue = macdData.macd || macdData.value || 0;
            const macdSignal = macdData.signal || macdData.signalLine || 0;
            const macdHistogram = macdData.histogram || macdData.hist || (macdValue - macdSignal);
            const rsiValue = rsiData.value || rsiData.rsi || rsiData.current || 0;
            if (!currentPrice || !emaValue || rsiValue === 0) {
                reasoning.push('❌ Missing required price, EMA, or RSI data for Three-Tier strategy');
                return 'HOLD';
            }
            const isPrimaryBullish = currentPrice > emaValue;
            const isPrimaryBearish = currentPrice < emaValue;
            const isIntermediateBullish = macdHistogram > 0 && macdValue > macdSignal;
            const isIntermediateBearish = macdHistogram < 0 && macdValue < macdSignal;
            const isBullishRSI = rsiValue >= 40 && rsiValue <= 55;
            const isBearishRSI = rsiValue >= 45 && rsiValue <= 60;
            const hasVolumeConfirmation = Math.abs(macdHistogram) > 0.1;
            reasoning.push(`📊 Three-Tier Analysis: Price=$${currentPrice.toFixed(2)}, EMA=$${emaValue.toFixed(2)}, RSI=${rsiValue.toFixed(1)}, MACD=${macdValue.toFixed(3)}, Hist=${macdHistogram.toFixed(3)}`);
            if (isPrimaryBullish && isIntermediateBullish && isBullishRSI && hasVolumeConfirmation) {
                reasoning.push(`🟢 THREE-TIER BUY: All conditions met - Price above EMA (${currentPrice.toFixed(2)} > ${emaValue.toFixed(2)}), MACD bullish, RSI pullback (${rsiValue.toFixed(1)})`);
                return 'BUY';
            }
            if (isPrimaryBearish && isIntermediateBearish && isBearishRSI && hasVolumeConfirmation) {
                reasoning.push(`🔴 THREE-TIER SELL: All conditions met - Price below EMA (${currentPrice.toFixed(2)} < ${emaValue.toFixed(2)}), MACD bearish, RSI bounce (${rsiValue.toFixed(1)})`);
                return 'SELL';
            }
            if (rsiValue > 75) {
                reasoning.push(`🔴 THREE-TIER SELL: Momentum exit - RSI overbought (${rsiValue.toFixed(1)})`);
                return 'SELL';
            }
            if (rsiValue < 25) {
                reasoning.push(`🟢 THREE-TIER BUY: Momentum exit - RSI oversold (${rsiValue.toFixed(1)})`);
                return 'BUY';
            }
            if (isPrimaryBullish && !isIntermediateBullish) {
                reasoning.push(`🔴 THREE-TIER SELL: Trend exit - MACD turned bearish in uptrend`);
                return 'SELL';
            }
            if (isPrimaryBearish && !isIntermediateBearish) {
                reasoning.push(`🟢 THREE-TIER BUY: Trend exit - MACD turned bullish in downtrend`);
                return 'BUY';
            }
            let holdReason = '⚪ THREE-TIER HOLD: ';
            const conditions = [];
            if (!isPrimaryBullish && !isPrimaryBearish)
                conditions.push('Price near EMA');
            if (!isIntermediateBullish && !isIntermediateBearish)
                conditions.push('MACD neutral');
            if (!isBullishRSI && !isBearishRSI)
                conditions.push(`RSI not in entry zone (${rsiValue.toFixed(1)})`);
            if (!hasVolumeConfirmation)
                conditions.push('Weak momentum');
            reasoning.push(holdReason + (conditions.length > 0 ? conditions.join(', ') : 'Waiting for alignment'));
            return 'HOLD';
        }
        catch (error) {
            reasoning.push(`❌ Three-Tier Trend strategy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return 'HOLD';
        }
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
    async calculateHistoricalIndicators(priceData, indicators) {
        const result = {};
        for (const indicator of indicators) {
            try {
                switch (indicator) {
                    case 'ema':
                        result.ema = this.calculateEMA(priceData, 50);
                        break;
                    case 'rsi':
                        result.rsi = this.calculateRSI(priceData, 14);
                        break;
                    case 'macd':
                        result.macd = this.calculateMACD(priceData);
                        break;
                    case 'bollinger-bands':
                        result.bollingerBands = this.calculateBollingerBands(priceData, 20, 2);
                        break;
                    case 'mfi':
                        result.mfi = this.calculateMFI(priceData, 14);
                        break;
                    case 'donchian':
                        result.donchian = this.calculateDonchianChannels(priceData, 20);
                        break;
                    default:
                        console.warn(`Historical calculation not implemented for ${indicator}`);
                        result[indicator] = { signal: 'HOLD', value: 0 };
                }
            }
            catch (error) {
                console.error(`Error calculating ${indicator}:`, error);
                result[indicator] = { signal: 'HOLD', value: 0 };
            }
        }
        return result;
    }
    makeHistoricalTradingDecision(indicators, strategy, currentPrice) {
        const reasoning = [];
        console.log('🔍 DEBUG makeHistoricalTradingDecision: Checking individual indicator strategy:', {
            strategyName: strategy.name,
            indicators: strategy.indicators,
            indicatorsType: typeof strategy.indicators,
            isIndividual: this.isIndividualIndicatorStrategy(strategy)
        });
        if (this.isIndividualIndicatorStrategy(strategy)) {
            console.log('🎯 DEBUG makeHistoricalTradingDecision: Using individual indicator strategy logic');
            const recommendation = this.evaluateIndividualIndicatorStrategy(strategy, indicators, reasoning);
            return {
                recommendation,
                confidence: 'MEDIUM',
                reasoning
            };
        }
        console.log('🔄 DEBUG makeHistoricalTradingDecision: Using multi-indicator strategy logic');
        let buySignals = 0;
        let sellSignals = 0;
        if (indicators.ema) {
            const ema = indicators.ema;
            if (currentPrice > ema.value) {
                buySignals++;
                reasoning.push(`🟢 Price above 50-day EMA ($${currentPrice.toFixed(2)} > $${ema.value.toFixed(2)})`);
            }
            else if (currentPrice < ema.value) {
                sellSignals++;
                reasoning.push(`🔴 Price below 50-day EMA ($${currentPrice.toFixed(2)} < $${ema.value.toFixed(2)})`);
            }
        }
        if (indicators.rsi) {
            const rsi = indicators.rsi;
            if (rsi.value < 30) {
                buySignals++;
                reasoning.push(`🟢 RSI oversold (${rsi.value.toFixed(1)})`);
            }
            else if (rsi.value > 70) {
                sellSignals++;
                reasoning.push(`🔴 RSI overbought (${rsi.value.toFixed(1)})`);
            }
            else if (rsi.value < 50 && strategy.indicators.includes('macd')) {
                buySignals += 0.5;
                reasoning.push(`🟡 RSI below midline (${rsi.value.toFixed(1)}) - bullish bias`);
            }
            else if (rsi.value > 50 && strategy.indicators.includes('macd')) {
                sellSignals += 0.5;
                reasoning.push(`🟡 RSI above midline (${rsi.value.toFixed(1)}) - bearish bias`);
            }
        }
        if (indicators.macd) {
            const macd = indicators.macd;
            if (macd.signal === 'BUY') {
                buySignals++;
                reasoning.push(`🟢 MACD bullish crossover`);
            }
            else if (macd.signal === 'SELL') {
                sellSignals++;
                reasoning.push(`🔴 MACD bearish crossover`);
            }
            else if (macd.current > macd.signalCurrent) {
                buySignals += 0.5;
                reasoning.push(`🟡 MACD above signal line - bullish momentum`);
            }
            else if (macd.current < macd.signalCurrent) {
                sellSignals += 0.5;
                reasoning.push(`🟡 MACD below signal line - bearish momentum`);
            }
        }
        let recommendation = 'HOLD';
        let confidence = 'LOW';
        const isSingleIndicatorStrategy = strategy.indicators.length === 1;
        const isDoubleIndicatorStrategy = strategy.indicators.length === 2;
        if (buySignals >= 2) {
            recommendation = 'BUY';
            confidence = buySignals >= 3 ? 'HIGH' : 'MEDIUM';
        }
        else if (sellSignals >= 2) {
            recommendation = 'SELL';
            confidence = sellSignals >= 3 ? 'HIGH' : 'MEDIUM';
        }
        else if (buySignals >= 1.5 && isDoubleIndicatorStrategy) {
            recommendation = 'BUY';
            confidence = 'MEDIUM';
        }
        else if (sellSignals >= 1.5 && isDoubleIndicatorStrategy) {
            recommendation = 'SELL';
            confidence = 'MEDIUM';
        }
        else if (buySignals > sellSignals && buySignals > 0) {
            if (isSingleIndicatorStrategy) {
                recommendation = 'BUY';
                confidence = 'MEDIUM';
            }
            else {
                recommendation = 'WATCH';
                reasoning.push(`⚪ Weak bullish signals`);
            }
        }
        else if (sellSignals > buySignals && sellSignals > 0) {
            if (isSingleIndicatorStrategy) {
                recommendation = 'SELL';
                confidence = 'MEDIUM';
            }
            else {
                recommendation = 'WATCH';
                reasoning.push(`⚪ Weak bearish signals`);
            }
        }
        if (reasoning.length === 0) {
            reasoning.push(`⚪ No clear signals - holding position`);
        }
        return { recommendation, confidence, reasoning };
    }
    calculateEMA(priceData, period) {
        if (priceData.length < period) {
            return { value: 0, trend: 'NEUTRAL', signal: 'HOLD' };
        }
        const prices = priceData.map(d => d.close);
        const multiplier = 2 / (period + 1);
        let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        const currentPrice = prices[prices.length - 1];
        const previousEma = prices.length > period + 1 ?
            (prices[prices.length - 2] * multiplier) + (ema * (1 - multiplier)) : ema;
        const trend = ema > previousEma ? 'BULLISH' : ema < previousEma ? 'BEARISH' : 'NEUTRAL';
        const signal = currentPrice > ema ? 'BUY' : currentPrice < ema ? 'SELL' : 'HOLD';
        return { value: ema, trend, signal, price: currentPrice };
    }
    calculateRSI(priceData, period = 14) {
        if (priceData.length < period + 1) {
            return { value: 50, signal: 'HOLD' };
        }
        const prices = priceData.map(d => d.close);
        const gains = [];
        const losses = [];
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
        const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        let signal = 'HOLD';
        if (rsi < 30)
            signal = 'BUY';
        else if (rsi > 70)
            signal = 'SELL';
        return { value: rsi, signal };
    }
    calculateMACD(priceData) {
        if (priceData.length < 35) {
            return {
                signal: 'HOLD',
                current: 0,
                signalCurrent: 0,
                histogram: 0,
                macd: 0,
                signalLine: 0
            };
        }
        const prices = priceData.map(d => d.close);
        const macdValues = [];
        const startIndex = Math.max(0, prices.length - 20);
        for (let i = startIndex; i < prices.length; i++) {
            const periodPrices = prices.slice(0, i + 1);
            if (periodPrices.length >= 26) {
                const ema12 = this.calculateSimpleEMA(periodPrices, 12);
                const ema26 = this.calculateSimpleEMA(periodPrices, 26);
                macdValues.push(ema12 - ema26);
            }
        }
        if (macdValues.length < 9) {
            return {
                signal: 'HOLD',
                current: 0,
                signalCurrent: 0,
                histogram: 0,
                macd: 0,
                signalLine: 0
            };
        }
        const currentMACD = macdValues[macdValues.length - 1];
        const signalLine = this.calculateSimpleEMA(macdValues, 9);
        const histogram = currentMACD - signalLine;
        let signal = 'HOLD';
        if (currentMACD > signalLine && histogram > 0)
            signal = 'BUY';
        else if (currentMACD < signalLine && histogram < 0)
            signal = 'SELL';
        return {
            signal,
            current: currentMACD,
            signalCurrent: signalLine,
            histogram,
            macd: currentMACD,
            signalLine
        };
    }
    calculateBollingerBands(priceData, period, multiplier) {
        if (priceData.length < period) {
            return { signal: 'HOLD', upper: 0, middle: 0, lower: 0 };
        }
        const prices = priceData.map(d => d.close);
        const recentPrices = prices.slice(-period);
        const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        const upper = middle + (stdDev * multiplier);
        const lower = middle - (stdDev * multiplier);
        const currentPrice = prices[prices.length - 1];
        let signal = 'HOLD';
        if (currentPrice <= lower)
            signal = 'BUY';
        else if (currentPrice >= upper)
            signal = 'SELL';
        return { signal, upper, middle, lower, price: currentPrice };
    }
    calculateMFI(priceData, period) {
        if (priceData.length < period + 1) {
            return { mfi: 50, signal: 'HOLD' };
        }
        const recentData = priceData.slice(-period - 1);
        let positiveFlow = 0;
        let negativeFlow = 0;
        for (let i = 1; i < recentData.length; i++) {
            const current = recentData[i];
            const previous = recentData[i - 1];
            const typicalPrice = (current.high + current.low + current.close) / 3;
            const previousTypicalPrice = (previous.high + previous.low + previous.close) / 3;
            const rawMoneyFlow = typicalPrice * current.volume;
            if (typicalPrice > previousTypicalPrice) {
                positiveFlow += rawMoneyFlow;
            }
            else if (typicalPrice < previousTypicalPrice) {
                negativeFlow += rawMoneyFlow;
            }
        }
        const moneyFlowRatio = positiveFlow / (negativeFlow || 1);
        const mfi = 100 - (100 / (1 + moneyFlowRatio));
        let signal = 'HOLD';
        if (mfi < 20)
            signal = 'BUY';
        else if (mfi > 80)
            signal = 'SELL';
        return { mfi, signal };
    }
    calculateSimpleEMA(values, period) {
        if (values.length === 0)
            return 0;
        if (values.length === 1)
            return values[0];
        const multiplier = 2 / (period + 1);
        let ema = values[0];
        for (let i = 1; i < values.length; i++) {
            ema = (values[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
    }
    calculateDonchianChannels(priceData, period = 20) {
        if (priceData.length < period) {
            return {
                upper: 0,
                lower: 0,
                middle: 0,
                current_price: 0,
                position: 'MIDDLE',
                signal: 'HOLD'
            };
        }
        const recentData = priceData.slice(-period);
        const highs = recentData.map(d => d.high);
        const lows = recentData.map(d => d.low);
        const upperChannel = Math.max(...highs);
        const lowerChannel = Math.min(...lows);
        const middleChannel = (upperChannel + lowerChannel) / 2;
        const currentPrice = priceData[priceData.length - 1].close;
        let position = 'MIDDLE';
        let signal = 'HOLD';
        if (currentPrice >= upperChannel) {
            position = 'UPPER_BREAKOUT';
            signal = 'BUY';
        }
        else if (currentPrice <= lowerChannel) {
            position = 'LOWER_BREAKOUT';
            signal = 'SELL';
        }
        else if (currentPrice > middleChannel) {
            position = 'UPPER_HALF';
            signal = 'BULLISH';
        }
        else if (currentPrice < middleChannel) {
            position = 'LOWER_HALF';
            signal = 'BEARISH';
        }
        return {
            upper: upperChannel,
            lower: lowerChannel,
            middle: middleChannel,
            current_price: currentPrice,
            position: position,
            signal: signal,
            period: period
        };
    }
}
exports.TradingService = TradingService;
//# sourceMappingURL=tradingService.js.map