import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface LocaleMessage {
  readonly message?: string;
  readonly placeholders?: Record<string, { readonly content?: string }>;
}

async function readMessages(locale: string): Promise<Record<string, LocaleMessage>> {
  return JSON.parse(
    await readFile(`static/_locales/${locale}/messages.json`, "utf8")
  ) as Record<string, LocaleMessage>;
}

function placeholderShape(message: LocaleMessage): Record<string, string> {
  return Object.fromEntries(
    Object.entries(message.placeholders ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, value.content ?? ""])
  );
}

describe("Pale-Moon-i18n-Parität", () => {
  it("hält alle 51 Locales auf demselben vollständigen Schlüsselstand", async () => {
    const entries = await readdir("static/_locales", { withFileTypes: true });
    const locales = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(locales).toHaveLength(51);

    const reference = await readMessages("de");
    const referenceKeys = Object.keys(reference).sort();
    expect(referenceKeys).toHaveLength(170);

    for (const locale of locales) {
      const messages = await readMessages(locale);
      expect(Object.keys(messages).sort(), `${locale}: abweichender Schlüsselbestand`).toEqual(
        referenceKeys
      );

      for (const key of referenceKeys) {
        expect(messages[key]?.message?.trim(), `${locale}: leere Nachricht ${key}`).toBeTruthy();
        expect(
          placeholderShape(messages[key] ?? {}),
          `${locale}: abweichende Platzhalter bei ${key}`
        ).toEqual(placeholderShape(reference[key] ?? {}));
      }
    }
  });

  it("lässt keine verwendeten statischen oder dynamischen i18n-Schlüssel fehlen", async () => {
    const de = await readMessages("de");
    const htmlPaths = [
      "static/options/options.html",
      "static/popup/popup.html",
      "static/legal/legal.html"
    ];
    const sourcePaths = ["src/options.ts", "src/popup.ts", "src/rules/catalog.ts"];

    for (const path of htmlPaths) {
      const html = await readFile(path, "utf8");
      const keys = new Set<string>();
      for (const match of html.matchAll(/\bdata-i18n(?:-[a-z-]+)?=["']([^"']+)["']/gu)) {
        if (match[1]) keys.add(match[1]);
      }
      for (const key of keys) {
        expect(de[key]?.message, `${path}: fehlender i18n-Schlüssel ${key}`).toBeTruthy();
      }
    }

    for (const path of sourcePaths) {
      const source = await readFile(path, "utf8");
      const keys = new Set<string>();
      for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/gu)) {
        if (match[1]) keys.add(match[1]);
      }
      for (const match of source.matchAll(
        /\b(?:labelKey|descriptionKey):\s*["']([^"']+)["']/gu
      )) {
        if (match[1]) keys.add(match[1]);
      }
      for (const key of keys) {
        expect(de[key]?.message, `${path}: fehlender dynamischer i18n-Schlüssel ${key}`).toBeTruthy();
      }
    }
  });

  it("lässt keine verwaisten UI-Schlüssel im Katalog zurück", async () => {
    const de = await readMessages("de");
    const productionPaths = [
      "src/options.ts",
      "src/popup.ts",
      "src/rules/catalog.ts",
      "static/options/options.html",
      "static/popup/popup.html",
      "static/legal/legal.html",
      "manifests/firefox.json",
      "manifests/chromium.json"
    ];
    const productionText = (
      await Promise.all(productionPaths.map((path) => readFile(path, "utf8")))
    ).join("\n");

    const orphaned = Object.keys(de)
      .filter((key) => !productionText.includes(key))
      .sort();

    expect(orphaned).toEqual([]);
  });
});
