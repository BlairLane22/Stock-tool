#!/usr/bin/env node

const ExcelJS = require('exceljs');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../reports/backtest-results-2025-08-13.xlsx');

async function addTotalsToExistingExcel() {
  console.log('📊 Adding totals to existing Excel file...');
  
  try {
    // Load existing workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE);
    
    // Get the Detailed Results sheet
    const worksheet = workbook.getWorksheet('Detailed Results');
    
    if (!worksheet) {
      console.error('❌ Could not find "Detailed Results" sheet');
      return;
    }
    
    // Get all data rows (excluding header)
    const dataRows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowData = {
          symbol: row.getCell(1).value,
          strategyName: row.getCell(2).value,
          totalTrades: parseFloat(row.getCell(3).value) || 0,
          winRate: parseFloat(row.getCell(4).value) || 0,
          totalReturnPercent: parseFloat(row.getCell(5).value) || 0,
          finalCapital: parseFloat(row.getCell(6).value) || 0,
          profitLoss: parseFloat(row.getCell(7).value) || 0,
          bestTrade: parseFloat(row.getCell(8).value) || 0,
          worstTrade: parseFloat(row.getCell(9).value) || 0,
          avgTradeReturn: parseFloat(row.getCell(10).value) || 0,
          winningTrades: parseFloat(row.getCell(11).value) || 0,
          losingTrades: parseFloat(row.getCell(12).value) || 0
        };
        
        // Only add if it's a valid data row (not empty)
        if (rowData.symbol && rowData.symbol !== 'TOTALS') {
          dataRows.push(rowData);
        }
      }
    });
    
    console.log(`📈 Found ${dataRows.length} data rows`);
    
    // Calculate totals
    const STARTING_CAPITAL = 10000; // $10,000 per test
    const totalInitialInvestment = dataRows.length * STARTING_CAPITAL;
    const totals = {
      symbol: 'TOTALS',
      strategyName: `Initial Investment: $${totalInitialInvestment.toLocaleString()}`,
      totalTrades: dataRows.reduce((sum, r) => sum + r.totalTrades, 0),
      winRate: dataRows.reduce((sum, r) => sum + r.winRate, 0) / dataRows.length, // Average win rate
      totalReturnPercent: dataRows.reduce((sum, r) => sum + r.totalReturnPercent, 0),
      finalCapital: dataRows.reduce((sum, r) => sum + r.finalCapital, 0),
      profitLoss: dataRows.reduce((sum, r) => sum + r.profitLoss, 0),
      bestTrade: Math.max(...dataRows.map(r => r.bestTrade)),
      worstTrade: Math.min(...dataRows.map(r => r.worstTrade)),
      avgTradeReturn: dataRows.reduce((sum, r) => sum + r.avgTradeReturn, 0) / dataRows.length,
      winningTrades: dataRows.reduce((sum, r) => sum + r.winningTrades, 0),
      losingTrades: dataRows.reduce((sum, r) => sum + r.losingTrades, 0)
    };
    
    console.log('📊 Calculated totals:', {
      totalTrades: totals.totalTrades,
      avgWinRate: `${(totals.winRate * 100).toFixed(2)}%`,
      totalReturn: `${totals.totalReturnPercent.toFixed(2)}%`,
      totalFinalCapital: `$${totals.finalCapital.toFixed(2)}`,
      totalProfitLoss: `$${totals.profitLoss.toFixed(2)}`
    });
    
    // Find the last row with data
    let lastRowNumber = 1;
    worksheet.eachRow((row, rowNumber) => {
      if (row.getCell(1).value) {
        lastRowNumber = rowNumber;
      }
    });
    
    // Add empty row and totals row
    const emptyRowNumber = lastRowNumber + 1;
    const totalsRowNumber = lastRowNumber + 2;
    
    // Add totals row
    const totalsRow = worksheet.getRow(totalsRowNumber);
    totalsRow.getCell(1).value = totals.symbol;
    totalsRow.getCell(2).value = totals.strategyName;
    totalsRow.getCell(3).value = totals.totalTrades;
    totalsRow.getCell(4).value = totals.winRate;
    totalsRow.getCell(5).value = totals.totalReturnPercent / 100; // Convert to decimal for percentage format
    totalsRow.getCell(6).value = totals.finalCapital;
    totalsRow.getCell(7).value = totals.profitLoss;
    totalsRow.getCell(8).value = totals.bestTrade;
    totalsRow.getCell(9).value = totals.worstTrade;
    totalsRow.getCell(10).value = totals.avgTradeReturn;
    totalsRow.getCell(11).value = totals.winningTrades;
    totalsRow.getCell(12).value = totals.losingTrades;
    
    // Style the totals row
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } }; // Yellow background
    
    // Apply number formatting to the totals row
    totalsRow.getCell(4).numFmt = '0.00%'; // Win Rate
    totalsRow.getCell(5).numFmt = '0.00%'; // Total Return %
    totalsRow.getCell(6).numFmt = '$#,##0.00'; // Final Capital
    totalsRow.getCell(7).numFmt = '$#,##0.00'; // Profit/Loss
    
    // Save the modified workbook
    await workbook.xlsx.writeFile(EXCEL_FILE);
    console.log(`✅ Added totals to Excel file: ${EXCEL_FILE}`);
    
  } catch (error) {
    console.error('❌ Error modifying Excel file:', error);
  }
}

// Run the script
addTotalsToExistingExcel();
