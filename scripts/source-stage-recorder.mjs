import assert from 'node:assert/strict';
const stages=new Set(['preparation','session-helper','navigation-command']);
export function validateStages(report){
 assert.deepEqual(Object.keys(report).sort(),['completed','rawDataExported','role','stages']);
 assert.equal(report.rawDataExported,false);assert.ok(['baseline','extension'].includes(report.role));assert.equal(typeof report.completed,'boolean');
 assert.ok(Array.isArray(report.stages)&&report.stages.length<=3);
 const seen=new Set();
 for(const item of report.stages){assert.deepEqual(Object.keys(item).sort(),['completed','elapsedMs','stage']);assert.ok(stages.has(item.stage)&&!seen.has(item.stage));seen.add(item.stage);assert.equal(typeof item.completed,'boolean');assert.ok(Number.isFinite(item.elapsedMs)&&item.elapsedMs>=0&&item.elapsedMs<=360000);}
}
export function createStageRecorder(role,now=()=>performance.now()){
 const report={role,completed:false,rawDataExported:false,stages:[]};
 return {report,async measure(stage,action){assert.ok(stages.has(stage)&&!report.stages.some(s=>s.stage===stage));const start=now(),entry={stage,completed:false,elapsedMs:0};report.stages.push(entry);try{const value=await action();entry.completed=true;return value;}finally{entry.elapsedMs=now()-start;validateStages(report);}}};
}
