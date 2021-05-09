import fs from 'fs';
import csv from 'csv-parser';

interface StockDescription {
  companyName: string;
  symbol: string;
}

export function loadStockArray(): Array<StockDescription> {
  const results: Array<StockDescription> = [];

  fs.createReadStream(
    '/Users/blairlane/Desktop/Stock-tool/src/util/total-stock-symbol-list.csv',
  )
    .pipe(csv())
    .on('data', (data: StockDescription) => results.push(data))
    .on('end', () => {
      console.log(results);
      console.log();
      // [
      //   { NAME: 'Daffy Duck', AGE: '24' },
      //   { NAME: 'Bugs Bunny', AGE: '22' }
      // ]
    });

  return results;
}

export const stocks: Array<StockDescription> = loadStockArray();

export const stockDictionary: Record<string, string> = {};
stocks.forEach((stock) => {
  stockDictionary[stock.symbol] = stock.companyName;
});

export function getName(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  return stockDictionary[symbolUpper];
}
