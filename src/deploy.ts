import fs from 'fs';
import path from 'path';
import { exit } from './utils';

export async function deploy(deployUri: string, cmdObj: Record<string, unknown>): Promise<void> {
  console.log('deployed');
  exit(0);
}
