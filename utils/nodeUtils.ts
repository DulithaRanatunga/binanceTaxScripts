import { exit } from "process";
var fs = require('fs');
const https = require('https');
var dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

// Just reads a file into lines();
export function readFile(fn): string[] {
    return fs.readFileSync(fn, 'utf8').split('\n').map(l => l.trim()).filter(l => !!l);
}

// Writes lines to file
export function writeOut(path:string, lines: string[]) {    
    fs.writeFileSync(path, lines.join('\n'));
    print('Written to ' + path);
}



// Simple get request. Surely a better package exists....
export function curl(url): Promise<any> {
    return new Promise((resolve, reject) => {
        print(url, 'Requesting')
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
              print(err.message, "ERROR");
              reject(err);
        });
    });
}

// Lazy console.log wrapper to say "msg: " + val
export function print(s, msg?) {
    return console.log((msg ? msg + ": " : '') + s);
}

export function dateInUnixMilliseconds(date, format): number {
    return dayjs(date, format).valueOf(); 
}

export interface CommandLineArgs {
    inFile: string,
    outFile: string;
    fileName: string;
    outDir: string;
}

export function usage(): CommandLineArgs {
    var args = process.argv.slice(2);
    print(args, 'args');
    if (args.length < 2) {
        console.error("Usage: npm start inputFile.csv outputDirectory. | e.g. npm start in/example.csv out")
        exit(-1);
    } 
    var fileName: string = args[0].split("/").slice(-1)[0];
    return {
        inFile: args[0],
        outFile: args[1] + "/" + fileName,
        fileName: fileName,
        outDir: args[1],
    }
}