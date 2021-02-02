import { getName } from '../src/util/nasdaq-symbols';

describe('get stock name', () => {
  test('can find TSLA', async () => {
    expect(getName('TSLA')).toEqual('Tesla Motors, Inc.');
  });
  test('can find tsla', async () => {
    expect(getName('tsla')).toEqual('Tesla Motors, Inc.');
  });
  test('can find the public company monty started in his bedroom', async () => {
    expect(getName('sofo')).toEqual('Sonic Foundry, Inc.');
  });
  test('unknown company should return undefined', async () => {
    expect(getName('sfo')).toEqual(undefined);
  });
});
