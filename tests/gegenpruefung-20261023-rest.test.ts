import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung von Codex, 23.10.2026, Restliste (R05).
describe("Kurzformen mit Schrägstrich, Komma und „jedem*r“", () => {
  it.each([
    ["Gute Einarbeitung ist das Fundament für eine/n erfolgreiche/n und zufriedene/n Mitarbeiter/in.",
      "Gute Einarbeitung ist das Fundament für einen erfolgreichen und zufriedenen Mitarbeiter."],
    ["gemessen an dem Maßstab für eine/n erfahrene/n oder führende/n Wissenschaftler/in",
      "gemessen an dem Maßstab für einen erfahrenen oder führenden Wissenschaftler"],
    ["Wir suchen eine:n engagierte:n, motivierte:n Mitarbeiter:in.",
      "Wir suchen einen engagierten, motivierten Mitarbeiter."],
    ["Daher können diese Angebote von jedem*r Bewohner*in kostenlos genutzt werden.",
      "Daher können diese Angebote von jedem Bewohner kostenlos genutzt werden."],
    ["Ich danke jedem/r Kolleg/in.", "Ich danke jedem Kollegen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Genitiv in Koordination", () => {
  it.each([
    ["die Rolle einer Wähler*in der Grünen oder einer Politiker*in der AfD",
      "die Rolle eines Wählers der Grünen oder eines Politikers der AfD"],
    ["die Zusammenarbeit einer Trainer*in mit Migrationsgeschichte und einer Trainer*in ohne",
      "die Zusammenarbeit eines Trainers mit Migrationsgeschichte und eines Trainers ohne"],
    ["Das Buch einer Lehrer*in und einer neuen Schüler*in.",
      "Das Buch eines Lehrers und eines neuen Schülers."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it("lässt die ausgeschriebene Doppelform stehen", () => {
    expect(t("Das Buch eines Lehrers und einer Lehrer*in.")).toBe("Das Buch eines Lehrers und einer Lehrer*in.");
  });
});
