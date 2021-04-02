import { lte } from 'lodash';
import { emaCalculation } from './helpers/emaCalculation';

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

function checkSlope(macd: number[]) {
  let sum = 0;
  for (let c = 1; c < macd.length; c++) {
    if (macd[c] > 0) {
      sum += macd[c] - macd[c - 1];
    } else {
      sum -= macd[c - 1] - macd[c];
    }
  }

  return sum / macd.length;
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

  // console.log(macd);
  const slope = checkSlope(macd);
  // console.log(slope);
  // console.log(macd[11]);
  // console.log(signal_line);

  if (macd[11] > signal_line && slope > 0.25) {
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
