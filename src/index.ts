/* eslint-disable-next-line  @typescript-eslint/no-var-requires */
require('dotenv').config({
  path: 'variables.env',
});
import settings from '../package.json';
import { Command } from 'commander';
import { deploy } from './deploy';
const program = new Command();

program.version(settings.version).description('gqlpages tools');

program
  .command('env')
  .description(`list environment settings`)
  .action(async () => {
    console.log(`Executing in folder: ${process.cwd()}`);
    const dbUrl = process.env.DATABASE_URL?.replace(/:(.*):.*@/, ':$1:***@');
    console.log(`Database Connection: ${dbUrl}`);
    process.exit(0);
  });

program
  .command('deploy <uri>')
  .description(`deploy table from a folder or yaml file`)
  .option('--verbose', 'show intermediate steps')
  .action(async (uri, cmdObj) => {
    deploy(uri, cmdObj);
  });

program.parse(process.argv);
