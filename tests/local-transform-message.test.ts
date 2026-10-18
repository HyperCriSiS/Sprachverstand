import {afterEach, describe, expect, it, vi} from "vitest";
import {isLocalTransformRequest, isDetailedTransformResult} from "../src/core/local-transform-message";
import {transformLargeTextLocally} from "../src/browser/local-transform";

afterEach(() => vi.unstubAllGlobals());
describe("Interne lokale Großtextnachrichten", () => {
  it("überträgt deaktivierte Regeln als Liste und erhält Ausnahmen und Kontext", async () => {
    const result = {text: "Nutzer", replacements: 1,
      summaries: [{original: "Nutzer:innen", replacement: "Nutzer", count: 1}]};
    const sendMessage = vi.fn(async (_message: unknown) => result);
    vi.stubGlobal("browser", {runtime: {sendMessage}});
    expect(await transformLargeTextLocally("Nutzer:innen", {profile: "aggressive",
      disabledRuleIds: new Set(["regel"]), protectedTerms: ["Ausnahme"], leadingContext: "mit "})).toEqual(result);
    const request = sendMessage.mock.calls[0]![0];
    expect(request).toEqual({type: "sprachverstand.transform-large-text", input: "Nutzer:innen",
      options: {profile: "aggressive", disabledRuleIds: ["regel"], protectedTerms: ["Ausnahme"], leadingContext: "mit "}});
    expect(isLocalTransformRequest(request)).toBe(true);
  });
  it.each([null, {}, "Text", {type: "sprachverstand.transform-large-text", input: 42},
    {type: "sprachverstand.transform-large-text", input: "Text", options: {profile: "falsch"}},
    {type: "sprachverstand.transform-large-text", input: "Text", options: {profile: "aggressive", protectedTerms: [17]}},
    {type: "sprachverstand.transform-large-text", input: "Text", options: {profile: "aggressive", customReplacements: [null]}}
  ])("verwirft ungültige Anfragen: %j", value => expect(isLocalTransformRequest(value)).toBe(false));
  it.each([null, {}, {text: "Text", replacements: -1, summaries: []},
    {text: "Text", replacements: Number.NaN, summaries: []},
    {text: "Text", replacements: 1, summaries: [{original: "A", replacement: "B", count: -1}]}
  ])("verwirft ungültige Antworten: %j", value => expect(isDetailedTransformResult(value)).toBe(false));
  it("meldet eine fehlende Antwort, damit der Aufrufer dieselben Regeln erneut ausführen kann", async () => {
    vi.stubGlobal("browser", {runtime: {sendMessage: vi.fn(async () => undefined)}});
    await expect(transformLargeTextLocally("Text", {profile: "aggressive"})).rejects.toThrow();
  });
});
