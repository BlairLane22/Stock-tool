import { exit } from '../util/exit';
import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { macdStochasticOscillator } from '../strategies/macd&StochasticOscillator';
import { thanks } from '../algorithms/relativeStrengthIndex';

export async function buy(
  symbol: string,
  cmdObj: Record<string, unknown>,
): Promise<void> {
  const quote = await getQuote(symbol.toUpperCase());

  const end: number = Date.now() / 1000 - 18000; // The 18000 is for the 5 hour difference between new york city and the GMT time, in seconds

  const candles = await getDailyCandles({
    symbol: symbol,
    fromStamp: 1,
    toStamp: Math.floor(end),
  });

  //   Buy Decision
  thanks(candles);
  const t = macdStochasticOscillator(quote, candles);

  // Purchase If statement
  if (t) {
    console.log('Buy Stock');
  } else {
    console.log("Don't buy Stock");
  }

  exit(0);
}
