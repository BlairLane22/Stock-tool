import { smaCalculation } from '../helpers/smaCalculation';

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

function emaCalculation(
  days: number,
  quote: Quote,
  candles: Candle[],
): number[] {
  const num = candles.length;
  const ema_final = [smaCalculation(days, candles)[0]];
  let ema = 0;
  const smoothing_factor = 2 / (days + 1);

  for (let a = days; a > 0; a -= 1) {
    ema =
      (candles[num - a].close - ema_final[days - a]) * smoothing_factor +
      ema_final[days - a];
    ema_final.push(ema);
  }

  return ema_final;
}

export { emaCalculation };
