import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

interface LocaleMessage {
  readonly message?: string;
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
  it("keeps German and English locale keys aligned", async () => {
    const [de, en] = await Promise.all([readMessages("de"), readMessages("en")]);
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const key of Object.keys(de)) {
      expect(de[key]?.message, `missing German message: ${key}`).toBeTruthy();
      expect(en[key]?.message, `missing English message: ${key}`).toBeTruthy();
    }
  });

  it("references only existing localization keys in extension pages", async () => {
    const [de, en] = await Promise.all([readMessages("de"), readMessages("en")]);

    for (const path of localizedPages) {
      const dom = new JSDOM(await readFile(path, "utf8"));
      for (const element of dom.window.document.querySelectorAll("*")) {
        for (const attribute of localizationAttributes) {
          const key = element.getAttribute(attribute);
          if (!key) continue;
          expect(de[key]?.message, `${path}: missing German key ${key}`).toBeTruthy();
          expect(en[key]?.message, `${path}: missing English key ${key}`).toBeTruthy();
        }
      }
    }
  });

  it("does not leave visible UI prose unmarked for localization", async () => {
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

      expect(unlocalized, `${path}: unlocalized visible text`).toEqual([]);
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
    expect(bootstrap).toContain("data-i18n");
    expect(bootstrap).toContain("_locales/de/messages.json");
    expect(bootstrap).toContain("settingsExported");
    expect(bootstrap).toContain("importSummary");
  });
});
