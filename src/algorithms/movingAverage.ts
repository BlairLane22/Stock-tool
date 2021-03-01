import { smaCalculation } from './helpers/smaCalculation';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function movingAverageBuyDecision(days: number, candles: Candle[]): number {
  return smaCalculation(days, candles);
}

export { movingAverageBuyDecision };
