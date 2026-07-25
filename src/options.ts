import type { RuleProfile } from "./core/rule";
import {
  defaultSettings,
  type Settings
} from "./settings/defaults";
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

const form = requiredElement<HTMLFormElement>("#settings-form");
const enabledInput = requiredElement<HTMLInputElement>("#enabled");
const profileSelect = requiredElement<HTMLSelectElement>("#profile");
const excludedDomainsInput =
  requiredElement<HTMLTextAreaElement>("#excluded-domains");
const resetButton = requiredElement<HTMLButtonElement>("#reset");
const statusOutput = requiredElement<HTMLOutputElement>("#status");

let currentSettings: Settings = defaultSettings;

function render(settings: Settings): void {
  currentSettings = settings;
  enabledInput.checked = settings.enabled;
  profileSelect.value = settings.profile;
  excludedDomainsInput.value = settings.excludedDomains.join("\n");
}

function readForm(): Settings {
  return {
    enabled: enabledInput.checked,
    profile: profileSelect.value as RuleProfile,
    excludedDomains: excludedDomainsInput.value
      .split(/\r?\n/u)
      .map((entry) => entry.trim())
      .filter(Boolean),
    disabledRuleIds: currentSettings.disabledRuleIds
  };
}

function showStatus(message: string): void {
  statusOutput.textContent = message;
  window.setTimeout(() => {
    statusOutput.textContent = "";
  }, 2000);
}

async function start(): Promise<void> {
  render(await loadSettings());

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    void saveSettings(readForm()).then(() => {
      showStatus("Gespeichert");
    });
  });

  resetButton.addEventListener("click", () => {
    render(defaultSettings);

    void saveSettings(defaultSettings).then(() => {
      showStatus("Zurückgesetzt");
    });
  });
}

void start();
