import { movingAverage } from './movingAverage';

export async function runChartPatterns(symbol: string): Promise<void> {
    let x: number[] = await movingAverage(symbol, 25);
    let y: number[] = await movingAverage(symbol, 50);
    let z: number[] = await movingAverage(symbol, 200);

    console.log(x[x.length - 1]);
    console.log(y[y.length - 1]);
    console.log(z[z.length - 1]);

    if(y[y.length - 1] > z[z.length - 1] && x[x.length - 1] > y[y.length - 1]) {
      console.log("Buy")
    } else {
      console.log("Don't buy")
    }
}