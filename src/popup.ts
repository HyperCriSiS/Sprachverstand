import { getExtensionApi } from "./browser/api";
import type { RuleProfile } from "./core/rule";
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
const profileSelect = requiredElement<HTMLSelectElement>("#profile");
const stateOutput = requiredElement<HTMLOutputElement>("#state");
const countOutput = requiredElement<HTMLOutputElement>("#count");
const optionsButton = requiredElement<HTMLButtonElement>("#open-options");

let settings: Settings;

function render(): void {
  enabledInput.checked = settings.enabled;
  profileSelect.value = settings.profile;
  stateOutput.textContent = settings.enabled ? "Aktiv" : "Pausiert";
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
  })) as { readonly count?: unknown } | undefined;

  countOutput.textContent =
    typeof response?.count === "number" ? String(response.count) : "0";
}

async function persist(): Promise<void> {
  settings = {
    ...settings,
    enabled: enabledInput.checked,
    profile: profileSelect.value as RuleProfile
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
    void persist();
  });

  profileSelect.addEventListener("change", () => {
    void persist();
  });

  optionsButton.addEventListener("click", () => {
    void getExtensionApi().runtime.openOptionsPage();
  });
}

void start();
