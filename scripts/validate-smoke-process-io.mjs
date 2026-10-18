import {existsSync} from 'node:fs';
import {appendFile,readFile} from 'node:fs/promises';
import {validateSmokeProcessIo} from './smoke-process-io.mjs';
const file='artifacts/browser-smoke-navigation/process-io.json';
const present=existsSync(file);
if(present){const text=await readFile(file,'utf8');if(text.length>64*1024)throw Error('Process I/O diagnostic exceeds export bound');validateSmokeProcessIo(JSON.parse(text));}
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`present=${present}\n`);
console.log(present?'Bounded synthetic process I/O diagnostic validated.':'No process I/O diagnostic was produced.');
