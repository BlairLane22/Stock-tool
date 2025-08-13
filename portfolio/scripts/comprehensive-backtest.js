#!/usr/bin/env node

/**
 * Comprehensive Backtesting Script
 * 
 * This script runs all available trading strategies against all available symbols
 * and exports the results to an Excel file for analysis.
 * 
 * Usage: node scripts/comprehensive-backtest.js
 */

const axios = require('axios');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Configuration
const PORTFOLIO_API_URL = 'http://localhost:3001';
const BACKEND_API_URL = 'http://localhost:3000';
const STARTING_CAPITAL = 10000;
const OUTPUT_DIR = path.join(__dirname, '..', 'reports');
const EXCEL_FILE = path.join(OUTPUT_DIR, `backtest-results-${new Date().toISOString().split('T')[0]}.xlsx`);

// Available symbols (from your backend datasets) - Testing with smaller subset first
const SYMBOLS = ['AMD', 'NVDA', 'GOOGL', 'UBER', 'GPRO', 'PYPL']; // Reduced for testing rate limiting
// const SYMBOLS = ['SPOT', 'AMD', 'NVDA', 'IBM', 'GOOGL', 'CRM', 'TSLA', 'UBER', 'GPRO', 'BB', 'PYPL'];

// Available strategies will be fetched dynamically from database
let STRATEGIES = [];

// Rate limiting configuration
const REQUEST_DELAY = 1000; // 1 second between requests
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

class ComprehensiveBacktester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.startTime = new Date();
  }

  /**
   * Sleep function for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Starting Comprehensive Backtesting Suite');
    console.log(`📊 Testing ${STRATEGIES.length} strategies on ${SYMBOLS.length} symbols`);
    console.log(`💰 Starting capital: $${STARTING_CAPITAL.toLocaleString()}`);
    console.log('=' * 60);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Check if services are running
    await this.checkServices();

    // Fetch available strategies
    await this.fetchAvailableStrategies();

    // Run all backtests
    await this.runAllBacktests();

    // Generate Excel report
    await this.generateExcelReport();

    // Print summary
    this.printSummary();

    console.log('✅ Comprehensive backtesting complete!');
  }

  /**
   * Fetch available strategies from the database
   */
  async fetchAvailableStrategies() {
    console.log('🔍 Fetching available strategies...');

    try {
      const response = await axios.get(`${PORTFOLIO_API_URL}/api/portfolio/strategies/all`);

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Filter out strategies that don't generate trading signals or are duplicates
        const excludedStrategies = [
          'strategy-atr-only',        // ATR only measures volatility, no buy/sell signals
          'strategy-mfi-only',        // MFI alone doesn't generate clear signals
          'strategy-pattern-focus',   // Pattern recognition often returns 0% (no patterns detected)
          '1a3b2ada-a117-4b91-874c-37168ef6298c'  // Duplicate RSI strategy with UUID instead of proper ID
        ];

        STRATEGIES = response.data.data
          .map(strategy => strategy.id)
          .filter(strategyId => !excludedStrategies.includes(strategyId));

        console.log(`✅ Found ${STRATEGIES.length} trading strategies (excluded ${excludedStrategies.length} non-trading indicators)`);
        console.log(`📊 Active strategies: ${STRATEGIES.join(', ')}`);

        if (excludedStrategies.length > 0) {
          console.log(`⚠️  Excluded strategies: ${excludedStrategies.join(', ')}`);
        }
      } else {
        // Fallback to hardcoded trading strategies (excluding non-trading indicators)
        STRATEGIES = [
          'strategy-ema-50-crossover',
          'strategy-bollinger-only',
          'strategy-rsi-only',
          'strategy-macd-only',
          'strategy-rsi-ema',
          'strategy-macd-rsi',
          'strategy-three-tier-trend',
          'strategy-donchian-breakout',
          'strategy-turtle-donchian-atr',
          'strategy-all-indicators'
        ];
        console.log(`⚠️  Using fallback trading strategies: ${STRATEGIES.length} strategies`);
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch strategies from API, using fallback trading strategies`);
      STRATEGIES = [
        'strategy-ema-50-crossover',
        'strategy-bollinger-only',
        'strategy-rsi-only',
        'strategy-macd-only',
        'strategy-rsi-ema',
        'strategy-macd-rsi',
        'strategy-three-tier-trend',
        'strategy-donchian-breakout',
        'strategy-turtle-donchian-atr',
        'strategy-all-indicators'
      ];
    }
  }

  /**
   * Check if required services are running
   */
  async checkServices() {
    console.log('🔍 Checking services...');
    
    try {
      await axios.get(`${PORTFOLIO_API_URL}/health`);
      console.log('✅ Portfolio API is running');
    } catch (error) {
      console.error('❌ Portfolio API is not running. Please start it with: npm start');
      process.exit(1);
    }

    try {
      await axios.get(`${BACKEND_API_URL}/health`);
      console.log('✅ Backend API is running');
    } catch (error) {
      console.error('❌ Backend API is not running. Please start it first.');
      process.exit(1);
    }
  }

  /**
   * Run backtests for all strategy-symbol combinations
   */
  async runAllBacktests() {
    console.log('\n📈 Running backtests...');
    
    let completed = 0;
    const total = STRATEGIES.length * SYMBOLS.length;

    for (const strategy of STRATEGIES) {
      for (const symbol of SYMBOLS) {
        let success = false;
        let attempts = 0;

        while (!success && attempts < RETRY_ATTEMPTS) {
          try {
            console.log(`🔄 Testing ${strategy} on ${symbol}... (${completed + 1}/${total})`);

            const result = await this.runSingleBacktest(symbol, strategy);
            this.results.push(result);

            console.log(`✅ ${strategy} on ${symbol}: ${result.totalReturnPercent.toFixed(2)}% return`);
            success = true;

          } catch (error) {
            attempts++;
            if (error.response && error.response.status === 429) {
              console.log(`⚠️  Rate limited (${attempts}/${RETRY_ATTEMPTS}). Waiting ${RETRY_DELAY/1000}s...`);
              if (attempts < RETRY_ATTEMPTS) {
                await this.sleep(RETRY_DELAY);
              }
            } else if (attempts >= RETRY_ATTEMPTS) {
              console.error(`❌ Error testing ${strategy} on ${symbol}:`, error.message);
              this.errors.push({
                symbol,
                strategy,
                error: error.message
              });
              success = true; // Stop retrying
            } else {
              console.log(`⚠️  Error (${attempts}/${RETRY_ATTEMPTS}): ${error.message}. Retrying...`);
              await this.sleep(RETRY_DELAY);
            }
          }
        }
        
        completed++;
        
        // Delay to prevent rate limiting (increased from 100ms to 1000ms)
        if (completed < total) {
          await this.sleep(REQUEST_DELAY);
        }
      }
    }
  }

  /**
   * Run a single backtest
   */
  async runSingleBacktest(symbol, strategy) {
    const url = `${PORTFOLIO_API_URL}/api/portfolio/backtest/${symbol}/strategy/${strategy}`;
    const payload = { startingCapital: STARTING_CAPITAL };

    const response = await axios.post(url, payload, {
      timeout: 120000, // 2 minutes timeout for long backtests
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format');
    }

    const data = response.data.data;
    
    return {
      symbol,
      strategy,
      strategyName: this.getStrategyDisplayName(strategy),
      totalTrades: data.totalTrades || 0,
      winRate: (data.winRate || 0) * 100, // Convert to percentage
      totalReturnPercent: data.totalReturnPercent || 0,
      finalCapital: data.finalCapital || STARTING_CAPITAL,
      profitLoss: (data.finalCapital || STARTING_CAPITAL) - STARTING_CAPITAL,
      maxDrawdown: data.maxDrawdown || 0,
      sharpeRatio: data.sharpeRatio || 0,
      avgTradeReturn: data.summary?.avgTradeReturn || 0,
      bestTrade: data.summary?.bestTrade?.returnPercent || 0,
      worstTrade: data.summary?.worstTrade?.returnPercent || 0,
      winningTrades: data.winningTrades || 0,
      losingTrades: data.losingTrades || 0,
      avgWinningTrade: data.avgWinningTrade || 0,
      avgLosingTrade: data.avgLosingTrade || 0,
      profitFactor: data.profitFactor || 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get display name for strategy
   */
  getStrategyDisplayName(strategy) {
    const names = {
      'strategy-bollinger-bands': 'Bollinger Bands',
      'strategy-rsi-oversold': 'RSI Oversold',
      'strategy-ema-crossover': 'EMA Crossover',
      'strategy-macd-signal': 'MACD Signal',
      'strategy-three-tier-trend': 'Three-Tier Trend',
      'strategy-donchian-breakout': 'Donchian Breakout',
      'strategy-turtle-donchian-atr': 'Turtle Trading (Donchian + ATR)'
    };
    return names[strategy] || strategy;
  }

  /**
   * Generate Excel report with multiple sheets
   */
  async generateExcelReport() {
    console.log('\n📊 Generating comprehensive Excel report...');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockTrack Comprehensive Backtesting Suite';
    workbook.created = new Date();

    // 1. Executive Summary Sheet
    await this.createSummarySheet(workbook);

    // 2. Symbol-Strategy Win/Loss Matrix
    await this.createSymbolStrategyMatrix(workbook);

    // 3. Detailed Results Sheet
    await this.createDetailedSheet(workbook);

    // 4. Strategy Performance Analysis
    await this.createStrategyComparisonSheet(workbook);

    // 5. Symbol Performance Analysis
    await this.createSymbolComparisonSheet(workbook);

    // 6. Top Performers Analysis
    await this.createTopPerformersSheet(workbook);

    // 7. Risk Analysis
    await this.createRiskAnalysisSheet(workbook);

    // 8. Errors and Issues Sheet (if any)
    if (this.errors.length > 0) {
      await this.createErrorsSheet(workbook);
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save the workbook
    await workbook.xlsx.writeFile(EXCEL_FILE);
    console.log(`✅ Comprehensive Excel report saved: ${EXCEL_FILE}`);
  }

  /**
   * Create summary sheet
   */
  async createSummarySheet(workbook) {
    const worksheet = workbook.addWorksheet('Summary');
    
    // Headers
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Summary data
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.totalTrades > 0).length;
    const avgReturn = this.results.reduce((sum, r) => sum + r.totalReturnPercent, 0) / totalTests;
    const bestStrategy = this.results.reduce((best, current) => 
      current.totalReturnPercent > best.totalReturnPercent ? current : best
    );
    const worstStrategy = this.results.reduce((worst, current) => 
      current.totalReturnPercent < worst.totalReturnPercent ? current : worst
    );

    const summaryData = [
      { metric: 'Report Generated', value: new Date().toLocaleString() },
      { metric: 'Total Tests Run', value: totalTests },
      { metric: 'Successful Tests', value: successfulTests },
      { metric: 'Failed Tests', value: this.errors.length },
      { metric: 'Average Return %', value: `${avgReturn.toFixed(2)}%` },
      { metric: 'Best Performance', value: `${bestStrategy.strategyName} on ${bestStrategy.symbol}: ${bestStrategy.totalReturnPercent.toFixed(2)}%` },
      { metric: 'Worst Performance', value: `${worstStrategy.strategyName} on ${worstStrategy.symbol}: ${worstStrategy.totalReturnPercent.toFixed(2)}%` },
      { metric: 'Starting Capital', value: `$${STARTING_CAPITAL.toLocaleString()}` },
      { metric: 'Test Duration', value: `${Math.round((new Date() - this.startTime) / 1000)} seconds` }
    ];

    worksheet.addRows(summaryData);
    
    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
  }

  /**
   * Create Symbol-Strategy Win/Loss Matrix
   */
  async createSymbolStrategyMatrix(workbook) {
    const worksheet = workbook.addWorksheet('📊 Symbol-Strategy Matrix');

    // Create matrix data structure
    const matrix = {};
    const symbolStats = {};
    const strategyStats = {};

    // Initialize structures
    SYMBOLS.forEach(symbol => {
      matrix[symbol] = {};
      symbolStats[symbol] = { wins: 0, losses: 0, total: 0, totalReturn: 0 };
      STRATEGIES.forEach(strategy => {
        matrix[symbol][strategy] = { return: 0, status: 'No Data' };
      });
    });

    STRATEGIES.forEach(strategy => {
      strategyStats[strategy] = { wins: 0, losses: 0, total: 0, totalReturn: 0 };
    });

    // Populate matrix with results
    this.results.forEach(result => {
      const symbol = result.symbol;
      const strategy = result.strategyName || 'Unknown';
      const returnPct = result.totalReturnPercent || 0;

      if (matrix[symbol] && matrix[symbol][strategy] !== undefined) {
        matrix[symbol][strategy] = {
          return: returnPct,
          status: returnPct > 0 ? 'WIN' : returnPct < 0 ? 'LOSS' : 'BREAK-EVEN'
        };

        // Update stats
        symbolStats[symbol].total++;
        symbolStats[symbol].totalReturn += returnPct;
        if (returnPct > 0) symbolStats[symbol].wins++;
        else if (returnPct < 0) symbolStats[symbol].losses++;

        strategyStats[strategy].total++;
        strategyStats[strategy].totalReturn += returnPct;
        if (returnPct > 0) strategyStats[strategy].wins++;
        else if (returnPct < 0) strategyStats[strategy].losses++;
      }
    });

    let row = 1;

    // Title
    worksheet.mergeCells(`A${row}:${String.fromCharCode(65 + STRATEGIES.length + 2)}${row}`);
    worksheet.getCell(`A${row}`).value = '📊 SYMBOL vs STRATEGY PERFORMANCE MATRIX';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1f4e79' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row += 2;

    // Headers
    worksheet.getCell(`A${row}`).value = 'SYMBOL';
    worksheet.getCell(`A${row}`).font = { bold: true };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6FA' } };

    let col = 2;
    STRATEGIES.forEach(strategy => {
      const cellRef = String.fromCharCode(64 + col) + row;
      worksheet.getCell(cellRef).value = strategy.replace('strategy-', '').toUpperCase();
      worksheet.getCell(cellRef).font = { bold: true, size: 10 };
      worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6FA' } };
      worksheet.getCell(cellRef).alignment = { horizontal: 'center', wrapText: true };
      col++;
    });

    // Win Rate column
    const winRateCol = String.fromCharCode(64 + col);
    worksheet.getCell(`${winRateCol}${row}`).value = 'WIN RATE';
    worksheet.getCell(`${winRateCol}${row}`).font = { bold: true };
    worksheet.getCell(`${winRateCol}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
    col++;

    // Avg Return column
    const avgReturnCol = String.fromCharCode(64 + col);
    worksheet.getCell(`${avgReturnCol}${row}`).value = 'AVG RETURN';
    worksheet.getCell(`${avgReturnCol}${row}`).font = { bold: true };
    worksheet.getCell(`${avgReturnCol}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };

    row++;

    // Data rows
    SYMBOLS.forEach(symbol => {
      worksheet.getCell(`A${row}`).value = symbol;
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F8FF' } };

      let col = 2;
      STRATEGIES.forEach(strategy => {
        const cellRef = String.fromCharCode(64 + col) + row;
        const data = matrix[symbol][strategy];

        if (data.status === 'No Data') {
          worksheet.getCell(cellRef).value = 'N/A';
          worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } };
        } else {
          worksheet.getCell(cellRef).value = `${data.return.toFixed(1)}%`;

          // Color coding
          if (data.status === 'WIN') {
            worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
            worksheet.getCell(cellRef).font = { color: { argb: '006400' }, bold: true };
          } else if (data.status === 'LOSS') {
            worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6C1' } };
            worksheet.getCell(cellRef).font = { color: { argb: '8B0000' }, bold: true };
          } else {
            worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0' } };
          }
        }

        worksheet.getCell(cellRef).alignment = { horizontal: 'center' };
        col++;
      });

      // Win rate
      const stats = symbolStats[symbol];
      const winRate = stats.total > 0 ? (stats.wins / stats.total * 100).toFixed(1) : '0.0';
      worksheet.getCell(`${winRateCol}${row}`).value = `${winRate}%`;
      worksheet.getCell(`${winRateCol}${row}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`${winRateCol}${row}`).font = { bold: true };

      // Average return
      const avgReturn = stats.total > 0 ? (stats.totalReturn / stats.total).toFixed(1) : '0.0';
      worksheet.getCell(`${avgReturnCol}${row}`).value = `${avgReturn}%`;
      worksheet.getCell(`${avgReturnCol}${row}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`${avgReturnCol}${row}`).font = { bold: true };

      row++;
    });

    // Set column widths
    worksheet.getColumn('A').width = 12;
    for (let i = 2; i <= STRATEGIES.length + 1; i++) {
      worksheet.getColumn(i).width = 12;
    }
    worksheet.getColumn(winRateCol).width = 12;
    worksheet.getColumn(avgReturnCol).width = 12;
  }

  /**
   * Create detailed results sheet
   */
  async createDetailedSheet(workbook) {
    const worksheet = workbook.addWorksheet('Detailed Results');

    // Headers
    worksheet.columns = [
      { header: 'Symbol', key: 'symbol', width: 10 },
      { header: 'Strategy', key: 'strategyName', width: 25 },
      { header: 'Total Trades', key: 'totalTrades', width: 12 },
      { header: 'Win Rate %', key: 'winRate', width: 12 },
      { header: 'Total Return %', key: 'totalReturnPercent', width: 15 },
      { header: 'Final Capital', key: 'finalCapital', width: 15 },
      { header: 'Profit/Loss', key: 'profitLoss', width: 15 },
      { header: 'Best Trade', key: 'bestTrade', width: 12 },
      { header: 'Worst Trade', key: 'worstTrade', width: 12 },
      { header: 'Avg Trade Return', key: 'avgTradeReturn', width: 15 },
      { header: 'Winning Trades', key: 'winningTrades', width: 15 },
      { header: 'Losing Trades', key: 'losingTrades', width: 15 }
    ];

    // Add data
    worksheet.addRows(this.results);

    // Calculate totals
    const totalInitialInvestment = this.results.length * STARTING_CAPITAL;
    const totals = {
      symbol: 'TOTALS',
      strategyName: `Initial Investment: $${totalInitialInvestment.toLocaleString()}`,
      totalTrades: this.results.reduce((sum, r) => sum + r.totalTrades, 0),
      winRate: this.results.reduce((sum, r) => sum + (r.winRate * 100), 0) / this.results.length / 100, // Average win rate
      totalReturnPercent: this.results.reduce((sum, r) => sum + r.totalReturnPercent, 0) / 100, // Convert to decimal for Excel
      finalCapital: this.results.reduce((sum, r) => sum + r.finalCapital, 0),
      profitLoss: this.results.reduce((sum, r) => sum + r.profitLoss, 0),
      bestTrade: Math.max(...this.results.map(r => r.bestTrade || 0)),
      worstTrade: Math.min(...this.results.map(r => r.worstTrade || 0)),
      avgTradeReturn: this.results.reduce((sum, r) => sum + (r.avgTradeReturn || 0), 0) / this.results.length,
      winningTrades: this.results.reduce((sum, r) => sum + r.winningTrades, 0),
      losingTrades: this.results.reduce((sum, r) => sum + r.losingTrades, 0)
    };

    // Add empty row and totals row
    worksheet.addRow({});
    const totalsRow = worksheet.addRow(totals);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };

    // Style the totals row
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } }; // Yellow background

    // Format numbers
    worksheet.getColumn('finalCapital').numFmt = '$#,##0.00';
    worksheet.getColumn('profitLoss').numFmt = '$#,##0.00';
    worksheet.getColumn('totalReturnPercent').numFmt = '0.00%';
    worksheet.getColumn('winRate').numFmt = '0.00%';
  }

  /**
   * Create strategy comparison sheet
   */
  async createStrategyComparisonSheet(workbook) {
    const worksheet = workbook.addWorksheet('Strategy Comparison');

    // Group results by strategy
    const strategyStats = {};

    this.results.forEach(result => {
      if (!strategyStats[result.strategy]) {
        strategyStats[result.strategy] = {
          strategyName: result.strategyName,
          tests: [],
          totalReturn: 0,
          totalTrades: 0,
          wins: 0,
          losses: 0
        };
      }

      const stats = strategyStats[result.strategy];
      stats.tests.push(result);
      stats.totalReturn += result.totalReturnPercent;
      stats.totalTrades += result.totalTrades;
      stats.wins += result.winningTrades;
      stats.losses += result.losingTrades;
    });

    // Calculate averages
    const comparisonData = Object.values(strategyStats).map(stats => ({
      strategyName: stats.strategyName,
      testsRun: stats.tests.length,
      avgReturn: stats.totalReturn / stats.tests.length,
      totalTrades: stats.totalTrades,
      avgTradesPerTest: stats.totalTrades / stats.tests.length,
      totalWins: stats.wins,
      totalLosses: stats.losses,
      overallWinRate: stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 0,
      bestResult: Math.max(...stats.tests.map(t => t.totalReturnPercent)),
      worstResult: Math.min(...stats.tests.map(t => t.totalReturnPercent)),
      consistency: this.calculateConsistency(stats.tests.map(t => t.totalReturnPercent))
    }));

    // Headers
    worksheet.columns = [
      { header: 'Strategy', key: 'strategyName', width: 25 },
      { header: 'Tests Run', key: 'testsRun', width: 12 },
      { header: 'Avg Return %', key: 'avgReturn', width: 15 },
      { header: 'Total Trades', key: 'totalTrades', width: 12 },
      { header: 'Avg Trades/Test', key: 'avgTradesPerTest', width: 15 },
      { header: 'Overall Win Rate %', key: 'overallWinRate', width: 18 },
      { header: 'Best Result %', key: 'bestResult', width: 15 },
      { header: 'Worst Result %', key: 'worstResult', width: 15 },
      { header: 'Consistency', key: 'consistency', width: 12 }
    ];

    // Add data
    worksheet.addRows(comparisonData);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };

    // Format numbers
    worksheet.getColumn('avgReturn').numFmt = '0.00%';
    worksheet.getColumn('overallWinRate').numFmt = '0.00%';
    worksheet.getColumn('bestResult').numFmt = '0.00%';
    worksheet.getColumn('worstResult').numFmt = '0.00%';
    worksheet.getColumn('avgTradesPerTest').numFmt = '0.0';
    worksheet.getColumn('consistency').numFmt = '0.00';
  }

  /**
   * Create symbol comparison sheet
   */
  async createSymbolComparisonSheet(workbook) {
    const worksheet = workbook.addWorksheet('Symbol Comparison');

    // Group results by symbol
    const symbolStats = {};

    this.results.forEach(result => {
      if (!symbolStats[result.symbol]) {
        symbolStats[result.symbol] = {
          symbol: result.symbol,
          tests: [],
          totalReturn: 0,
          totalTrades: 0
        };
      }

      const stats = symbolStats[result.symbol];
      stats.tests.push(result);
      stats.totalReturn += result.totalReturnPercent;
      stats.totalTrades += result.totalTrades;
    });

    // Calculate averages
    const comparisonData = Object.values(symbolStats).map(stats => ({
      symbol: stats.symbol,
      strategiesTested: stats.tests.length,
      avgReturn: stats.totalReturn / stats.tests.length,
      bestStrategy: stats.tests.reduce((best, current) =>
        current.totalReturnPercent > best.totalReturnPercent ? current : best
      ),
      worstStrategy: stats.tests.reduce((worst, current) =>
        current.totalReturnPercent < worst.totalReturnPercent ? current : worst
      ),
      totalTrades: stats.totalTrades,
      consistency: this.calculateConsistency(stats.tests.map(t => t.totalReturnPercent))
    }));

    // Headers
    worksheet.columns = [
      { header: 'Symbol', key: 'symbol', width: 10 },
      { header: 'Strategies Tested', key: 'strategiesTested', width: 18 },
      { header: 'Avg Return %', key: 'avgReturn', width: 15 },
      { header: 'Best Strategy', key: 'bestStrategyName', width: 25 },
      { header: 'Best Return %', key: 'bestReturn', width: 15 },
      { header: 'Worst Strategy', key: 'worstStrategyName', width: 25 },
      { header: 'Worst Return %', key: 'worstReturn', width: 15 },
      { header: 'Total Trades', key: 'totalTrades', width: 12 },
      { header: 'Consistency', key: 'consistency', width: 12 }
    ];

    // Transform data for display
    const displayData = comparisonData.map(data => ({
      symbol: data.symbol,
      strategiesTested: data.strategiesTested,
      avgReturn: data.avgReturn,
      bestStrategyName: data.bestStrategy.strategyName,
      bestReturn: data.bestStrategy.totalReturnPercent,
      worstStrategyName: data.worstStrategy.strategyName,
      worstReturn: data.worstStrategy.totalReturnPercent,
      totalTrades: data.totalTrades,
      consistency: data.consistency
    }));

    // Add data
    worksheet.addRows(displayData);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };

    // Format numbers
    worksheet.getColumn('avgReturn').numFmt = '0.00%';
    worksheet.getColumn('bestReturn').numFmt = '0.00%';
    worksheet.getColumn('worstReturn').numFmt = '0.00%';
    worksheet.getColumn('consistency').numFmt = '0.00';
  }

  /**
   * Create Top Performers Analysis Sheet
   */
  async createTopPerformersSheet(workbook) {
    const worksheet = workbook.addWorksheet('🏆 Top Performers');

    // Sort results by return
    const sortedResults = [...this.results].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);

    let row = 1;

    // Title
    worksheet.mergeCells(`A${row}:G${row}`);
    worksheet.getCell(`A${row}`).value = '🏆 TOP PERFORMING STRATEGY-SYMBOL COMBINATIONS';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row += 2;

    // Headers
    const headers = ['Rank', 'Symbol', 'Strategy', 'Return %', 'Final Capital', 'Total Trades', 'Win Rate %'];
    headers.forEach((header, index) => {
      const cellRef = String.fromCharCode(65 + index) + row;
      worksheet.getCell(cellRef).value = header;
      worksheet.getCell(cellRef).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1f4e79' } };
      worksheet.getCell(cellRef).alignment = { horizontal: 'center' };
    });
    row++;

    // Top 20 performers
    sortedResults.slice(0, 20).forEach((result, index) => {
      const rank = index + 1;
      const data = [
        rank,
        result.symbol,
        (result.strategyName || 'Unknown').replace('strategy-', ''),
        `${result.totalReturnPercent.toFixed(2)}%`,
        `$${result.finalCapital.toLocaleString()}`,
        result.totalTrades,
        `${result.winRate.toFixed(1)}%`
      ];

      data.forEach((value, colIndex) => {
        const cellRef = String.fromCharCode(65 + colIndex) + row;
        worksheet.getCell(cellRef).value = value;
        worksheet.getCell(cellRef).alignment = { horizontal: 'center' };

        // Color coding for top 3
        if (rank <= 3) {
          const colors = ['FFD700', 'C0C0C0', 'CD7F32']; // Gold, Silver, Bronze
          worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[rank - 1] } };
          worksheet.getCell(cellRef).font = { bold: true };
        } else if (result.totalReturnPercent > 0) {
          worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6FFE6' } };
        }
      });
      row++;
    });

    // Set column widths
    worksheet.getColumn('A').width = 8;  // Rank
    worksheet.getColumn('B').width = 10; // Symbol
    worksheet.getColumn('C').width = 25; // Strategy
    worksheet.getColumn('D').width = 12; // Return %
    worksheet.getColumn('E').width = 15; // Final Capital
    worksheet.getColumn('F').width = 12; // Total Trades
    worksheet.getColumn('G').width = 12; // Win Rate %
  }

  /**
   * Create Risk Analysis Sheet
   */
  async createRiskAnalysisSheet(workbook) {
    const worksheet = workbook.addWorksheet('⚠️ Risk Analysis');

    let row = 1;

    // Title
    worksheet.mergeCells(`A${row}:F${row}`);
    worksheet.getCell(`A${row}`).value = '⚠️ RISK ANALYSIS & PERFORMANCE METRICS';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC143C' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row += 2;

    // Risk Categories
    const riskCategories = {
      'HIGH RISK (>500% return)': this.results.filter(r => r.totalReturnPercent > 500),
      'MODERATE RISK (50-500% return)': this.results.filter(r => r.totalReturnPercent > 50 && r.totalReturnPercent <= 500),
      'LOW RISK (0-50% return)': this.results.filter(r => r.totalReturnPercent > 0 && r.totalReturnPercent <= 50),
      'LOSSES (<0% return)': this.results.filter(r => r.totalReturnPercent < 0),
      'NO ACTIVITY (0% return)': this.results.filter(r => r.totalReturnPercent === 0)
    };

    Object.entries(riskCategories).forEach(([category, results]) => {
      worksheet.getCell(`A${row}`).value = category;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };

      // Color coding
      if (category.includes('HIGH RISK')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6C1' } };
      } else if (category.includes('MODERATE RISK')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0' } };
      } else if (category.includes('LOW RISK')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6FFE6' } };
      } else if (category.includes('LOSSES')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B6B' } };
      } else {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } };
      }

      worksheet.getCell(`B${row}`).value = `${results.length} strategies`;
      worksheet.getCell(`B${row}`).font = { bold: true };

      if (results.length > 0) {
        const avgReturn = results.reduce((sum, r) => sum + r.totalReturnPercent, 0) / results.length;
        worksheet.getCell(`C${row}`).value = `Avg: ${avgReturn.toFixed(2)}%`;

        const bestInCategory = results.reduce((best, current) =>
          current.totalReturnPercent > best.totalReturnPercent ? current : best
        );
        worksheet.getCell(`D${row}`).value = `Best: ${bestInCategory.symbol} ${bestInCategory.totalReturnPercent.toFixed(2)}%`;
      }

      row++;
    });

    // Set column widths
    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 15;
    worksheet.getColumn('D').width = 25;
  }

  /**
   * Create errors sheet
   */
  async createErrorsSheet(workbook) {
    const worksheet = workbook.addWorksheet('Errors');

    // Headers
    worksheet.columns = [
      { header: 'Symbol', key: 'symbol', width: 10 },
      { header: 'Strategy', key: 'strategy', width: 25 },
      { header: 'Error Message', key: 'error', width: 50 }
    ];

    // Add data
    worksheet.addRows(this.errors);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
  }

  /**
   * Calculate consistency (lower standard deviation = more consistent)
   */
  calculateConsistency(returns) {
    if (returns.length <= 1) return 0;

    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Return inverse of coefficient of variation (lower = more consistent)
    return mean !== 0 ? Math.abs(mean) / stdDev : 0;
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Print summary to console
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKTESTING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Completed: ${this.results.length} tests`);
    console.log(`❌ Failed: ${this.errors.length} tests`);
    console.log(`⏱️  Duration: ${Math.round((new Date() - this.startTime) / 1000)} seconds`);
    console.log(`📁 Report: ${EXCEL_FILE}`);
    console.log('='.repeat(60));
  }
}

// Run the script if called directly
if (require.main === module) {
  const backtester = new ComprehensiveBacktester();
  backtester.run().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveBacktester;
