import './prepare.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const baseline='6b135fc8dcfb2942ac96906583616e25874a8e4c';
execFileSync('git',['diff','--exit-code',baseline,'--','src','assets','package.json','package-lock.json','scripts/build.mjs','scripts/real-world-browser-matrix.mjs']);
let library=await readFile('artifacts/discovery-probe/browser-library.mjs','utf8');
// Context evidence is sufficient for this campaign; avoid hundreds of GB of screenshots.
library=library.replace('if (mode === "extension" && deepObservation.final.evidence.length) await saveScreenshot','if (false) await saveScreenshot');
await writeFile('artifacts/discovery-probe/browser-library.mjs',library);
const provenance=JSON.parse(await readFile('artifacts/discovery-probe/provenance.json'));
provenance.buildHashes={};for(const name of ['content.js','background.js','manifest.json'])provenance.buildHashes[name]=createHash('sha256').update(await readFile('dist/chromium/'+name)).digest('hex');
await writeFile('artifacts/discovery-probe/provenance.json',JSON.stringify(provenance,null,2));
