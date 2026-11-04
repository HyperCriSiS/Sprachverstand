import {expect, it, vi} from "vitest";
import {connectBackgroundTransform} from "../src/thunderbird/background-transform";
import type {ExtensionApi, MessageListener} from "../src/browser/api";

it("transforms only validated requests from tabs and preserves personal exceptions", async () => {
  let listener: MessageListener;
  const addListener = vi.fn((value: MessageListener) => {listener = value;});
  connectBackgroundTransform({runtime: {onMessage: {addListener}}} as unknown as ExtensionApi);
  const request = {type: "sprachverstand.transform-large-text", input: "Nutzer:innen", options: {profile: "aggressive"}};
  expect(await listener!(request, {})).toBeUndefined();
  expect(await listener!({...request, input: 42}, {tab: {id: 7}})).toBeUndefined();
  expect(await listener!(request, {tab: {id: 7}})).toMatchObject({text: "Nutzer", replacements: 1});
  expect(await listener!({...request, options: {profile: "aggressive", protectedTerms: ["Nutzer:innen"]}}, {tab: {id: 7}}))
    .toMatchObject({text: "Nutzer:innen", replacements: 0});
});
