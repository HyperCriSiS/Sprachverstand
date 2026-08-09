import { getExtensionApi } from "./browser/api";
import { ruleGroupDefinitions } from "./rules/catalog";
import {
  defaultVisiblePopupSectionIds,
  popupRuleGroupSectionId,
  type PopupSectionId,
  type Settings
} from "./settings/defaults";
import { loadSettings, saveSettings } from "./settings/storage";

interface CountUpdatedMessage {
  readonly type: "sprachverstand.count-updated";
  readonly tabId: number;
  readonly text: string;
}

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element fehlt: ${selector}`);
  }

  return element;
}

const enabledInput = requiredElement<HTMLInputElement>("#enabled");
const stateOutput = requiredElement<HTMLOutputElement>("#state");
const countOutput = requiredElement<HTMLOutputElement>("#count");
const ruleGroupsContainer = requiredElement<HTMLElement>("#rule-groups");
const processAccessibleAttributesInput =
  requiredElement<HTMLInputElement>("#process-accessible-attributes");
const processQuotedTextInput =
  requiredElement<HTMLInputElement>("#process-quoted-text");
const processSubtitlesInput =
  requiredElement<HTMLInputElement>("#process-subtitles");
const optionsButton = requiredElement<HTMLButtonElement>("#open-options");
const popupSections = [
  ...document.querySelectorAll<HTMLElement>("[data-popup-section]")
];

let settings: Settings;
let activeTabId: number | undefined;

function isCountUpdatedMessage(message: unknown): message is CountUpdatedMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<CountUpdatedMessage>;
  return (
    candidate.type === "sprachverstand.count-updated" &&
    typeof candidate.tabId === "number" &&
    typeof candidate.text === "string"
  );
}

function createRuleGroupControls(): void {
  const fragment = document.createDocumentFragment();

  for (const group of ruleGroupDefinitions) {
    const label = document.createElement("label");
    label.className = "popup-rule";
    label.dataset.popupRuleGroup = group.id;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.ruleGroupId = group.id;

    const content = document.createElement("span");
    content.className = "popup-rule-content";

    const title = document.createElement("strong");
    title.textContent = group.label;

    const example = document.createElement("code");
    example.textContent = group.example;

    content.append(title, example);
    label.append(input, content);
    fragment.append(label);
  }

  ruleGroupsContainer.replaceChildren(fragment);
}

function ruleGroupInputs(): HTMLInputElement[] {
  return [...ruleGroupsContainer.querySelectorAll<HTMLInputElement>(
    "input[data-rule-group-id]"
  )];
}

function popupRuleGroupRows(): HTMLElement[] {
  return [...ruleGroupsContainer.querySelectorAll<HTMLElement>(
    "[data-popup-rule-group]"
  )];
}

function render(): void {
  enabledInput.checked = settings.enabled;
  stateOutput.textContent = settings.enabled ? "Aktiv" : "Pausiert";
  processAccessibleAttributesInput.checked =
    settings.processAccessibleAttributes;
  processQuotedTextInput.checked = settings.processQuotedText;
  processSubtitlesInput.checked = settings.processSubtitles;

  const visibleSections = new Set<PopupSectionId>(
    settings.visiblePopupSectionIds ?? defaultVisiblePopupSectionIds
  );
  for (const section of popupSections) {
    const sectionId = section.dataset.popupSection as PopupSectionId | undefined;
    section.hidden = !sectionId || !visibleSections.has(sectionId);
  }

  for (const row of popupRuleGroupRows()) {
    const groupId = row.dataset.popupRuleGroup;
    row.hidden = !groupId || !visibleSections.has(popupRuleGroupSectionId(groupId));
  }

  const enabledGroups = new Set(settings.enabledRuleGroupIds);
  for (const input of ruleGroupInputs()) {
    input.checked = enabledGroups.has(input.dataset.ruleGroupId ?? "");
  }
}

async function resolveActiveTabId(): Promise<number | undefined> {
  const api = getExtensionApi();
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id;
  return activeTabId;
}

async function renderCurrentCount(): Promise<void> {
  const api = getExtensionApi();
  const tabId = activeTabId ?? (await resolveActiveTabId());

  if (tabId === undefined) {
    countOutput.textContent = "0";
    return;
  }

  const response = (await api.runtime.sendMessage({
    type: "sprachverstand.get-count",
    tabId
  })) as { readonly text?: unknown } | undefined;

  countOutput.textContent =
    typeof response?.text === "string" ? response.text : "0";
}

function refreshCountAfterChange(): void {
  for (const delay of [0, 60, 180, 400]) {
    window.setTimeout(() => {
      void renderCurrentCount();
    }, delay);
  }
}

async function persistEnabled(): Promise<void> {
  settings = {
    ...settings,
    enabled: enabledInput.checked
  };

  await saveSettings(settings);
  render();
  refreshCountAfterChange();
}

async function persistRuleGroups(): Promise<void> {
  settings = {
    ...settings,
    enabledRuleGroupIds: ruleGroupInputs()
      .filter((input) => input.checked)
      .map((input) => input.dataset.ruleGroupId)
      .filter((id): id is string => Boolean(id))
  };

  await saveSettings(settings);
  render();
  refreshCountAfterChange();
}

async function persistTextOptions(): Promise<void> {
  settings = {
    ...settings,
    processAccessibleAttributes: processAccessibleAttributesInput.checked,
    processQuotedText: processQuotedTextInput.checked,
    processSubtitles: processSubtitlesInput.checked
  };

  await saveSettings(settings);
  render();
  refreshCountAfterChange();
}

function handleRuntimeMessage(message: unknown): void {
  if (
    isCountUpdatedMessage(message) &&
    message.tabId === activeTabId
  ) {
    countOutput.textContent = message.text || "0";
  }
}

async function start(): Promise<void> {
  createRuleGroupControls();
  settings = await loadSettings();
  render();
  await resolveActiveTabId();
  await renderCurrentCount();

  const api = getExtensionApi();
  api.runtime.onMessage.addListener(handleRuntimeMessage);
  window.addEventListener("unload", () => {
    api.runtime.onMessage.removeListener(handleRuntimeMessage);
  });

  enabledInput.addEventListener("change", () => {
    void persistEnabled();
  });

  ruleGroupsContainer.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
      void persistRuleGroups();
    }
  });

  for (const input of [
    processAccessibleAttributesInput,
    processQuotedTextInput,
    processSubtitlesInput
  ]) {
    input.addEventListener("change", () => {
      void persistTextOptions();
    });
  }

  optionsButton.addEventListener("click", () => {
    const open = async (): Promise<void> => {
      if (activeTabId !== undefined) {
        await api.runtime.sendMessage({
          type: "sprachverstand.set-inspected-tab",
          tabId: activeTabId
        });
      }
      await api.runtime.openOptionsPage();
    };
    void open();
  });
}

void start();
