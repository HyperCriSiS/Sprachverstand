import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";
import { markedDativePluralRule } from "../src/rules/marked-dative-plural";

let processor: DomProcessor | undefined;
afterEach(() => {processor?.stop(); processor = undefined; document.body.replaceChildren();});

describe("Dativkontext benötigt eine abschließende Wortgrenze", () => {
  it.each(["mit", "den langen", "Nutzer:innen 3 / 5", "mit𐐀", "mit\u200b"])
    ("erhält das Verhalten ohne Kontext bei %s", context => {
      expect(markedDativePluralRule.leadingContextRequiresTrailingWhitespace).toBe(true);
      expect(markedDativePluralRule.applyWithLeadingContext!("Nutzer:innen", context))
        .toEqual(markedDativePluralRule.apply("Nutzer:innen"));
    });

  it.each([
    ['<span>mit den langen </span><b>Nutzer:innen</b>', "mit den langen Nutzern"],
    ['<span>mit </span><i>den </i><b>Nutzer:innen</b>', "mit den Nutzern"],
    ['<span>mit</span><b>Nutzer:innen</b>', "mitNutzer"],
    ['<span>Nutzer:innen 3 / 5</span><b>Nutzer:innen</b>', "Nutzer 3 / 5Nutzer"],
    ['<span>Eine </span><b>Studierende</b> wartet.', "Eine Studentin wartet."]
  ])("bewahrt Flexion über Inline-Grenzen: %s", (html, expected) => {
    document.body.innerHTML = "<p>" + html + "</p>";
    processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive",
      processAccessibleAttributes: false});
    processor.start(); processor.flush();
    expect(document.querySelector("p")!.textContent).toBe(expected);
  });
});
