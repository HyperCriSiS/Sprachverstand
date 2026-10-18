// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {createSmokeProcessIo,validateSmokeProcessIo} from '../scripts/smoke-process-io.mjs';
import {summarizeProcessIo} from '../scripts/navigation-process-io.mjs';
import {processKind} from '../scripts/navigation-process-io-worker.mjs';
function setup(overrides={}){
  let clock=0;
  const stop=vi.fn(async phases=>summarizeProcessIo([],phases,{offset:0,uncertainty:0}));
  const modeBound=vi.fn(()=>true),startMonitor=vi.fn(async()=>({stop,modeBound}));
  const save=vi.fn(),unavailable=vi.fn();
  const recorder=createSmokeProcessIo({enabled:true,now:()=>++clock,startMonitor,save,unavailable,...overrides});
  return {recorder,stop,modeBound,startMonitor,save,unavailable};
}
it('keeps recording disabled without starting a helper or writing an artifact',async()=>{
  const s=setup({enabled:false});await s.recorder.start(123);
  expect(await s.recorder.measure('session',async()=>42)).toBe(42);
  await s.recorder.close();expect(s.startMonitor).not.toHaveBeenCalled();expect(s.save).not.toHaveBeenCalled();
});
it('stops once immediately after successful navigation and exports no successful samples',async()=>{
  const s=setup();await s.recorder.start(123);await s.recorder.start(123);
  await s.recorder.measure('session',async()=>1);
  expect(s.stop).not.toHaveBeenCalled();
  await s.recorder.measure('navigation',async()=>2);
  expect(s.stop).toHaveBeenCalledTimes(1);expect(s.startMonitor).toHaveBeenCalledTimes(1);
  expect(s.stop.mock.calls[0][0]).toEqual([{name:'session',start:1,end:2},{name:'navigation',start:3,end:4}]);
  await s.recorder.close();expect(s.stop).toHaveBeenCalledTimes(1);expect(s.save).not.toHaveBeenCalled();
});
for(const stage of ['session','navigation'])it(`preserves the exact ${stage} failure after bounded export`,async()=>{
  const s=setup();await s.recorder.start(123);
  if(stage==='navigation')await s.recorder.measure('session',async()=>1);
  const original=new Error('PRIVATE_EXCEPTION');
  await expect(s.recorder.measure(stage,async()=>{throw original;})).rejects.toBe(original);
  expect(s.stop).not.toHaveBeenCalled();
  await s.recorder.close();
  expect(s.save).toHaveBeenCalledTimes(1);
  const report=s.save.mock.calls[0][0];validateSmokeProcessIo(report);
  expect(report.stage).toBe(stage);expect(report.addonModeBound).toBe(true);
  expect(JSON.stringify(report)).not.toContain('PRIVATE');
  expect(report.processIo.phases.at(-1).durationMs).toBe(1);
  await s.recorder.close();expect(s.stop).toHaveBeenCalledTimes(1);
});
it('cannot replace the original result when startup, stop or export fails',async()=>{
  const original=new Error('original');
  for(const overrides of [
    {startMonitor:async()=>{throw Error('private startup');}},
    {startMonitor:async()=>({stop:async()=>{throw Error('private stop');}})},
    {save:async()=>{throw Error('private output');}}
  ]){
    const s=setup(overrides);await s.recorder.start(123);
    await expect(s.recorder.measure('session',async()=>{throw original;})).rejects.toBe(original);
    await s.recorder.close();expect(s.unavailable).toHaveBeenCalledTimes(1);
  }
});
it('closes a recorder when the caller fails between session and navigation',async()=>{
  const s=setup();await s.recorder.start(123);await s.recorder.measure('session',async()=>1);
  await s.recorder.close();await s.recorder.close();expect(s.stop).toHaveBeenCalledTimes(1);expect(s.save).not.toHaveBeenCalled();
});
it('rejects private fields, arbitrary stage names and broken mode flags before export',()=>{
  const valid={schemaVersion:1,stage:'session',addonModeBound:false,processIo:summarizeProcessIo([],[],{offset:0,uncertainty:0})};
  validateSmokeProcessIo(valid);
  for(const mutation of [r=>r.sessionId='PRIVATE',r=>r.stage='PRIVATE',r=>r.addonModeBound='PRIVATE',r=>r.processIo.pathsExported=true]){
    const bad=structuredClone(valid);mutation(bad);expect(()=>validateSmokeProcessIo(bad)).toThrow();
  }
});
it('keeps untyped deeper browser descendants separate from the main browser',()=>{
  expect(processKind(12,10,[],'/private/chrome',10)).toBe('browser');
  expect(processKind(12,10,[],'/private/chrome',11)).toBe('other');
  expect(processKind(12,10,['--type=zygote'],'/private/chrome',10)).toBe('other');
  expect(processKind(12,10,['--type=renderer'],'/private/chrome',11)).toBe('renderer');
});
