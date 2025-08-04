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
import { rsiAnalysis, quickRSI } from './commands/rsiAnalysis';
import { bollingerBandsAnalysis, quickBollingerBands } from './commands/bollingerBandsAnalysis';
import { mfiAnalysis, quickMFI } from './commands/mfiAnalysis';
import { imiAnalysis, quickIMI } from './commands/imiAnalysis';
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

program
  .command('rsi <symbol>')
  .description('calculate and analyze RSI (Relative Strength Index) for a stock')
  .option('-p, --period <number>', 'RSI period (default: 14)', '14')
  .option('-m, --multi', 'multi-timeframe analysis', false)
  .option('--periods <numbers>', 'comma-separated periods for multi-timeframe (default: 14,21,50)', '14,21,50')
  .option('--oversold <number>', 'custom oversold level (default: 30)', '30')
  .option('--overbought <number>', 'custom overbought level (default: 70)', '70')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--mock', 'use mock data for demonstration', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const periods = cmdObj.periods.split(',').map((p: string) => parseInt(p.trim()));
    const customLevels = {
      oversold: parseFloat(cmdObj.oversold),
      overbought: parseFloat(cmdObj.overbought),
      extremeOversold: parseFloat(cmdObj.oversold) - 10,
      extremeOverbought: parseFloat(cmdObj.overbought) + 10
    };

    await rsiAnalysis(symbol, {
      period,
      multiTimeframe: cmdObj.multi,
      periods,
      customLevels,
      testData: cmdObj.testData,
      mock: cmdObj.mock
    });
  });

program
  .command('quick-rsi <symbol>')
  .description('get quick RSI value and signal for a stock (API endpoint)')
  .option('-p, --period <number>', 'RSI period (default: 14)', '14')
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    try {
      const result = await quickRSI(symbol, period);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('bollinger <symbol>')
  .description('calculate and analyze Bollinger Bands for a stock')
  .option('-p, --period <number>', 'period for moving average (default: 20)', '20')
  .option('-m, --multiplier <number>', 'standard deviation multiplier (default: 2)', '2')
  .option('-s, --squeeze', 'include squeeze analysis', false)
  .option('--test-data <filename>', 'use specific test data file')
  .option('--mock', 'use mock data for demonstration', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const multiplier = parseFloat(cmdObj.multiplier);

    await bollingerBandsAnalysis(symbol, {
      period,
      multiplier,
      squeeze: cmdObj.squeeze,
      testData: cmdObj.testData,
      mock: cmdObj.mock
    });
  });

program
  .command('quick-bollinger <symbol>')
  .description('get quick Bollinger Bands values and signal (API endpoint)')
  .option('-p, --period <number>', 'period for moving average (default: 20)', '20')
  .option('-m, --multiplier <number>', 'standard deviation multiplier (default: 2)', '2')
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const multiplier = parseFloat(cmdObj.multiplier);
    try {
      const result = await quickBollingerBands(symbol, period, multiplier);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('mfi <symbol>')
  .description('calculate and analyze Money Flow Index for a stock')
  .option('-p, --period <number>', 'MFI period (default: 14)', '14')
  .option('--oversold <number>', 'oversold threshold (default: 20)', '20')
  .option('--overbought <number>', 'overbought threshold (default: 80)', '80')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--mock', 'use mock data for demonstration', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const customLevels = {
      oversold: parseInt(cmdObj.oversold),
      overbought: parseInt(cmdObj.overbought)
    };

    await mfiAnalysis(symbol, {
      period,
      customLevels,
      testData: cmdObj.testData,
      mock: cmdObj.mock
    });
  });

program
  .command('quick-mfi <symbol>')
  .description('get quick Money Flow Index value and signal (API endpoint)')
  .option('-p, --period <number>', 'MFI period (default: 14)', '14')
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    try {
      const result = await quickMFI(symbol, period);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('imi <symbol>')
  .description('calculate and analyze Intraday Momentum Index for a stock')
  .option('-p, --period <number>', 'IMI period (default: 14)', '14')
  .option('--oversold <number>', 'oversold threshold (default: 30)', '30')
  .option('--overbought <number>', 'overbought threshold (default: 70)', '70')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--mock', 'use mock data for demonstration', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const customLevels = {
      oversold: parseInt(cmdObj.oversold),
      overbought: parseInt(cmdObj.overbought)
    };

    await imiAnalysis(symbol, {
      period,
      customLevels,
      testData: cmdObj.testData,
      mock: cmdObj.mock
    });
  });

program
  .command('quick-imi <symbol>')
  .description('get quick Intraday Momentum Index value and signal (API endpoint)')
  .option('-p, --period <number>', 'IMI period (default: 14)', '14')
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    try {
      const result = await quickIMI(symbol, period);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse(process.argv);
