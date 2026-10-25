import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 27.10.2026.
describe("Regressionen N34–N40", () => {
  it.each([
    // N34: Richtungsakkusativ nach zwischen/neben
    ["Wir stellen uns zwischen Lehrer:innen und Schüler:innen.", "Wir stellen uns zwischen Lehrer und Schüler."],
    ["Wir treten neben Ärzt*innen.", "Wir treten neben Ärzte."],
    ["Wir versuchen, uns zwischen Lehrer:innen zu stellen.", "Wir versuchen, uns zwischen Lehrer zu stellen."],
    ["Wir vermitteln zwischen Lehrer:innen und Schüler:innen.", "Wir vermitteln zwischen Lehrern und Schülern."],
    ["die Kooperation zwischen Landwirt:innen und Konsumierenden", "die Kooperation zwischen Landwirten und Konsumierenden"],
    // N35: Listen-Nachbarn
    ["Eltern, Künstler:innen und allen Lehrern bekannte Autoren kommen.", "Eltern, Künstler und allen Lehrern bekannte Autoren kommen."],
    ["Heute danken wir Lehrern, Lehrer:innen und Schüler:innen besuchen uns.", "Heute danken wir Lehrern, Lehrer und Schüler besuchen uns."],
    ["Die Eltern danken Lehrern, Lehrer:innen und Schüler:innen sind schon da.", "Die Eltern danken Lehrern, Lehrer und Schüler sind schon da."],
    ["Wir danken Lehrern, Schüler:innen und Eltern herzlich.", "Wir danken Lehrern, Schülern und Eltern herzlich."],
    // N36, N37
    ["Wir danken dem Lehrer und der Ärzt*in hilft uns.", "Wir danken dem Lehrer und der Arzt hilft uns."],
    ["Ein Buch dem Lehrer und der Ärzt*in überreiche ich.", "Ein Buch dem Lehrer und dem Arzt überreiche ich."],
    ["Sie kennt jeder Lehrer*in.", "Sie kennt jeder Lehrer."],
    ["Sie sagt jeder Lehrer*in ihre Meinung.", "Sie sagt jedem Lehrer ihre Meinung."],
    ["Die Regel ist: Jeder Lehrer*in geben wir ein Buch.", "Die Regel ist: Jedem Lehrer geben wir ein Buch."],
    // N38: eingebettetes Partizipialattribut
    ["Wir danken den von den Schulen entsandten Lehrer:innen.", "Wir danken den von den Schulen entsandten Lehrern."],
    ["Mit den von den Behörden beauftragten HelferInnen reden wir.", "Mit den von den Behörden beauftragten Helfern reden wir."],
    ["ohne die von den Verletzten gewählten Nebenklagevertreter*innen", "ohne die von den Verletzten gewählten Nebenklagevertreter"],
    // N39, N40
    ["Am Samstag, den 24.10.2026 kamen Lehrer:innen und Schüler:innen.", "Am Samstag, den 24.10.2026 kamen Lehrer und Schüler."],
    ["Wir reden mit den Kindern und besuchen Lehrer:innen.", "Wir reden mit den Kindern und besuchen Lehrer."],
    ["mit Kollegen aus Kantonen und erfahrenen Vertreter*innen", "mit Kollegen aus Kantonen und erfahrenen Vertretern"],
    ["mit Lehrkräften und zivilen Zwangsarbeiter*innen", "mit Lehrkräften und zivilen Zwangsarbeitern"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Varianten der Gegenprüfung vom 27.10.2026", () => {
  it.each([
    ["Wir reden mit rund zehn Lehrer:innen.", "Wir reden mit rund zehn Lehrern."],
    ["Wir reden mit vielen Tausend Lehrer:innen.", "Wir reden mit vielen Tausend Lehrern."],
    ["Bis zu fünf Ärzt*innen können zeitgleich arbeiten.", "Bis zu fünf Ärzte können zeitgleich arbeiten."],
    ["Hinweis: wir sehen die Lehrer*in.", "Hinweis: wir sehen den Lehrer."],
    ["Peter sagt: mit jeder Lehrer*in sprechen wir.", "Peter sagt: mit jedem Lehrer sprechen wir."],
    ["Kevin wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Kevin wartet. Jeder Lehrer kennt seine Telefonnummer."],
    ["Kim wartet. Jede Lehrer*in kennt ihre Telefonnummer.", "Kim wartet. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Berliner Schulen sind bekannt. Jede Lehrer*in kennt ihre Telefonnummer.",
      "Berliner Schulen sind bekannt. Jeder Lehrer kennt ihre Telefonnummer."],
    ["Ich hoffe, dass die Mutter aus Berlin die Ärzt*in möge.", "Ich hoffe, dass die Mutter aus Berlin den Arzt möge."],
    ["Mit den Jungen tanzen Lehrer:innen.", "Mit den Jungen tanzen Lehrer."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
