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

function macdBuyDecision(quote: Quote, candles: Candle[]): boolean {
  const ema_12 = emaCalculation(12, 350, quote, candles);
  const ema_26 = emaCalculation(26, 350, quote, candles);
  // const ema_27 = emaCalculation(60, 350, quote, candles);

  // console.log(ema_12);
  // console.log(ema_26);
  // console.log(ema_27);

  const ema_final = ema_12[11] - ema_26[25];
  if (ema_final > 0) {
    console.log('MACD: Buy Stock');
    return true;
  } else {
    console.log('MACD: Neutral');
    return false;
  }
}

export { macdBuyDecision };
