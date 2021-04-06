interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function averageGainLoss(days: number, candles: Candle[]) {
  const num = candles.length;

  const gain_percent = [];
  const loss_percent = [];
  let count = 0;

  for (let s = num - days; s < num; s += 1) {
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

  let gain_sum = 0;
  let loss_sum = 0;

  for (let y = 0; y < 14; y++) {
    gain_sum += gain_percent[y];
    loss_sum += loss_percent[y];
  }

  const gain = gain_sum / 14;
  const loss = loss_sum / 14;

  return { gain, loss };
}

export { averageGainLoss };
