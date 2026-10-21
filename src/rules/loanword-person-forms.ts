import type { Rule } from "../core/rule";
import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Englische Lehnwörter als Personenbezeichnungen (`Maker:innen`,
// `Researcher*in`, `Creator*innen`), Webanalyse 21.10.2026. Abschaltbar
// über die Regelgruppe „Englische Lehnwörter“.

export const loanwordPersonFormsRuleId = "lexicon.loanwords";

let enabled = true;

// Set by transformText for each call from the rule group setting.
export function setLoanwordPersonFormsEnabled(value: boolean): void {
  enabled = value;
}

// The lexicon is data for the other rules, not a pass of its own. This rule
// only carries the id the rule group switches; it never changes text.
export const loanwordPersonFormsRule: Rule = {
  id: loanwordPersonFormsRuleId,
  risk: "safe",
  apply: (input: string) => ({ text: input, replacements: 0 })
};

// Stamm → [Plural, schwach]: -er/-ler endungslos, -or/-eur/-är mit -en/-e,
// schwache -ist/-ant/-ent/-at/-graf mit -en.
const regular: ReadonlyMap<string, readonly [plural: string, weak: boolean]> = new Map([
  ["accelerator", ["accelerators", false]],
  ["admin", ["admins", false]],
  ["birder", ["birder", false]],
  ["birdracer", ["birdracer", false]],
  ["booker", ["booker", false]],
  ["breaker", ["breaker", false]],
  ["cannasseur", ["cannasseure", false]],
  ["careleaver", ["careleaver", false]],
  ["cemas-researcher", ["cemas-researcher", false]],
  ["changemaker", ["changemaker", false]],
  ["checker", ["checker", false]],
  ["christfluencer", ["christfluencer", false]],
  ["clickworker", ["clickworker", false]],
  ["co-founder", ["co-founder", false]],
  ["community-leader", ["community-leader", false]],
  ["connector", ["connectors", false]],
  ["consumer", ["consumer", false]],
  ["content-consumer", ["content-consumer", false]],
  ["content-creator", ["content-creators", false]],
  ["contentcreator", ["contentcreators", false]],
  ["copywriter", ["copywriter", false]],
  ["coworker", ["coworker", false]],
  ["creator", ["creators", false]],
  ["croupier", ["croupiers", false]],
  ["crowdworker", ["crowdworker", false]],
  ["downhiller", ["downhiller", false]],
  ["ecopointer", ["ecopointer", false]],
  ["engineer", ["engineer", false]],
  ["entrepreneur", ["entrepreneure", false]],
  ["event-checker", ["event-checker", false]],
  ["fachreviewer", ["fachreviewer", false]],
  ["facilitator", ["facilitators", false]],
  ["festival-booker", ["festival-booker", false]],
  ["foodsaver", ["foodsaver", false]],
  ["foodsharer", ["foodsharer", false]],
  ["freerider", ["freerider", false]],
  ["fulbrighter", ["fulbrighter", false]],
  ["funder", ["funder", false]],
  ["gatekeeper", ["gatekeeper", false]],
  ["geocacher", ["geocacher", false]],
  ["golddigger", ["golddigger", false]],
  ["gravelbiker", ["gravelbiker", false]],
  ["hater", ["hater", false]],
  ["headliner", ["headliner", false]],
  ["homepreneur", ["homepreneure", false]],
  ["hoster", ["hoster", false]],
  ["incluencer", ["incluencer", false]],
  ["influcencer", ["influcencer", false]],
  ["infuencer", ["infuencer", false]],
  ["inkluencer", ["inkluencer", false]],
  ["inluencer", ["inluencer", false]],
  ["instagrammer", ["instagrammer", false]],
  ["intrapreneur", ["intrapreneure", false]],
  ["labeler", ["labeler", false]],
  ["leader", ["leader", false]],
  ["legalizer", ["legalizer", false]],
  ["maker", ["maker", false]],
  ["multitasker", ["multitasker", false]],
  ["nonliner", ["nonliner", false]],
  ["organizer", ["organizer", false]],
  ["pacemaker", ["pacemaker", false]],
  ["panelist", ["panelisten", true]],
  ["para-cycler", ["para-cycler", false]],
  ["peacekeeper", ["peacekeeper", false]],
  ["personalmarketer", ["personalmarketer", false]],
  ["planner", ["planner", false]],
  ["player", ["player", false]],
  ["presenter", ["presenter", false]],
  ["prosumer", ["prosumer", false]],
  ["reise-creator", ["reise-creators", false]],
  ["researcher", ["researcher", false]],
  ["rider", ["rider", false]],
  ["risikocontroller", ["risikocontroller", false]],
  ["runner", ["runner", false]],
  ["schoolworker", ["schoolworker", false]],
  ["scientist", ["scientists", false]],
  ["sexworker", ["sexworker", false]],
  ["sinnfluencer", ["sinnfluencer", false]],
  ["slamer", ["slamer", false]],
  ["snowboardcrosser", ["snowboardcrosser", false]],
  ["swinger", ["swinger", false]],
  ["team-player", ["team-player", false]],
  ["teamleader", ["teamleader", false]],
  ["teamplayer", ["teamplayer", false]],
  ["teamworker", ["teamworker", false]],
  ["top-player", ["top-player", false]],
  ["trailrunner", ["trailrunner", false]],
  ["trekker", ["trekker", false]],
  ["twitter", ["twitter", false]],
  ["uploader", ["uploader", false]],
  ["videographer", ["videographer", false]],
  ["viewer", ["viewer", false]],
  ["wiii-grwm-creator", ["wiii-grwm-creators", false]],
  ["windsurfer", ["windsurfer", false]],
  ["woolcrafter", ["woolcrafter", false]],
  ["worker", ["worker", false]]
]);

// Schwache Nomen auf -e, deren Stamm vor dem Marker das -e verliert
// (`Sprachpat*innen` → Sprachpaten, `Gesundheitslots*in` → Gesundheitslotse).
const weakE: ReadonlySet<string> = new Set([

]);

// Abweichende Stämme, Genitiv-s vor dem Marker, Umlautstämme und
// übernommene Ausgangsschreibweisen.
const full: ReadonlyMap<string, GeneratedPersonForms> = new Map([

]);

function lookup(normalizedBase: string): GeneratedPersonForms | undefined {
  const exact = full.get(normalizedBase);
  if (exact) return exact;
  if (weakE.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return {
      plural: inflected,
      singular: `${normalizedBase}e`,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: inflected,
      genitiveSingular: inflected
    };
  }
  const variant = regular.get(normalizedBase);
  if (!variant) return undefined;
  const [plural, weak] = variant;
  return {
    plural,
    singular: normalizedBase,
    feminineSingular: `${normalizedBase}in`,
    obliqueSingular: weak ? plural : normalizedBase,
    genitiveSingular: weak ? plural : `${normalizedBase}s`
  };
}

export function getLoanwordPersonForms(normalizedBase: string): GeneratedPersonForms | undefined {
  return enabled ? lookup(normalizedBase) : undefined;
}
