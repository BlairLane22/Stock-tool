/* eslint-disable-next-line  @typescript-eslint/no-var-requires */
require('dotenv').config({
  path: 'variables.env',
});
import settings from '../package.json';
import { Command } from 'commander';
import { name } from './commands/name';
import { quote } from './commands/quote';
import { buy } from './commands/buy';
import { repetitiveBuy } from './commands/repetitiveBuy';
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
  .command('quote <symbol>')
  .description(`get the quote for a symbol`)
  .option('--verbose', 'show all info')
  .action(async (uri, cmdObj) => {
    quote(uri, cmdObj);
  });

program
  .command('name <symbol>')
  .description(`get the company name for a symbol`)
  .action(async (symbol) => {
    name(symbol);
  });

program
  .command('buy <symbol>')
  .description(`get the purchase decision for a company`)
  .action(async (uri, cmdObj) => {
    buy(uri, cmdObj);
  });

program
  .command('repetitiveBuy')
  .description(`runs repetitive buying`)
  .action(async (cmdObj) => {
    try {
      const symbol = repetitiveBuy();
      buy(await symbol, cmdObj);
      console.log(symbol);
    } catch (e) {
      console.log('There was an error. Please run again');
    }
  });

program.parse(process.argv);
