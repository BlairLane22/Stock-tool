import { stocks } from '../util/nasdaq-symbols';

export function repetitiveBuy(): string {
  const count = stocks.length;
  const num = Math.floor(Math.random() * count);

  const symbol = stocks[num - 1].symbol;

  return symbol;
}
