import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;
afterEach(() => { processor?.stop(); processor = undefined; document.body.innerHTML = ""; });

describe("N59: Mengenangabe vor einem Inline-Knoten", () => {
  for (const degree of ["sehr", "recht", "ziemlich"]) {
    for (const marker of [":innen", "Innen", "innen"]) {
      for (const [preposition, noun] of [["Mit", "Lehrern"], ["Für", "Lehrer"]]) {
        it(preposition + " bis zu " + degree + " vielen Lehrer" + marker, () => {
          document.body.innerHTML = "<p>" + preposition + " bis zu " + degree + " vielen <em>Lehrer" + marker + "</em>.</p>";
          const original = document.body.innerHTML;
          processor = new DomProcessor(document, { rules: defaultRules, profile: "aggressive" });
          processor.start(); processor.flush();
          expect(document.body.textContent).toBe(preposition + " bis zu " + degree + " vielen " + (marker === "innen" ? "Lehrerinnen" : noun) + ".");
          processor.stop({ restore: true });
          expect(document.body.innerHTML).toBe(original);
        });
      }
    }
  }
});
