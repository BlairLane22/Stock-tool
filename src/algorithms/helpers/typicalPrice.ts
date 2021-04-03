interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

// Returns the typical price over a certain period
function typicalPrice(days: number, candles: Candle[]): number {
  let sum = 0;
  const num = candles.length;

  for (let t = 1; t <= days; t++) {
    sum +=
      (candles[num - days + t - 1].high +
        candles[num - days + t - 1].low +
        candles[num - days + t - 1].close) /
      3;
  }

  return sum / days;
}

export { typicalPrice };
