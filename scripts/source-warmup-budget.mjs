import assert from 'node:assert/strict';
export function sourceWarmupPlan(mode){
 assert.ok(['immediate','idle-only','zero-scan','browser-read'].includes(mode));
 return {wallBudgetMs:mode==='immediate'?0:30000,cpuBudgetUs:['zero-scan','browser-read'].includes(mode)?2000000:0};
}
export function validateSourceWarmup(mode,wallMs,cpuUs){
 const plan=sourceWarmupPlan(mode);
 assert.ok(Number.isFinite(wallMs)&&wallMs>=0&&Math.abs(wallMs-plan.wallBudgetMs)<=250,'Source-control wall budget mismatch');
 assert.ok(Number.isFinite(cpuUs)&&cpuUs>=plan.cpuBudgetUs&&cpuUs<=plan.cpuBudgetUs+50000,'Source-control CPU budget mismatch');
 return plan;
}
