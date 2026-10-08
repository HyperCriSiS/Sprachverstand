import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular, mapMappedSingularPair } from "../src/rules/person-lexicon";
import { getReviewedPersonFormsWave83, reviewedPersonFormCountWave83 } from "../src/rules/reviewed-person-forms-wave-83";

// Die unabhängig festgehaltene Positivliste dient als vollständige Regression.
const freigegebeneBasen = [
  "aachener",
  "aargauer",
  "abholer",
  "achtklässler",
  "alleingänger",
  "allrounder",
  "altwiener",
  "amsterdamer",
  "anti-raucher",
  "ausbildungsabbrecher",
  "autopfandleiher",
  "badener",
  "berufskomiker",
  "bezahler",
  "bieler",
  "bittsteller",
  "bootslenker",
  "braunschweiger",
  "bummler",
  "bundesberner",
  "bundesliga-handballer",
  "champagnertrinker",
  "chefbanker",
  "chefdenker",
  "cloppenburger",
  "cola-trinker",
  "computer-einsteiger",
  "crowdsurfer",
  "curler",
  "datenbroker",
  "deutsch-afrikaner",
  "drogenlenker",
  "durchschnittszürcher",
  "eichsfelder",
  "elftklässler",
  "ennetbadener",
  "ermöglicher",
  "essener",
  "ex-boxer",
  "ex-komiker",
  "expresszusteller",
  "fahrzeuglenker",
  "faktenleugner",
  "festordner",
  "filmkomiker",
  "flachdenker",
  "fuldaer",
  "geisterjogger",
  "gelegenheitsraucher",
  "gifhorner",
  "grabräuber",
  "grazer",
  "grevener",
  "hannoveraner",
  "hauptbeeinflusser",
  "hauptzahler",
  "hersfelder",
  "hinterwäldler",
  "hobbybläser",
  "hobbyjogger",
  "hornbläser",
  "internet-broker",
  "internet-komiker",
  "interneteinsteiger",
  "jobeinsteiger",
  "jugendfußballer",
  "jungbanker",
  "junggewerkschafter",
  "junglenker",
  "kaffeetrinker",
  "katzenhalter",
  "kiewer",
  "kirchgänger",
  "kitesurfer",
  "klardenker",
  "kleinbasler",
  "klippenspringer",
  "klotener",
  "kopenhagener",
  "kulturgenießer",
  "landstreicher",
  "lehrabgänger",
  "lehrergewerkschafter",
  "lerner",
  "leugner",
  "lübecker",
  "medienwissenschafter",
  "mitdenker",
  "motorradlenker",
  "münsteraner",
  "nachwuchsboxer",
  "nachwuchskomiker",
  "nachwuchssurfer",
  "nacktschläfer",
  "negativdenker",
  "neuntklässler",
  "nichtskönner",
  "nordafrikaner",
  "nordbadener",
  "nordostschweizer",
  "normalschläfer",
  "nutztierhalter",
  "oberaargauer",
  "oberösterreicher",
  "ostschweizer",
  "pfeifenraucher",
  "pkw-lenker",
  "reformverweiger",
  "regelhüter",
  "rigaer",
  "rückenschläfer",
  "saalordner",
  "schnelldenker",
  "sechstklässler",
  "selbstdenker",
  "staatenlenker",
  "staatsanbeter",
  "staatsleugner",
  "starkomiker",
  "studienabbrecher",
  "supermarkträuber",
  "trierer",
  "vaduzer",
  "vorausdenker",
  "wahlschweizer",
  "warschauer",
  "weingenießer",
  "weintrinker",
  "weltrekordhalter",
  "westafrikaner",
  "whiskytrinker",
  "wiesbadener",
  "wismarer",
  "wissenschaftsleugner",
  "wolfenbütteler",
  "würzburger",
  "zagreber",
  "zehntklässler",
  "zigarettenraucher",
  "zukunftsdenker",
  "zweiradlenker",
  "zwölftklässler"
] as const;

// Diese lexikalisch unklaren bzw. unvollständigen Basen wurden nicht freigegeben.
const ausgeschlosseneBasen = [
  "bierwander",
  "gender",
  "israel",
  "klassenclown",
  "kulturpessimist",
  "strandwander",
  "warenimporteur",
  "zauber",
  "zimmer",
  "zuliefer"
] as const;

describe("dreiundachtzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau 142 einzeln geprüfte Personenbasen", () => {
    expect(reviewedPersonFormCountWave83).toBe(142);
    expect(freigegebeneBasen).toHaveLength(142);
    expect(new Set(freigegebeneBasen).size).toBe(142);
  });

  it.each(freigegebeneBasen)("bildet alle vollständigen Formen für %s ab", (base) => {
    const nominativ = base;
    const feminin = `${base}in`;
    const genitiv = `${base}s`;
    expect(getReviewedPersonFormsWave83(base)).toEqual({
      plural: base,
      singular: nominativ,
      feminineSingular: feminin,
      obliqueSingular: nominativ,
      genitiveSingular: genitiv
    });
    expect(mappedPluralSeparatorsRule.apply(`${base}:innen`)).toEqual({
      text: base,
      replacements: 1
    });
    expect(mapMappedSingularPair(base, feminin)).toBe(base);
    expect(mapMappedSingular(base, "nominative")).toBe(base);
    expect(mapMappedSingular(base, "accusative")).toBe(base);
    expect(mapMappedSingular(base, "dative")).toBe(base);
    expect(mapMappedSingular(base, "genitive")).toBe(genitiv);
  });

  it.each(ausgeschlosseneBasen)("schließt die riskante Basis %s aus", (base) => {
    expect(getReviewedPersonFormsWave83(base)).toBeUndefined();
  });

  it("lässt unmarkierte Wörter und fremde Wortendungen unverändert", () => {
    expect(mappedPluralSeparatorsRule.apply("Aachener")).toEqual({text: "Aachener", replacements: 0});
    expect(getReviewedPersonFormsWave83("aachenerfirma")).toBeUndefined();
  });
});