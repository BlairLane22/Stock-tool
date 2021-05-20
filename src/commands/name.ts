import { stockDictionary, getName } from '../util/symbolList';

export async function name(symbol: string): Promise<void> {
  const symbolUpper = symbol.toUpperCase();
  if (stockDictionary[symbolUpper]) {
    console.log(`${symbolUpper}:${getName(symbolUpper)}`);
  } else {
    console.log(`${symbolUpper} is not a valid symbol.`);
  }
  process.exit(0);
}
