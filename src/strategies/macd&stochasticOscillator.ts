// import { stochasticOscillator } from '../algorithms/stochasticOscillator';

import { stochasticOscillatorBuyDecision } from '../algorithms/stochasticOscillator';
import { macdBuyDecision } from '../algorithms/macd';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface Quote {
  open: number;
  high: number;
  low: number;
  current: number;
  previousClose: number;
}

function macdStochasticOscillator(quote: Quote, candles: Candle[]) {
  const macd_buy = macdBuyDecision(quote, candles);
  const k_buy = stochasticOscillatorBuyDecision(candles);

  return { macd_buy: macd_buy, k_buy: k_buy };
}

export { macdStochasticOscillator };
