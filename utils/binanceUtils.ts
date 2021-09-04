import { print, curl} from './nodeUtils';

const ALREADY_IN_BNB = 'N/A';

function apiBase(path): string {
    return 'https://api.binance.com/api/v3/' + path;
}

export async function getPriceAtOpen(symbol, time): Promise<number> {
    let price: string;
    await curl(apiBase(`klines?symbol=${symbol}&interval=1m&startTime=${time}&endTime=${time+300000}`)).then(body => {
        price = body[0] ? body[0][1] : -1;
        // print(price, 'Price response')
    });
    return Number(price).valueOf(); // [[time, open, high, low, close, volume, close time, asset vol, trades, buy vol, quote vol, ignore ]]
} 

export async function getSymbolPairs(): Promise<string[]> {
    let pairs = [];
    await curl(apiBase('ticker/price')).then(allSymbols => {
        pairs = allSymbols.map(s => s.symbol);
    });
    return pairs;
}

export function getBnbPair(symbols, ticker: string): string {        
    if (ticker === 'AUD') { return 'BNBAUD' };
    if (ticker === 'BNB') { return ALREADY_IN_BNB};
    return symbols.find(s => s.indexOf(ticker) !== -1 && s.indexOf('BNB') !== -1);
}

export async function getPrice(symbol, date, buySide: boolean): Promise<number> {
    const price: number = await getPriceAtOpen(symbol, date);
    return buySide ? price : 1.0 / price;
}

export async function getBnbPairPrice(symbol: string, date: number): Promise<number> {     
    return symbol === ALREADY_IN_BNB ? 1 : getPrice(symbol, date, symbol.slice(0,3) === 'BNB');
}
