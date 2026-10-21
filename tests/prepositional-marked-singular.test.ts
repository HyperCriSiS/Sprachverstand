import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026: Nach Präposition und femininem Begleitwort entstand
// bei Trennzeichenformen ein Mischausdruck (`mit der Patient`), nach `zur`
// ein falscher Artikel (`zur Erzieher`). Beim Binnen-I galt die Regel schon.
describe("markierter Singular nach Präposition und femininem Begleitwort", () => {
  it.each([
    ["Wir sprechen mit der Lehrer*in.", "Wir sprechen mit dem Lehrer."],
    ["dokumentiert und mit der Patient*in diskutiert", "dokumentiert und mit dem Patienten diskutiert"],
    ["mit der Ärzt:in", "mit dem Arzt"],
    ["eine Vorstellung bei der Diätolog:in", "eine Vorstellung bei dem Diätologen"],
    ["von der Referent*in vorgestellt", "von dem Referenten vorgestellt"],
    ["für die Kolleg:in", "für den Kollegen"],
    ["durch die Lehrer/in", "durch den Lehrer"],
    ["gemeinsam mit Ihrer Hausärzt:in", "gemeinsam mit Ihrem Hausarzt"],
    ["für jede Literaturfreund*in.", "für jeden Literaturfreund."],
    // Binnen-I wie bisher.
    ["mit der LehrerIn", "mit dem Lehrer"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("zur + markierter Singular", () => {
  it.each([
    ["Ausbildung zur Erzieher*in", "Ausbildung zum Erzieher"],
    ["Weiterbildung zur Fachärzt*in", "Weiterbildung zum Facharzt"],
    ["Ausbildung zur Assistent*in", "Ausbildung zum Assistenten"],
    ["Lehrgang zur Sprechstundenassistent:in", "Lehrgang zum Sprechstundenassistenten"],
    ["Zur Fachinformatiker/in", "Zum Fachinformatiker"],
    ["Ausbildung zur ErzieherIn", "Ausbildung zum Erzieher"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("bleibt unverändert oder wie bisher", () => {
  it.each([
    // Paare werden nur als Ganzes aufgelöst.
    ["Ausbildung zum/zur Erzieher*in", "Ausbildung zum Erzieher"],
    ["Ausbildung zur/zum Erzieher*in", "Ausbildung zum Erzieher"],
    // Kompositum mit Bindestrich: kein Personensingular.
    ["Mit dieser Täter*in-Opfer-Umkehr", "Mit dieser Täter*in-Opfer-Umkehr"],
    // Koordination: das zweite Glied bekäme sonst den Nominativ.
    ["Lab wird von einer Künstler:in oder Technolog:in geleitet", "Lab wird von einer Künstler:in oder Technolog:in geleitet"],
    // Ohne Präposition gilt weiter der Mehrdeutigkeitsschutz.
    ["die Lehrer*in", "die Lehrer*in"],
    ["eine Patient*in", "eine Patient*in"],
    // Normale Feminina bleiben.
    ["mit der Lehrerin", "mit der Lehrerin"],
    ["Ausbildung zur Erzieherin", "Ausbildung zur Erzieherin"],
    ["zur Fachkraft", "zur Fachkraft"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
