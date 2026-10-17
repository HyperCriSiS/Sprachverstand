import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {summarizeSyntheticOptOutput} from './synthetic-opt-output.mjs';
assert.equal(process.platform,'linux','Own Linux preflight only');
const bin='/usr/bin/chromium';
const version=spawnSync(bin,['--version'],{encoding:'utf8',timeout:5000});
assert.ok(version.stdout.includes('155.0.8059.0'),'Require declared system version');
const directory=await mkdtemp(path.join(tmpdir(),'sv-opt-source-'));
try{
 const html='<script>function svDiagnosticHotLoop(n){let x=0;for(let i=0;i<n;i++)x=(x+i)|0;return x}for(let j=0;j<200;j++)window.svTotal=svDiagnosticHotLoop(10000);document.title="synthetic-complete";</script>';
 const result=spawnSync(bin,['--headless=new','--no-sandbox','--no-first-run','--no-default-browser-check',
 '--user-data-dir='+directory,'--enable-logging=stderr','--js-flags=--trace-opt --trace-file-names','--dump-dom',
 'data:text/html,'+encodeURIComponent(html)],{encoding:'utf8',timeout:15000,maxBuffer:16*1024*1024});
 const counts=summarizeSyntheticOptOutput(result.stdout??'',result.stderr??'');
 const report={browserVersion:'155.0.8059.0',syntheticOnly:true,compilerFlagsDiagnosticOnly:true,
 rawOutputExported:false,profileExported:false,browserExitedSuccessfully:result.status===0,
 fixtureCompleted:(result.stdout??'').includes('synthetic-complete'),...counts};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/opt-source-preflight.json',JSON.stringify(report,null,2));
 assert.equal(report.browserExitedSuccessfully,true,'Synthetic browser must exit normally');
 assert.equal(report.fixtureCompleted,true,'Synthetic fixture must execute');
 assert.ok(counts.recognizedFunctionLinesStdout+counts.recognizedFunctionLinesStderr>0,'Known optimization output required');
 console.log('Synthetic function optimization output captured; only fixed counts exported.');
}finally{
 assert.ok(directory.startsWith(path.join(tmpdir(),'sv-opt-source-')));await rm(directory,{recursive:true,force:true});
}
