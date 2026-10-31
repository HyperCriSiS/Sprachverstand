import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("static/options/options.html", "utf8");
const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));

describe("Unterstützen-Link im Footer der Einstellungen", () => {
  it("verlinkt nur statisch auf Ko-fi, ohne nachgeladenes Skript", () => {
    expect(footer).toContain('<a class="support-link" data-i18n="supportProject" href="https://ko-fi.com/hypercrisis" rel="noreferrer" target="_blank">');
    expect(html).not.toContain("ko-fi.com/cdn");
    expect(html).not.toContain("kofiwidget");
  });

  it("steht mittig zwischen Copyright und den übrigen Links", () => {
    const support = footer.indexOf('data-i18n="supportProject"');
    expect(support).toBeGreaterThan(footer.indexOf('data-i18n="copyright"'));
    expect(support).toBeLessThan(footer.indexOf('data-i18n="reportProblems"'));
  });
});
