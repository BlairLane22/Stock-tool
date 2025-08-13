#!/usr/bin/env node

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Sample data to demonstrate the comprehensive Excel report
const sampleResults = [
  { symbol: 'AMD', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 15293.48, finalCapital: 1539348, totalTrades: 45, winRate: 67.8 },
  { symbol: 'GOOGL', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 1464.78, finalCapital: 156478, totalTrades: 32, winRate: 62.5 },
  { symbol: 'CRM', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 857.01, finalCapital: 95701, totalTrades: 28, winRate: 57.1 },
  { symbol: 'NVDA', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 672.72, finalCapital: 77272, totalTrades: 38, winRate: 55.3 },
  { symbol: 'SPOT', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 429.03, finalCapital: 52903, totalTrades: 22, winRate: 59.1 },
  { symbol: 'TSLA', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 391.96, finalCapital: 49196, totalTrades: 41, winRate: 51.2 },
  { symbol: 'IBM', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 72.68, finalCapital: 17268, totalTrades: 18, winRate: 61.1 },
  { symbol: 'UBER', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: 4.75, finalCapital: 10475, totalTrades: 12, winRate: 50.0 },
  { symbol: 'GPRO', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: -22.76, finalCapital: 7724, totalTrades: 15, winRate: 33.3 },
  { symbol: 'BB', strategyName: 'strategy-ema-50-crossover', totalReturnPercent: -18.30, finalCapital: 8170, totalTrades: 19, winRate: 36.8 },
  { symbol: 'AMD', strategyName: 'strategy-bollinger-only', totalReturnPercent: 78.58, finalCapital: 17858, totalTrades: 25, winRate: 52.0 },
  { symbol: 'UBER', strategyName: 'strategy-bollinger-only', totalReturnPercent: 62.53, finalCapital: 16253, totalTrades: 31, winRate: 48.4 },
  { symbol: 'IBM', strategyName: 'strategy-bollinger-only', totalReturnPercent: 18.99, finalCapital: 11899, totalTrades: 22, winRate: 54.5 },
  { symbol: 'GOOGL', strategyName: 'strategy-bollinger-only', totalReturnPercent: 12.67, finalCapital: 11267, totalTrades: 18, winRate: 55.6 },
  { symbol: 'SPOT', strategyName: 'strategy-bollinger-only', totalReturnPercent: 8.15, finalCapital: 10815, totalTrades: 14, winRate: 57.1 }
];

const SYMBOLS = ['SPOT', 'AMD', 'NVDA', 'IBM', 'GOOGL', 'CRM', 'TSLA', 'UBER', 'GPRO', 'BB'];
const STRATEGIES = ['strategy-ema-50-crossover', 'strategy-bollinger-only', 'strategy-atr-only', 'strategy-pattern-focus'];
const STARTING_CAPITAL = 10000;

class ExcelReportDemo {
  constructor() {
    this.results = sampleResults;
    this.errors = [];
    this.startTime = new Date(Date.now() - 120000); // 2 minutes ago
  }

  async generateDemoReport() {
    console.log('📊 Generating comprehensive Excel report demo...');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockTrack Comprehensive Backtesting Suite';
    workbook.created = new Date();
    
    // Create all sheets
    await this.createSymbolStrategyMatrix(workbook);
    await this.createTopPerformersSheet(workbook);
    await this.createRiskAnalysisSheet(workbook);
    
    // Save the workbook
    const outputDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = path.join(outputDir, 'demo-comprehensive-report.xlsx');
    await workbook.xlsx.writeFile(filename);
    console.log(`✅ Demo Excel report saved: ${filename}`);
  }

  async createSymbolStrategyMatrix(workbook) {
    const worksheet = workbook.addWorksheet('📊 Symbol-Strategy Matrix');
    
    // Create matrix data structure
    const matrix = {};
    const symbolStats = {};
    
    // Initialize structures
    SYMBOLS.forEach(symbol => {
      matrix[symbol] = {};
      symbolStats[symbol] = { wins: 0, losses: 0, total: 0, totalReturn: 0 };
      STRATEGIES.forEach(strategy => {
        matrix[symbol][strategy] = { return: 0, status: 'No Data' };
      });
    });
    
    // Populate matrix with results
    this.results.forEach(result => {
      const symbol = result.symbol;
      const strategy = result.strategyName;
      const returnPct = result.totalReturnPercent;
      
      if (matrix[symbol] && matrix[symbol][strategy] !== undefined) {
        matrix[symbol][strategy] = {
          return: returnPct,
          status: returnPct > 0 ? 'WIN' : returnPct < 0 ? 'LOSS' : 'BREAK-EVEN'
        };
        
        symbolStats[symbol].total++;
        symbolStats[symbol].totalReturn += returnPct;
        if (returnPct > 0) symbolStats[symbol].wins++;
        else if (returnPct < 0) symbolStats[symbol].losses++;
      }
    });
    
    let row = 1;
    
    // Title
    worksheet.mergeCells(`A${row}:G${row}`);
    worksheet.getCell(`A${row}`).value = '📊 SYMBOL vs STRATEGY PERFORMANCE MATRIX';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1f4e79' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row += 2;
    
    // Headers
    worksheet.getCell(`A${row}`).value = 'SYMBOL';
    worksheet.getCell(`A${row}`).font = { bold: true };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6FA' } };
    
    const strategyHeaders = ['EMA-50', 'BOLLINGER', 'ATR', 'PATTERNS'];
    strategyHeaders.forEach((header, index) => {
      const cellRef = String.fromCharCode(66 + index) + row; // B, C, D, E
      worksheet.getCell(cellRef).value = header;
      worksheet.getCell(cellRef).font = { bold: true };
      worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6FA' } };
      worksheet.getCell(cellRef).alignment = { horizontal: 'center' };
    });
    
    worksheet.getCell(`F${row}`).value = 'WIN RATE';
    worksheet.getCell(`F${row}`).font = { bold: true };
    worksheet.getCell(`F${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
    
    worksheet.getCell(`G${row}`).value = 'AVG RETURN';
    worksheet.getCell(`G${row}`).font = { bold: true };
    worksheet.getCell(`G${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
    
    row++;
    
    // Data rows
    SYMBOLS.forEach(symbol => {
      worksheet.getCell(`A${row}`).value = symbol;
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F8FF' } };
      
      STRATEGIES.forEach((strategy, index) => {
        const cellRef = String.fromCharCode(66 + index) + row;
        const data = matrix[symbol][strategy];
        
        if (data.status === 'No Data') {
          worksheet.getCell(cellRef).value = 'N/A';
          worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } };
        } else {
          worksheet.getCell(cellRef).value = `${data.return.toFixed(1)}%`;
          
          if (data.status === 'WIN') {
            worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
            worksheet.getCell(cellRef).font = { color: { argb: '006400' }, bold: true };
          } else if (data.status === 'LOSS') {
            worksheet.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6C1' } };
            worksheet.getCell(cellRef).font = { color: { argb: '8B0000' }, bold: true };
          }
        }
        
        worksheet.getCell(cellRef).alignment = { horizontal: 'center' };
      });
      
      // Win rate and average return
      const stats = symbolStats[symbol];
      const winRate = stats.total > 0 ? (stats.wins / stats.total * 100).toFixed(1) : '0.0';
      const avgReturn = stats.total > 0 ? (stats.totalReturn / stats.total).toFixed(1) : '0.0';
      
      worksheet.getCell(`F${row}`).value = `${winRate}%`;
      worksheet.getCell(`F${row}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`F${row}`).font = { bold: true };
      
      worksheet.getCell(`G${row}`).value = `${avgReturn}%`;
      worksheet.getCell(`G${row}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`G${row}`).font = { bold: true };
      
      row++;
    });
    
    // Set column widths
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col, index) => {
      worksheet.getColumn(col).width = index === 0 ? 12 : 15;
    });
  }

  async createTopPerformersSheet(workbook) {
    const worksheet = workbook.addWorksheet('🏆 Top Performers');
    
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
    
    // Data rows
    sortedResults.forEach((result, index) => {
      const rank = index + 1;
      const data = [
        rank,
        result.symbol,
        result.strategyName.replace('strategy-', ''),
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
    worksheet.getColumn('A').width = 8;
    worksheet.getColumn('B').width = 10;
    worksheet.getColumn('C').width = 20;
    worksheet.getColumn('D').width = 12;
    worksheet.getColumn('E').width = 15;
    worksheet.getColumn('F').width = 12;
    worksheet.getColumn('G').width = 12;
  }

  async createRiskAnalysisSheet(workbook) {
    const worksheet = workbook.addWorksheet('⚠️ Risk Analysis');
    
    let row = 1;
    
    // Title
    worksheet.mergeCells(`A${row}:D${row}`);
    worksheet.getCell(`A${row}`).value = '⚠️ RISK ANALYSIS & PERFORMANCE CATEGORIES';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC143C' } };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row += 2;
    
    // Risk categories
    const riskCategories = {
      'LEGENDARY (>1000% return)': this.results.filter(r => r.totalReturnPercent > 1000),
      'EXCEPTIONAL (500-1000% return)': this.results.filter(r => r.totalReturnPercent > 500 && r.totalReturnPercent <= 1000),
      'HIGH RETURN (100-500% return)': this.results.filter(r => r.totalReturnPercent > 100 && r.totalReturnPercent <= 500),
      'MODERATE RETURN (50-100% return)': this.results.filter(r => r.totalReturnPercent > 50 && r.totalReturnPercent <= 100),
      'LOW RETURN (0-50% return)': this.results.filter(r => r.totalReturnPercent > 0 && r.totalReturnPercent <= 50),
      'LOSSES (<0% return)': this.results.filter(r => r.totalReturnPercent < 0)
    };
    
    Object.entries(riskCategories).forEach(([category, results]) => {
      worksheet.getCell(`A${row}`).value = category;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      
      // Color coding
      if (category.includes('LEGENDARY')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
      } else if (category.includes('EXCEPTIONAL')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA500' } };
      } else if (category.includes('HIGH RETURN')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '90EE90' } };
      } else if (category.includes('MODERATE')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0' } };
      } else if (category.includes('LOW RETURN')) {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6FFE6' } };
      } else {
        worksheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6C1' } };
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
}

// Run the demo
const demo = new ExcelReportDemo();
demo.generateDemoReport().catch(console.error);
