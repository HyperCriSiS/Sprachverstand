import { readFile } from "node:fs/promises";
// @ts-expect-error jsdom is an existing test dependency without bundled TypeScript declarations.
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

interface LocaleMessage {
  readonly message?: string;
  readonly placeholders?: Readonly<Record<string, { readonly content?: string }>>;
}

interface LocaleDefinition {
  readonly code: string;
  readonly name: string;
  readonly direction: "ltr" | "rtl";
}

async function readMessages(locale: string): Promise<Record<string, LocaleMessage>> {
  return JSON.parse(
    await readFile(`static/_locales/${locale}/messages.json`, "utf8")
  ) as Record<string, LocaleMessage>;
}

const localizedPages = [
  "static/popup/popup.html",
  "static/options/options.html",
  "static/legal/legal.html"
] as const;

const localizationAttributes = [
  "data-i18n",
  "data-i18n-aria-label",
  "data-i18n-aria-description",
  "data-i18n-placeholder",
  "data-i18n-title"
] as const;

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("WebExtension localization", () => {
  it("hält alle 50 Locales vollständig und platzhalterkompatibel", async () => {
    const locales = JSON.parse(
      await readFile("config/locales.json", "utf8")
    ) as LocaleDefinition[];
    expect(locales).toHaveLength(50);
    expect(
      locales
        .filter((locale) => locale.direction === "rtl")
        .map((locale) => locale.code)
        .sort()
    ).toEqual(["ar", "fa", "he"]);

    const de = await readMessages("de");
    const referenceKeys = Object.keys(de).sort();
    for (const locale of locales) {
      const messages = await readMessages(locale.code);
      expect(Object.keys(messages).sort(), locale.code).toEqual(referenceKeys);
      for (const key of referenceKeys) {
        expect(
          messages[key]?.message,
          `${locale.code}: missing message ${key}`
        ).toBeTruthy();
        expect(
          messages[key]?.placeholders ?? {},
          `${locale.code}: placeholder metadata ${key}`
        ).toEqual(de[key]?.placeholders ?? {});
      }
    }
  });

  it("references only existing localization keys in extension pages", async () => {
    const de = await readMessages("de");

    for (const path of localizedPages) {
      const dom = new JSDOM(await readFile(path, "utf8"));
      for (const element of dom.window.document.querySelectorAll("*")) {
        for (const attribute of localizationAttributes) {
          const key = element.getAttribute(attribute);
          if (!key) continue;
          expect(de[key]?.message, `${path}: missing German key ${key}`).toBeTruthy();
        }
      }
    }
  });

  it("does not leave visible UI prose outside the localization catalog", async () => {
    const de = await readMessages("de");
    const catalogText = new Set(
      Object.values(de)
        .map((entry) => entry.message)
        .filter(
          (message): message is string =>
            Boolean(message) && !message?.includes("$")
        )
        .map(normalize)
    );
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
          !parent.closest("[data-i18n]") &&
          !catalogText.has(text)
        ) {
          unlocalized.push(text);
        }
        node = walker.nextNode();
      }

      expect(
        unlocalized,
        `${path}: text missing from localization catalog`
      ).toEqual([]);
    }
  });

  it("localizes both manifests", async () => {
    for (const target of ["firefox", "chromium"]) {
      const manifest = JSON.parse(
        await readFile(`manifests/${target}.json`, "utf8")
      ) as Record<string, unknown>;
      expect(manifest.default_locale).toBe("de");
      expect(manifest.name).toBe("__MSG_extensionName__");
      expect(manifest.description).toBe("__MSG_extensionDescription__");
    }
  });

  it("ships and injects the localization bootstrap into all UI pages", async () => {
    const [buildScript, bootstrap] = await Promise.all([
      readFile("scripts/build.mjs", "utf8"),
      readFile("static/i18n-bootstrap.js", "utf8")
    ]);
    expect(buildScript).toContain("i18n-bootstrap.js");
    expect(buildScript).toContain("popup/popup.html");
    expect(buildScript).toContain("options/options.html");
    expect(buildScript).toContain("legal/legal.html");
    expect(bootstrap).toContain("getUILanguage");
    expect(bootstrap).toContain("rtlLanguages");
    expect(bootstrap).toContain("data-i18n");
    expect(bootstrap).toContain("_locales/de/messages.json");
    expect(bootstrap).toContain("settingsExported");
    expect(bootstrap).toContain("importSummary");
  });
});
