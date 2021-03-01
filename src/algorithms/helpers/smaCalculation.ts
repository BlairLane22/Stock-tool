interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function smaCalculation(days: number, candles: Candle[]): number {
  let sum = 0;

  for (let x = 0; x < days; x++) {
    const candle = candles[x];
    sum += candle.close;
    // console.log(candles[x]);
  }

  return sum / days;
}

export { smaCalculation };
