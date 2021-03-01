interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function smaCalculation(days: number, candles: Candle[]): number {
  const sum = 0;

  for (let x = 100 - days; x < 100; x++) {
    console.log(candles[x]);
  }

  return sum / days;
}

export { smaCalculation };
