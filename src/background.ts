import { getExtensionApi } from "./browser/api";
import { badgeBackgroundColor, formatBadgeCount } from "./browser/badge";

interface ReplacementSummaryEntry {
  readonly original: string;
  readonly replacement: string;
  readonly count: number;
}

interface ReplacementCountMessage {
  readonly type: "sprachverstand.replacement-count";
  readonly count: number;
}

interface ReplacementStateMessage {
  readonly type: "sprachverstand.replacement-state";
  readonly hostname?: string;
  readonly count: number;
  readonly replacements: readonly ReplacementSummaryEntry[];
}

interface GetCountMessage {
  readonly type: "sprachverstand.get-count";
  readonly tabId: number;
}

interface GetReplacementStateMessage {
  readonly type: "sprachverstand.get-replacement-state";
  readonly tabId: number;
}

interface SetInspectedTabMessage {
  readonly type: "sprachverstand.set-inspected-tab";
  readonly tabId: number;
}

interface GetInspectedCountMessage {
  readonly type: "sprachverstand.get-inspected-count";
}

interface CachedReplacementState {
  readonly hostname: string | undefined;
  readonly count: number;
  readonly replacements: readonly ReplacementSummaryEntry[];
}

const api = getExtensionApi();
const statesByTab = new Map<number, CachedReplacementState>();
let inspectedTabId: number | undefined;
let lastCountedTabId: number | undefined;

function normalizedReplacementEntries(
  entries: readonly ReplacementSummaryEntry[]
): ReplacementSummaryEntry[] {
  return entries
    .filter(
      (entry) =>
        typeof entry.original === "string" &&
        typeof entry.replacement === "string" &&
        Number.isFinite(entry.count) &&
        entry.count > 0
    )
    .map((entry) => ({
      original: entry.original,
      replacement: entry.replacement,
      count: Math.max(1, Math.trunc(entry.count))
    }))
    .slice(0, 250);
}

async function notifyStateUpdate(
  tabId: number,
  state: CachedReplacementState
): Promise<void> {
  await api.runtime
    .sendMessage({
      type: "sprachverstand.state-updated",
      tabId,
      text: formatBadgeCount(state.count) || "0",
      hostname: state.hostname,
      count: state.count,
      replacements: state.replacements
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

function isReplacementStateMessage(
  message: unknown
): message is ReplacementStateMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<ReplacementStateMessage>;
  return (
    candidate.type === "sprachverstand.replacement-state" &&
    typeof candidate.count === "number" &&
    Number.isFinite(candidate.count) &&
    Array.isArray(candidate.replacements)
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

function isGetReplacementStateMessage(
  message: unknown
): message is GetReplacementStateMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<GetReplacementStateMessage>;
  return (
    candidate.type === "sprachverstand.get-replacement-state" &&
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

async function updateTabState(
  tabId: number,
  state: CachedReplacementState
): Promise<void> {
  statesByTab.set(tabId, state);
  lastCountedTabId = tabId;

  await Promise.all([
    api.action.setBadgeBackgroundColor({
      color: badgeBackgroundColor,
      tabId
    }),
    api.action.setBadgeText({
      text: formatBadgeCount(state.count),
      tabId
    })
  ]);
  await notifyStateUpdate(tabId, state);
}

api.runtime.onMessage.addListener(async (message, sender) => {
  if (isReplacementStateMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    await updateTabState(tabId, {
      hostname:
        typeof message.hostname === "string" && message.hostname
          ? message.hostname
          : undefined,
      count: Math.max(0, Math.trunc(message.count)),
      replacements: normalizedReplacementEntries(message.replacements)
    });
    return undefined;
  }

  // Abwärtskompatibel für ältere Content-Scripts während Erweiterungs-Reloads.
  if (isReplacementCountMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    await updateTabState(tabId, {
      hostname: statesByTab.get(tabId)?.hostname,
      count: Math.max(0, Math.trunc(message.count)),
      replacements: statesByTab.get(tabId)?.replacements ?? []
    });
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

    const cached = statesByTab.get(tabId);
    if (cached) {
      return { tabId, text: formatBadgeCount(cached.count) || "0" };
    }

    const badgeText = await api.action.getBadgeText({ tabId });
    return { tabId, text: badgeText || "0" };
  }

  if (isGetReplacementStateMessage(message)) {
    const cached = statesByTab.get(message.tabId);
    if (cached) {
      return {
        text: formatBadgeCount(cached.count) || "0",
        hostname: cached.hostname,
        count: cached.count,
        replacements: cached.replacements
      };
    }

    const badgeText = await api.action.getBadgeText({ tabId: message.tabId });
    return {
      text: badgeText || "0",
      count: Number.parseInt(badgeText, 10) || 0,
      replacements: []
    };
  }

  if (isGetCountMessage(message)) {
    const cached = statesByTab.get(message.tabId);
    if (cached) {
      return { text: formatBadgeCount(cached.count) || "0" };
    }

    const badgeText = await api.action.getBadgeText({ tabId: message.tabId });
    return { text: badgeText || "0" };
  }

  return undefined;
});

api.tabs.onRemoved.addListener((tabId) => {
  statesByTab.delete(tabId);
  if (inspectedTabId === tabId) {
    inspectedTabId = undefined;
  }
  if (lastCountedTabId === tabId) {
    lastCountedTabId = undefined;
  }
});
