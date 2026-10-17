import assert from 'node:assert/strict';
import {summarizeSyntheticOptOutput} from './synthetic-opt-output.mjs';
const report=summarizeSyntheticOptOutput('[marking 0xSECRET <JSFunction svDiagnosticHotLoop (sfi = 0xPRIVATE)> for optimization]\n[compiling method 0xX <JSFunction otherName>]','[completed compiling 0xSECRET <JSFunction svDiagnosticHotLoop (sfi = 0xPRIVATE)>]');
assert.deepEqual(report,{recognizedFunctionLinesStdout:1,recognizedFunctionLinesStderr:1});
assert.ok(!JSON.stringify(report).includes('SECRET'));assert.ok(!JSON.stringify(report).includes('PRIVATE'));
console.log('Synthetic known-function trace counts only; raw names, addresses and other lines omitted.');
