import { describe, expect, it } from "vitest";
import { normalizeSettings } from "../src/settings/defaults";

describe("Normalisierung persönlicher Ausnahmen", () => {
  it("entfernt Dubletten ohne Beachtung der Groß- und Kleinschreibung", () => {
    const settings = normalizeSettings({
      protectedTerms: [
        "Nutzer:innen",
        "nutzer:innen",
        "Meine geschützte Phrase"
      ]
    });

    expect(settings.protectedTerms).toEqual([
      "Nutzer:innen",
      "Meine geschützte Phrase"
    ]);
  });
});
