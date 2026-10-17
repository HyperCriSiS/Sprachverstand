import {build} from 'esbuild';
await build({entryPoints:['scripts/classifier-literal-control.ts'],bundle:true,platform:'browser',format:'iife',
 target:['es2022'],minify:false,sourcemap:false,outfile:'artifacts/page-dom-control.js',
 metafile:true,write:false}).then(async result=>{
 const fs=await import('node:fs/promises');
 await fs.mkdir('artifacts',{recursive:true});
 for(const output of result.outputFiles)await fs.writeFile(output.path,output.contents);
 await fs.writeFile('artifacts/page-dom-control.metafile.json',JSON.stringify(result.metafile));
});
