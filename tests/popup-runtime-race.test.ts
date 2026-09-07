import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MessageListener } from "../src/browser/api";
import { defaultSettings } from "../src/settings/defaults";

const popupHtml = readFileSync("static/popup/popup.html", "utf8");

function installPopupMarkup(): void {
  const body = popupHtml.match(/<body>([\s\S]*?)<\/body>/u)?.[1];
  if (!body) {
    throw new Error("Popup-Markup enthält keinen Body.");
  }
  document.body.innerHTML = body;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../src/settings/storage");
});

describe("Popup-Zustand während des Starts", () => {
  it("behält ein neueres Push-Update mit Ersetzungsdetails gegenüber einer älteren Anfrageantwort", async () => {
    installPopupMarkup();

    let runtimeListener: MessageListener | undefined;
    let resolveInitialState: ((value: unknown) => void) | undefined;
    const initialState = new Promise<unknown>((resolve) => {
      resolveInitialState = resolve;
    });

    vi.doMock("../src/settings/storage", () => ({
      loadSettings: vi.fn(async () => defaultSettings),
      saveSettings: vi.fn(async () => undefined)
    }));

    const sendRuntimeMessage = vi.fn(async (message: unknown) => {
      if (
        message &&
        typeof message === "object" &&
        (message as { readonly type?: unknown }).type ===
          "sprachverstand.get-replacement-state"
      ) {
        return initialState;
      }
      return undefined;
    });

    vi.stubGlobal("browser", {
      i18n: {
        getMessage: vi.fn(() => ""),
        getUILanguage: vi.fn(() => "de")
      },
      runtime: {
        openOptionsPage: vi.fn(),
        getURL: vi.fn((path: string) => path),
        sendMessage: sendRuntimeMessage,
        onMessage: {
          addListener: vi.fn((listener: MessageListener) => {
            runtimeListener = listener;
          }),
          removeListener: vi.fn()
        }
      },
      tabs: {
        query: vi.fn(async () => [{ id: 37 }]),
        create: vi.fn(async () => ({ id: 1 })),
        update: vi.fn(async () => ({ id: 1 }))
      }
    });

    void import("../src/popup");

    await vi.waitFor(() => {
      expect(runtimeListener).toBeDefined();
    });

    runtimeListener?.(
      {
        type: "sprachverstand.state-updated",
        tabId: 37,
        text: "14",
        count: 14,
        replacements: [
          { original: "Nutzer:innen", replacement: "Nutzer", count: 14 }
        ]
      },
      {}
    );

    resolveInitialState?.({ text: "14", count: 14, replacements: [] });

    await vi.waitFor(() => {
      expect(document.querySelector("#count")?.textContent).toBe("14");
    });

    document.querySelector<HTMLButtonElement>("#open-replacements")?.click();

    await vi.waitFor(() => {
      expect(document.querySelector("#details-count")?.textContent).toBe("14");
      expect(document.querySelector("#details-unique-count")?.textContent).toBe(
        "1"
      );
    });
    expect(document.querySelector("#replacement-list")?.textContent).toContain(
      "Nutzer:innen"
    );
  });
});
