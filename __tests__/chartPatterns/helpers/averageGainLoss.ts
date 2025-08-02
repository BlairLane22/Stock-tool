import { averageGainLoss } from '../../../src/chartPatterns/helpers/averageGainLoss';

let testCandles = [
    {
        open: 98.72,
        high: 112.84,
        low: 94.23,
        close: 112.21,
        volume: 288273329,
        timeStamp: 1453680000
    },
    {
        open: 100.41,
        high: 105.11,
        low: 96.82,
        close: 102.01,
        volume: 258965528,
        timeStamp: 1454889600
    },
    {
        open: 105.49,
        high: 109.45,
        low: 102.74,
        close: 107.92,
        volume: 152033937,
        timeStamp: 1456099200
    },
    {
        open: 108.07,
        high: 109.42,
        low: 104.4,
        close: 109.41,
        volume: 123196160,
        timeStamp: 1457308800
    },
    {
        open: 111.66,
        high: 113.19,
        low: 111.03,
        close: 113.05,
        volume: 73850143,
        timeStamp: 1458518400
    }
];

describe('averageGainLoss function', () => {
    it('Should return gain and loss averages', () => {
        const result = averageGainLoss(2, 5, testCandles);
        expect(result).toHaveProperty('gain');
        expect(result).toHaveProperty('loss');
        expect(Array.isArray(result.gain)).toBe(true);
        expect(Array.isArray(result.loss)).toBe(true);
    });
});
