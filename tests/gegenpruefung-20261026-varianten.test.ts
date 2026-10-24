import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 26.10.2026.
describe("Subjekt vor dem Dativverb mit Attribut oder ohne Begleiter (N24)", () => {
  it.each([
    ["Eltern folgen Lehrer:innen.", "Eltern folgen Lehrern."],
    ["Engagierte Eltern folgen Lehrer:innen.", "Engagierte Eltern folgen Lehrern."],
    ["Die Eltern der Kinder folgen Lehrer:innen.", "Die Eltern der Kinder folgen Lehrern."],
    ["Die Eltern aus Berlin folgen Lehrer:innen.", "Die Eltern aus Berlin folgen Lehrern."],
    ["Einige von uns helfen Lehrer:innen.", "Einige von uns helfen Lehrern."],
    ["Es folgen Lehrer:innen.", "Es folgen Lehrer."],
    ["Wem helfen Lehrer:innen?", "Wem helfen Lehrer?"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Gradadverb zwischen Artikel und Mengenwort (N25)", () => {
  it.each([
    ["Die überaus vielen Lehrer:innen kommen.", "Die überaus vielen Lehrer kommen."],
    ["Die inzwischen vielen Lehrer:innen kommen.", "Die inzwischen vielen Lehrer kommen."],
    ["Diese ausgesprochen wenigen Lehrer:innen kommen.", "Diese ausgesprochen wenigen Lehrer kommen."],
    ["die Auswahl unter vielen qualifizierten Bewerber:innen", "die Auswahl unter vielen qualifizierten Bewerbern"],
    ["der Friedhof, der auch vielen Einwohner:innen unbekannt ist", "der Friedhof, der auch vielen Einwohnern unbekannt ist"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Satzanfang ohne Besitzer (N28)", () => {
  it.each([
    ["Draußen regnet es. Jede Lehrer*in kennt ihre Telefonnummer.", "Draußen regnet es. Jeder Lehrer kennt seine Telefonnummer."],
    ["Niemand wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Niemand wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Plötzlich regnet es. Jede Lehrer*in kennt ihre Telefonnummer.", "Plötzlich regnet es. Jeder Lehrer kennt seine Telefonnummer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Nominalgruppe als Nebensatzsubjekt (N22)", () => {
  it.each([
    ["Ich hoffe, dass die Mutter die Ärzt*in möge.", "Ich hoffe, dass die Mutter den Arzt möge."],
    ["Ich hoffe, dass die neue Kollegin die Ärzt*in werde unterstützen.", "Ich hoffe, dass die neue Kollegin den Arzt werde unterstützen."],
    ["Ich hoffe, dass meine Mutter die Ärzt*in möge.", "Ich hoffe, dass meine Mutter den Arzt möge."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
