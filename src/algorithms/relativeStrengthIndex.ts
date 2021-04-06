import { averageGainLoss } from './helpers/averageGainLoss';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function relativeStrengthIndexBuyDecision(candles: Candle[]): void {
  const averages = averageGainLoss(14, candles);
  const gain = averages.gain;
  const loss = averages.loss;

  console.log(gain);
  console.log(loss);

  const rs = gain / loss;
  console.log(rs);

  const s1 = 100 - 100 / (1 + rs);
  console.log('Final: ' + s1);
}

export { relativeStrengthIndexBuyDecision };
