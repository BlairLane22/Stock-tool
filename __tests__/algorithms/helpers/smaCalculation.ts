import { smaCalculation } from '../../../src/algorithms/helpers/smaCalculation';

describe('Test smaCalculation', () => {
  test('smaCalculation over 3 days', async () => {
    const sma = smaCalculation(3, [
      {
        open: 870.35,
        high: 891.5,
        low: 858.66,
        close: 864.16,
        volume: 27333955,
        timeStamp: Date.parse('27 Jan 2021 00:00:00 GMT') / 1000,
      },
      {
        open: 820.0,
        high: 848.0,
        low: 801.0,
        close: 835.43,
        volume: 26378048,
        timeStamp: Date.parse('28 Jan 2021 00:00:00 GMT') / 1000,
      },
      {
        open: 830.0003,
        high: 842.41,
        low: 780.1,
        close: 793.53,
        volume: 34990754,
        timeStamp: Date.parse('29 Jan 2021 00:00:00 GMT') / 1000,
      },
    ]);
    expect(sma).toEqual(831.04);
  });
});
