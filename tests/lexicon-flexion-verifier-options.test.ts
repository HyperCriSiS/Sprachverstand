import { describe, expect, it } from "vitest";
import { isCandidateEligible } from "../scripts/lexicon-verify-flexion.mjs";

describe("Flexionsprüfer-Kandidatenauswahl", () => {
  const weakPair = {
    base: "orthoptist",
    masculine: "orthoptist",
    feminine: "orthoptistin",
    confidence: "weak"
  };

  it("bleibt standardmäßig auf starke Paarbelege begrenzt", () => {
    expect(isCandidateEligible(weakPair)).toBe(false);
    expect(
      isCandidateEligible({
        ...weakPair,
        confidence: "strong"
      })
    ).toBe(true);
  });

  it("lässt schwächere Paarbelege nur nach expliziter Freigabe zu", () => {
    expect(isCandidateEligible(weakPair, true)).toBe(true);
    expect(isCandidateEligible({ base: "unvollständig" }, true)).toBe(false);
  });
});
