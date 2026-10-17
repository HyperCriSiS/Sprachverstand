import {domRuleMetadata} from '../src/rules/dom-metadata';
import {isRiskAllowed} from '../src/core/rule';
import {defaultSettings} from '../src/settings/defaults';
import {disabledRuleIdsForGroups} from '../src/rules/catalog';
// Synthetic diagnostic only. No DomProcessor, extension API or transformer.
const options={rules:domRuleMetadata,profile:'aggressive' as const,disabledRuleIds:disabledRuleIdsForGroups(defaultSettings.enabledRuleGroupIds)};
const stats={started:false,requests:0,matchedMarkers:0,notifications:0,reportedCount:0,contextCandidates:0};
function needsLeadingContext(input:string):boolean{
 for(const rule of options.rules){
  if(!rule.applyWithLeadingContext||!rule.leadingContextCandidate||options.disabledRuleIds.has(rule.id)||!isRiskAllowed(rule.risk,options.profile))continue;
  rule.leadingContextCandidate.lastIndex=0;if(rule.leadingContextCandidate.test(input))return true;
 }
 return false;
}
const target=globalThis as typeof globalThis&{__startPageDomControl:()=>void;__stopPageDomControl:()=>Promise<void>;__pageDomControlStats:typeof stats};
target.__pageDomControlStats=stats;
const changes=new Map<Element,{original:string;expected:string}>();let observer:MutationObserver|undefined;
function processElement(element:Element){
 const parent=element.parentElement;
 if(!['static-target','normal'].includes(element.id)&&!(element.tagName==='SPAN'&&parent&&['dynamic-root','dynamic'].includes(parent.id)))return;
 const input=element.textContent??'',count=input.split('Nutzer:innen').length-1;if(!count)return;
 stats.requests++;if(needsLeadingContext(input))stats.contextCandidates++;
 const expected=input.replaceAll('Nutzer:innen','Nutzer');changes.set(element,{original:input,expected});element.textContent=expected;
 stats.matchedMarkers+=count;stats.reportedCount=changes.size;stats.notifications++;
}
target.__startPageDomControl=()=>{
 if(observer)throw Error('Minimal classifier already started');stats.started=true;
 observer=new MutationObserver(records=>{for(const record of records){if(record.target instanceof Element)processElement(record.target);else if(record.target.parentElement)processElement(record.target.parentElement);for(const node of record.addedNodes)if(node instanceof Element)processElement(node);}});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 for(const element of document.querySelectorAll('#static-target,#normal,#dynamic-root > span,#dynamic > span'))processElement(element);
};
target.__stopPageDomControl=async()=>{observer?.disconnect();observer=undefined;for(const [element,change]of changes)if(element.textContent===change.expected)element.textContent=change.original;changes.clear();};
