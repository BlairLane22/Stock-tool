import { exit } from '../util/exit';
import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { movingAverageBuyDecision } from '../algorithms/movingAverage';

import { bollingerBandBuyDecision } from '../algorithms/bollingerBand';
import { macdStochasticOscillator } from '../strategies/macd&StochasticOscillator';

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
  // const ma_buy = movingAverageBuyDecision(candles);
  // const bb_buy = bollingerBandBuyDecision(quote, candles);

  const t = macdStochasticOscillator(quote, candles);

  // Purchase If statement
  if (t) {
    console.log('Buy Stocks');
  } else {
    console.log("Don't buy stock");
  }

  exit(0);
}
