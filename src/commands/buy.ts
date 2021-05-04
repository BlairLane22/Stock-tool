import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { macdStochasticOscillator } from '../strategies/macdStochasticOscillator';
import { relativeStrengthIndexBuyDecision } from '../algorithms/relativeStrengthIndex';

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
    relativeStrengthIndexBuyDecision(candles);
    t = macdStochasticOscillator(quote, candles);
  } catch (e) {
    console.log('Something was wrong with the quote. Please run again');
    return 0;
  }

  // Purchase If statement
  if (t) {
    console.log('Buy Stock');
    return 1;
  } else {
    console.log("Don't buy Stock");
    return 0;
  }
}
