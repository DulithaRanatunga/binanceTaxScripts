import {CommandLineArgs, usage, print, dateInUnixMilliseconds, writeOut, getPrice, getBnbPair, getBnbPairPrice, getSymbolPairs} from '../utils';
var fs = require('fs');
const csv = require('csv-parser')

const CSV_DELIMITER = ',';

async function processCsvLine(symbols: string[], entry: CsvEntryIn): Promise<CsvEntryOut> {
    if (JSON.stringify(entry) === '{}') { return undefined }; // Where am i getting empty lines from???
    let comparePair, comparePairPrice, comparisonPrice, audAmount;
    const compareDate: number = dateInUnixMilliseconds(entry.UTC_Time + ' -0000', 'DD/MM/YYYY HH:mm Z');
    // DOGE/BNB was delisted in 2020 and added back in 2021. So we go direct for that one.
    if (entry.Coin === 'DOGE') { 
        const dogePrice = await getPrice('DOGEAUD', compareDate, true);
        comparePair = 'DOGEAUD';
        comparePairPrice = dogePrice;
        comparisonPrice = Number(entry.Change).valueOf() * dogePrice;
        audAmount = comparisonPrice;
    } else {
        comparePair = getBnbPair(symbols, entry.Coin);
        comparePairPrice = await getBnbPairPrice(comparePair, compareDate);
        comparisonPrice = comparePair === 'BNBAUD' ? comparePairPrice : await getPrice('BNBAUD', compareDate, true);
        audAmount = Number(entry.Change).valueOf() / comparePairPrice * comparisonPrice;    
    }
    return Object.assign({}, entry, {
        bnbPair: comparePair,
        bnbPairPrice: comparePairPrice,
        bnbAudPrice: comparisonPrice,
        audPrice: audAmount,
    })
}

const NEW_HEADERS = [
    'Conversion Pair',
    'PairPrice',
    'ConvertedPrice',
    'audPrice',
];

interface CsvEntryIn {
    'UTC_Time': string;
    'Account': string;
    'Operation':string;
    'Coin':string;
    'Change':string;        
}

interface CsvEntryOut extends CsvEntryIn {
    bnbPair: string;
    bnbPairPrice: number;
    bnbAudPrice: string;
    audPrice: number;    
}

async function run(args: CommandLineArgs) {
    const out:string[] = [];
    const symbols:string[] = await getSymbolPairs();
    const csvEntries: CsvEntryIn[] = [];
    fs.createReadStream(args.inFile)
    .pipe(csv({ separator: CSV_DELIMITER }))
    .on('data', (data) => csvEntries.push(data))
    .on('headers', (headers) => {
        out.push([headers,...NEW_HEADERS].join(CSV_DELIMITER));
    })
    .on('end', async () => {
        let allLines: Promise<CsvEntryOut>[] = [];
        print('Fetching Data From Binance')
        csvEntries.forEach(csvEntry => {             
           allLines.push(processCsvLine(symbols, csvEntry));
        });
        await Promise.all(allLines).then(rows => {   
            writeOut(args.outFile, [...out, ...rows.map(row => [
                row.UTC_Time,
                row.Account,
                row.Operation,
                row.Coin,
                row.Change,
                row.bnbPair,
                row.bnbPairPrice,
                row.bnbAudPrice,
                row.audPrice
            ].join(CSV_DELIMITER))]);
        })
  });
}


run(usage());