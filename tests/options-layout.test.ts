import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const html = readFileSync(
  new URL("../static/options/options.html", import.meta.url),
  "utf8"
);

describe("Einstellungsaufbau", () => {
  it("ordnet die Bereiche in der vorgesehenen Reihenfolge an", () => {
    const document = new JSDOM(html).window.document;
    const headings = [
      ...document.querySelectorAll<HTMLHeadingElement>(
        "details.settings-section > summary > h2"
      )
    ].map((heading) => heading.textContent?.trim());

    expect(headings).toEqual([
      "Allgemein",
      "Was soll korrigiert werden?",
      "Wo soll korrigiert werden?",
      "Persönliche Ausnahmen",
      "Eigene Ersetzungen",
      "Ausgeschlossene Domains",
      "Einstellungen sichern und übertragen",
      "Browser-Synchronisierung"
    ]);
  });

  it("bietet globale Schalter und einzeln aufklappbare Bereiche", () => {
    const document = new JSDOM(html).window.document;
    const sections = [
      ...document.querySelectorAll<HTMLDetailsElement>("details.settings-section")
    ];

    expect(document.querySelector("#expand-all-sections")).not.toBeNull();
    expect(document.querySelector("#collapse-all-sections")).not.toBeNull();
    expect(sections).toHaveLength(8);
    expect(sections.filter((section) => section.open)).toHaveLength(2);
  });
});
