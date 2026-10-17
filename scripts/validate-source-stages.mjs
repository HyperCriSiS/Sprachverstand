import fs from 'node:fs';
import {validateStages} from './source-stage-recorder.mjs';
let present=false;
for(const role of ['baseline','extension']){const path=`artifacts/source-stages/${role}.json`;if(!fs.existsSync(path))continue;if(fs.statSync(path).size>4096)throw Error('Oversized stage metadata');validateStages(JSON.parse(fs.readFileSync(path,'utf8')));present=true;}
if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`present=${present}\n`);
console.log(JSON.stringify({validatedStageMetadata:present}));
