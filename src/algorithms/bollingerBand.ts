import { standDeviation } from './helpers/standardDeviation';
import { typicalPrice } from './helpers/typicalPrice';

interface Quote {
  open: number;
  high: number;
  low: number;
  current: number;
  previousClose: number;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function bollingerBandBuyDecision(quotes: Quote, candles: Candle[]): number {
  const tp = typicalPrice(20, candles);
  const sd = standDeviation(20, candles);

  const bollinger_band_upper = tp + 2 * sd;
  //   const bollinger_band_lower = tp - 2 * sd;

  if (quotes.current > bollinger_band_upper) {
    console.log('Bollinger Band: Buy Stocks');
    return 5;
  } else {
    console.log('Bollinger Band: Neutral');
    return 0;
  }
}

export { bollingerBandBuyDecision };
