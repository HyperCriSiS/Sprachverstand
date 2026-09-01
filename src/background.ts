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

interface CachedReplacementState {
  readonly count: number;
  readonly replacements: readonly ReplacementSummaryEntry[];
}

const api = getExtensionApi();
const statesByTab = new Map<number, CachedReplacementState>();

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
  await api.runtime
    .sendMessage({
      type: "sprachverstand.state-updated",
      tabId,
      text: formatBadgeCount(state.count) || "0",
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

api.runtime.onMessage.addListener(async (message, sender) => {
  if (isReplacementStateMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    await updateTabState(tabId, {
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
      count: Math.max(0, Math.trunc(message.count)),
      replacements: statesByTab.get(tabId)?.replacements ?? []
    });
    return undefined;
  }

  if (isGetReplacementStateMessage(message)) {
    const live = await readLiveReplacementState(message.tabId);
    if (live) {
      statesByTab.set(message.tabId, live);
      return {
        text: formatBadgeCount(live.count) || "0",
        count: live.count,
        replacements: live.replacements
      };
    }

    const cached = statesByTab.get(message.tabId);
    if (cached) {
      return {
        text: formatBadgeCount(cached.count) || "0",
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
});
