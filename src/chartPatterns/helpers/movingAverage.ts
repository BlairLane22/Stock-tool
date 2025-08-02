interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timeStamp: number;
}

export function movingAverageCalculation(data: Candle[], num: number): number[] {
    const sma = [];
    // console.log(data.length)

    for (let t = num-1; t < data.length; t++) {
        let sum: number = 0;
        for (let x = 0; x < num; x++) {
            sum += data[t-x].close;
        }
        sma.push(parseFloat((sum/num).toFixed(2)));
    }

    return sma;
}