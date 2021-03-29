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

  for (let t = duration; t > 0; t -= 1) {
    let highest = candles[num - days].high;
    let lowest = candles[num - days].low;

    for (let x = 1; x <= days; x++) {
      if (candles[num - days - t + x].high > highest) {
        highest = candles[num - days - t + x].high;
      }

      if (candles[num - days - t + x].low < lowest) {
        lowest = candles[num - days - t + x].low;
      }
    }

    const numerator = candles[num - t].close - lowest;
    const denominator = highest - lowest;

    arr_final.push((numerator / denominator) * 100);
  }

  return arr_final;
}

function stochasticOscillatorBuyDecision(candles: Candle[]): boolean {
  const k = stochasticOscillator(14, 50, candles);
  let k_buy = false;
  // console.log(k);

  const k_19 = k[19];
  const k_18 = k[18];
  const k_17 = k[17];

  if (k_19 > k_18 && k_19 > (k_18 + k_17) / 2) {
    k_buy = true;
  }

  if (k_buy) {
    console.log('Stochastic Oscillator: Buy Stock');
    return true;
  } else {
    console.log('Stochastic Oscillator: Neutral');
    return false;
  }
}

export { stochasticOscillator, stochasticOscillatorBuyDecision };
