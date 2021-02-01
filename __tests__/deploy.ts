import fs from 'fs';
import path from 'path';

// deal with the fact that this can execute from either the local package
// folder when running as a test in vscode but could run from root if
// running from lerna
function getDataFolder(): string {
  const executingFolder = process.cwd().replace(/\\/g, '/');
  //console.log(`Executing in folder: ${executingFolder}`);
  const packageFolder = 'packages/gqlpages-tools';
  const dataFolder = '../../test-data/covid19';

  if (executingFolder.endsWith(packageFolder)) {
    return path.join('./', dataFolder);
  }
  return path.join('./', packageFolder, dataFolder);
}

describe('deploy page', () => {
  test('deploy page', async () => {
    expect(1).toEqual(1);
  });
});
