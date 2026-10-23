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
  // Gegenprüfung 24.10.2026 (N18): die Besucher sind Subjekt, die Kunst ist das Dativobjekt.
  ["Im Museum begegnen Besucher*innen der Kunst.", "Im Museum begegnen Besucher der Kunst."],
  // „gegenüber“ regiert selbst den Dativ (N21).
  ["Das Vertrauen Bürger:innen gegenüber wächst.", "Das Vertrauen Bürgern gegenüber wächst."]
])("%s", (input, expected) => expect(t(input)).toBe(expected));
