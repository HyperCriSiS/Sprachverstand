import { getExtensionApi } from "./browser/api";
import { transformText } from "./core/transform-text";
import { defaultRules } from "./rules";
import {
  disabledRuleIdsForGroups,
  ruleGroupDefinitions
} from "./rules/catalog";
import {
  currentSettingsRevision,
  defaultSettings,
  maximumCustomReplacements,
  maximumExcludedDomains,
  normalizeExcludedDomain,
  syncCategoryIds,
  type Settings,
  type SyncCategoryId
} from "./settings/defaults";
import {
  analyzeCustomReplacementConflicts,
  formatCustomReplacementsText,
  formatProtectedTermsText,
  parseCustomReplacementsText,
  parseProtectedTermsText,
  type ReplacementNotice
} from "./settings/personal-rules";
import {
  createSettingsBackupDocument,
  maximumSettingsBackupImportBytes,
  mergeImportedSettings,
  parseSettingsBackupDocument,
  stringifySettingsBackupDocument,
  type SettingsBackupImportMode,
  type SettingsImportResult
} from "./settings/settings-backup";
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

const form = requiredElement<HTMLFormElement>("#settings-form");
const enabledInput = requiredElement<HTMLInputElement>("#enabled");
const countOutput = requiredElement<HTMLOutputElement>("#count");
const processAccessibleAttributesInput =
  requiredElement<HTMLInputElement>("#process-accessible-attributes");
const processQuotedTextInput =
  requiredElement<HTMLInputElement>("#process-quoted-text");
const ruleGroupsContainer = requiredElement<HTMLElement>("#rule-groups");
const protectedTermsInput =
  requiredElement<HTMLTextAreaElement>("#protected-terms");
const customReplacementsInput =
  requiredElement<HTMLTextAreaElement>("#custom-replacements");
const customReplacementFeedback =
  requiredElement<HTMLElement>("#custom-replacement-feedback");
const customPreviewInput =
  requiredElement<HTMLTextAreaElement>("#custom-preview-input");
const customPreviewOutput =
  requiredElement<HTMLTextAreaElement>("#custom-preview-output");
const customPreviewCount =
  requiredElement<HTMLOutputElement>("#custom-preview-count");
const exportSettingsButton =
  requiredElement<HTMLButtonElement>("#export-personal-rules");
const importSettingsButton =
  requiredElement<HTMLButtonElement>("#import-personal-rules");
const importSettingsFile =
  requiredElement<HTMLInputElement>("#import-personal-rules-file");
const importModeSelect =
  requiredElement<HTMLSelectElement>("#personal-rules-import-mode");
const importSummary = requiredElement<HTMLElement>("#import-summary");
const syncCategoriesContainer =
  requiredElement<HTMLElement>("#sync-categories");
const excludedDomainsInput =
  requiredElement<HTMLTextAreaElement>("#excluded-domains");
const selectAllRulesButton =
  requiredElement<HTMLButtonElement>("#select-all-rules");
const selectNoRulesButton =
  requiredElement<HTMLButtonElement>("#select-no-rules");
const resetButton = requiredElement<HTMLButtonElement>("#reset");
const statusOutput = requiredElement<HTMLOutputElement>("#status");
const expandAllSectionsButton =
  requiredElement<HTMLButtonElement>("#expand-all-sections");
const collapseAllSectionsButton =
  requiredElement<HTMLButtonElement>("#collapse-all-sections");
const settingsSections = [
  ...document.querySelectorAll<HTMLDetailsElement>("details.settings-section")
];
const expandAllSectionsButton =
  requiredElement<HTMLButtonElement>("#expand-all-sections");
const collapseAllSectionsButton =
  requiredElement<HTMLButtonElement>("#collapse-all-sections");
const settingsSections = [
  ...document.querySelectorAll<HTMLDetailsElement>("details.settings-section")
];

let activeTabId: number | undefined;
let interactiveUpdateTimer: number | undefined;
let statusTimer: number | undefined;

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

function refreshSectionToggleButtons(): void {
  const allOpen = settingsSections.every((section) => section.open);
  const allClosed = settingsSections.every((section) => !section.open);
  expandAllSectionsButton.disabled = allOpen;
  collapseAllSectionsButton.disabled = allClosed;
}

function setAllSectionsOpen(open: boolean): void {
  for (const section of settingsSections) {
    section.open = open;
  }
  refreshSectionToggleButtons();
}

function refreshSectionToggleButtons(): void {
  const allOpen = settingsSections.every((section) => section.open);
  const allClosed = settingsSections.every((section) => !section.open);
  expandAllSectionsButton.disabled = allOpen;
  collapseAllSectionsButton.disabled = allClosed;
}

function setAllSectionsOpen(open: boolean): void {
  for (const section of settingsSections) {
    section.open = open;
  }
  refreshSectionToggleButtons();
}

function createRuleGroupControls(): void {
  const fragment = document.createDocumentFragment();

  for (const group of ruleGroupDefinitions) {
    const label = document.createElement("label");
    label.className = "rule-card";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.ruleGroupId = group.id;

    const content = document.createElement("span");
    content.className = "rule-card-content";

    const title = document.createElement("strong");
    title.textContent = group.label;

    const description = document.createElement("span");
    description.textContent = group.description;

    const example = document.createElement("code");
    example.textContent = group.example;

    content.append(title, description, example);
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

function syncCategoryInputs(): HTMLInputElement[] {
  return [...syncCategoriesContainer.querySelectorAll<HTMLInputElement>(
    "input[data-sync-category]"
  )];
}

function syncCategoryIdsFromForm(): SyncCategoryId[] {
  const known = new Set<string>(syncCategoryIds);
  return syncCategoryInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.syncCategory)
    .filter(
      (id): id is SyncCategoryId => typeof id === "string" && known.has(id)
    );
}

function enabledRuleGroupIdsFromForm(): string[] {
  return ruleGroupInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.ruleGroupId)
    .filter((id): id is string => Boolean(id));
}

function render(settings: Settings): void {
  enabledInput.checked = settings.enabled;
  processAccessibleAttributesInput.checked =
    settings.processAccessibleAttributes;
  processQuotedTextInput.checked = settings.processQuotedText;
  protectedTermsInput.value = formatProtectedTermsText(settings.protectedTerms);
  customReplacementsInput.value = formatCustomReplacementsText(
    settings.customReplacements
  );
  excludedDomainsInput.value = settings.excludedDomains.join("\n");

  const selectedSyncCategories = new Set(settings.syncCategoryIds);
  for (const input of syncCategoryInputs()) {
    input.checked = selectedSyncCategories.has(
      input.dataset.syncCategory as SyncCategoryId
    );
  }

  const enabledGroups = new Set(settings.enabledRuleGroupIds);
  for (const input of ruleGroupInputs()) {
    input.checked = enabledGroups.has(input.dataset.ruleGroupId ?? "");
  }
}

function readLines(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readExcludedDomains(): string[] {
  const entries = readLines(excludedDomainsInput.value);
  if (entries.length > maximumExcludedDomains) {
    throw new Error(
      `Es sind höchstens ${maximumExcludedDomains} Domain-Ausschlüsse möglich.`
    );
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const normalized = normalizeExcludedDomain(entry);
    if (!normalized) {
      throw new Error(`Der Domain-Ausschluss „${entry}“ ist ungültig.`);
    }
    if (seen.has(normalized)) {
      throw new Error(
        `Der Domain-Ausschluss „${entry}“ ist mehrfach beziehungsweise in gleichwertiger Schreibweise enthalten.`
      );
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function readForm(): Settings {
  return {
    settingsRevision: currentSettingsRevision,
    enabled: enabledInput.checked,
    excludedDomains: readExcludedDomains(),
    enabledRuleGroupIds: enabledRuleGroupIdsFromForm(),
    protectedTerms: parseProtectedTermsText(protectedTermsInput.value),
    customReplacements: parseCustomReplacementsText(
      customReplacementsInput.value
    ).replacements,
    processAccessibleAttributes: processAccessibleAttributesInput.checked,
    processQuotedText: processQuotedTextInput.checked,
    syncCategoryIds: syncCategoryIdsFromForm()
  };
}

function showStatus(
  message: string,
  isError = false,
  duration = 5000
): void {
  if (statusTimer !== undefined) {
    window.clearTimeout(statusTimer);
  }

  statusOutput.textContent = message;
  statusOutput.classList.toggle("error", isError);
  statusTimer = window.setTimeout(() => {
    statusOutput.textContent = "";
    statusOutput.classList.remove("error");
    statusTimer = undefined;
  }, duration);
}

function createNoticeList(
  notices: readonly ReplacementNotice[]
): HTMLUListElement {
  const list = document.createElement("ul");
  const visibleNotices = notices.slice(0, 16);

  for (const notice of visibleNotices) {
    const item = document.createElement("li");
    item.className = notice.severity;
    item.textContent = notice.message;
    list.append(item);
  }

  if (notices.length > visibleNotices.length) {
    const item = document.createElement("li");
    item.textContent = `${notices.length - visibleNotices.length} weitere Hinweise werden aus Platzgründen nicht angezeigt.`;
    list.append(item);
  }

  return list;
}

function renderCustomReplacementFeedback(): void {
  try {
    const parsed = parseCustomReplacementsText(customReplacementsInput.value);
    const protectedTerms = parseProtectedTermsText(protectedTermsInput.value);
    const disabledRuleIds = disabledRuleIdsForGroups(
      enabledRuleGroupIdsFromForm()
    );
    const notices = [
      ...parsed.notices,
      ...analyzeCustomReplacementConflicts(
        parsed.replacements,
        protectedTerms,
        (source) =>
          transformText(source, defaultRules, {
            profile: "aggressive",
            disabledRuleIds,
            protectedTerms: [],
            customReplacements: [],
            processQuotedText: true
          }).text
      )
    ];

    const summary = document.createElement("p");
    summary.className = "diagnostic-summary";
    summary.textContent = `${parsed.replacements.length} von ${maximumCustomReplacements} möglichen Ersetzungen geprüft.`;

    if (notices.length === 0) {
      const success = document.createElement("p");
      success.className = "diagnostic-success";
      success.textContent = "Keine Konflikte oder auffälligen Überschneidungen erkannt.";
      customReplacementFeedback.replaceChildren(summary, success);
      customReplacementFeedback.className = "diagnostics success";
      return;
    }

    customReplacementFeedback.replaceChildren(summary, createNoticeList(notices));
    customReplacementFeedback.className = notices.some(
      (notice) => notice.severity === "warning"
    )
      ? "diagnostics warning"
      : "diagnostics info";
  } catch (error) {
    const message = document.createElement("p");
    message.textContent =
      error instanceof Error
        ? error.message
        : "Eigene Ersetzungen konnten nicht geprüft werden.";
    customReplacementFeedback.replaceChildren(message);
    customReplacementFeedback.className = "diagnostics error";
  }
}

function renderCustomReplacementPreview(): void {
  const input = customPreviewInput.value;
  if (!input) {
    customPreviewOutput.value = "";
    customPreviewCount.textContent = "Noch kein Testtext eingegeben.";
    customPreviewCount.classList.remove("error");
    return;
  }

  try {
    const settings = readForm();
    const result = transformText(input, defaultRules, {
      profile: "aggressive",
      disabledRuleIds: disabledRuleIdsForGroups(
        settings.enabledRuleGroupIds
      ),
      protectedTerms: settings.protectedTerms,
      customReplacements: settings.customReplacements,
      processQuotedText: settings.processQuotedText
    });

    customPreviewOutput.value = result.text;
    customPreviewCount.textContent =
      result.replacements === 0
        ? "Keine Änderung im Testtext."
        : `${result.replacements} ${result.replacements === 1 ? "Ersetzung" : "Ersetzungen"} im Testtext.`;
    customPreviewCount.classList.remove("error");
  } catch (error) {
    customPreviewOutput.value = "";
    customPreviewCount.textContent =
      error instanceof Error
        ? error.message
        : "Die Vorschau konnte nicht erstellt werden.";
    customPreviewCount.classList.add("error");
  }
}

function scheduleInteractiveUpdate(): void {
  if (interactiveUpdateTimer !== undefined) {
    window.clearTimeout(interactiveUpdateTimer);
  }

  interactiveUpdateTimer = window.setTimeout(() => {
    renderCustomReplacementFeedback();
    renderCustomReplacementPreview();
    interactiveUpdateTimer = undefined;
  }, 120);
}

async function renderCurrentCount(): Promise<void> {
  const api = getExtensionApi();
  const response = (await api.runtime.sendMessage({
    type: "sprachverstand.get-inspected-count"
  })) as { readonly tabId?: unknown; readonly text?: unknown } | undefined;

  activeTabId =
    typeof response?.tabId === "number" ? response.tabId : activeTabId;
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

async function persist(): Promise<void> {
  try {
    await saveSettings(readForm());
    importSummary.replaceChildren();
    showStatus("Gespeichert – offene Seiten werden sofort neu verarbeitet.");
    refreshCountAfterChange();
  } catch (error) {
    showStatus(
      error instanceof Error
        ? error.message
        : "Einstellungen konnten nicht gespeichert werden.",
      true
    );
  }
}

function downloadTextFile(contents: string, filename: string): void {
  const blob = new Blob([contents], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportSettings(): void {
  try {
    const settings = readForm();
    const exported = createSettingsBackupDocument(settings);
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      stringifySettingsBackupDocument(exported),
      `sprachverstand-einstellungen-${date}.json`
    );
    showStatus(
      `Alle Einstellungen einschließlich ${settings.protectedTerms.length} Ausnahmen und ${settings.customReplacements.length} eigener Ersetzungen exportiert.`
    );
  } catch (error) {
    showStatus(
      error instanceof Error
        ? error.message
        : "Die Einstellungen konnten nicht exportiert werden.",
      true
    );
  }
}

function selectedImportMode(): SettingsBackupImportMode {
  const value = importModeSelect.value;
  if (
    value === "keep-existing" ||
    value === "prefer-imported" ||
    value === "replace"
  ) {
    return value;
  }
  return "keep-existing";
}

function renderImportSummary(result: SettingsImportResult): void {
  const generalSettings = document.createElement("p");
  generalSettings.textContent =
    "Aktivierungsstatus, Regelgruppen, Domain-Ausschlüsse, Zitat- und Attributoptionen sowie die Auswahl der optionalen Browser-Synchronisierung wurden aus der Sicherung übernommen.";

  const summary = document.createElement("p");
  summary.textContent = [
    `${result.addedProtectedTerms} Ausnahmen ergänzt`,
    `${result.addedCustomReplacements} Ersetzungen ergänzt`,
    `${result.replacedCustomReplacements} Ersetzungen überschrieben`,
    `${result.skippedDuplicates} Dubletten übersprungen`
  ].join(", ") + ".";

  const reminder = document.createElement("p");
  reminder.className = "import-reminder";
  reminder.textContent = "Der Import ist vorbereitet, aber noch nicht gespeichert.";

  if (result.conflicts.length === 0) {
    importSummary.replaceChildren(generalSettings, summary, reminder);
    importSummary.className = "import-summary";
    return;
  }

  const heading = document.createElement("strong");
  heading.textContent = `${result.conflicts.length} Zielkonflikte:`;
  const list = document.createElement("ul");
  for (const conflict of result.conflicts.slice(0, 12)) {
    const item = document.createElement("li");
    item.textContent = conflict;
    list.append(item);
  }
  if (result.conflicts.length > 12) {
    const item = document.createElement("li");
    item.textContent = `${result.conflicts.length - 12} weitere Konflikte.`;
    list.append(item);
  }

  importSummary.replaceChildren(
    generalSettings,
    summary,
    heading,
    list,
    reminder
  );
  importSummary.className = "import-summary warning";
}

async function importSettings(file: File): Promise<void> {
  if (file.size > maximumSettingsBackupImportBytes) {
    throw new Error("Die Importdatei ist größer als 1 MB und wird nicht verarbeitet.");
  }

  const imported = parseSettingsBackupDocument(await file.text());
  const mode = selectedImportMode();
  const current = mode === "replace" ? defaultSettings : readForm();
  const result = mergeImportedSettings(
    current,
    imported.settings,
    mode
  );

  render(result.settings);
  renderImportSummary(result);
  scheduleInteractiveUpdate();
  showStatus(
    "Einstellungssicherung geprüft und in das Formular übernommen. Zum Anwenden noch speichern.",
    false,
    8000
  );
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
  refreshSectionToggleButtons();
  render(await loadSettings());
  renderCustomReplacementFeedback();
  renderCustomReplacementPreview();
  await renderCurrentCount();

  const api = getExtensionApi();
  api.runtime.onMessage.addListener(handleRuntimeMessage);
  window.addEventListener("unload", () => {
    api.runtime.onMessage.removeListener(handleRuntimeMessage);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void persist();
  });
  form.addEventListener("input", scheduleInteractiveUpdate);
  form.addEventListener("change", scheduleInteractiveUpdate);

  expandAllSectionsButton.addEventListener("click", () => {
  setAllSectionsOpen(true);
});
collapseAllSectionsButton.addEventListener("click", () => {
  setAllSectionsOpen(false);
});
for (const section of settingsSections) {
  section.addEventListener("toggle", refreshSectionToggleButtons);
}

  expandAllSectionsButton.addEventListener("click", () => {
  setAllSectionsOpen(true);
});
collapseAllSectionsButton.addEventListener("click", () => {
  setAllSectionsOpen(false);
});
for (const section of settingsSections) {
  section.addEventListener("toggle", refreshSectionToggleButtons);
}

  selectAllRulesButton.addEventListener("click", () => {
    for (const input of ruleGroupInputs()) {
      input.checked = true;
    }
    scheduleInteractiveUpdate();
  });

  selectNoRulesButton.addEventListener("click", () => {
    for (const input of ruleGroupInputs()) {
      input.checked = false;
    }
    scheduleInteractiveUpdate();
  });

  exportSettingsButton.addEventListener("click", exportSettings);
  importSettingsButton.addEventListener("click", () => {
    importSettingsFile.click();
  });
  importSettingsFile.addEventListener("change", () => {
    const file = importSettingsFile.files?.[0];
    if (!file) {
      return;
    }

    void importSettings(file)
      .catch((error: unknown) => {
        showStatus(
          error instanceof Error
            ? error.message
            : "Die Einstellungen konnten nicht importiert werden.",
          true,
          8000
        );
      })
      .finally(() => {
        importSettingsFile.value = "";
      });
  });

  resetButton.addEventListener("click", () => {
    render(defaultSettings);
    importSummary.replaceChildren();
    scheduleInteractiveUpdate();
    void saveSettings(defaultSettings).then(() => {
      showStatus("Auf sichere Standardeinstellungen zurückgesetzt.");
      refreshCountAfterChange();
    });
  });
}

void start();
