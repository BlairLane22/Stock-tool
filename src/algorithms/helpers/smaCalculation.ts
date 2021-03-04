interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function smaCalculation(days: number, candles: Candle[]): number[] {
  let sum = 0;
  const num = candles.length;
  const sma = [];

  for (let t = days; t > 0; t -= 1) {
    for (let x = 1; x <= days; x++) {
      sum += candles[num - days + x - t].close;
      // console.log(candle.close);
    }
    sma.push(sum / days);
    sum = 0;
  }

  return sma;
}

export { smaCalculation };
