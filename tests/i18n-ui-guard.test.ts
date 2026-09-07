import { readFile } from "node:fs/promises";
// @ts-expect-error jsdom ist eine vorhandene Testabhängigkeit ohne mitgelieferte TypeScript-Deklarationen.
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

interface LocaleMessage {
  readonly message?: string;
}

const localizedPages = [
  "static/popup/popup.html",
  "static/options/options.html",
  "static/legal/legal.html"
] as const;

const localizedAttributes = [
  ["title", "data-i18n-title"],
  ["placeholder", "data-i18n-placeholder"],
  ["aria-label", "data-i18n-aria-label"],
  ["aria-description", "data-i18n-aria-description"]
] as const;

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function readGermanMessages(): Promise<Record<string, LocaleMessage>> {
  return JSON.parse(
    await readFile("static/_locales/de/messages.json", "utf8")
  ) as Record<string, LocaleMessage>;
}

describe("i18n UI regression guard", () => {
  it("erzwingt i18n-Bindungen für sichtbare HTML-Texte und Attribute", async () => {
    const de = await readGermanMessages();
    const allowedLiteralText = new Set(["Sprachverstand", "0"]);

    for (const path of localizedPages) {
      const dom = new JSDOM(await readFile(path, "utf8"));
      const document = dom.window.document;
      const walker = document.createTreeWalker(
        document.documentElement,
        dom.window.NodeFilter.SHOW_TEXT
      );
      const unlocalized: string[] = [];

      let node = walker.nextNode();
      while (node) {
        const text = normalize(node.nodeValue ?? "");
        const parent = node.parentElement;
        if (
          text &&
          parent &&
          !allowedLiteralText.has(text) &&
          !/^[().,·]+$/.test(text) &&
          !parent.closest("code, script, style") &&
          !parent.closest("[data-i18n]")
        ) {
          unlocalized.push(text);
        }
        node = walker.nextNode();
      }

      expect(
        unlocalized,
        `${path}: sichtbarer Text ohne data-i18n`
      ).toEqual([]);

      for (const element of document.querySelectorAll("*")) {
        const key = element.getAttribute("data-i18n");
        if (key) {
          const expected = de[key]?.message;
          const fallback = normalize(element.textContent ?? "");
          if (expected && fallback && !expected.includes("$")) {
            expect(
              fallback,
              `${path}: deutscher Fallback passt nicht zu ${key}`
            ).toBe(normalize(expected));
          }
        }

        for (const [attribute, localizationAttribute] of localizedAttributes) {
          const value = element.getAttribute(attribute);
          if (!value) continue;
          expect(
            element.getAttribute(localizationAttribute),
            `${path}: ${attribute} ohne ${localizationAttribute}`
          ).toBeTruthy();
        }
      }
    }
  });

  it("verhindert fest verdrahtete dynamische UI-Texte in TypeScript", async () => {
    const sources = await Promise.all(
      ["src/options.ts", "src/popup.ts"].map(async (path) => ({
        path,
        source: await readFile(path, "utf8")
      }))
    );
    const directAssignments =
      /\b(?:textContent|innerText|innerHTML|title|placeholder|ariaLabel|ariaDescription)\s*=\s*(["'`])((?:\\.|(?!\1).)*)\1/gu;
    const attributeAssignments =
      /\.setAttribute\(\s*["'](?:title|aria-label|aria-description|placeholder)["']\s*,\s*(["'`])((?:\\.|(?!\1).)*)\1/gu;

    for (const { path, source } of sources) {
      const hardcoded: string[] = [];
      for (const pattern of [directAssignments, attributeAssignments]) {
        for (const match of source.matchAll(pattern)) {
          const literal = (match[2] ?? "").replace(/\$\{[^}]*\}/gu, "");
          if (/\p{L}/u.test(literal)) hardcoded.push(match[0]);
        }
      }

      expect(
        hardcoded,
        `${path}: dynamischer sichtbarer Text muss über i18n laufen`
      ).toEqual([]);
    }
  });
});
