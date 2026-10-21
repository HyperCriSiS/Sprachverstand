import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;
const nfd = (value: string) => value.normalize("NFD");

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

// Webanalyse 21.10.2026 (UNI-01): 34 Formen mit zerlegten Umlauten (NFD)
// auf 58 Domains blieben stehen, weil das Lexikon nur NFC kennt.
describe("zerlegte Umlaute (NFD) in markierten Wörtern", () => {
  it.each([
    ["Künstler:innen arbeiten.", "Künstler arbeiten."],
    ["Schüler*innen und Lehrer*innen", "Schüler und Lehrer"],
    ["SchülerInnen", "Schüler"],
    ["Täter*innen", "Täter"],
    ["Ärzt*innen", "Ärzte"],
    ["Mit Schüler*innen", "Mit Schülern"]
  ])("%s", (input, expected) => {
    expect(t(nfd(input)).normalize("NFC")).toBe(expected);
  });

  it("lässt den übrigen Text in seinen ursprünglichen Codeeinheiten", () => {
    const input = nfd("Für Bürger*innen der Stadt Köln");
    const output = t(input);
    expect(output.normalize("NFC")).toBe("Für Bürger der Stadt Köln");
    expect(output.startsWith(nfd("Für "))).toBe(true);
    expect(output.endsWith(nfd(" der Stadt Köln"))).toBe(true);
  });

  it("gibt ein markiertes Wort ohne Umwandlung exakt zurück", () => {
    const input = nfd("Köln:innen und Grüße");
    expect(t(input)).toBe(input);
    const mixed = nfd("Schüler*innen und Köln:innen");
    expect(t(mixed)).toBe(`Schüler und ${nfd("Köln:innen")}`);
  });

  it("verhält sich bei NFC unverändert", () => {
    expect(t("Künstler:innen arbeiten.")).toBe("Künstler arbeiten.");
    expect(t("die Schüler*in")).toBe("die Schüler*in");
  });

  it("wirkt im DomProcessor und stellt die NFD-Codeeinheiten wieder her", () => {
    const original = nfd("Alle Schüler*innen kommen.");
    document.body.innerHTML = "<p></p>";
    const p = document.querySelector("p")!;
    p.textContent = original;
    processor = new DomProcessor(document, {
      rules: defaultRules,
      profile: "aggressive",
      processAccessibleAttributes: false
    });
    processor.start();
    processor.flush();
    expect(p.textContent?.normalize("NFC")).toBe("Alle Schüler kommen.");
    processor.stop({ restore: true });
    processor = undefined;
    expect(p.textContent).toBe(original);
  });
});
