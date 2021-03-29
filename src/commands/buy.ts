import { exit } from '../util/exit';
import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { macdStochasticOscillator } from '../strategies/macd&StochasticOscillator';
import { thanks } from '../algorithms/relativeStrengthIndex';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

export async function buy(
  symbol: string,
  cmdObj: Record<string, unknown>,
): Promise<number> {
  let quote;
  let candles;

  try {
    quote = await getQuote(symbol.toUpperCase());
    const end: number = Date.now() / 1000 - 18000; // The 18000 is for the 5 hour difference between new york city and the GMT time, in seconds
    candles = await getDailyCandles({
      symbol: symbol,
      fromStamp: 1,
      toStamp: Math.floor(end),
    });
  } catch (e) {
    console.log('Could not find quote. Please run again');
    return 0;
  }

  let t;
  try {
    //   Buy Decision
    thanks(candles);
    t = macdStochasticOscillator(quote, candles);
  } catch (e) {
    console.log('Something was wrong with the quote. Please run again');
    return 0;
  }

  // Purchase If statement
  if (t) {
    console.log('Buy Stock');
  } else {
    console.log("Don't buy Stock");
  }

  exit(0);
  return 0;
}
