import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-11: getrennte Inline- und Untertitelkontexte", () => {
  it("führt Zitatkontext nicht durch ausgeschlossene Captions hindurch", () => {
    document.body.innerHTML =
      '<p>„<span class="ytp-caption-segment">Hinweis</span><b>Lehrer:innen</b>“.</p>';
    processor = new DomProcessor(document, {
      rules: defaultRules,
      profile: "aggressive",
      processAccessibleAttributes: false,
      processQuotedText: false,
      processSubtitles: false
    });
    processor.start();
    expect(document.querySelector("span")?.textContent).toBe("Hinweis");
    expect(document.querySelector("b")?.textContent).toBe("Lehrer");
  });
});
