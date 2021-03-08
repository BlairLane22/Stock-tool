import { stochasticOscillator } from '../../src/algorithms/stochasticOscillator';

describe('Test stochaticOscillator', () => {
  test('stochaticOscillator over 3 days', async () => {
    const k = stochasticOscillator(5, [
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
      {
        open: 814.29,
        high: 842,
        low: 795.56,
        close: 839.81,
        volume: 25391390,
        timeStamp: Date.parse('1 Feb 2021 00:00:00 GMT') / 1000,
      },
      {
        open: 844.68,
        high: 880.5,
        low: 842.2,
        close: 872.79,
        volume: 24346210,
        timeStamp: Date.parse('2 Feb 2021 00:00:00 GMT') / 1000,
      },
    ]);
    expect(Number.parseFloat(k.toFixed(3))).toEqual(83.205);
  });
});
