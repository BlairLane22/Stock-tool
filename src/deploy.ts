import fs from 'fs';
import path from 'path';
import { exit } from './util/exit';
import { getQuote } from './util/rest';

export async function deploy(deployUri: string, cmdObj: Record<string, unknown>): Promise<void> {
  console.log(await getQuote('TSLA'));
  exit(0);
}
