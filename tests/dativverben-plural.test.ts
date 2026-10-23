import { expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung 23.10.2026, V01: Dativverben vor Pluralformen.
it.each([
  ["Wir danken Lehrer:innen.", "Wir danken Lehrern."],
  ["Wir danken Fantasiehelfer:innen.", "Wir danken Fantasiehelfern."],
  ["Lehrer:innen helfen Schüler:innen.", "Lehrer helfen Schülern."],
  ["Das Projekt hilft vielen Schüler*innen.", "Das Projekt hilft vielen Schülern."],
  ["Im Museum begegnen Besucher*innen der Kunst.", "Im Museum begegnen Besuchern der Kunst."]
])("%s", (input, expected) => expect(t(input)).toBe(expected));

it("liest das Substantiv „Vertrauen“ nicht als Verb", () => {
  expect(t("Das Vertrauen Bürger:innen gegenüber wächst.")).toBe("Das Vertrauen Bürger gegenüber wächst.");
});
