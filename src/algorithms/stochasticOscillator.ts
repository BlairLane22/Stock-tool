interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function stochasticOscillator(days: number, candles: Candle[]): number {
  const num = candles.length;

  let highest = candles[num - days].high;
  let lowest = candles[num - days].low;

  for (let x = 1; x <= days; x++) {
    if (candles[num - days + x - 1].close > highest) {
      highest = candles[num - days + x - 1].high;
    }

    if (candles[num - days + x - 1].low < lowest) {
      lowest = candles[num - days + x - 1].low;
    }
  }

  const numerator = candles[num - 1].close - lowest;
  const denominator = highest - lowest;

  const k = (numerator / denominator) * 100;

  return k;
}

function stochasticOscillatorBuyDecision(candles: Candle[]): number {
  const k = stochasticOscillator(14, candles);

  if (k < 15) {
    console.log('Stochastic Oscillator: Buy Stock');
    return 5;
  } else {
    console.log('Stochastic Oscillator: Neutral');
    return 0;
  }
}

export { stochasticOscillatorBuyDecision, stochasticOscillator };
