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
  const signal_line = emaCalculation(9, 350, quote, candles);
  const ema_12 = emaCalculation(12, 350, quote, candles);
  const ema_26 = emaCalculation(26, 350, quote, candles);
  // const ema_27 = emaCalculation(60, 350, quote, candles);
  let macd = false;

  // console.log(ema_12);
  // console.log(ema_26);
  // console.log(ema_27);

  const ema_1 = ema_12[11] - ema_26[25];
  const ema_2 = ema_12[10] - ema_26[24];
  const ema_3 = ema_12[9] - ema_26[23];
  const ema_4 = ema_12[8] - ema_26[22];
  const ema_5 = ema_12[7] - ema_26[21];
  const ema_6 = ema_12[6] - ema_26[20];

  const ema_average_1 = (ema_1 + ema_2) / 2;
  const ema_average_2 = (ema_3 + ema_4) / 2;
  const ema_average_3 = (ema_5 + ema_6) / 2;

  if (
    ema_average_1 > ema_average_2 &&
    ema_average_2 > ema_average_3 &&
    ema_average_1 > signal_line[8]
  ) {
    macd = true;
  }

  if (macd) {
    console.log('MACD: Buy Stock');
    return true;
  } else {
    console.log('MACD: Neutral');
    return false;
  }
}

export { macdBuyDecision };
