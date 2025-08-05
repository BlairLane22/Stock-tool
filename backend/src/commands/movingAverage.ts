import { movingAverageCalculation } from '../chartPatterns/helpers/movingAverage';
import { getCandles } from './helper/getCandles';


export async function movingAverage(symbol: string, num: number): Promise<number[]> {
    let startTime = new Date();
    let candles = await getCandles(symbol);

    startTime = new Date();
    let g: number[] = movingAverageCalculation(candles, num);
    let duration = ((new Date().valueOf() - startTime.valueOf()) / 1000).toFixed(10)
    console.log("movingAverage took: " + duration + " seconds")

    // console.log(g);

    return g;
}