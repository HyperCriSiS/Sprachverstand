import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startProcessIoMonitor,epochNow} from './navigation-process-io.mjs';
import {validateProcessIoSummary} from './validate-navigation-process-io.mjs';

export function validateSmokeProcessIo(value) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), ['schemaVersion','stage','addonModeBound','processIo'].sort());
  assert.equal(value.schemaVersion, 1);
  assert.ok(['session','navigation'].includes(value.stage));
  assert.equal(typeof value.addonModeBound, 'boolean');
  validateProcessIoSummary(value.processIo);
}

// Optional diagnostic only: a failed recorder must never replace the test error.
export function createSmokeProcessIo({enabled, outputDirectory,
  startMonitor = startProcessIoMonitor, now = epochNow,
  save = async report => {
    await mkdir(outputDirectory, {recursive:true});
    await writeFile(path.join(outputDirectory, 'process-io.json'), JSON.stringify(report, null, 2), {flag:'wx'});
  }, unavailable = () => {}}) {
  let monitor, started = false, failureStage;
  const phases = [];
  const finish = async failureStage => {
    const current = monitor;
    monitor = undefined;
    if (!current) return;
    try {
      const processIo = await current.stop(phases);
      if (failureStage) {
        const report = {schemaVersion:1, stage:failureStage, addonModeBound:current.modeBound(true), processIo};
        validateSmokeProcessIo(report);
        await save(report);
      }
    } catch { unavailable(); }
  };
  return {
    async start(pid) {
      if (!enabled || started) return;
      started = true;
      try { monitor = await startMonitor(pid); } catch { unavailable(); }
    },
    async measure(name, action) {
      if (!monitor) return action();
      assert.ok(['session','navigation'].includes(name));
      const phase = {name,start:now(),end:null};
      phases.push(phase);
      try {
        const result = await action();
        phase.end = now();
        if (name === 'navigation') await finish();
        return result;
      } catch (error) {
        phase.end = now();
        // Preserve the immediate navigation failure witness; flush during cleanup.
        failureStage = name;
        throw error;
      }
    },
    async close() { await finish(failureStage); }
  };
}
