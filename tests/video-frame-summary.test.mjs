import {describe,it,expect} from 'vitest';
import {summarizeVideoFrames} from '../scripts/video-frame-summary.mjs';
const fromGaps=gaps=>gaps.reduce((times,gap)=>[...times,times.at(-1)+gap],[0]);
describe('Video frame summary with P99',()=>{
 it('uses nearest rank and preserves rare pauses in maximum even when P99 misses them',()=>{
  const times=fromGaps([...Array(15).fill(500),...Array(98).fill(16),80,250]);
  const copy=[...times];const result=summarizeVideoFrames(times);
  expect(result).toEqual({callbacks:116,p95GapMs:16,p99GapMs:80,maximumGapMs:250,gapsOver120Ms:1});
  expect(times).toEqual(copy);
 });
 it('retains the exact existing startup exclusion and strict >120 count',()=>{
  expect(summarizeVideoFrames(fromGaps([...Array(15).fill(2000),120,121]))).toEqual({callbacks:18,p95GapMs:121,p99GapMs:121,maximumGapMs:121,gapsOver120Ms:1});
 });
 it.each([{times:[]},{times:[0]},{times:[0,16,32]}])('keeps empty settled windows at zero: ',({times})=>{
  expect(summarizeVideoFrames(times)).toEqual({callbacks:times.length,p95GapMs:0,p99GapMs:0,maximumGapMs:0,gapsOver120Ms:0});
 });
 it('keeps the established handling of invalid and decreasing timestamp differences',()=>{
  const times=[...fromGaps(Array(15).fill(16)),NaN,500,400,520,650];
  expect(summarizeVideoFrames(times)).toEqual({callbacks:21,p95GapMs:130,p99GapMs:130,maximumGapMs:130,gapsOver120Ms:1});
 });
});

import {summarizeVideoCallbackEntries} from '../scripts/video-frame-summary.mjs';
describe('Independent callback-entry clock',()=>{
 it('uses actual entry times, separately from the rendering timestamps',()=>{
  const entries=fromGaps([...Array(15).fill(10),20,100]);
  const frames=entries.map((callbackAtMs,index)=>({callbackAtMs,nowMs:index*10}));
  expect(summarizeVideoCallbackEntries(frames).maximumGapMs).toBe(100);
  expect(summarizeVideoFrames(frames.map(frame=>frame.nowMs)).maximumGapMs).toBe(10);
 });
 it.each([[],[{nowMs:10}],[{callbackAtMs:NaN}],[{callbackAtMs:-1}],[{callbackAtMs:2},{callbackAtMs:1}]])('keeps absent or invalid entry clocks unknown: %j',(...frames)=>{
  expect(summarizeVideoCallbackEntries(frames.flat())).toBeNull();
 });
 it('accepts repeated quantized entry times without inventing negative gaps',()=>{
  expect(summarizeVideoCallbackEntries(Array(18).fill({callbackAtMs:10})).maximumGapMs).toBe(0);
 });
});

import {validateVideoCallbackMetadata} from '../scripts/video-frame-summary.mjs';
describe('Required callback-entry metadata',()=>{
 const frames=()=>Array.from({length:20},(_,i)=>({nowMs:i*16,callbackAtMs:i*17,focusedAtFrame:true,visibilityAtFrame:'visible'}));
 it('summarizes the actual entry clock independently from rendering time',()=>{
  const samples=frames();expect(validateVideoCallbackMetadata(samples).maximumGapMs).toBe(17);
  expect(summarizeVideoFrames(samples.map(f=>f.nowMs)).maximumGapMs).toBe(16);
 });
 it('retains observed focus loss and hidden state rather than inventing a focused sample',()=>{
  const samples=frames();samples[5].focusedAtFrame=false;samples[5].visibilityAtFrame='hidden';
  expect(validateVideoCallbackMetadata(samples).callbacks).toBe(20);expect(samples[5].focusedAtFrame).toBe(false);
 });
 it.each(['callbackAtMs','focusedAtFrame','visibilityAtFrame'])('rejects an unobserved %s field',key=>{
  const samples=frames();delete samples[3][key];expect(()=>validateVideoCallbackMetadata(samples)).toThrow();
 });
 it('rejects non-monotonic entry clocks and an empty observation',()=>{
  const samples=frames();samples[3].callbackAtMs=0;expect(()=>validateVideoCallbackMetadata(samples)).toThrow();
  expect(()=>validateVideoCallbackMetadata([])).toThrow();
 });
});
