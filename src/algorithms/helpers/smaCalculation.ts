interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

// Returns the sma over a certain period
function smaCalculation(
  days: number,
  duration: number,
  candles: Candle[],
): number[] {
  let sum = 0;
  const num = candles.length;
  const sma = [];

  for (let t = duration; t > 0; t -= 1) {
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
