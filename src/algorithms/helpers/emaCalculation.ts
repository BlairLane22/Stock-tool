interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function emaCalculation(days: number, candles: Candle[]): number {
  let ema = 0;
  let ema_before = 0;
  const smoothing_factor = 2 / (days + 1);
  const multiplier = smoothing_factor / (1 + days);

  for (let a = 0; a < days; a++) {
    const x = 1 - multiplier;
    const y = candles[a].close;

    ema = y + ema_before * x;
    ema_before = ema;
  }

  return ema;
}

export { emaCalculation };
