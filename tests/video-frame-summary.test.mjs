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
