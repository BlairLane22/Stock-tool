import { exit } from '../util/exit';
import { getQuote } from '../util/rest';
import { getDailyCandles } from '../util/rest';
import { movingAverageBuyDecision } from '../algorithms/movingAverage';
import { stochasticOscillatorBuyDecision } from '../algorithms/stochasticOscillator';
import { bollingerBandBuyDecision } from '../algorithms/bollingerBand';
import { macdBuyDecision } from '../algorithms/macd';

export async function buy(
  symbol: string,
  cmdObj: Record<string, unknown>,
): Promise<void> {
  const quote = await getQuote(symbol.toUpperCase());

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
  const bb_buy = bollingerBandBuyDecision(quote, candles);
  const macd_buy = macdBuyDecision(candles);

  // Total buy score
  const buy_score = ma_buy + k_buy + bb_buy + macd_buy;

  // Purchase If statement
  if (buy_score >= 10) {
    console.log('Buy Stocks');
  } else {
    console.log("Don't buy stock");
  }
  //   console.log(candles[0].open);

  // console.log(candles);
  // console.log(Math.floor(last3days));
  // console.log(Math.floor(end));

  exit(0);
}
