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

describe("Popup-Zähler und Ersetzungsübersicht", () => {
  it("lädt den Zustand des aktiven Tabs und rendert Zähler sowie Ersetzungsliste", async () => {
    installPopupMarkup();

    let runtimeListener: MessageListener | undefined;
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
        return {
          text: "3",
          count: 3,
          replacements: [
            { original: "Nutzer:innen", replacement: "Nutzer", count: 2 },
            { original: "Mitarbeiter*innen", replacement: "Mitarbeiter", count: 1 }
          ]
        };
      }
      return undefined;
    });
    const queryTabs = vi.fn(async () => [{ id: 37 }]);

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
        query: queryTabs,
        create: vi.fn(async () => ({ id: 1 }))
      }
    });

    await import("../src/popup");

    await vi.waitFor(() => {
      expect(document.querySelector("#count")?.textContent).toBe("3");
    });

    expect(queryTabs).toHaveBeenCalledWith({
      active: true,
      currentWindow: true
    });
    expect(sendRuntimeMessage).toHaveBeenCalledWith({
      type: "sprachverstand.get-replacement-state",
      tabId: 37
    });
    expect(sendRuntimeMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "sprachverstand.get-inspected-count" })
    );

    document.querySelector<HTMLButtonElement>("#open-replacements")?.click();

    expect(document.querySelector<HTMLElement>("#details-view")?.hidden).toBe(
      false
    );
    expect(document.querySelector("#details-count")?.textContent).toBe("3");
    expect(document.querySelector("#details-unique-count")?.textContent).toBe(
      "2"
    );
    expect(
      document.querySelectorAll("#replacement-list .replacement-item")
    ).toHaveLength(2);
    expect(document.querySelector("#replacement-list")?.textContent).toContain(
      "Nutzer:innen"
    );
    expect(document.querySelector("#replacement-list")?.textContent).toContain(
      "Mitarbeiter"
    );

    expect(runtimeListener).toBeDefined();
    runtimeListener?.(
      {
        type: "sprachverstand.state-updated",
        tabId: 99,
        text: "9",
        count: 9,
        replacements: [
          { original: "Fremd", replacement: "Fremd", count: 9 }
        ]
      },
      {}
    );
    expect(document.querySelector("#count")?.textContent).toBe("3");

    runtimeListener?.(
      {
        type: "sprachverstand.state-updated",
        tabId: 37,
        text: "4",
        count: 4,
        replacements: [
          { original: "Nutzer:innen", replacement: "Nutzer", count: 4 }
        ]
      },
      {}
    );

    expect(document.querySelector("#count")?.textContent).toBe("4");
    expect(document.querySelector("#details-count")?.textContent).toBe("4");
    expect(document.querySelector("#details-unique-count")?.textContent).toBe(
      "1"
    );
  });
});
