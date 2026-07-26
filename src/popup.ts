import { getExtensionApi } from "./browser/api";
import { ruleGroupDefinitions } from "./rules/catalog";
import type { Settings } from "./settings/defaults";
import { loadSettings, saveSettings } from "./settings/storage";

function requiredElement<T extends HTMLElement>(
  selector: string
): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element fehlt: ${selector}`);
  }

  return element;
}

const enabledInput = requiredElement<HTMLInputElement>("#enabled");
const stateOutput = requiredElement<HTMLOutputElement>("#state");
const countOutput = requiredElement<HTMLOutputElement>("#count");
const rulesSummary = requiredElement<HTMLElement>("#rules-summary");
const optionsButton = requiredElement<HTMLButtonElement>("#open-options");

let settings: Settings;

function render(): void {
  enabledInput.checked = settings.enabled;
  stateOutput.textContent = settings.enabled ? "Aktiv" : "Pausiert";
  rulesSummary.textContent = `${settings.enabledRuleGroupIds.length} von ${ruleGroupDefinitions.length} Regelgruppen aktiv`;
}

async function renderCurrentCount(): Promise<void> {
  const api = getExtensionApi();
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined) {
    countOutput.textContent = "0";
    return;
  }

  const response = (await api.runtime.sendMessage({
    type: "sprachverstand.get-count",
    tabId: tab.id
  })) as { readonly text?: unknown } | undefined;

  countOutput.textContent =
    typeof response?.text === "string" ? response.text : "0";
}

async function persistEnabled(): Promise<void> {
  settings = {
    ...settings,
    enabled: enabledInput.checked
  };

  await saveSettings(settings);
  render();
  window.setTimeout(() => {
    void renderCurrentCount();
  }, 0);
}

async function start(): Promise<void> {
  settings = await loadSettings();
  render();
  await renderCurrentCount();

  enabledInput.addEventListener("change", () => {
    void persistEnabled();
  });

  optionsButton.addEventListener("click", () => {
    void getExtensionApi().runtime.openOptionsPage();
  });
}

void start();
