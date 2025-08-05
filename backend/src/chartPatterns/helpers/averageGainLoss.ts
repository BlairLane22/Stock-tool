interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timeStamp: number;
  }

  function percentageGainLoss(duration: number, candles: Candle[]) {
    const num = candles.length;
    let count = 0;
    const gain_percent = [];
    const loss_percent = [];

    for (let s = 1; s < num; s += 1) {
        const diff = candles[s].close - candles[s - 1].close;
    
        if (diff > 0) {
          gain_percent[count] = diff;
          loss_percent[count] = 0;
        } else {
          gain_percent[count] = 0;
          loss_percent[count] = diff;
        }
    
        count += 1;
      }

      return { gain_percent, loss_percent };
  }
  
  function averageGainLoss(days: number, duration: number, candles: Candle[]) {
    const num = candles.length;
  
    const gain: number[] = [];
    const loss: number[] = [];

    let gain_percent: number[] = percentageGainLoss(duration, candles).gain_percent;
    let loss_percent: number[] = percentageGainLoss(duration, candles).loss_percent;

    for (let d = num - days; d < num; d++) {
      let gain_sum = 0;
      let loss_sum = 0;
      const gain_num = gain.length;
      const loss_num = loss.length;
  
      for (let y = d - days; y < d; y++) {
        gain_sum += gain_percent[y];
        loss_sum += loss_percent[y];
      }
      
      gain.push(gain[gain_num - 1] * 13 + gain_sum / days);
      loss.push(loss[loss_num - 1] * 13 + loss_sum / days);
    }
  
    return { gain, loss };
  }
  
  export { averageGainLoss };