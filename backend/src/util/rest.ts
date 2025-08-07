import axios from 'axios';

export async function postData<INPUT, RESULT>(
  { url, jwt }: { url: string; jwt?: string },
  data: INPUT,
): Promise<RESULT> {
  const headers = { Authorization: '' };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  try {
    const reply = await axios.post(`${process.env.REST_API_URL}${url}`, data, {
      headers,
    });
    return reply.data;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

export async function getData<RESULT>(url: string): Promise<RESULT> {
  try {
    const reply = await axios.get(url);
    return reply.data;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

export interface Quote {
  open: number;
  high: number;
  low: number;
  current: number;
  previousClose: number;
}
interface FinnQuote {
  o: number;
  h: number;
  l: number;
  c: number;
  pc: number;
}
export async function getQuote(symbol: string): Promise<Quote> {
  // Try Finnhub first if token is available
  if (process.env.FINNHUB_API_TOKEN && process.env.FINNHUB_API_TOKEN.trim() !== '') {
    try {
      const result = await getData<FinnQuote>(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_TOKEN}`,
      );

      return {
        open: result.o,
        high: result.h,
        low: result.l,
        current: result.c,
        previousClose: result.pc,
      };
    } catch (error) {
      console.log('Finnhub API failed, trying Alpha Vantage...');
    }
  }

  // Fall back to Alpha Vantage
  if (process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY.trim() !== '') {
    try {
      const result = await getData<any>(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
      );

      const quote = result['Global Quote'];
      if (!quote) {
        throw new Error('Invalid Alpha Vantage response');
      }

      return {
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        current: parseFloat(quote['05. price']),
        previousClose: parseFloat(quote['08. previous close']),
      };
    } catch (error) {
      console.log('Alpha Vantage API failed:', error.message);
      throw error;
    }
  }

  throw new Error('No valid API keys found. Please set FINNHUB_API_TOKEN or ALPHA_VANTAGE_API_KEY');
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}
interface FinnCandles {
  o: Array<number>;
  h: Array<number>;
  l: Array<number>;
  c: Array<number>;
  v: Array<number>;
  t: Array<number>;
  s: string;
}
export async function getDailyCandles({
  symbol,
  fromStamp,
  toStamp,
}: {
  symbol: string;
  fromStamp: number;
  toStamp: number;
}): Promise<Array<Candle>> {
  // Try Finnhub first if token is available
  if (process.env.FINNHUB_API_TOKEN && process.env.FINNHUB_API_TOKEN.trim() !== '') {
    try {
      const result = await getData<FinnCandles>(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=W&from=${fromStamp}&to=${toStamp}&token=${process.env.FINNHUB_API_TOKEN}`,
      );

      const candles: Array<Candle> = [];

      if (result.o) {
        result.o.forEach((v, i) => {
          candles.push({
            open: result.o[i],
            high: result.h[i],
            low: result.l[i],
            close: result.c[i],
            volume: result.v[i],
            timeStamp: result.t[i],
          });
        });
      }

      return candles;
    } catch (error) {
      console.log('Finnhub API failed, trying Alpha Vantage...');
    }
  }

  // Fall back to Alpha Vantage
  if (process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY.trim() !== '') {
    try {
      // Alpha Vantage uses weekly data for longer timeframes
      const result = await getData<any>(
        `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
      );

      const timeSeries = result['Weekly Time Series'];
      if (!timeSeries) {
        throw new Error('Invalid Alpha Vantage response or API limit reached');
      }

      const candles: Array<Candle> = [];

      // Convert Alpha Vantage data to our format
      Object.keys(timeSeries).forEach(date => {
        const timestamp = new Date(date).getTime() / 1000;

        // Filter by date range
        if (timestamp >= fromStamp && timestamp <= toStamp) {
          const data = timeSeries[date];
          candles.push({
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume']),
            timeStamp: timestamp,
          });
        }
      });

      // Sort by timestamp (oldest first)
      candles.sort((a, b) => a.timeStamp - b.timeStamp);

      return candles;
    } catch (error) {
      console.log('Alpha Vantage API failed:', error.message);
      throw error;
    }
  }

  throw new Error('No valid API keys found. Please set FINNHUB_API_TOKEN or ALPHA_VANTAGE_API_KEY');
}
