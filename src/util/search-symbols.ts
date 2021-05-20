import fs from 'fs';
import csv from 'csv-parser';

interface StockDescription {
  companyName: string;
  symbol: string;
}

export function loadStockArray(): Array<StockDescription> {
  const results: Array<StockDescription> = [];

  fs.createReadStream('./src/util/total-stock-symbol-list.csv')
    .pipe(csv())
    .on('data', (data: StockDescription) => results.push(data))
    .on('end', () => {
      console.log(results);
      console.log();
      // [
      //   { symbol: 'Daffy Duck', companyName: '24' },
      //   { symbol: 'Bugs Bunny', companyName: '22' }
      // ]
    });

  return results;
}

export const stocks: Array<StockDescription> = loadStockArray();

export const stockDictionary: Record<string, string> = {};

stocks;

export function getName(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  return stockDictionary[symbolUpper];
}
