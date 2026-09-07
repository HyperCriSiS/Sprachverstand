import { afterEach, describe, expect, it, vi } from "vitest";
import type { MessageListener } from "../src/browser/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Background-Zustand", () => {
  it("behält Details bei zählergleichen Sparse-Updates und gewinnt den Hostnamen aus sender.url", async () => {
    let runtimeListener: MessageListener | undefined;

    vi.stubGlobal("browser", {
      runtime: {
        openOptionsPage: vi.fn(),
        getURL: vi.fn((path: string) => path),
        sendMessage: vi.fn(async () => undefined),
        onMessage: {
          addListener: vi.fn((listener: MessageListener) => {
            runtimeListener = listener;
          }),
          removeListener: vi.fn()
        }
      },
      action: {
        setBadgeText: vi.fn(async () => undefined),
        getBadgeText: vi.fn(async () => "14"),
        setBadgeBackgroundColor: vi.fn(async () => undefined)
      },
      tabs: {
        sendMessage: vi.fn(async () => ({
          count: 14,
          replacements: []
        })),
        query: vi.fn(async () => [{ id: 37 }]),
        create: vi.fn(async () => ({ id: 1 })),
        update: vi.fn(async () => ({ id: 1 })),
        onUpdated: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        },
        onRemoved: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      },
      i18n: {
        getMessage: vi.fn(() => ""),
        getUILanguage: vi.fn(() => "de")
      },
      storage: {
        local: {},
        sync: {},
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      }
    });

    await import("../src/background");
    expect(runtimeListener).toBeDefined();

    await runtimeListener?.(
      {
        type: "sprachverstand.replacement-state",
        count: 14,
        replacements: [
          { original: "Nutzer:innen", replacement: "Nutzer", count: 14 }
        ]
      },
      { tab: { id: 37 }, url: "https://www.example.org/artikel" }
    );

    await runtimeListener?.(
      {
        type: "sprachverstand.replacement-state",
        count: 14,
        replacements: []
      },
      { tab: { id: 37 }, url: "https://www.example.org/artikel" }
    );

    const response = (await runtimeListener?.(
      { type: "sprachverstand.get-replacement-state", tabId: 37 },
      {}
    )) as
      | {
          readonly hostname?: string;
          readonly count?: number;
          readonly replacements?: readonly unknown[];
        }
      | undefined;

    expect(response?.hostname).toBe("www.example.org");
    expect(response?.count).toBe(14);
    expect(response?.replacements).toEqual([
      { original: "Nutzer:innen", replacement: "Nutzer", count: 14 }
    ]);
  });
});
