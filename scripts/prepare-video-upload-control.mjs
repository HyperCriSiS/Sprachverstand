import {readFile,mkdir,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {sanitizeVideoFailure} from './sanitize-video-failure.mjs';
const mode=process.argv[2];assert.ok(['valid','reject-second'].includes(mode));
const source=(await readFile('tests/video-failure-sanitizer.test.mjs','utf8')).replaceAll('\r\n','\n');
const fixtureFunction=source.match(/function fixture\(\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(fixtureFunction,'Use existing synthetic unit fixture, fail closed if moved');
const fixture=vm.runInNewContext('('+fixtureFunction+')');
const directory='artifacts/video-playback';await mkdir(directory,{recursive:true});
for(const attempt of [1,2]){
 const report=fixture();report.profile='SYNTHETIC_PRIVATE_SENTINEL';report.extension.staticText='SYNTHETIC_PRIVATE_SENTINEL';
 assert.ok(!JSON.stringify(sanitizeVideoFailure(report)).includes('SYNTHETIC_PRIVATE_SENTINEL'));
 if(mode==='reject-second'&&attempt===2)report.sourceHash='invalid-synthetic-source';
 await writeFile(directory+'/video-pair-chromium-30-'+attempt+'.json',JSON.stringify(report));
}
await writeFile(directory+'/raw-trace-must-not-upload.json','SYNTHETIC_PRIVATE_SENTINEL');
console.log('Synthetic failure-path fixture ready; no browser run or personal data.');
