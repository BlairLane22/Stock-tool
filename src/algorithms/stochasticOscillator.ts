interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}
function stochasticOscillator(
  days: number,
  duration: number,
  candles: Candle[],
): number[] {
  const num = candles.length;
  const arr_final = [];

  let highest = candles[num - days].high;
  let lowest = candles[num - days].low;

  for (let t = duration; t > 0; t -= 1) {
    for (let x = 1; x <= days; x++) {
      if (candles[num - days + x - t].close > highest) {
        highest = candles[num - days + x - t].high;
      }

      if (candles[num - days + x - 1].low < lowest) {
        lowest = candles[num - days + x - t].low;
      }
    }
    const numerator = candles[num - 1].close - lowest;
    const denominator = highest - lowest;

    arr_final.push((numerator / denominator) * 100);
  }

  return arr_final;
}

function stochasticOscillatorBuyDecision(candles: Candle[]): boolean {
  const k = stochasticOscillator(14, 20, candles);

  // console.log(k);

  if (k[19] < 15) {
    console.log('Stochastic Oscillator: Buy Stock');
    return true;
  } else {
    console.log('Stochastic Oscillator: Neutral');
    return false;
  }
}

export { stochasticOscillator, stochasticOscillatorBuyDecision };
