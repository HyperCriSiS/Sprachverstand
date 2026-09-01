import { afterEach, describe, expect, it, vi } from "vitest";
import type { MessageListener } from "../src/browser/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Hintergrundzustand der Ersetzungsübersicht", () => {
  it("fragt den angegebenen Tab live ab und normalisiert dessen Zustand", async () => {
    let messageListener: MessageListener | undefined;
    const sendTabMessage = vi.fn(async () => ({
      count: 2,
      replacements: [
        { original: "Nutzer:innen", replacement: "Nutzer", count: 2 },
        null,
        { original: "ungültig", replacement: "", count: Number.NaN }
      ]
    }));

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
        sendMessage: vi.fn(async () => undefined),
        onMessage: {
          addListener: vi.fn((listener: MessageListener) => {
            messageListener = listener;
          }),
          removeListener: vi.fn()
        }
      },
      action: {
        setBadgeText: vi.fn(async () => undefined),
        getBadgeText: vi.fn(async () => "0"),
        setBadgeBackgroundColor: vi.fn(async () => undefined)
      },
      tabs: {
        create: vi.fn(async () => ({ id: 1 })),
        query: vi.fn(async () => []),
        sendMessage: sendTabMessage,
        onRemoved: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      }
    });

    await import("../src/background");

    expect(messageListener).toBeDefined();
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
  });
});
