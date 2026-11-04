import {loadSettings} from "../settings/storage";
import {composeSettingKey, composeScriptId, type ThunderbirdComposeApi} from "./compose-api";
import {transformComposeBody} from "./compose-transform";

export function connectComposeCorrection(api: ThunderbirdComposeApi): void {
  let registration = Promise.resolve();
  const attemptedTabs = new Set<number>();
  const enabled = async () => (await api.storage.local.get(composeSettingKey))[composeSettingKey] === true &&
    await api.permissions.contains({permissions: ["compose"]});

  function reconcile(): void {
    registration = registration.catch(() => undefined).then(async () => {
      if (!await api.permissions.contains({permissions: ["compose"]})) return;
      const registered = await api.scripting.compose.getRegisteredScripts({ids: [composeScriptId]});
      if (await enabled()) {
        if (!registered.length) await api.scripting.compose.registerScripts([{id: composeScriptId, js: ["compose-ready.js"]}]);
      } else if (registered.length) await api.scripting.compose.unregisterScripts({ids: [composeScriptId]});
    }).catch(() => {console.error("Sprachverstand: compose registration failed.");});
  }
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[composeSettingKey]) reconcile();
  });
  api.permissions.onAdded.addListener(reconcile);
  api.permissions.onRemoved.addListener(reconcile);
  api.tabs.onRemoved.addListener(tabId => attemptedTabs.delete(tabId));
  api.runtime.onMessage.addListener((message, sender) => {
    if (!message || typeof message !== "object" ||
        (message as {type?: unknown}).type !== "sprachverstand.compose-ready") return undefined;
    const tabId = sender.tab?.id;
    if (tabId === undefined || attemptedTabs.has(tabId)) return undefined;
    attemptedTabs.add(tabId);
    return (async () => {
      if (!await enabled()) return;
      const before = await api.compose.getComposeDetails(tabId);
      const patch = transformComposeBody(before, await loadSettings());
      if (!patch || !await enabled()) return;
      const current = await api.compose.getComposeDetails(tabId);
      // Do not replace text if the user or another extension edited meanwhile.
      if (current.isModified || current.type !== before.type || current.isPlainText !== before.isPlainText ||
          current.body !== before.body || current.plainTextBody !== before.plainTextBody) return;
      await api.compose.setComposeDetails(tabId, patch);
    })().catch(() => {console.error("Sprachverstand: reply/forward correction failed.");});
  });
  reconcile();
}
