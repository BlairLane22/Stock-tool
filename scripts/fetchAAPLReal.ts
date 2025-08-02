import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Note: The timestamps you provided are actually for 2024, not 2025
// Jan 1 2024 = 1704067200
// Apr 1 2024 = 1711900800

async function fetchRealAAPLData() {
  const symbol = "AAPL";
  const fromTimestamp = 1704067200;  // Jan 1 2024 (not 2025)
  const toTimestamp = 1711900800;    // Apr 1 2024 (not 2025)
  
  console.log(`Fetching AAPL data from ${new Date(fromTimestamp * 1000).toDateString()} to ${new Date(toTimestamp * 1000).toDateString()}`);
  
  try {
    // Try Yahoo Finance with different approach
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${fromTimestamp}&period2=${toTimestamp}&interval=1d&includePrePost=false`;
    
    console.log('Fetching from Yahoo Finance...');
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result[0]) {
      const result = response.data.chart.result[0];
      const meta = result.meta;
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      console.log(`✅ Received data for ${meta.symbol} with ${timestamps.length} data points`);
      
      const candles = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        // Skip weekends and invalid data
        if (quotes.open[i] !== null && quotes.high[i] !== null && 
            quotes.low[i] !== null && quotes.close[i] !== null && quotes.volume[i] !== null) {
          candles.push({
            open: parseFloat(quotes.open[i].toFixed(2)),
            high: parseFloat(quotes.high[i].toFixed(2)),
            low: parseFloat(quotes.low[i].toFixed(2)),
            close: parseFloat(quotes.close[i].toFixed(2)),
            volume: quotes.volume[i],
            timeStamp: timestamps[i]
          });
        }
      }
      
      // Create test data file
      const testData = {
        symbol: "AAPL",
        timeframe: "daily",
        description: `AAPL daily candle data from ${new Date(fromTimestamp * 1000).toDateString()} to ${new Date(toTimestamp * 1000).toDateString()}. Real market data downloaded from Yahoo Finance. This period reportedly contains a cup and handle pattern formation.`,
        expectedPattern: {
          type: "cup-and-handle",
          confidence: "UNKNOWN",
          shouldDetect: true,
          reason: "Real AAPL market data from Q1 2024 - pattern to be validated by algorithm"
        },
        candles: candles
      };
      
      // Save to test-data directory
      const testDataDir = path.join(__dirname, '../test-data');
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }
      
      const filename = `aapl-q1-2024-real.json`;
      const filepath = path.join(testDataDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(testData, null, 2));
      
      console.log(`✅ Successfully saved ${candles.length} candles to ${filepath}`);
      console.log(`📊 Date range: ${new Date(candles[0].timeStamp * 1000).toDateString()} to ${new Date(candles[candles.length - 1].timeStamp * 1000).toDateString()}`);
      console.log(`💰 Price range: $${Math.min(...candles.map(c => c.low)).toFixed(2)} - $${Math.max(...candles.map(c => c.high)).toFixed(2)}`);
      console.log(`📈 Start: $${candles[0].close} | End: $${candles[candles.length - 1].close} | Change: ${((candles[candles.length - 1].close - candles[0].close) / candles[0].close * 100).toFixed(1)}%`);
      
      console.log('\n🔍 To test pattern detection, run:');
      console.log(`node lib/src/index.js cup-handle AAPL --test-data aapl-q1-2024-real`);
      
      return true;
      
    } else {
      throw new Error('Invalid response format from Yahoo Finance');
    }
    
  } catch (error) {
    console.error('❌ Error fetching real data:', error.message);
    console.log('\n📝 The mock data file has already been created as fallback.');
    console.log('You can test with: node lib/src/index.js cup-handle AAPL --test-data aapl-jan-apr-2025-mock');
    return false;
  }
}

// Run the fetch
fetchRealAAPLData();
