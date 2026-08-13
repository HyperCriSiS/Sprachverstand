import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const legacyApi = readFileSync(
  "legacy/palemoon/palemoon/legacy-api.js",
  "utf8"
);

describe("Pale Moon theme integration", () => {
  it("detects dark Pale Moon toolbars and mirrors the theme into extension pages", () => {
    expect(legacyApi).toContain('toolbar[brighttext]');
    expect(legacyApi).toContain('getAttribute("brighttext") !== "false"');
    expect(legacyApi).toContain(
      'setAttribute("data-palemoon-theme", theme)'
    );
  });

  it("updates the mirrored theme when browser theme attributes change", () => {
    expect(legacyApi).toContain("MutationObserver");
    expect(legacyApi).toContain('"brighttext"');
    expect(legacyApi).toContain('"lwthemetextcolor"');
    expect(legacyApi).toContain("scheduleThemeRefresh");
  });

  it("injects both light and dark palettes only into Pale Moon extension pages", () => {
    expect(legacyApi).toContain('sprachverstand-palemoon-theme');
    expect(legacyApi).toContain(':root[data-palemoon-theme="light"]');
    expect(legacyApi).toContain(':root[data-palemoon-theme="dark"]');
    expect(legacyApi).toContain("#1c1b22");
    expect(legacyApi).toContain("#f2f2f4");
  });
});
