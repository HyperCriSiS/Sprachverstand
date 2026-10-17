import { afterEach, describe, expect, it, vi } from "vitest";
import type { MessageListener } from "../src/browser/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Hintergrundzustand der Ersetzungsübersicht", () => {
  it("fragt den angegebenen Tab live ab und verwirft dessen Zustand bei Navigation", async () => {
    let messageListener: MessageListener | undefined;
    let updatedListener:
      | ((
          tabId: number,
          changeInfo: { readonly status?: "loading" | "complete" }
        ) => void)
      | undefined;
    const sendTabMessage = vi.fn(async () => ({
      count: 2,
      replacements: [
        { original: "Nutzer:innen", replacement: "Nutzer", count: 2 },
        null,
        { original: "ungültig", replacement: "", count: Number.NaN }
      ]
    }));
    const setBadgeText = vi.fn(async () => undefined);
    const sendRuntimeMessage = vi.fn(async () => undefined);

    vi.stubGlobal("browser", {
      i18n: {
        getMessage: vi.fn(() => ""),
        getUILanguage: vi.fn(() => "de")
      },
      storage: {
        sync: {},
        local: {},
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      },
      runtime: {
        openOptionsPage: vi.fn(),
        getURL: vi.fn((path: string) => path),
        sendMessage: sendRuntimeMessage,
        onMessage: {
          addListener: vi.fn((listener: MessageListener) => {
            messageListener = listener;
          }),
          removeListener: vi.fn()
        }
      },
      action: {
        setBadgeText,
        getBadgeText: vi.fn(async () => "0"),
        setBadgeBackgroundColor: vi.fn(async () => undefined)
      },
      tabs: {
        create: vi.fn(async () => ({ id: 1 })),
        query: vi.fn(async () => []),
        sendMessage: sendTabMessage,
        onUpdated: {
          addListener: vi.fn((listener) => {
            updatedListener = listener;
          }),
          removeListener: vi.fn()
        },
        onRemoved: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      }
    });

    await import("../src/background");

    expect(messageListener).toBeDefined();
    const transformRequest = {type: "sprachverstand.transform-large-text", input: "mit Nutzer:innen",
      options: {profile: "aggressive"}};
    expect(await messageListener?.(transformRequest, {})).toBeUndefined();
    expect(await messageListener?.(transformRequest, {tab: {id: 37}})).toEqual({
      text: "mit Nutzern", replacements: 1,
      summaries: [{original: "Nutzer:innen", replacement: "Nutzern", count: 1}]
    });
    expect(await messageListener?.({type: "sprachverstand.transform-text-batch", requests: [transformRequest]}, {})).toBeUndefined();
    const sharedBatch = {type: "sprachverstand.transform-text-shared-batch", sharedOptions: {profile: "aggressive"},
      requests: [{input: "Nutzer:innen", leadingContext: "mit "},
        {input: "Nutzer:innen", protectedRanges: [{start: 0, end: 12}]}]};
    expect(await messageListener?.(sharedBatch, {})).toBeUndefined();
    expect((await messageListener?.(sharedBatch, {tab: {id: 37}}) as {text: string}[]).map(value => value.text))
      .toEqual(["Nutzern", "Nutzer:innen"]);
    expect(await messageListener?.({type: "sprachverstand.transform-text-batch", requests: [transformRequest]}, {tab: {id: 37}})).toEqual([{
      text: "mit Nutzern", replacements: 1,
      summaries: [{original: "Nutzer:innen", replacement: "Nutzern", count: 1}]
    }]);
    const repeated = await messageListener?.({...transformRequest, input: "Nutzer:innen ".repeat(5_000)}, {tab: {id: 37}});
    expect(repeated).toEqual({text: "Nutzer ".repeat(5_000), replacements: 5_000,
      summaries: [{original: "Nutzer:innen", replacement: "Nutzer", count: 5_000}]});
    const response = await messageListener?.(
      { type: "sprachverstand.get-replacement-state", tabId: 37 },
      {}
    );

    expect(sendTabMessage).toHaveBeenCalledWith(37, {
      type: "sprachverstand.get-current-replacement-state"
    });
    expect(response).toEqual({
      text: "2",
      count: 2,
      replacements: [
        { original: "Nutzer:innen", replacement: "Nutzer", count: 2 }
      ]
    });

    const unchangedState = {type: "sprachverstand.replacement-state", hostname: "example.test", count: 2,
      replacements: [{original: "Nutzer:innen", replacement: "Nutzer", count: 2}]};
    await messageListener?.(unchangedState, {tab: {id: 37}});
    setBadgeText.mockClear(); sendRuntimeMessage.mockClear();
    await messageListener?.(unchangedState, {tab: {id: 37}});
    expect(setBadgeText, "identical settled state needs no repeated badge write").not.toHaveBeenCalled();
    expect(sendRuntimeMessage, "identical settled state needs no repeated broadcasts").not.toHaveBeenCalled();
    expect(updatedListener).toBeDefined();
    updatedListener?.(37, { status: "loading" });
    await vi.waitFor(() => {
      expect(setBadgeText).toHaveBeenCalledWith({ text: "", tabId: 37 });
    });
    expect(sendRuntimeMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sprachverstand.state-updated",
        tabId: 37,
        count: 0,
        replacements: []
      })
    );
  });
});
