import { exit } from '../util/exit';
import { getQuote } from '../util/rest';

export async function quote(
  symbol: string,
  cmdObj: Record<string, unknown>,
): Promise<void> {
  console.log(await getQuote(symbol.toUpperCase()));
  exit(0);
}
