import { exit } from '../util/exit';
import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { movingAverageBuyDecision } from '../algorithms/movingAverage';

export async function buy(
  symbol: string,
  cmdObj: Record<string, unknown>,
): Promise<void> {
  const quote = await getQuote(symbol.toUpperCase());

  const end: number = Date.now() / 1000 - 18000;
  const seconds = 86400; //number of seconds in a day
  const days = 20;
  const x = days / 7;
  const last3days: number = end + Math.floor(x * 2) - days * seconds;

  const candles = await getDailyCandles({
    symbol: symbol,
    fromStamp: Math.floor(last3days),
    toStamp: Math.floor(end),
  });

  //   Buy Decision
  const ma_buy = movingAverageBuyDecision(5, candles);

  //   console.log(candles[0].open);

  //   console.log(quote.open);
  console.log(Math.floor(last3days));
  console.log(Math.floor(end));
  console.log('Moving average: ' + ma_buy);

  exit(0);
}
