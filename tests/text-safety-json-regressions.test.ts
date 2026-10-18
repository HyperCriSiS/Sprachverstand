import {describe, expect, it} from "vitest";
import {isProbablyTechnicalText} from "../src/core/text-safety";

describe("Begrenzte kompakte JSON-Schutzprüfung", () => {
  it("bewahrt die vorherige Erkennung bei unterschiedlichen Schlüsseln und Begrenzern", () => {
    const previous = /^(?:\{.*"[^"]+"\s*:.*\}|\[\s*\{.*\}\s*\])$/su;
    const fragments = ["a", " ", "\n", '"', ":", "{", "}", "[", "]", "ß", "𐐀"];
    let seed = 31819;
    for (let trial = 0; trial < 3000; trial++) {
      let middle = " Prosa ";
      for (let index = 0; index < 20; index++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        middle += fragments[seed % fragments.length];
      }
      for (const input of ["{" + middle + "}", "[" + middle + "]", "{" + middle]) {
        expect(isProbablyTechnicalText(input), input).toBe(previous.test(input.trim()));
      }
    }
  });
  it("lässt lange unvollständige JSON-Fragmente ohne vollständige Rückwärtssuche durch", () => {
    expect(isProbablyTechnicalText('{"name": Prosa, '.repeat(10_000))).toBe(false);
    expect(isProbablyTechnicalText('{"name": Prosa, '.repeat(10_000) + "}")).toBe(true);
    expect(isProbablyTechnicalText('[  { Prosa }  ]')).toBe(true);
  });
});
