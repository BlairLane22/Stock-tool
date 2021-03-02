import { smaCalculation } from './helpers/smaCalculation';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeStamp: number;
}

function movingAverageBuyDecision(candles: Candle[]): number {
  const sma_50 = smaCalculation(50, candles);
  const sma_20 = smaCalculation(20, candles);
  const sma_8 = smaCalculation(8, candles);
  // console.log('Moving average: ' + sma_50);
  // console.log('Moving average: ' + sma_20);
  // console.log('Moving average: ' + sma_8);

  //  BUY STOCKS (check if the moving average the day befor it is less than the one today is)

  if (sma_20 > sma_50 && sma_8 > sma_20) {
    console.log('Moving average: Buy Stock');
    return 5;
  } else {
    console.log('Moving average: Neutral');
    return 0;
  }
}

export { movingAverageBuyDecision };
