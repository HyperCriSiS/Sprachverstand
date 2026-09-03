import { getExtensionApi } from "./browser/api";
import { badgeBackgroundColor, formatBadgeCount } from "./browser/badge";

interface ReplacementCountMessage {
  readonly type: "sprachverstand.replacement-count";
  readonly hostname?: string;
  readonly count: number;
}

interface GetCountMessage {
  readonly type: "sprachverstand.get-count";
  readonly tabId: number;
}

interface SetInspectedTabMessage {
  readonly type: "sprachverstand.set-inspected-tab";
  readonly tabId: number;
}

interface GetInspectedCountMessage {
  readonly type: "sprachverstand.get-inspected-count";
}

const api = getExtensionApi();
const countsByTab = new Map<number, number>();
const hostnamesByTab = new Map<number, string>();
let inspectedTabId: number | undefined;
let lastCountedTabId: number | undefined;

async function notifyCountUpdate(
  tabId: number,
  count: number,
  hostname?: string
): Promise<void> {
  await api.runtime
    .sendMessage({
      type: "sprachverstand.count-updated",
      tabId,
      text: formatBadgeCount(count) || "0",
      ...(hostname ? { hostname } : {})
    })
    .catch(() => {
      // Popup oder Einstellungsseite sind meist nicht geöffnet.
    });
}

function isReplacementCountMessage(
  message: unknown
): message is ReplacementCountMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<ReplacementCountMessage>;
  return (
    candidate.type === "sprachverstand.replacement-count" &&
    typeof candidate.count === "number" &&
    Number.isFinite(candidate.count)
  );
}

function isGetCountMessage(message: unknown): message is GetCountMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<GetCountMessage>;
  return (
    candidate.type === "sprachverstand.get-count" &&
    typeof candidate.tabId === "number"
  );
}

function isSetInspectedTabMessage(
  message: unknown
): message is SetInspectedTabMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<SetInspectedTabMessage>;
  return (
    candidate.type === "sprachverstand.set-inspected-tab" &&
    typeof candidate.tabId === "number"
  );
}

function isGetInspectedCountMessage(
  message: unknown
): message is GetInspectedCountMessage {
  return (
    Boolean(message) &&
    typeof message === "object" &&
    (message as Partial<GetInspectedCountMessage>).type ===
      "sprachverstand.get-inspected-count"
  );
}

api.runtime.onMessage.addListener(async (message, sender) => {
  if (isReplacementCountMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    const count = Math.max(0, Math.trunc(message.count));
    const hostname =
      typeof message.hostname === "string" && message.hostname
        ? message.hostname
        : undefined;
    countsByTab.set(tabId, count);
    if (hostname) {
      hostnamesByTab.set(tabId, hostname);
    }
    lastCountedTabId = tabId;

    await Promise.all([
      api.action.setBadgeBackgroundColor({
        color: badgeBackgroundColor,
        tabId
      }),
      api.action.setBadgeText({
        text: formatBadgeCount(count),
        tabId
      })
    ]);
    await notifyCountUpdate(tabId, count, hostname);

    return undefined;
  }

  if (isSetInspectedTabMessage(message)) {
    inspectedTabId = message.tabId;
    return undefined;
  }

  if (isGetInspectedCountMessage(message)) {
    const tabId = inspectedTabId ?? lastCountedTabId;
    if (tabId === undefined) {
      return { text: "0" };
    }

    const cachedCount = countsByTab.get(tabId);
    if (cachedCount !== undefined) {
      return {
        tabId,
        text: formatBadgeCount(cachedCount) || "0",
        hostname: hostnamesByTab.get(tabId)
      };
    }

    const badgeText = await api.action.getBadgeText({ tabId });
    return {
      tabId,
      text: badgeText || "0",
      hostname: hostnamesByTab.get(tabId)
    };
  }

  if (isGetCountMessage(message)) {
    const cachedCount = countsByTab.get(message.tabId);
    if (cachedCount !== undefined) {
      return {
        text: formatBadgeCount(cachedCount) || "0",
        hostname: hostnamesByTab.get(message.tabId)
      };
    }

    const badgeText = await api.action.getBadgeText({ tabId: message.tabId });
    return {
      text: badgeText || "0",
      hostname: hostnamesByTab.get(message.tabId)
    };
  }

  return undefined;
});

api.tabs.onRemoved.addListener((tabId) => {
  countsByTab.delete(tabId);
  hostnamesByTab.delete(tabId);
  if (inspectedTabId === tabId) {
    inspectedTabId = undefined;
  }
  if (lastCountedTabId === tabId) {
    lastCountedTabId = undefined;
  }
});
