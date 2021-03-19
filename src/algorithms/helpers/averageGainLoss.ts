interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function main(days: number, candles: Candle[]) {
  const high = [];
  const low = [];
  const num = candles.length;

  for (let u = days; u > 0; u -= 1) {
    const today = candles[num - u].close;
    const yesterday = candles[num - u - 1].close;

    const sum = (today - yesterday) / today;

    if (sum > 0) {
      high.push(sum);
    } else {
      low.push(sum);
    }
  }

  let sumHigh = 0;
  let sumLow = 0;

  for (let i = 0; i < high.length; i++) {
    sumHigh += high[i];
  }

  for (let i = 0; i < low.length; i++) {
    sumLow += low[i];
  }

  sumHigh /= days;
  sumLow /= days;

  return { sumHigh, sumLow };
}

export { main };
