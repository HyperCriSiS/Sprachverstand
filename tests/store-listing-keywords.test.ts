import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("getrennte Firefox- und Chrome-Storetexte", () => {
  beforeAll(() => {
    execFileSync(process.execPath, ["scripts/generate-store-metadata.mjs"]);
  });

  it("erhält die deutsche Firefox-Suchwortliste vollständig im AMO-Export", () => {
    const source = readJson("store/amo-listings/de.json");
    const exported = readJson("store/generated/amo-metadata.json");
    expect(source.keywords).toContain("Genderfilter");
    expect(source.keywords).toContain("Gendersternchen entfernen");
    expect(source.keywords).toContain("generisches Maskulinum");
    expect(exported.description.de).toBe(
      `${source.description}\n\nTags:\n${source.keywords.join(", ")}`
    );
    expect(exported.summary.de).toBe(source.summary);
  });

  it("hält alle 51 Chrome-Beschreibungen frei vom Firefox-Keywordblock", () => {
    const locales = readJson("config/locales.json") as Array<{ code: string }>;
    expect(locales).toHaveLength(51);
    for (const { code } of locales) {
      const listing = readJson(`store/listings/${code}.json`);
      expect(listing.description.split("\n\n")[0].length).toBeGreaterThan(20);
      expect(listing.description).not.toContain("Tags:");
      expect(listing.description).toContain("Nutzer:innen");
      expect(listing.description).toContain("Mitarbeiter*innen");
    }
    const chrome = readJson("store/listings/de.json").description;
    for (const keyword of ["Gendersternchen", "Gender-Doppelpunkt", "Binnen-I", "Gender Gap"]) {
      expect(chrome).toContain(keyword);
    }
    expect(readFileSync("store/generated/chrome-dashboard.csv", "utf8")).not.toContain("Tags:");
  });
});
