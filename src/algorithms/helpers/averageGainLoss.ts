interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function averageGainLoss(days: number, duration: number, candles: Candle[]) {
  const num = candles.length;

  const gain_percent = [];
  const loss_percent = [];
  let count = 0;

  const gain: number[] = [50];
  const loss: number[] = [50];

  for (let s = num - duration; s < num; s += 1) {
    const diff = candles[s].close - candles[s - 1].close;

    if (diff > 0) {
      gain_percent[count] = diff;
      loss_percent[count] = 0;
    } else {
      gain_percent[count] = 0;
      loss_percent[count] = diff;
    }

    count += 1;
  }

  for (let d = num - days; d < num; d++) {
    let gain_sum = 0;
    let loss_sum = 0;
    const gain_num = gain.length;
    const loss_num = loss.length;

    for (let y = d - days; y < d; y++) {
      gain_sum += gain_percent[y];
      loss_sum += loss_percent[y];
    }
    // console.log(gain[gain_num - 1] * 13 + gain_sum / days);

    gain.push(gain[gain_num - 1] * 13 + gain_sum / days);
    loss.push(loss[loss_num - 1] * 13 + loss_sum / days);
  }

  return { gain, loss };
}

export { averageGainLoss };
