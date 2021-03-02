import { typicalPrice } from '../helpers/typicalPrice';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function standDeviation(days: number, candles: Candle[]): number {
  let sum = 0;
  const num = candles.length;

  for (let s = 1; s <= days; s++) {
    const y =
      (candles[num - days + s - 1].close - typicalPrice(days, candles)) ** 2;
    sum += y;
  }

  return Math.sqrt(sum / (days - 1));
}

export { standDeviation };
