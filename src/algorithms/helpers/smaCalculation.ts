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
  const num = candles.length;

  for (let x = 1; x <= days; x++) {
    const candle = candles[num - x];
    sum += candle.close;
    // console.log(candle.close);
  }

  return sum / days;
}

export { smaCalculation };
