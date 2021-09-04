import { exit } from "process";
import { getSystemErrorMap } from "util";

var fs = require('fs');
var dayjs = require('dayjs');
const https = require('https');
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const csv = require('csv-parser')



var inFile = 'in/example.csv';
var outFile = 'out/example.csv';

function readFile(fn): string[] {
    return fs.readFileSync(fn, 'utf8').split('\n').map(l => l.trim()).filter(l => !!l);
}

const tx: string[] = readFile(inFile);

const CSV_DELIMITER = ',';
const ALREADY_IN_BNB = 'N/A';

function curl(url): Promise<any> {
    return new Promise((resolve, reject) => {
        p(url, 'Requesting')
        https.get(url, (resp) => {
            let data = '';
           
            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });
           
              // The whole response has been received. Print out the result.
            resp.on('end', () => {                
                resolve(JSON.parse(data));
            });
            
            }).on("error", (err) => {
              console.log("Error: " + err.message);
              reject(err);
        });
    });
}


async function getPriceAtOpen(symbol, time): Promise<number> {
    let price: string;
    await curl(apiBase(`klines?symbol=${symbol}&interval=1m&startTime=${time}&endTime=${time+300000}`)).then(body => {
        price = body[0] ? body[0][1] : -1;
        p(price, 'Price response')
    });
    return Number(price).valueOf(); // [[time, open, high, low, close, volume, close time, asset vol, trades, buy vol, quote vol, ignore ]]
} 

function apiBase(path): string {
    return 'https://api.binance.com/api/v3/' + path;
}

async function getSymbolPairs(): Promise<string[]> {
    let pairs = [];
    await curl(apiBase('ticker/price')).then(allSymbols => {
        pairs = allSymbols.map(s => s.symbol);
    });
    return pairs;
}

function getBnbPair(symbols, ticker: string): string {        
    if (ticker === 'AUD') { return 'BNBAUD' };
    if (ticker === 'BNB') { return ALREADY_IN_BNB};
    return symbols.find(s => s.indexOf(ticker) !== -1 && s.indexOf('BNB') !== -1);
}

function dateInUnixMilliseconds(date): number {
    return dayjs(date, 'DD/MM/YYYY HH:mm Z').valueOf(); 
}

async function getPrice(symbol, date, buySide: boolean): Promise<number> {
    const price: number = await getPriceAtOpen(symbol, date);
    return buySide ? price : 1.0 / price;
}

async function getBnbPairPrice(symbol: string, date: number): Promise<number> {     
    return symbol === ALREADY_IN_BNB ? 1 : getPrice(symbol, date, symbol.slice(0,3) === 'BNB');
}

function getTicker(cost): string {
    return cost.slice(cost.search(/[A-Z]/));
}

function getQuantity(cost: string, ticker): number {
    const numWithCommas: string = cost.slice(0, cost.indexOf(ticker));
    return Number(numWithCommas.replace(',',''));
}

async function processCsvLine(symbols: string[], entry: CsvEntryIn): Promise<CsvEntryOut> {
    if (JSON.stringify(entry) === '{}') { return undefined }; // Where am i getting empty lines from???
    let comparePair, comparePairPrice, comparisonPrice, audAmount;
    const compareDate: number = dateInUnixMilliseconds(entry.UTC_Time + ' -0000');
    // DOGE/BNB was delisted in 2020 and added back in 2021. So we go direct for that one.
    if (entry.Coin === 'DOGE') { 
        const dogePrice = await getPrice('DOGEAUD', compareDate, true);
        if (dogePrice == -1) { console.log('============================================ALERT============================================'); }
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


function writeOut(path:string, lines: string[]) {    
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Written to ' + path);
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
        console.log('Fetching Data From Binance')
        csvEntries.forEach(csvEntry => {             
        // csvEntries.filter(csvEntry => csvEntry.Coin === 'DOGE').forEach(csvEntry => {
        // csvEntries.slice(0,5).forEach(csvEntry => {              // For testing
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

function p(s, msg?) {
    return console.log((msg ? msg + ": " : '') + s);
}

interface CommandLineArgs {
    inFile: string,
    outFile: string;
}

function usage(): CommandLineArgs {
    var args = process.argv.slice(2);
    p(args, 'args');
    if (args.length < 2) {
        console.error("Usage: npm start inputFile.csv outputDirectory. | e.g. npm start in/example.csv out")
        exit(-1);
    } 
    let inFile: string = args[0];
    return {
        inFile: inFile,
        outFile: args[1] + "/" + inFile.split("/").slice(-1)[0],
    }
}

run(usage());