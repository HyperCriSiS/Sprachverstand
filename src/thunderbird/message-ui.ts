import type {ExtensionApi} from "../browser/api";
import {parseOptionsPageTabId} from "../browser/options";
import {badgeBackgroundColor, formatBadgeCount} from "../browser/badge";

// Reuse the browser popup/options protocol, but never persist mail fragments or
// replacement summaries. The displayed message is the sole source of truth.
export function connectMessageUi(api: ExtensionApi): void {
  let inspectedTabId: number | undefined;
  const validId = (id: unknown): id is number =>
    typeof id === "number" && Number.isInteger(id) && id >= 0;

  async function readState(tabId: number) {
    try {
      const state = await api.tabs.sendMessage(tabId, {
        type: "sprachverstand.get-current-replacement-state"
      }) as {count?: unknown; replacements?: unknown} | undefined;
      if (typeof state?.count === "number" && Number.isFinite(state.count) && Array.isArray(state.replacements)) {
        const count = Math.max(0, Math.trunc(state.count));
        return {count, text: formatBadgeCount(count) || "0", replacements: state.replacements, hostname: ""};
      }
    } catch { /* No displayed message in this tab. */ }
    return {count: 0, text: "0", replacements: [], hostname: ""};
  }

  api.runtime.onMessage.addListener((message, sender) => {
    if (!message || typeof message !== "object") return undefined;
    const request = message as {type?: unknown; tabId?: unknown; count?: unknown; replacements?: unknown};
    if (request.type === "sprachverstand.set-inspected-tab" && validId(request.tabId)) {
      inspectedTabId = request.tabId;
      return undefined;
    }
    if (request.type === "sprachverstand.get-inspected-count") {
      const tabId = parseOptionsPageTabId(sender.url) ?? inspectedTabId;
      return tabId === undefined ? Promise.resolve({text: "0"}) : readState(tabId).then(state => ({tabId, text: state.text}));
    }
    if ((request.type === "sprachverstand.get-replacement-state" || request.type === "sprachverstand.get-count") && validId(request.tabId)) {
      return readState(request.tabId);
    }
    if (request.type === "sprachverstand.replacement-state" && validId(sender.tab?.id) &&
        typeof request.count === "number" && Number.isFinite(request.count) && Array.isArray(request.replacements)) {
      const tabId = sender.tab.id;
      const count = Math.max(0, Math.trunc(request.count));
      return Promise.all([
        api.action.setBadgeBackgroundColor({color: badgeBackgroundColor, tabId}),
        api.action.setBadgeText({text: formatBadgeCount(count), tabId}),
        api.runtime.sendMessage({type: "sprachverstand.state-updated", tabId,
          text: formatBadgeCount(count) || "0", count, replacements: request.replacements, hostname: ""}).catch(() => undefined)
      ]).then(() => undefined);
    }
    return undefined;
  });

  api.tabs.onRemoved.addListener(tabId => {
    if (inspectedTabId === tabId) inspectedTabId = undefined;
  });
  api.tabs.onUpdated.addListener((tabId, change) => {
    if (change.status !== "loading") return;
    void Promise.resolve(api.action.setBadgeText({text: "", tabId})).catch(() => undefined);
    void api.runtime.sendMessage({type: "sprachverstand.state-updated", tabId,
      text: "0", count: 0, replacements: [], hostname: ""}).catch(() => undefined);
  });
}
