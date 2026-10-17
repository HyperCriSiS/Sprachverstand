import fs from 'node:fs';
import {readFile,writeFile,appendFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {videoPresentationProgress} from './video-gap-episodes.mjs';
const sourceHash='13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd';
const number=value=>{if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Invalid synthetic video number');return value;};
const integer=value=>{if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid synthetic video count');return value;};
const boolean=value=>{if(typeof value!=='boolean')throw Error('Invalid synthetic video boolean');return value;};
const optionalNumber=value=>value===undefined||value===null?null:number(value);
const optionalBoolean=value=>value===undefined||value===null?null:boolean(value);
const visibility=value=>{if(value===undefined||value===null)return null;if(!['visible','hidden'].includes(value))throw Error('Invalid visibility state');return value;};
const bounded=(value,maximum)=>{if(!Array.isArray(value)||value.length>maximum)throw Error('Unbounded synthetic observation');return value;};
const version=value=>{if(value!=='unknown'&&!/^\d+\.\d+\.\d+\.\d+$/u.test(value))throw Error('Invalid browser version');return value;};

function roleSummary(input,mode,controlKind){
 if(input.mode!==mode||input.controlKind!==controlKind||input.installationArgumentsVerified!==true)throw Error('Unverified control role');
 const extensionInstalled=boolean(input.extensionInstalled);
 if(extensionInstalled!==(mode==='extension'&&controlKind==='product'))throw Error('Unexpected extension installation');
 const samples=bounded(input.frameSamples,2048).map(frame=>({
  nowMs:number(frame.nowMs),mediaTime:number(frame.mediaTime),presentedFrames:integer(frame.presentedFrames),
  callbackAtMs:optionalNumber(frame.callbackAtMs),presentationTimeMs:optionalNumber(frame.presentationTimeMs),
  expectedDisplayTimeMs:optionalNumber(frame.expectedDisplayTimeMs),processingDurationMs:optionalNumber(frame.processingDurationMs),
  visibility:visibility(frame.visibilityAtFrame),focused:optionalBoolean(frame.focusedAtFrame)
 }));
 if(integer(input.frames.callbacks)!==samples.length)throw Error('Frame count mismatch');
 const support=input.longTaskSupported??null;
 if(support!==null&&typeof support!=='boolean')throw Error('Invalid long-task observation');
 const longTasks=support===true?bounded(input.longTasks,256).map(task=>({startMs:number(task.startMs),durationMs:number(task.durationMs)})):[];
 const completion=input.dynamicCompletion;
 const mutationTicks=integer(input.mutationTicks);
 let literalControl=null;
 if(input.literalControl!==null&&input.literalControl!==undefined){
  literalControl={rewrites:integer(input.literalControl.rewrites),batches:integer(input.literalControl.batches)};
 }
 return {
  role:mode,correctionImplementation:mode==='baseline'?'none':controlKind==='literal'?'page-literal':'sprachverstand',
  extensionInstalled,installationArgumentsVerified:true,browserVersion:version(input.browserVersion),driverVersion:version(input.driverVersion),
  currentTime:number(input.currentTime),droppedVideoFrames:integer(input.droppedVideoFrames),mutationTicks,
  completion:{total:integer(completion.total),expected:integer(completion.expected),correct:integer(completion.correct)},
  literalControl,literalWorkMatches:mode==='extension'&&controlKind==='literal'
   ?literalControl!==null&&literalControl.rewrites===48*mutationTicks+1&&literalControl.batches===mutationTicks:null,
  frames:{callbacks:samples.length,p95GapMs:optionalNumber(input.frames.p95GapMs),maximumGapMs:optionalNumber(input.frames.maximumGapMs),gapsOver120Ms:integer(input.frames.gapsOver120Ms)},
  presentationProgress:videoPresentationProgress(samples,30)??null,
  frameSamples:samples,longTaskObservation:support===true?'observed':support===false?'unsupported':'not-enabled',longTasks,
  focused:boolean(input.focused),visibility:visibility(input.visibilityState),
  visibilityEvents:bounded(input.visibilityEvents??[],256).map(event=>({nowMs:number(event.nowMs),state:visibility(event.state),focused:boolean(event.focused)}))
 };
}

export function sanitizeVideo30Pair(input){
 if(!['literal','product'].includes(input.controlKind)||!['baseline-first','extension-first'].includes(input.pairOrder)||input.sourceFps!==30||input.sourceHash!==sourceHash)throw Error('Unexpected video source or experiment');
 const baseline=roleSummary(input.baseline,'baseline',input.controlKind),extension=roleSummary(input.extension,'extension',input.controlKind);
 if(baseline.browserVersion!==extension.browserVersion||baseline.driverVersion!==extension.driverVersion)throw Error('Mixed browser versions in pair');
 return {schemaVersion:1,controlKind:input.controlKind,pairOrder:input.pairOrder,sourceFps:30,sourceHash,
  observation:'synthetic numeric frame and timing measurements, not a native trace or recording',
  baseline,extension,nativeTracesExported:false,profilesExported:false,sessionIdentifiersExported:false,recordingsExported:false};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const directory=path.resolve(process.argv[2]??'artifacts/video30-control');
 if(!directory.startsWith(path.join(process.cwd(),'artifacts')+path.sep))throw Error('Observation directory outside own artifacts');
 let count=0;
 for(const pair of [1,2,3]){
  const input=path.join(directory,`pair-${pair}`,'video-pair-chromium-30-1.json');
  if(!fs.existsSync(input))continue;
  if(fs.statSync(input).size>1024*1024)throw Error('Oversized synthetic report');
  let report;try{report=JSON.parse(await readFile(input,'utf8'));}catch{throw Error('Malformed synthetic report');}
  const output=path.join(path.dirname(input),'sanitized-video30-pair.json');
  if(fs.existsSync(output))throw Error('Do not overwrite exported measurements');
  await writeFile(output,JSON.stringify(sanitizeVideo30Pair(report),null,2));count++;
 }
 if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`present=${count>0}\n`);
 console.log(JSON.stringify({sanitizedPairs:count,nativeTracesExported:false,recordingsExported:false}));
}
