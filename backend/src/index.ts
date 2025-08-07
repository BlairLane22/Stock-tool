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
import { headAndShouldersPattern, headAndShouldersAnalysis, quickHeadAndShoulders } from './commands/headAndShouldersPattern';
import { rsiAnalysis, quickRSI } from './commands/rsiAnalysis';
import { bollingerBandsAnalysis, quickBollingerBands } from './commands/bollingerBandsAnalysis';
import { mfiAnalysis, quickMFI } from './commands/mfiAnalysis';
import { imiAnalysis, quickIMI } from './commands/imiAnalysis';
import { displayEMAAnalysis, displayMultiTimeframeEMA, quickEMA } from './commands/emaAnalysis';
import { displayATRAnalysis, displayPositionSizing, quickATR } from './commands/atrAnalysis';
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
  .option('--test-data <filename>', 'use specific test data file (without .json extension)')
  .option('--live', 'use live API data (default behavior)', false)
  .option('--mock', 'force use of mock data for demonstration', false)
  .action(async (symbol, cmdObj) => {
    const fast = parseInt(cmdObj.fast);
    const slow = parseInt(cmdObj.slow);
    const signal = parseInt(cmdObj.signal);
    await macd(symbol, fast, slow, signal, cmdObj.testData, cmdObj.live, cmdObj.mock);
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
  .command('head-shoulders <symbol>')
  .description(`detect and analyze Head and Shoulders chart pattern`)
  .option('--mock', 'use generated mock data for demonstration', false)
  .option('--test-data <filename>', 'use specific test data file (without .json extension)')
  .option('--live', 'use live API data instead of mock data', false)
  .action(async (symbol, cmdObj) => {
    await headAndShouldersPattern(symbol, {
      testData: cmdObj.testData,
      live: cmdObj.live,
      mock: cmdObj.mock
    });
  });

program
  .command('head-shoulders-analysis <symbol>')
  .description(`advanced Head and Shoulders analysis with custom parameters`)
  .option('--min-pattern <periods>', 'minimum pattern periods', '20')
  .option('--max-pattern <periods>', 'maximum pattern periods', '100')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--live', 'use live API data instead of mock data', false)
  .action(async (symbol, cmdObj) => {
    const minPatternPeriods = parseInt(cmdObj.minPattern);
    const maxPatternPeriods = parseInt(cmdObj.maxPattern);
    await headAndShouldersAnalysis(symbol, {
      minPatternPeriods,
      maxPatternPeriods,
      testData: cmdObj.testData,
      live: cmdObj.live
    });
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
  .option('--mock', 'use mock data for demonstration (default: true)', true)
  .option('--live', 'use live API data instead of mock data', false)
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
      mock: cmdObj.testData ? false : (cmdObj.live ? false : cmdObj.mock)  // Use test data if specified, otherwise mock unless --live
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
  .option('--mock', 'use mock data for demonstration (default: true)', true)
  .option('--live', 'use live API data instead of mock data', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const multiplier = parseFloat(cmdObj.multiplier);

    await bollingerBandsAnalysis(symbol, {
      period,
      multiplier,
      squeeze: cmdObj.squeeze,
      testData: cmdObj.testData,
      mock: cmdObj.testData ? false : (cmdObj.live ? false : cmdObj.mock)  // Use test data if specified, otherwise mock unless --live
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
  .option('--mock', 'use mock data for demonstration (default: true)', true)
  .option('--live', 'use live API data instead of mock data', false)
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
      mock: cmdObj.testData ? false : (cmdObj.live ? false : cmdObj.mock)  // Use test data if specified, otherwise mock unless --live
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
  .option('--mock', 'use mock data for demonstration (default: true)', true)
  .option('--live', 'use live API data instead of mock data', false)
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
      mock: cmdObj.testData ? false : (cmdObj.live ? false : cmdObj.mock)  // Use test data if specified, otherwise mock unless --live
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

program
  .command('ema <symbol>')
  .description('calculate and analyze Exponential Moving Average for a stock')
  .option('-p, --period <number>', 'EMA period (default: 12)', '12')
  .option('-t, --type <type>', 'price type (close, high, low, open, median)', 'close')
  .option('-m, --multi', 'multi-timeframe analysis', false)
  .option('--periods <numbers>', 'comma-separated periods for multi-timeframe (default: 12,26,50)', '12,26,50')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--mock', 'use mock data for demonstration (default: true)', true)
  .option('--live', 'use live API data instead of mock data', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const priceType = cmdObj.type as 'close' | 'high' | 'low' | 'open' | 'median';

    const useMockData = cmdObj.live ? false : cmdObj.mock;  // Use mock unless --live is specified

    if (cmdObj.multi) {
      const periods = cmdObj.periods.split(',').map((p: string) => parseInt(p.trim()));
      await displayMultiTimeframeEMA(symbol, periods, useMockData);
    } else {
      await displayEMAAnalysis(symbol, period, priceType, useMockData);
    }
  });

program
  .command('quick-ema <symbol>')
  .description('get quick Exponential Moving Average value and signal (API endpoint)')
  .option('-p, --period <number>', 'EMA period (default: 12)', '12')
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    try {
      const result = await quickEMA(symbol, period);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('atr <symbol>')
  .description('calculate and analyze Average True Range for volatility assessment')
  .option('-p, --period <number>', 'ATR period (default: 14)', '14')
  .option('--position-sizing', 'show position sizing analysis', false)
  .option('--account <amount>', 'account size for position sizing (default: 10000)', '10000')
  .option('--risk <percentage>', 'risk percentage per trade (default: 2)', '2')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--mock', 'use mock data for demonstration (default: true)', true)
  .option('--live', 'use live API data instead of mock data', false)
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    const useMockData = cmdObj.live ? false : cmdObj.mock;  // Use mock unless --live is specified

    if (cmdObj.positionSizing) {
      const accountSize = parseFloat(cmdObj.account);
      const riskPercent = parseFloat(cmdObj.risk) / 100;
      await displayPositionSizing(symbol, accountSize, riskPercent, period);
    } else {
      await displayATRAnalysis(symbol, period, useMockData);
    }
  });

program
  .command('quick-atr <symbol>')
  .description('get quick Average True Range value and volatility assessment (API endpoint)')
  .option('-p, --period <number>', 'ATR period (default: 14)', '14')
  .action(async (symbol, cmdObj) => {
    const period = parseInt(cmdObj.period);
    try {
      const result = await quickATR(symbol, period);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('quick-macd <symbol>')
  .description('get quick MACD values and signal (API endpoint)')
  .option('--fast <period>', 'fast EMA period (default: 12)', '12')
  .option('--slow <period>', 'slow EMA period (default: 26)', '26')
  .option('--signal <period>', 'signal line EMA period (default: 9)', '9')
  .action(async (symbol, cmdObj) => {
    const fastPeriod = parseInt(cmdObj.fast);
    const slowPeriod = parseInt(cmdObj.slow);
    const signalPeriod = parseInt(cmdObj.signal);
    try {
      const { getMACDResult } = await import('./indicators/macd');
      const { getCandles } = await import('./commands/helper/getCandles');
      const candles = await getCandles(symbol);
      const result = getMACDResult(candles, fastPeriod, slowPeriod, signalPeriod);

      const quickResult = {
        symbol: symbol.toUpperCase(),
        macd: result.current,
        signal: result.signalCurrent,
        histogram: result.histogramCurrent,
        crossover: result.current > result.signalCurrent ?
          (result.previous <= result.signalPrevious ? 'BULLISH_CROSSOVER' : 'BULLISH') :
          (result.previous >= result.signalPrevious ? 'BEARISH_CROSSOVER' : 'BEARISH'),
        timestamp: new Date().toISOString()
      };

      console.log(JSON.stringify(quickResult, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('quick-cup-handle <symbol>')
  .description('get quick Cup and Handle pattern detection (API endpoint)')
  .action(async (symbol, cmdObj) => {
    try {
      const { getCupAndHandleResult } = await import('./indicators/cupAndHandle');
      const { getCandles } = await import('./commands/helper/getCandles');
      const candles = await getCandles(symbol);
      const result = getCupAndHandleResult(candles);

      const quickResult = {
        symbol: symbol.toUpperCase(),
        patternDetected: result.isPattern,
        confidence: result.confidence,
        signal: result.isPattern ?
          (result.confidence === 'HIGH' ? 'BUY' : 'HOLD') : 'WAIT',
        targetPrice: result.targetPrice,
        breakoutLevel: result.breakoutLevel,
        stopLoss: result.stopLoss,
        timestamp: new Date().toISOString()
      };

      console.log(JSON.stringify(quickResult, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('quick-head-shoulders <symbol>')
  .description('get quick Head and Shoulders pattern detection (API endpoint)')
  .option('--test-data <filename>', 'use specific test data file')
  .option('--live', 'use live API data instead of mock data', false)
  .action(async (symbol, cmdObj) => {
    try {
      await quickHeadAndShoulders(symbol, {
        testData: cmdObj.testData,
        live: cmdObj.live
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse(process.argv);
