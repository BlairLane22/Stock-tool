import { emaCalculation } from './helpers/emaCalculation';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function macdBuyDecision(candles: Candle[]): number {
  const ema_12 = emaCalculation(12, candles);
  const ema_26 = emaCalculation(26, candles);

  // const ema_final_before = ema_12_before - ema_26_before

  const ema_final = ema_12 - ema_26;
  if (ema_final > 0) {
    console.log('MACD: Buy Stock');
    return 5;
  } else {
    console.log('MACD: Neutral');
    return 0;
  }
}

export { macdBuyDecision };
