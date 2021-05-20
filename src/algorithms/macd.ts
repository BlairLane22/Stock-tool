import { emaCalculation } from './helpers/emaCalculation';
import { checkSlope } from './helpers/slopeCalculation';

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

function signalLine(macd: number[]): number {
  const num = macd.length;
  let sum = 0;
  for (let y = num - 9; y < num; y++) {
    sum += macd[y];
  }

  return sum / 9;
}

function macdBuyDecision(quote: Quote, candles: Candle[]): boolean {
  const ema_3 = emaCalculation(3, 350, quote, candles);
  const ema_6 = emaCalculation(6, 350, quote, candles);
  const ema_12 = emaCalculation(12, 350, quote, candles);
  const ema_26 = emaCalculation(26, 350, quote, candles);
  // const ema_27 = emaCalculation(60, 350, quote, candles);
  let macd_buy = false;

  const macd = [];

  for (let t = 0; t < 12; t++) {
    macd.push(ema_12[t] - ema_26[t + 14]);
  }

  const signal_line = signalLine(macd);
  const slope = checkSlope(macd, 3);

  if (macd[11] > signal_line && slope > 0.1) {
    macd_buy = true;
  }

  if (macd_buy) {
    console.log('MACD: Buy Stock');
    return true;
  } else {
    console.log('MACD: Neutral');
    return false;
  }
}

export { macdBuyDecision };
