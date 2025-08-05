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

async function fetchIBMData() {
  const url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&outputsize=full&apikey=demo";
  
  console.log('Fetching IBM data from Alpha Vantage...');
  console.log(`URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('✅ Response received');
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    // Check for API errors
    if (response.data['Error Message']) {
      throw new Error(`API Error: ${response.data['Error Message']}`);
    }
    
    if (response.data['Note']) {
      console.log(`⚠️ API Note: ${response.data['Note']}`);
    }
    
    const timeSeries = response.data['Time Series (Daily)'];
    
    if (!timeSeries) {
      console.log('Available keys in response:', Object.keys(response.data));
      throw new Error('Time Series (Daily) not found in response');
    }
    
    console.log(`📊 Processing time series data...`);
    
    const candles: CandleData[] = [];
    const dates = Object.keys(timeSeries).sort(); // Sort dates chronologically
    
    console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    console.log(`📈 Total trading days: ${dates.length}`);
    
    dates.forEach(date => {
      const dayData = timeSeries[date];
      const timestamp = Math.floor(new Date(date + 'T16:00:00-05:00').getTime() / 1000); // NYSE close time
      
      candles.push({
        open: parseFloat(dayData['1. open']),
        high: parseFloat(dayData['2. high']),
        low: parseFloat(dayData['3. low']),
        close: parseFloat(dayData['4. close']),
        volume: parseInt(dayData['5. volume']),
        timeStamp: timestamp
      });
    });
    
    // Get recent data (last 200 trading days for pattern analysis)
    const recentCandles = candles.slice(-200);
    
    // Create test data file
    const testData: TestDataFile = {
      symbol: "IBM",
      timeframe: "daily",
      description: `IBM daily stock data from Alpha Vantage API. Contains ${recentCandles.length} recent trading days. Downloaded on ${new Date().toISOString()}. Real market data for cup and handle pattern analysis.`,
      expectedPattern: {
        type: "unknown",
        confidence: "UNKNOWN",
        shouldDetect: false,
        reason: "Real market data - pattern detection to be determined by algorithm"
      },
      candles: recentCandles
    };
    
    // Save to test-data directory
    const testDataDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    const filename = `ibm-recent-data.json`;
    const filepath = path.join(testDataDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(testData, null, 2));
    
    console.log(`✅ Successfully saved ${recentCandles.length} candles to ${filepath}`);
    console.log(`📊 Recent data range: ${new Date(recentCandles[0].timeStamp * 1000).toDateString()} to ${new Date(recentCandles[recentCandles.length - 1].timeStamp * 1000).toDateString()}`);
    console.log(`💰 Price range: $${Math.min(...recentCandles.map(c => c.low)).toFixed(2)} - $${Math.max(...recentCandles.map(c => c.high)).toFixed(2)}`);
    console.log(`📈 Start: $${recentCandles[0].close.toFixed(2)} | End: $${recentCandles[recentCandles.length - 1].close.toFixed(2)} | Change: ${((recentCandles[recentCandles.length - 1].close - recentCandles[0].close) / recentCandles[0].close * 100).toFixed(1)}%`);
    
    // Also save full dataset
    const fullTestData: TestDataFile = {
      symbol: "IBM",
      timeframe: "daily",
      description: `IBM complete daily stock data from Alpha Vantage API. Contains ${candles.length} total trading days. Downloaded on ${new Date().toISOString()}. Full historical data for comprehensive analysis.`,
      expectedPattern: {
        type: "unknown",
        confidence: "UNKNOWN",
        shouldDetect: false,
        reason: "Full historical market data - multiple patterns may exist"
      },
      candles: candles
    };
    
    const fullFilename = `ibm-full-data.json`;
    const fullFilepath = path.join(testDataDir, fullFilename);
    
    fs.writeFileSync(fullFilepath, JSON.stringify(fullTestData, null, 2));
    console.log(`✅ Also saved full dataset (${candles.length} candles) to ${fullFilename}`);
    
    console.log('\n🔍 To test pattern detection, run:');
    console.log(`node lib/src/index.js cup-handle IBM --test-data ibm-recent-data`);
    console.log(`node lib/src/index.js cup-handle IBM --test-data ibm-full-data`);
    
    // Show some sample data
    console.log('\n📋 Sample data (last 5 days):');
    recentCandles.slice(-5).forEach(candle => {
      const date = new Date(candle.timeStamp * 1000).toDateString();
      console.log(`  ${date}: Open $${candle.open}, High $${candle.high}, Low $${candle.low}, Close $${candle.close}, Volume ${candle.volume.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching IBM data:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

// Run the fetch
fetchIBMData().catch(console.error);
