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
  //const fromStamp = from.getTime() / 1000;
  //const toStamp = to.getTime() / 1000;
  const result = await getData<FinnCandles>(
    `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromStamp}&to=${toStamp}&token=${process.env.FINNHUB_API_TOKEN}`,
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
}
