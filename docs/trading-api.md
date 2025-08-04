# Trading Strategy API

A command-line trading analysis tool that can be called from other projects for technical indicator calculations and pattern recognition.

## Available Indicators & Patterns

### RSI (Relative Strength Index)
```bash
npm start rsi AAPL                    # Basic RSI analysis
npm start rsi AAPL --multi            # Multi-timeframe
npm start quick-rsi AAPL              # JSON API response
```

### Bollinger Bands
```bash
npm start bollinger AAPL             # Basic Bollinger Bands analysis
npm start bollinger AAPL --squeeze   # Include squeeze analysis
npm start quick-bollinger AAPL       # JSON API response
```

### Money Flow Index (MFI)
```bash
npm start mfi AAPL                   # Basic MFI analysis
npm start mfi AAPL --period 21       # Custom period
npm start quick-mfi AAPL             # JSON API response
```

### Intraday Momentum Index (IMI)
```bash
npm start imi AAPL                   # Basic IMI analysis
npm start imi AAPL --period 21       # Custom period
npm start quick-imi AAPL             # JSON API response
```

### Cup and Handle Pattern
```bash
npm start cup-handle AAPL             # Pattern detection
npm start cup-analysis AAPL           # Advanced analysis
```

### Personal Trading Strategy
```bash
npm start strategy AAPL               # Complete technical analysis
```

### MACD
```bash
npm start macd AAPL                   # MACD analysis
```

## API Integration

### From Node.js
```javascript
const { exec } = require('child_process');

// Get RSI data
exec('npm start quick-rsi AAPL', (error, stdout) => {
  const rsi = JSON.parse(stdout);
  console.log(`AAPL RSI: ${rsi.rsi} - Signal: ${rsi.signal}`);
});
```

### From Python
```python
import subprocess
import json

# Get RSI analysis
result = subprocess.run(['npm', 'start', 'quick-rsi', 'AAPL'], 
                       capture_output=True, text=True)
rsi_data = json.loads(result.stdout)
print(f"AAPL RSI: {rsi_data['rsi']} - Signal: {rsi_data['signal']}")
```

### From Any Language
```bash
# HTTP-like usage via command line
curl -X GET "http://localhost:3000/api/rsi/AAPL" 
# Equivalent: npm start quick-rsi AAPL
```

## Test Data
```bash
npm start list-test-data              # Show available test files
npm start rsi IBM --test-data ibm-recent-data
```

## Common Options
- `--mock`: Use mock data for testing
- `--test-data <file>`: Use specific test dataset
- `--period <number>`: Indicator period (default varies)
- `--help`: Show command help

## Output Formats
- **Human-readable**: Full analysis with charts and explanations
- **JSON**: Machine-readable for API integration (use `quick-*` commands)
- **Test validation**: Automated testing against known patterns
