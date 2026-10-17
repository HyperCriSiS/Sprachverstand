import {describe,it,expect} from 'vitest';
import {validateVideoBaselineSafety} from '../scripts/video-baseline-safety.mjs';
describe('Minimum video baseline qualification',()=>{
 it('rejects the recorded Firefox no-addon stall even when extension playback is better',()=>{
  expect(()=>validateVideoBaselineSafety({frames:{maximumGapMs:1964.3400000000001}})).toThrow(/Videobaseline ungeeignet/);
 });
 it('uses the existing absolute ceiling without rounding a violation away',()=>{
  expect(()=>validateVideoBaselineSafety({frames:{maximumGapMs:300}})).not.toThrow();
  expect(()=>validateVideoBaselineSafety({frames:{maximumGapMs:300.001}})).toThrow(/300 ms/);
 });
 it.each([undefined,null,NaN,Infinity,-1])('refuses missing or invalid observed maximum %s',maximumGapMs=>{
  expect(()=>validateVideoBaselineSafety({frames:{maximumGapMs}})).toThrow(/ungueltig/);
 });
 it('does not infer the overall release acceptance from a suitable minimum reference',()=>{
  expect(validateVideoBaselineSafety({frames:{maximumGapMs:48.72}})).toBeUndefined();
 });
});
