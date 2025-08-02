import { getDailyCandles } from '../../util/rest';

interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timeStamp: number;
}

export function getCandles(symbol: string): Promise<Candle[]> {
    const end: number = Date.now() / 1000 - 18000; // The 18000 is for the 5 hour difference between new york city and the GMT time, in seconds
    const start: number = end - (2 * 365 * 24 * 60 * 60); // 2 years ago in seconds
    let candles = getDailyCandles({
      symbol: symbol,
      fromStamp: Math.floor(start),
      toStamp: Math.floor(end),
    });

    return candles;
}
