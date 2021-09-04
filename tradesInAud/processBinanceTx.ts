import {usage, dateInUnixMilliseconds, writeOut, getPrice, getBnbPair, getBnbPairPrice, getSymbolPairs, CommandLineArgs} from '../utils';
var fs = require('fs');
const csv = require('csv-parser');

const CSV_DELIMITER = ',';

function getTicker(cost): string {
    return cost.slice(cost.search(/[A-Z]/));
}

function getQuantity(cost: string, ticker): number {
    const numWithCommas: string = cost.slice(0, cost.indexOf(ticker));
    return Number(numWithCommas.replace(',',''));
}

function processEntry(symbols, e: CsvEntry): void {    
    e.executedTicker = getTicker(e.Executed);
    e.executedWithoutTicker = getQuantity(e.Executed, e.executedTicker);

    e.ammountTicker = getTicker(e.Amount);
    e.bnbPair = getBnbPair(symbols, e.ammountTicker);
    e.nAmmount = getQuantity(e.Amount, e.ammountTicker)

    e.feeTicker = getTicker(e.Fee);
    e.nFee = getQuantity(e.Fee, e.feeTicker);
    e.feeBnbPair = getBnbPair(symbols, e.feeTicker);
}


async function processCsvLine(symbols: string[], entry: CsvEntry): Promise<string[]> {
    if (JSON.stringify(entry) === '{}') { return []}; // Where am i getting empty lines from???
    let bnbPair, bnbPairPrice, bnbAudPrice, feeBnbPair, feeBnbPairPrice, bnbAmmount, bnbFee,  audAmmount, audFee;
    const compareDate: number = dateInUnixMilliseconds(entry["Date(UTC)"] + ' -0000', 'YYYY-MM-DD HH:mm:ss Z');
    processEntry(symbols, entry);
    bnbPair = entry.bnbPair;
    bnbPairPrice = await getBnbPairPrice(bnbPair, compareDate);
    feeBnbPair = entry.feeBnbPair;
    feeBnbPairPrice = feeBnbPair === bnbPair ? bnbPairPrice: await getBnbPairPrice(feeBnbPair, compareDate);
    bnbAudPrice = bnbPair === 'BNBAUD' ? bnbPairPrice : await getPrice('BNBAUD', compareDate, true);
    bnbAmmount = entry.nAmmount / bnbPairPrice;
    bnbFee = entry.nFee / feeBnbPairPrice; 
    audAmmount = bnbAmmount * bnbAudPrice;
    audFee = bnbFee * bnbAudPrice;

    return [
        entry["Date(UTC)"], 
        entry['Pair'], 
        entry['Side'], 
        entry['Price'], 
        entry['Executed'], 
        entry['Amount'], 
        entry['Fee'], 
        entry.executedWithoutTicker,
        entry.executedTicker,
        entry.nAmmount,
        entry.ammountTicker,
        entry.nFee,
        entry.feeTicker,
        bnbPair, 
        bnbPairPrice, 
        feeBnbPair, 
        feeBnbPairPrice, 
        bnbAudPrice, 
        bnbAmmount, 
        bnbFee, 
        audAmmount, 
        audFee
    ];
}

const NEW_HEADERS = [
    'executedWithoutTicker',
    'executedTicker',
    'amountWithoutTicker', 
    'ticker', 
    'feeWithoutTicker', 
    'feeTicker', 
    'bnbPair', 
    'bnbPairPrice', 
    'feeBnbPair', 
    'feeBnbPairPrice', 
    'bnbAudPrice', 
    'bnbAmmount', 
    'bnbFee', 
    'audAmmount', 
    'audFee'
];

interface CsvEntry {
    'Date(UTC)': string;
    'Pair': string;
    'Side': string;
    'Price': string;
    'Executed': string;
    'Amount': string;
    'Fee': string;
    bnbPair?: string;
    feeBnbPair?: string;
    nAmmount?: number;
    ammountTicker?: string;
    nFee?: number;
    feeTicker?: string;
    executedWithoutTicker?: number;
    executedTicker: string;
}

async function run(args: CommandLineArgs) {
    const out = [];
    const symbols:string[] = await getSymbolPairs();
    const csvEntries: CsvEntry[] = [];
    fs.createReadStream(args.inFile)
    .pipe(csv({ separator: CSV_DELIMITER }))
    .on('data', (data) => csvEntries.push(data))
    .on('headers', (headers) => {
        out.push(['Group',headers,...NEW_HEADERS].join(CSV_DELIMITER));
    })
    .on('end', async () => {
        let allLines: Promise<string[]>[] = [];
        console.log('Fetching Data From Binance')
        csvEntries.forEach(csvEntry => {             
        // csvEntries.slice(0,5).forEach(csvEntry => {              // For testing
            allLines.push(processCsvLine(symbols, csvEntry));
        });
        await Promise.all(allLines).then(rows => {
            console.log('Combining into Groups!')
            let groupId: number = 0;
            let groupDate: string = undefined;
            let groupSide: string = undefined;
            let groupPair: string = undefined;
            let groupCoin: string = undefined;
            let sumAmount: number = 0.0;
            let sumCost: number = 0.0;
            let sumFee: number = 0.0;
            let groupHeaders: string[] = [
                'Group', 'Date', 'Pair', 'Side', 'Ammount', 'Coin', 'Cost(AUD)', 'Fee (AUD)'
            ]
            let groupData: string[] = [];
            let row: string[];
            let first: boolean = true;
            for (let i = rows.length - 1; i >= 0; i--) {
                row = rows[i];
                if (!row.length) {
                    console.log('Skip Row');
                }
                const d = row[0];                
                const s = row[2];
                if (d !== groupDate || s !== groupSide) {
                    if (!first) groupData.push([groupId, groupDate, groupPair, groupSide, sumAmount, groupCoin,sumCost,sumFee].join(CSV_DELIMITER));
                    first = false;
                    groupId++;
                    groupDate=d;
                    groupSide = s;
                    groupPair = row[1];
                    groupCoin = row[8];
                    sumCost = 0;
                    sumFee = 0;
                    sumAmount = 0;
                }                
                sumAmount = sumAmount +  Number(row[7]).valueOf(); // sum coin ammount
                sumCost = sumCost +  Number(row[row.length -2]).valueOf(); // sum aud ammount
                sumFee = sumFee +  Number(row[row.length -1]).valueOf(); // sum aud fee
                out.push([groupId, ...row.map(x => '"' + x + '"')].join(CSV_DELIMITER));
            }
            groupData.push([groupId, groupDate, groupPair, groupSide, sumAmount, groupCoin,sumCost,sumFee].join(CSV_DELIMITER));            
            writeOut(args.outFile, out);
            writeOut(args.outDir + '/' + 'groups.' + args.fileName, [groupHeaders.join(CSV_DELIMITER), ...groupData]);
        })
  });

}

run(usage())
