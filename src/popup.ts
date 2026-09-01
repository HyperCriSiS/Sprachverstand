import { getExtensionApi } from "./browser/api";
import { t } from "./i18n";
import { ruleGroupDefinitions } from "./rules/catalog";
import {
  defaultVisiblePopupSectionIds,
  popupRuleGroupSectionId,
  type PopupSectionId,
  type Settings
} from "./settings/defaults";
import { loadSettings, saveSettings } from "./settings/storage";

interface ReplacementSummaryEntry {
  readonly original: string;
  readonly replacement: string;
  readonly count: number;
}

interface StateUpdatedMessage {
  readonly type: "sprachverstand.state-updated";
  readonly tabId: number;
  readonly text: string;
  readonly count: number;
  readonly replacements: readonly ReplacementSummaryEntry[];
}

interface ReplacementStateResponse {
  readonly text?: unknown;
  readonly count?: unknown;
  readonly replacements?: unknown;
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
const detailsCountOutput = requiredElement<HTMLOutputElement>("#details-count");
const detailsUniqueCountOutput =
  requiredElement<HTMLOutputElement>("#details-unique-count");
const replacementList = requiredElement<HTMLUListElement>("#replacement-list");
const replacementEmpty = requiredElement<HTMLElement>("#replacement-empty");
const mainView = requiredElement<HTMLElement>("#main-view");
const detailsView = requiredElement<HTMLElement>("#details-view");
const openReplacementsButton =
  requiredElement<HTMLButtonElement>("#open-replacements");
const closeReplacementsButton =
  requiredElement<HTMLButtonElement>("#close-replacements");
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
let currentCount = 0;
let currentReplacements: readonly ReplacementSummaryEntry[] = [];

function isReplacementSummaryEntry(value: unknown): value is ReplacementSummaryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReplacementSummaryEntry>;
  return (
    typeof candidate.original === "string" &&
    typeof candidate.replacement === "string" &&
    typeof candidate.count === "number" &&
    Number.isFinite(candidate.count) &&
    candidate.count > 0
  );
}

function isStateUpdatedMessage(message: unknown): message is StateUpdatedMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<StateUpdatedMessage>;
  return (
    candidate.type === "sprachverstand.state-updated" &&
    typeof candidate.tabId === "number" &&
    typeof candidate.text === "string" &&
    typeof candidate.count === "number" &&
    Array.isArray(candidate.replacements) &&
    candidate.replacements.every(isReplacementSummaryEntry)
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
    title.textContent = t(group.labelKey, undefined, group.label);

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

function renderReplacementDetails(): void {
  countOutput.textContent = String(currentCount);
  detailsCountOutput.textContent = String(currentCount);
  detailsUniqueCountOutput.textContent = String(currentReplacements.length);
  replacementEmpty.hidden = currentReplacements.length !== 0;

  const fragment = document.createDocumentFragment();
  for (const entry of currentReplacements) {
    const item = document.createElement("li");
    item.className = "replacement-item";

    const original = document.createElement("span");
    original.className = "replacement-original";
    original.textContent = entry.original;

    const arrow = document.createElement("span");
    arrow.className = "replacement-arrow";
    arrow.textContent = "→";
    arrow.setAttribute("aria-hidden", "true");

    const replacement = document.createElement("span");
    replacement.className = "replacement-target";
    replacement.textContent = entry.replacement || "∅";

    const times = document.createElement("span");
    times.className = "replacement-times";
    times.textContent = `× ${entry.count}`;

    item.append(original, arrow, replacement, times);
    fragment.append(item);
  }

  replacementList.replaceChildren(fragment);
}

function render(): void {
  enabledInput.checked = settings.enabled;
  stateOutput.textContent = settings.enabled
    ? t("active", undefined, "Aktiv")
    : t("paused", undefined, "Pausiert");
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

function normalizeReplacementState(
  value: ReplacementStateResponse | undefined
): {
  readonly count: number;
  readonly replacements: readonly ReplacementSummaryEntry[];
} {
  const replacements = Array.isArray(value?.replacements)
    ? value.replacements.filter(isReplacementSummaryEntry)
    : [];
  const count =
    typeof value?.count === "number" && Number.isFinite(value.count)
      ? Math.max(0, value.count)
      : replacements.reduce((total, entry) => total + entry.count, 0);
  return { count, replacements };
}

async function refreshReplacementState(): Promise<void> {
  const api = getExtensionApi();
  const response = (await api.runtime.sendMessage({
    type: "sprachverstand.get-inspected-count"
  })) as ReplacementStateResponse | undefined;
  const normalized = normalizeReplacementState(response);
  currentCount = normalized.count;
  currentReplacements = normalized.replacements;
  renderReplacementDetails();
}

function handleRuntimeMessage(message: unknown): void {
  if (!isStateUpdatedMessage(message) || message.tabId !== activeTabId) {
    return;
  }

  currentCount = Math.max(0, message.count);
  currentReplacements = message.replacements;
  renderReplacementDetails();
}

async function start(): Promise<void> {
  createRuleGroupControls();
  settings = await loadSettings();
  await resolveActiveTabId();
  render();
  await refreshReplacementState();

  const api = getExtensionApi();
  api.runtime.onMessage.addListener(handleRuntimeMessage);
  window.addEventListener("unload", () => {
    api.runtime.onMessage.removeListener(handleRuntimeMessage);
  });

  enabledInput.addEventListener("change", () => {
    settings = { ...settings, enabled: enabledInput.checked };
    void saveSettings(settings);
    render();
  });

  for (const input of ruleGroupInputs()) {
    input.addEventListener("change", () => {
      const enabledGroups = new Set(settings.enabledRuleGroupIds);
      const groupId = input.dataset.ruleGroupId;
      if (!groupId) {
        return;
      }
      if (input.checked) {
        enabledGroups.add(groupId);
      } else {
        enabledGroups.delete(groupId);
      }
      settings = {
        ...settings,
        enabledRuleGroupIds: ruleGroupDefinitions
          .map((group) => group.id)
          .filter((id) => enabledGroups.has(id))
      };
      void saveSettings(settings);
    });
  }

  processAccessibleAttributesInput.addEventListener("change", () => {
    settings = {
      ...settings,
      processAccessibleAttributes: processAccessibleAttributesInput.checked
    };
    void saveSettings(settings);
  });

  processQuotedTextInput.addEventListener("change", () => {
    settings = {
      ...settings,
      processQuotedText: processQuotedTextInput.checked
    };
    void saveSettings(settings);
  });

  processSubtitlesInput.addEventListener("change", () => {
    settings = {
      ...settings,
      processSubtitles: processSubtitlesInput.checked
    };
    void saveSettings(settings);
  });

  openReplacementsButton.addEventListener("click", () => {
    mainView.hidden = true;
    detailsView.hidden = false;
  });
  closeReplacementsButton.addEventListener("click", () => {
    detailsView.hidden = true;
    mainView.hidden = false;
  });

  optionsButton.addEventListener("click", () => {
    void api.runtime.openOptionsPage();
  });
}

void start();
