import { checkSlope } from './helpers/slopeCalculation';

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

function smaStochasticOscillator(k: number[]): number[] {
  const num = k.length;
  const sma = [];

  for (let t = 3; t < num; t += 1) {
    let sum = 0;
    for (let x = 0; x < 3; x++) {
      sum += k[t - x];
    }
    sma.push(sum / 3);
  }

  return sma;
}

function stochasticOscillatorBuyDecision(candles: Candle[]): boolean {
  const k = stochasticOscillator(14, 10, candles);
  const d = smaStochasticOscillator(k);
  const slope = checkSlope(k, 3);
  let k_buy = false;

  if (k > d && slope > 0.2) {
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
