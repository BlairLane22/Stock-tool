import { standDeviation } from './helpers/standardDeviation';
import { typicalPrice } from './helpers/typicalPrice';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function bollingerBandBuyDecision(candles: Candle[]): void {
  const tp = typicalPrice(20, candles);
  const sd = standDeviation(20, candles);

  const bollinger_band_upper = tp + 2 * sd;
  const bollinger_band_lower = tp - 2 * sd;

  console.log(bollinger_band_upper);
  console.log(bollinger_band_lower);
}

export { bollingerBandBuyDecision };
