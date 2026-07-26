import { getExtensionApi } from "./browser/api";
import { badgeBackgroundColor, formatBadgeCount } from "./browser/badge";

interface ReplacementCountMessage {
  readonly type: "sprachverstand.replacement-count";
  readonly count: number;
}

interface GetCountMessage {
  readonly type: "sprachverstand.get-count";
  readonly tabId: number;
}

const api = getExtensionApi();
const countsByTab = new Map<number, number>();

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

api.runtime.onMessage.addListener(async (message, sender) => {
  if (isReplacementCountMessage(message)) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return undefined;
    }

    const count = Math.max(0, Math.trunc(message.count));
    countsByTab.set(tabId, count);

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

    return undefined;
  }

  if (isGetCountMessage(message)) {
    return { count: countsByTab.get(message.tabId) ?? 0 };
  }

  return undefined;
});

api.tabs.onRemoved.addListener((tabId) => {
  countsByTab.delete(tabId);
});
