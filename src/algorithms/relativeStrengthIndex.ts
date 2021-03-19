import { main } from './helpers/averageGainLoss';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function thanks(candles: Candle[]): void {
  const averages = main(14, candles);

  console.log(averages.sumHigh);
  console.log(averages.sumLow);
}

export { thanks };
