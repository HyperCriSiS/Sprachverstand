import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readMessages(locale: string): Promise<Record<string, { message?: string }>> {
  return JSON.parse(
    await readFile(`static/_locales/${locale}/messages.json`, "utf8")
  ) as Record<string, { message?: string }>;
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

  it("ships and injects the localization bootstrap", async () => {
    const [buildScript, bootstrap] = await Promise.all([
      readFile("scripts/build.mjs", "utf8"),
      readFile("static/i18n-bootstrap.js", "utf8")
    ]);
    expect(buildScript).toContain("i18n-bootstrap.js");
    expect(buildScript).toContain("popup/popup.html");
    expect(buildScript).toContain("options/options.html");
    expect(bootstrap).toContain("getUILanguage");
    expect(bootstrap).toContain("_locales/de/messages.json");
  });
});
