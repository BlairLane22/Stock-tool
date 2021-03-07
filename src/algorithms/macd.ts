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

function macdBuyDecision(quote: Quote, candles: Candle[]): number {
  const ema_12 = emaCalculation(10, quote, candles);
  const ema_26 = emaCalculation(30, quote, candles);
  const ema_27 = emaCalculation(60, quote, candles);

  // const ema_final_before = ema_12_before - ema_26_before

  console.log(ema_12);
  console.log(ema_26);
  console.log(ema_27);

  const ema_final = ema_12[9] - ema_26[25];
  if (ema_final > 0) {
    console.log('MACD: Buy Stock');
    return 5;
  } else {
    console.log('MACD: Neutral');
    return 0;
  }
}

export { macdBuyDecision };
