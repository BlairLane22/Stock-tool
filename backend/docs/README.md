# Trading Analysis Commands Documentation

This directory contains comprehensive documentation for the trading analysis commands implemented in the Blair Tools project.

## Available Commands

### 1. Personal Trading Strategy (`strategy`)
**File**: [personal-trading-strategy.md](./personal-trading-strategy.md)

A comprehensive trading strategy analysis command that implements your personalized trading methodology. It combines multiple technical indicators, risk management principles, and a systematic checklist approach.

**Quick Usage**:
```bash
npm start strategy AAPL --balance 50000 --risk 1.5
```

**Key Features**:
- Complete technical analysis (MA, RSI, MACD, Volume)
- 5-step trading checklist evaluation
- Risk management and position sizing
- Trading signal generation (BUY/SELL/HOLD)
- Comprehensive scoring system (0-100)

### 2. MACD Indicator (`macd`)
**File**: [macd-indicator.md](./macd-indicator.md)

A professional implementation of the Moving Average Convergence Divergence indicator based on Investopedia standards. Provides detailed MACD analysis and trading signals.

**Quick Usage**:
```bash
npm start macd AAPL --fast 12 --slow 26 --signal 9
```

**Key Features**:
- Complete MACD calculation (Line, Signal, Histogram)
- Crossover detection and analysis
- Signal strength scoring (0-100)
- Trading recommendations with confidence levels
- Historical MACD data display

## Command Comparison

| Feature | Personal Strategy | MACD Indicator |
|---------|------------------|----------------|
| **Purpose** | Complete trading strategy | Single indicator analysis |
| **Indicators** | Multiple (MA, RSI, MACD, Volume) | MACD only |
| **Output** | Trading decision framework | Technical signal analysis |
| **Risk Management** | Full position sizing & stops | Signal-based recommendations |
| **Customization** | Account balance & risk % | MACD parameters (fast/slow/signal) |
| **Best For** | Complete trade analysis | MACD-focused strategies |

## Quick Start Guide

### Installation & Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Basic Usage Examples
```bash
# Personal trading strategy analysis
npm start strategy AAPL

# MACD analysis with default parameters
npm start macd AAPL

# View available commands
node lib/src/index.js --help

# Get help for specific command
node lib/src/index.js strategy --help
node lib/src/index.js macd --help
```

### Sample Output

#### Personal Trading Strategy
```
=== Personal Trading Strategy Analysis for AAPL ===

📊 Technical Indicators:
Current Price: $207.57
20-day MA: $209.35
50-day MA: $204.34
200-day MA: $189.27
RSI: 49.18
MACD: -2.7419
Volume Ratio: 0.88x average

🎯 Trading Signal: HOLD
Confidence: LOW
Risk/Reward Ratio: 2.1:1

💰 Position Management:
Recommended Position Size: 21 shares
Stop Loss: $198.41
Target Price: $226.80
```

#### MACD Indicator
```
=== MACD Analysis for AAPL ===

📊 Current MACD Values:
Current Price: $202.38
MACD Line: -0.7266
Signal Line: 0.6606
Histogram: -1.3873

🎯 MACD Analysis:
Current Signal: BEARISH
Crossover: NONE
Momentum: DECREASING
Signal Strength: 63/100

💡 Trading Recommendation:
Action: SELL
Confidence: MEDIUM
Reason: MACD below signal line with decreasing momentum
```

## Documentation Structure

### Personal Trading Strategy Documentation
- **Overview**: Complete strategy implementation
- **Command Usage**: Parameters and options
- **Strategy Components**: Technical indicators and analysis
- **Risk Management**: Position sizing and stop-loss calculation
- **Trading Checklist**: 5-step systematic evaluation
- **Output Analysis**: Detailed explanation of results
- **Best Practices**: Usage guidelines and recommendations
- **Limitations**: Current constraints and future enhancements

### MACD Indicator Documentation
- **MACD Theory**: Complete explanation of the indicator
- **Components**: MACD Line, Signal Line, Histogram
- **Command Usage**: Parameters and customization options
- **Trading Signals**: Buy/sell signal identification
- **Parameter Optimization**: Guidelines for different trading styles
- **Best Practices**: Market conditions and confirmation techniques
- **Technical Implementation**: Calculation methods and algorithms
- **Troubleshooting**: Common issues and solutions

## Integration

Both commands are designed to work together:

1. **Complementary Analysis**: Use MACD command for detailed momentum analysis, then personal strategy for complete evaluation
2. **Shared Components**: Both use the same MACD calculation engine
3. **Consistent Output**: Similar formatting and analysis structure
4. **Educational Value**: MACD command provides deep understanding, strategy command shows practical application

## Data Sources

- **Real-time Quotes**: Finnhub API
- **Historical Data**: Finnhub API with fallback to mock data
- **Calculations**: In-house algorithms using standard formulas
- **Reliability**: Professional-grade financial data with error handling

## Error Handling

Both commands include robust error handling:
- **API Failures**: Automatic fallback to mock data
- **Invalid Symbols**: Clear error messages and suggestions
- **Insufficient Data**: Graceful degradation with warnings
- **Parameter Validation**: Input validation and helpful error messages

## Testing

Comprehensive test suites ensure reliability:
- **Unit Tests**: Individual function testing
- **Integration Tests**: Command-level testing
- **Mock Data**: Realistic test scenarios
- **Edge Cases**: Error condition handling

## Future Enhancements

### Planned Improvements
- **Fundamental Analysis**: Integration with fundamental data
- **Additional Indicators**: RSI, Bollinger Bands, Stochastic
- **Backtesting**: Historical performance analysis
- **Alerts System**: Real-time signal notifications
- **Visualization**: Charts and graphical analysis
- **Portfolio Management**: Multi-stock analysis

### Technical Roadmap
- **Performance Optimization**: Faster calculations
- **Database Integration**: Local data caching
- **Real-time Data**: Live streaming updates
- **Mobile Integration**: Mobile app compatibility

## Support

For questions, issues, or feature requests:
1. **Documentation**: Refer to detailed command documentation
2. **Help Commands**: Use built-in help system
3. **Error Messages**: Follow error message suggestions
4. **Testing**: Use mock data mode for troubleshooting

## License

This project is part of the Blair Tools suite and follows the project's licensing terms.

---

**Note**: Both commands include fallback to mock data when API limits are reached, ensuring they always provide analysis for demonstration and learning purposes.
