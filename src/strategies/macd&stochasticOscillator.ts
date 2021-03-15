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

function macdStochasticOscillator(quote: Quote, candles: Candle[]): boolean {
  const macd = macdBuyDecision(quote, candles);
  const k = stochasticOscillatorBuyDecision(candles);

  if (macd && k) {
    return true;
  } else {
    return false;
  }
}

export { macdStochasticOscillator };
