import {DomProcessor} from "../src/core/dom-processor";
import {domRuleMetadata} from "../src/rules/dom-metadata";
import {isBuiltInTransformCandidate} from "../src/rules/transform-candidate";
import {defaultSettings} from "../src/settings/defaults";
import {disabledRuleIdsForGroups} from "../src/rules/catalog";

// Diagnostic fixture only: the real DOM processor, but no extension API,
// background transport, lexicon or general text transformation.
const stats={started:false,requests:0,matchedMarkers:0,notifications:0,reportedCount:0};
let processor:DomProcessor|undefined;
const target=globalThis as typeof globalThis & {
  __startPageDomControl:()=>void;
  __stopPageDomControl:()=>Promise<void>;
  __pageDomControlStats:typeof stats;
};
target.__pageDomControlStats=stats;
target.__startPageDomControl=()=>{
  if(processor)throw Error("Page DOM control already started");
  processor=new DomProcessor(document,{
    rules:domRuleMetadata,profile:"aggressive",isTransformCandidate:isBuiltInTransformCandidate,
    disabledRuleIds:disabledRuleIdsForGroups(defaultSettings.enabledRuleGroupIds),
    protectedTerms:defaultSettings.protectedTerms,customReplacements:defaultSettings.customReplacements,
    processAccessibleAttributes:defaultSettings.processAccessibleAttributes,
    processQuotedText:defaultSettings.processQuotedText,processSubtitles:defaultSettings.processSubtitles,
    replacementNotificationIntervalMs:100,
    transformText:async input=>{
      stats.requests++;
      const count=input.split("Nutzer:innen").length-1;
      stats.matchedMarkers+=count;
      return {text:input.replaceAll("Nutzer:innen","Nutzer"),replacements:count,
        summaries:count?[{original:"Nutzer:innen",replacement:"Nutzer",count}]:[]};
    },
    onReplacementCountChange:count=>{stats.notifications++;stats.reportedCount=count;}
  });
  stats.started=true;processor.start();
};
target.__stopPageDomControl=async()=>{await processor?.stopBudgeted();processor=undefined;};
