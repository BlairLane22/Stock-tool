interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

interface Quote {
  open: number;
  high: number;
  low: number;
  current: number;
  previousClose: number;
}

function emaCalculation(
  days: number,
  duration: number,
  quote: Quote,
  candles: Candle[],
): number[] {
  const num = candles.length;
  let sum = 0;

  for (let t = days; t > 0; t -= 1) {
    sum += candles[num - days - t].close;
  }

  const ema_final = [sum / days];

  for (let a = 1; a < days; a += 1) {
    const ema =
      candles[num - days + a].close * (2 / (1 + days)) +
      ema_final[a - 1] * (1 - 2 / (1 + days));
    ema_final.push(ema);
  }

  return ema_final;
}

export { emaCalculation };
