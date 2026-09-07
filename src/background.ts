import { getExtensionApi } from "./browser/api";
import { badgeBackgroundColor, formatBadgeCount } from "./browser/badge";
import { parseOptionsPageTabId } from "./browser/options";

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

function hostnameFromSenderUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const hostname = new URL(url).hostname.trim().toLowerCase().replace(/\.$/u, "");
    return hostname || undefined;
  } catch {
    return undefined;
  }
}

function replacementTotal(
  entries: readonly ReplacementSummaryEntry[]
): number {
  return entries.reduce((total, entry) => total + entry.count, 0);
}

function mergeCompatibleState(
  primary: CachedReplacementState,
  fallback: CachedReplacementState | undefined
): CachedReplacementState {
  if (!fallback || primary.count !== fallback.count) {
    return primary;
  }

  const fallbackReplacementsAreComplete =
    primary.count > 0 &&
    replacementTotal(fallback.replacements) === primary.count;

  return {
    hostname: primary.hostname ?? fallback.hostname,
    count: primary.count,
    replacements:
      primary.replacements.length > 0 || !fallbackReplacementsAreComplete
        ? primary.replacements
        : fallback.replacements
  };
}

function normalizedReplacementEntries(
  entries: readonly unknown[]
): ReplacementSummaryEntry[] {
  const normalized: ReplacementSummaryEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Partial<ReplacementSummaryEntry>;
    if (
      typeof candidate.original !== "string" ||
      typeof candidate.replacement !== "string" ||
      typeof candidate.count !== "number" ||
      !Number.isFinite(candidate.count) ||
      candidate.count <= 0
    ) {
      continue;
    }

    normalized.push({
      original: candidate.original,
      replacement: candidate.replacement,
      count: Math.max(1, Math.trunc(candidate.count))
    });

    if (normalized.length >= 250) {
      break;
    }
  }

  return normalized;
}

async function notifyStateUpdate(
  tabId: number,
  state: CachedReplacementState
): Promise<void> {
  const text = formatBadgeCount(state.count) || "0";
  await Promise.all([
    api.runtime
      .sendMessage({
        type: "sprachverstand.state-updated",
        tabId,
        text,
        hostname: state.hostname,
        count: state.count,
        replacements: state.replacements
      })
      .catch(() => {
        // Popup oder Einstellungsseite sind meist nicht geöffnet.
      }),
    api.runtime
      .sendMessage({
        type: "sprachverstand.count-updated",
        tabId,
        text
      })
      .catch(() => {
        // Die Einstellungsseite ist meist nicht geöffnet.
      })
  ]);
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
    typeof candidate.tabId === "number" &&
    Number.isInteger(candidate.tabId) &&
    candidate.tabId >= 0
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

async function readLiveReplacementState(
  tabId: number
): Promise<CachedReplacementState | undefined> {
  try {
    const response = await api.tabs.sendMessage(tabId, {
      type: "sprachverstand.get-current-replacement-state"
    });

    if (!response || typeof response !== "object") {
      return undefined;
    }

    const candidate = response as {
      readonly hostname?: unknown;
      readonly count?: unknown;
      readonly replacements?: unknown;
    };
    if (
      typeof candidate.count !== "number" ||
      !Number.isFinite(candidate.count) ||
      !Array.isArray(candidate.replacements)
    ) {
      return undefined;
    }

    return {
      hostname:
        typeof candidate.hostname === "string" && candidate.hostname
          ? candidate.hostname
          : undefined,
      count: Math.max(0, Math.trunc(candidate.count)),
      replacements: normalizedReplacementEntries(candidate.replacements)
    };
  } catch {
    // Auf internen Browserseiten oder vor dem Content-Script gibt es keinen Empfänger.
    return undefined;
  }
}

async function updateTabState(
  tabId: number,
  state: CachedReplacementState
): Promise<void> {
  statesByTab.set(tabId, state);

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

async function resetTabState(tabId: number): Promise<void> {
  statesByTab.delete(tabId);

  try {
    await api.action.setBadgeText({ text: "", tabId });
  } catch {
    // Der Tab kann zwischen Navigationsereignis und Badge-Update verschwunden sein.
  }

  await notifyStateUpdate(tabId, {
    hostname: undefined,
    count: 0,
    replacements: []
  });
}

async function getCountState(tabId: number): Promise<{
  readonly tabId: number;
  readonly text: string;
}> {
  const cached = statesByTab.get(tabId);
  const live = await readLiveReplacementState(tabId);
  if (live) {
    const merged = mergeCompatibleState(live, cached);
    statesByTab.set(tabId, merged);
    return { tabId, text: formatBadgeCount(merged.count) || "0" };
  }

  if (cached) {
    return { tabId, text: formatBadgeCount(cached.count) || "0" };
  }

  const badgeText = await api.action.getBadgeText({ tabId });
  return { tabId, text: badgeText || "0" };
}

api.runtime.onMessage.addListener(async (message, sender) => {
  if (isReplacementStateMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    const incoming = mergeCompatibleState(
      {
        hostname:
          typeof message.hostname === "string" && message.hostname
            ? message.hostname
            : hostnameFromSenderUrl(sender.url),
        count: Math.max(0, Math.trunc(message.count)),
        replacements: normalizedReplacementEntries(message.replacements)
      },
      statesByTab.get(tabId)
    );
    await updateTabState(tabId, incoming);
    return undefined;
  }

  // Abwärtskompatibel für ältere Content-Scripts während Erweiterungs-Reloads.
  if (isReplacementCountMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    await updateTabState(tabId, {
      hostname:
        statesByTab.get(tabId)?.hostname ?? hostnameFromSenderUrl(sender.url),
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
    const tabId = inspectedTabId ?? parseOptionsPageTabId(sender.url);
    if (tabId === undefined) {
      return { text: "0" };
    }
    return getCountState(tabId);
  }

  if (isGetReplacementStateMessage(message)) {
    const cached = statesByTab.get(message.tabId);
    const live = await readLiveReplacementState(message.tabId);
    if (live) {
      const merged = mergeCompatibleState(live, cached);
      statesByTab.set(message.tabId, merged);
      return {
        text: formatBadgeCount(merged.count) || "0",
        hostname: merged.hostname,
        count: merged.count,
        replacements: merged.replacements
      };
    }

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
      hostname: undefined,
      count: Number.parseInt(badgeText, 10) || 0,
      replacements: []
    };
  }

  if (isGetCountMessage(message)) {
    const state = await getCountState(message.tabId);
    return { text: state.text };
  }

  return undefined;
});

api.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    void resetTabState(tabId);
  }
});

api.tabs.onRemoved.addListener((tabId) => {
  statesByTab.delete(tabId);
});
