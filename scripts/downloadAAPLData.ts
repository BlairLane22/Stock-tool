import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface TestDataFile {
  symbol: string;
  timeframe: string;
  description: string;
  expectedPattern: {
    type: string;
    confidence?: string;
    shouldDetect?: boolean;
    reason?: string;
  };
  candles: CandleData[];
}

async function downloadAAPLData() {
  const symbol = "AAPL";
  const fromTimestamp = 1704067200;  // Jan 1 2025
  const toTimestamp = 1711900800;    // Apr 1 2025
  
  console.log(`Downloading AAPL data from ${new Date(fromTimestamp * 1000).toISOString()} to ${new Date(toTimestamp * 1000).toISOString()}`);
  
  try {
    // Using Alpha Vantage API (you may need to adjust based on your API setup)
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    
    // Try multiple API endpoints
    const endpoints = [
      // Alpha Vantage
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`,
      
      // Polygon.io (if you have access)
      // `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromTimestamp * 1000}/${toTimestamp * 1000}?apikey=${process.env.POLYGON_API_KEY}`,
      
      // Yahoo Finance alternative (using a public API)
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${fromTimestamp}&period2=${toTimestamp}&interval=1d`
    ];
    
    let data = null;
    let source = '';
    
    // Try Yahoo Finance first (most reliable for historical data)
    try {
      console.log('Trying Yahoo Finance API...');
      const response = await axios.get(endpoints[2], {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result[0]) {
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        const candles: CandleData[] = [];
        
        for (let i = 0; i < timestamps.length; i++) {
          if (quotes.open[i] && quotes.high[i] && quotes.low[i] && quotes.close[i] && quotes.volume[i]) {
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
        
        data = candles;
        source = 'Yahoo Finance';
        console.log(`✅ Successfully fetched ${candles.length} candles from Yahoo Finance`);
      }
    } catch (error) {
      console.log('Yahoo Finance failed, trying Alpha Vantage...');
      
      // Try Alpha Vantage as fallback
      try {
        const response = await axios.get(endpoints[0]);
        
        if (response.data && response.data['Time Series (Daily)']) {
          const timeSeries = response.data['Time Series (Daily)'];
          const candles: CandleData[] = [];
          
          Object.keys(timeSeries).forEach(date => {
            const timestamp = Math.floor(new Date(date).getTime() / 1000);
            if (timestamp >= fromTimestamp && timestamp <= toTimestamp) {
              const dayData = timeSeries[date];
              candles.push({
                open: parseFloat(dayData['1. open']),
                high: parseFloat(dayData['2. high']),
                low: parseFloat(dayData['3. low']),
                close: parseFloat(dayData['4. close']),
                volume: parseInt(dayData['5. volume']),
                timeStamp: timestamp
              });
            }
          });
          
          // Sort by timestamp
          candles.sort((a, b) => a.timeStamp - b.timeStamp);
          
          data = candles;
          source = 'Alpha Vantage';
          console.log(`✅ Successfully fetched ${candles.length} candles from Alpha Vantage`);
        }
      } catch (avError) {
        console.error('Alpha Vantage also failed:', avError.message);
      }
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to fetch data from all sources');
    }
    
    // Create test data file
    const testData: TestDataFile = {
      symbol: "AAPL",
      timeframe: "daily",
      description: `AAPL daily candle data from Jan 1 2025 to Apr 1 2025. Downloaded from ${source} on ${new Date().toISOString()}. This period reportedly contains a cup and handle pattern.`,
      expectedPattern: {
        type: "cup-and-handle",
        confidence: "UNKNOWN",
        shouldDetect: true,
        reason: "Real market data - pattern detection to be validated"
      },
      candles: data
    };
    
    // Save to test-data directory
    const testDataDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    const filename = `aapl-jan-apr-2025.json`;
    const filepath = path.join(testDataDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(testData, null, 2));
    
    console.log(`✅ Successfully saved ${data.length} candles to ${filepath}`);
    console.log(`📊 Data range: ${new Date(data[0].timeStamp * 1000).toDateString()} to ${new Date(data[data.length - 1].timeStamp * 1000).toDateString()}`);
    console.log(`💰 Price range: $${Math.min(...data.map(c => c.low)).toFixed(2)} - $${Math.max(...data.map(c => c.high)).toFixed(2)}`);
    
    // Test the pattern detection
    console.log('\n🔍 Testing pattern detection...');
    console.log(`Run: node lib/src/index.js cup-handle AAPL --test-data aapl-jan-apr-2025`);
    
  } catch (error) {
    console.error('❌ Error downloading data:', error.message);
    
    // Create a fallback with mock data if API fails
    console.log('📝 Creating fallback mock data...');
    
    const mockCandles: CandleData[] = [];
    const startPrice = 220;
    const startTime = fromTimestamp;
    
    // Generate realistic AAPL-like data with a cup and handle pattern
    for (let i = 0; i < 90; i++) {
      const timestamp = startTime + (i * 24 * 60 * 60); // Daily intervals
      let price = startPrice;
      
      // Create cup formation (first 60 days)
      if (i < 60) {
        if (i < 20) {
          // Initial decline
          price = startPrice - (i * 2.5);
        } else if (i < 40) {
          // Bottom formation
          price = startPrice - 50 + Math.sin((i - 20) * 0.3) * 5;
        } else {
          // Recovery
          price = (startPrice - 50) + ((i - 40) * 2.2);
        }
      } else {
        // Handle formation (last 30 days)
        const handleStart = startPrice - 6;
        price = handleStart - ((i - 60) * 0.2) + Math.sin((i - 60) * 0.5) * 2;
      }
      
      const volatility = price * 0.02;
      const open = price + (Math.random() - 0.5) * volatility;
      const close = price + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      
      mockCandles.push({
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(50000000 + Math.random() * 30000000),
        timeStamp: timestamp
      });
    }
    
    const fallbackData: TestDataFile = {
      symbol: "AAPL",
      timeframe: "daily",
      description: "AAPL mock data for Jan 1 2025 to Apr 1 2025 period. Generated as fallback when API was unavailable. Contains simulated cup and handle pattern.",
      expectedPattern: {
        type: "cup-and-handle",
        confidence: "MEDIUM",
        shouldDetect: true,
        reason: "Simulated cup and handle pattern"
      },
      candles: mockCandles
    };
    
    const testDataDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    const filename = `aapl-jan-apr-2025-mock.json`;
    const filepath = path.join(testDataDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(fallbackData, null, 2));
    console.log(`✅ Created fallback mock data: ${filepath}`);
  }
}

// Run the download
downloadAAPLData().catch(console.error);
