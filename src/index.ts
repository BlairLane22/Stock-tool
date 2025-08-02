/* eslint-disable-next-line  @typescript-eslint/no-var-requires */
require('dotenv').config({
  path: 'variables.env',
});
import settings from '../package.json';
import { Command } from 'commander';
import { name } from './commands/name';
import { quote } from './commands/quote';
import { runChartPatterns } from './commands/runChartPatterns';
import { movingAverage } from './commands/movingAverage';
import { personalTradingStrategy } from './commands/personalTradingStrategy';
import { macd } from './commands/macd';
import { cupAndHandlePattern, cupAndHandleAnalysis, listTestData } from './commands/cupAndHandlePattern';
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
  .command('runChartPatterns <symbol>')
  .description(`download a chart off the web`)
  .action(async (symbol) => {
    runChartPatterns(symbol);
  });

program
  .command('movingAverage <symbol> <num>')
  .description(`download a chart off the web`)
  .action(async (symbol, num) => {
    movingAverage(symbol, num);
  });

program
  .command('strategy <symbol>')
  .description(`analyze a stock using your personal trading strategy`)
  .option('--balance <amount>', 'account balance for position sizing', '10000')
  .option('--risk <percentage>', 'risk percentage per trade', '2')
  .action(async (symbol, cmdObj) => {
    const balance = parseFloat(cmdObj.balance);
    const risk = parseFloat(cmdObj.risk);
    await personalTradingStrategy(symbol, balance, risk);
  });

program
  .command('macd <symbol>')
  .description(`calculate and analyze MACD (Moving Average Convergence Divergence) for a stock`)
  .option('--fast <period>', 'fast EMA period', '12')
  .option('--slow <period>', 'slow EMA period', '26')
  .option('--signal <period>', 'signal line EMA period', '9')
  .action(async (symbol, cmdObj) => {
    const fast = parseInt(cmdObj.fast);
    const slow = parseInt(cmdObj.slow);
    const signal = parseInt(cmdObj.signal);
    await macd(symbol, fast, slow, signal);
  });

program
  .command('cup-handle <symbol>')
  .description(`detect and analyze Cup and Handle chart pattern`)
  .option('--mock', 'use generated mock data for demonstration', false)
  .option('--test-data <filename>', 'use specific test data file (without .json extension)')
  .action(async (symbol, cmdObj) => {
    await cupAndHandlePattern(symbol, cmdObj.mock, cmdObj.testData);
  });

program
  .command('cup-analysis <symbol>')
  .description(`advanced Cup and Handle analysis with custom parameters`)
  .option('--min-cup <periods>', 'minimum cup periods', '15')
  .option('--max-cup <periods>', 'maximum cup periods', '130')
  .option('--min-handle <periods>', 'minimum handle periods', '5')
  .option('--max-handle <periods>', 'maximum handle periods', '25')
  .action(async (symbol, cmdObj) => {
    const minCup = parseInt(cmdObj.minCup);
    const maxCup = parseInt(cmdObj.maxCup);
    const minHandle = parseInt(cmdObj.minHandle);
    const maxHandle = parseInt(cmdObj.maxHandle);
    await cupAndHandleAnalysis(symbol, minCup, maxCup, minHandle, maxHandle);
  });

program
  .command('list-test-data')
  .description(`list available test data files for pattern testing`)
  .action(() => {
    listTestData();
  });

program.parse(process.argv);
