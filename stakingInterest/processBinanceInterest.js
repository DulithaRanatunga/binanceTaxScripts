"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
var process_1 = require("process");
var fs = require('fs');
var dayjs = require('dayjs');
var https = require('https');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
var csv = require('csv-parser');
var inFile = 'in/example.csv';
var outFile = 'out/example.csv';
function readFile(fn) {
    return fs.readFileSync(fn, 'utf8').split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return !!l; });
}
var tx = readFile(inFile);
var CSV_DELIMITER = ',';
var ALREADY_IN_BNB = 'N/A';
function curl(url) {
    return new Promise(function (resolve, reject) {
        p(url, 'Requesting');
        https.get(url, function (resp) {
            var data = '';
            // A chunk of data has been received.
            resp.on('data', function (chunk) {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', function () {
                resolve(JSON.parse(data));
            });
        }).on("error", function (err) {
            console.log("Error: " + err.message);
            reject(err);
        });
    });
}
function getPriceAtOpen(symbol, time) {
    return __awaiter(this, void 0, void 0, function () {
        var price;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, curl(apiBase("klines?symbol=" + symbol + "&interval=1m&startTime=" + time + "&endTime=" + (time + 300000))).then(function (body) {
                        price = body[0] ? body[0][1] : -1;
                        p(price, 'Price response');
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, Number(price).valueOf()]; // [[time, open, high, low, close, volume, close time, asset vol, trades, buy vol, quote vol, ignore ]]
            }
        });
    });
}
function apiBase(path) {
    return 'https://api.binance.com/api/v3/' + path;
}
function getSymbolPairs() {
    return __awaiter(this, void 0, void 0, function () {
        var pairs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pairs = [];
                    return [4 /*yield*/, curl(apiBase('ticker/price')).then(function (allSymbols) {
                            pairs = allSymbols.map(function (s) { return s.symbol; });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, pairs];
            }
        });
    });
}
function getBnbPair(symbols, ticker) {
    if (ticker === 'AUD') {
        return 'BNBAUD';
    }
    ;
    if (ticker === 'BNB') {
        return ALREADY_IN_BNB;
    }
    ;
    return symbols.find(function (s) { return s.indexOf(ticker) !== -1 && s.indexOf('BNB') !== -1; });
}
function dateInUnixMilliseconds(date) {
    return dayjs(date, 'DD/MM/YYYY HH:mm Z').valueOf();
}
function getPrice(symbol, date, buySide) {
    return __awaiter(this, void 0, void 0, function () {
        var price;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPriceAtOpen(symbol, date)];
                case 1:
                    price = _a.sent();
                    return [2 /*return*/, buySide ? price : 1.0 / price];
            }
        });
    });
}
function getBnbPairPrice(symbol, date) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, symbol === ALREADY_IN_BNB ? 1 : getPrice(symbol, date, symbol.slice(0, 3) === 'BNB')];
        });
    });
}
function getTicker(cost) {
    return cost.slice(cost.search(/[A-Z]/));
}
function getQuantity(cost, ticker) {
    var numWithCommas = cost.slice(0, cost.indexOf(ticker));
    return Number(numWithCommas.replace(',', ''));
}
function processCsvLine(symbols, entry) {
    return __awaiter(this, void 0, void 0, function () {
        var comparePair, comparePairPrice, comparisonPrice, audAmount, compareDate, dogePrice, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (JSON.stringify(entry) === '{}') {
                        return [2 /*return*/, undefined];
                    }
                    ; // Where am i getting empty lines from???
                    compareDate = dateInUnixMilliseconds(entry.UTC_Time + ' -0000');
                    if (!(entry.Coin === 'DOGE')) return [3 /*break*/, 2];
                    return [4 /*yield*/, getPrice('DOGEAUD', compareDate, true)];
                case 1:
                    dogePrice = _b.sent();
                    if (dogePrice == -1) {
                        console.log('============================================ALERT============================================');
                    }
                    comparePair = 'DOGEAUD';
                    comparePairPrice = dogePrice;
                    comparisonPrice = Number(entry.Change).valueOf() * dogePrice;
                    audAmount = comparisonPrice;
                    return [3 /*break*/, 7];
                case 2:
                    comparePair = getBnbPair(symbols, entry.Coin);
                    return [4 /*yield*/, getBnbPairPrice(comparePair, compareDate)];
                case 3:
                    comparePairPrice = _b.sent();
                    if (!(comparePair === 'BNBAUD')) return [3 /*break*/, 4];
                    _a = comparePairPrice;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, getPrice('BNBAUD', compareDate, true)];
                case 5:
                    _a = _b.sent();
                    _b.label = 6;
                case 6:
                    comparisonPrice = _a;
                    audAmount = Number(entry.Change).valueOf() / comparePairPrice * comparisonPrice;
                    _b.label = 7;
                case 7: return [2 /*return*/, Object.assign({}, entry, {
                        bnbPair: comparePair,
                        bnbPairPrice: comparePairPrice,
                        bnbAudPrice: comparisonPrice,
                        audPrice: audAmount
                    })];
            }
        });
    });
}
var NEW_HEADERS = [
    'Conversion Pair',
    'PairPrice',
    'ConvertedPrice',
    'audPrice',
];
function writeOut(path, lines) {
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Written to ' + path);
}
function run(args) {
    return __awaiter(this, void 0, void 0, function () {
        var out, symbols, csvEntries;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    out = [];
                    return [4 /*yield*/, getSymbolPairs()];
                case 1:
                    symbols = _a.sent();
                    csvEntries = [];
                    fs.createReadStream(args.inFile)
                        .pipe(csv({ separator: CSV_DELIMITER }))
                        .on('data', function (data) { return csvEntries.push(data); })
                        .on('headers', function (headers) {
                        out.push(__spreadArray([headers], NEW_HEADERS).join(CSV_DELIMITER));
                    })
                        .on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                        var allLines;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    allLines = [];
                                    console.log('Fetching Data From Binance');
                                    csvEntries.forEach(function (csvEntry) {
                                        // csvEntries.filter(csvEntry => csvEntry.Coin === 'DOGE').forEach(csvEntry => {
                                        // csvEntries.slice(0,5).forEach(csvEntry => {              // For testing
                                        allLines.push(processCsvLine(symbols, csvEntry));
                                    });
                                    return [4 /*yield*/, Promise.all(allLines).then(function (rows) {
                                            writeOut(args.outFile, __spreadArray(__spreadArray([], out), rows.map(function (row) { return [
                                                row.UTC_Time,
                                                row.Account,
                                                row.Operation,
                                                row.Coin,
                                                row.Change,
                                                row.bnbPair,
                                                row.bnbPairPrice,
                                                row.bnbAudPrice,
                                                row.audPrice
                                            ].join(CSV_DELIMITER); })));
                                        })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
function p(s, msg) {
    return console.log((msg ? msg + ": " : '') + s);
}
function usage() {
    var args = process.argv.slice(2);
    p(args, 'args');
    if (args.length < 2) {
        console.error("Usage: npm start inputFile.csv outputDirectory. | e.g. npm start in/example.csv out");
        process_1.exit(-1);
    }
    var inFile = args[0];
    return {
        inFile: inFile,
        outFile: args[1] + "/" + inFile.split("/").slice(-1)[0]
    };
}
run(usage());
