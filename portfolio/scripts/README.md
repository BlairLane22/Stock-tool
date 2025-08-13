# Comprehensive Backtesting Script

This script runs all available trading strategies against all available symbols and exports the results to an Excel file for comprehensive analysis.

## Features

- **Automated Testing**: Runs all strategies on all symbols automatically
- **Excel Export**: Generates detailed Excel reports with multiple sheets
- **Performance Metrics**: Calculates win rates, returns, consistency, and more
- **Error Handling**: Tracks and reports any failed tests
- **Dynamic Strategy Discovery**: Automatically discovers available strategies from database

## Prerequisites

1. **Backend API** must be running on `http://localhost:3000`
2. **Portfolio API** must be running on `http://localhost:3001`
3. **Database** must be initialized with trading strategies

## Usage

### Quick Start
```bash
# From the portfolio directory
npm run backtest:all
```

### Manual Execution
```bash
# From the portfolio directory
node scripts/comprehensive-backtest.js
```

## Output

The script generates an Excel file in the `portfolio/reports/` directory with the following sheets:

### 1. Summary Sheet
- Total tests run
- Success/failure rates
- Average returns
- Best and worst performing combinations
- Test duration

### 2. Detailed Results Sheet
- Complete results for every strategy-symbol combination
- Metrics: trades, win rate, returns, profit/loss, best/worst trades
- Formatted for easy analysis

### 3. Strategy Comparison Sheet
- Performance comparison across all strategies
- Average returns per strategy
- Consistency metrics
- Overall win rates

### 4. Symbol Comparison Sheet
- Performance comparison across all symbols
- Best/worst strategies per symbol
- Symbol-specific insights

### 5. Errors Sheet (if any)
- Failed test combinations
- Error messages for debugging

## Configuration

Edit the script to customize:

```javascript
// Available symbols (add more as needed)
const SYMBOLS = ['AMD', 'NVDA', 'GOOGL'];

// Starting capital for all tests
const STARTING_CAPITAL = 10000;

// API endpoints
const PORTFOLIO_API_URL = 'http://localhost:3001';
const BACKEND_API_URL = 'http://localhost:3000';
```

## Available Strategies

The script automatically discovers strategies from your database, including:

- Bollinger Bands
- RSI Oversold
- EMA Crossover
- MACD Signal
- Three-Tier Trend
- Donchian Breakout
- Turtle Trading (Donchian + ATR)

## Performance Metrics

Each test calculates:

- **Total Trades**: Number of buy/sell transactions
- **Win Rate**: Percentage of profitable trades
- **Total Return**: Overall percentage return
- **Final Capital**: Ending portfolio value
- **Profit/Loss**: Dollar amount gained/lost
- **Best/Worst Trade**: Highest and lowest single trade returns
- **Consistency**: Statistical measure of performance stability

## Example Output

```
🚀 Starting Comprehensive Backtesting Suite
📊 Testing 7 strategies on 3 symbols
💰 Starting capital: $10,000
============================================================
🔍 Checking services...
✅ Portfolio API is running
✅ Backend API is running
🔍 Fetching available strategies...
✅ Found 7 strategies: strategy-bollinger-bands, strategy-rsi-oversold, ...
📈 Running backtests...
🔄 Testing strategy-bollinger-bands on AMD... (1/21)
✅ strategy-bollinger-bands on AMD: 45.23% return
...
📊 Generating Excel report...
✅ Excel report saved: portfolio/reports/backtest-results-2025-08-13.xlsx
============================================================
📊 BACKTESTING SUMMARY
============================================================
✅ Completed: 21 tests
❌ Failed: 0 tests
⏱️  Duration: 127 seconds
📁 Report: portfolio/reports/backtest-results-2025-08-13.xlsx
============================================================
```

## Troubleshooting

### Services Not Running
```
❌ Portfolio API is not running. Please start it with: npm start
❌ Backend API is not running. Please start it first.
```
**Solution**: Start both APIs before running the script.

### No Strategies Found
```
⚠️ Using fallback strategies: 7 strategies
```
**Solution**: Check database connection and ensure strategies are properly inserted.

### Timeout Errors
```
❌ Error testing strategy-name on SYMBOL: timeout of 120000ms exceeded
```
**Solution**: Increase timeout in script or check for performance issues.

## Tips

1. **Run during off-hours**: Backtesting can be resource-intensive
2. **Monitor progress**: Watch console output for real-time status
3. **Check Excel file**: Open immediately after completion for analysis
4. **Save results**: Excel files are timestamped for historical comparison
5. **Add symbols**: Edit SYMBOLS array to test additional stocks

## File Structure

```
portfolio/
├── scripts/
│   ├── comprehensive-backtest.js    # Main script
│   └── README.md                    # This file
├── reports/                         # Generated Excel files
│   └── backtest-results-YYYY-MM-DD.xlsx
└── package.json                     # Contains npm script
```
