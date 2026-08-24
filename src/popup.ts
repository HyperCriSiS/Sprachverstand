import { getExtensionApi } from "./browser/api";
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

function applyReplacementState(response: ReplacementStateResponse | undefined): void {
  currentCount =
    typeof response?.count === "number" && Number.isFinite(response.count)
      ? Math.max(0, Math.trunc(response.count))
      : typeof response?.text === "string"
        ? Number.parseInt(response.text, 10) || 0
        : 0;
  currentReplacements = Array.isArray(response?.replacements)
    ? response.replacements.filter(isReplacementSummaryEntry)
    : [];
  renderReplacementDetails();
}

async function renderCurrentState(): Promise<void> {
  const api = getExtensionApi();
  const tabId = activeTabId ?? (await resolveActiveTabId());

  if (tabId === undefined) {
    applyReplacementState(undefined);
    return;
  }

  const response = (await api.runtime.sendMessage({
    type: "sprachverstand.get-replacement-state",
    tabId
  })) as ReplacementStateResponse | undefined;

  applyReplacementState(response);
}

function refreshStateAfterChange(): void {
  for (const delay of [0, 60, 180, 400]) {
    window.setTimeout(() => {
      void renderCurrentState();
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
  refreshStateAfterChange();
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
  refreshStateAfterChange();
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
  refreshStateAfterChange();
}

function showDetails(): void {
  mainView.hidden = true;
  detailsView.hidden = false;
  closeReplacementsButton.focus();
}

function hideDetails(): void {
  detailsView.hidden = true;
  mainView.hidden = false;
  openReplacementsButton.focus();
}

function handleRuntimeMessage(message: unknown): void {
  if (isStateUpdatedMessage(message) && message.tabId === activeTabId) {
    applyReplacementState(message);
  }
}

async function start(): Promise<void> {
  createRuleGroupControls();
  settings = await loadSettings();
  render();
  await resolveActiveTabId();
  await renderCurrentState();

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

  openReplacementsButton.addEventListener("click", showDetails);
  closeReplacementsButton.addEventListener("click", hideDetails);

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
