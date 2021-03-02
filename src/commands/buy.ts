import { exit } from '../util/exit';
import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { movingAverageBuyDecision } from '../algorithms/movingAverage';
import { stochasticOscillatorBuyDecision } from '../algorithms/stochasticOscillator';
import { bollingerBandBuyDecision } from '../algorithms/bollingerBand';

export async function buy(
  symbol: string,
  cmdObj: Record<string, unknown>,
): Promise<void> {
  // const quote = await getQuote(symbol.toUpperCase());

  const end: number = Date.now() / 1000 - 18000;

  // console.log(Math.floor(last3days));
  // console.log(Math.floor(end));

  const candles = await getDailyCandles({
    symbol: symbol,
    fromStamp: 1,
    toStamp: Math.floor(end),
  });

  //   Buy Decision
  const ma_buy = movingAverageBuyDecision(candles);
  const k_buy = stochasticOscillatorBuyDecision(candles);
  const bb_buy = bollingerBandBuyDecision(candles);

  //   console.log(candles[0].open);

  // console.log(candles);
  // console.log(Math.floor(last3days));
  // console.log(Math.floor(end));

  exit(0);
}
