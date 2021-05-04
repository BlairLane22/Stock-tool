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
  const averages = averageGainLoss(14, 250, candles);
  const gain = averages.gain;
  const loss = averages.loss;
  const gain_num = gain.length;
  const loss_num = loss.length;
  let rs = 0;

  console.log(gain);
  console.log(loss);

  for (let s = 0; s < gain_num; s++) {
    rs = gain[gain_num] / loss[loss_num];
  }
  console.log(rs);

  const s1 = 100 - 100 / (1 + rs);
  console.log('Final: ' + s1);
}

export { relativeStrengthIndexBuyDecision };
