/* eslint-disable-next-line  @typescript-eslint/no-var-requires */
require('dotenv').config({
  path: 'variables.env',
});
import settings from '../package.json';
import { Command } from 'commander';
import { deploy } from './deploy';
import { stockDictionary } from './nasdaq-symbols';
const program = new Command();

program.version(settings.version).description('gqlpages tools');

program
  .command('env')
  .description(`list environment settings`)
  .action(async () => {
    console.log(`Executing in folder: ${process.cwd()}`);
    const token = process.env.FINNHUB_API_TOKEN;
    console.log(`FINNHUB TOKEN: ${token}`);
    process.exit(0);
  });

program
  .command('deploy <uri>')
  .description(`deploy table from a folder or yaml file`)
  .option('--verbose', 'show intermediate steps')
  .action(async (uri, cmdObj) => {
    deploy(uri, cmdObj);
  });

program
  .command('name <symbol>')
  .description(`get the company name for a symbol`)
  .action(async (symbol) => {
    const ticker = symbol.toUpperCase();
    if (stockDictionary[ticker]) {
      console.log(`${ticker}:${stockDictionary[ticker]}`);
    } else {
      console.log(`${ticker} is not a valid symbol.`);
    }
  });

program.parse(process.argv);
