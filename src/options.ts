import { getExtensionApi } from "./browser/api";
import { t } from "./i18n";
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
  popupSectionIds,
  syncCategoryIds,
  type PopupSectionId,
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
const processSubtitlesInput =
  requiredElement<HTMLInputElement>("#process-subtitles");
const popupSectionsContainer =
  requiredElement<HTMLElement>("#popup-sections");
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
const saveButton = requiredElement<HTMLButtonElement>("#save-settings");
const resetButton = requiredElement<HTMLButtonElement>("#reset");
const expandAllSectionsButton =
  requiredElement<HTMLButtonElement>("#expand-all-sections");
const collapseAllSectionsButton =
  requiredElement<HTMLButtonElement>("#collapse-all-sections");
const selectAllRulesButton =
  requiredElement<HTMLButtonElement>("#select-all-rules");
const selectNoRulesButton =
  requiredElement<HTMLButtonElement>("#select-no-rules");
const statusOutput = requiredElement<HTMLOutputElement>("#status");
const settingsSections = [
  ...document.querySelectorAll<HTMLDetailsElement>("details.settings-section")
];

let statusTimer: number | undefined;
let interactiveUpdateTimer: number | undefined;
let activeTabId: number | undefined;

class LocalizedUiError extends Error {}

function localizedUiError(
  key: string,
  substitutions: string | readonly string[] | undefined,
  fallback: string
): LocalizedUiError {
  return new LocalizedUiError(t(key, substitutions, fallback));
}

function visibleErrorMessage(
  error: unknown,
  key: string,
  fallback: string
): string {
  if (error instanceof LocalizedUiError) {
    return error.message;
  }

  console.error(error);
  return t(key, undefined, fallback);
}

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
  expandAllSectionsButton.disabled = settingsSections.every(
    (section) => section.open
  );
  collapseAllSectionsButton.disabled = settingsSections.every(
    (section) => !section.open
  );
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
    title.textContent = t(group.labelKey, undefined, group.label);

    const description = document.createElement("span");
    description.textContent = t(group.descriptionKey, undefined, group.description);

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

function popupSectionInputs(): HTMLInputElement[] {
  return [...popupSectionsContainer.querySelectorAll<HTMLInputElement>(
    "input[data-popup-section]"
  )];
}

function syncCategoryInputs(): HTMLInputElement[] {
  return [...syncCategoriesContainer.querySelectorAll<HTMLInputElement>(
    "input[data-sync-category]"
  )];
}

function enabledRuleGroupIdsFromForm(): string[] {
  return ruleGroupInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.ruleGroupId ?? "")
    .filter(Boolean);
}

function popupSectionIdsFromForm(): PopupSectionId[] {
  return popupSectionInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.popupSection as PopupSectionId)
    .filter((sectionId) => popupSectionIds.includes(sectionId));
}

function syncCategoryIdsFromForm(): SyncCategoryId[] {
  return syncCategoryInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.syncCategory as SyncCategoryId)
    .filter((categoryId) => syncCategoryIds.includes(categoryId));
}

function render(settings: Settings): void {
  enabledInput.checked = settings.enabled;
  processAccessibleAttributesInput.checked = settings.processAccessibleAttributes;
  processQuotedTextInput.checked = settings.processQuotedText;
  processSubtitlesInput.checked = settings.processSubtitles;
  protectedTermsInput.value = formatProtectedTermsText(settings.protectedTerms);
  customReplacementsInput.value = formatCustomReplacementsText(
    settings.customReplacements
  );
  excludedDomainsInput.value = settings.excludedDomains.join("\n");

  const enabledGroups = new Set(settings.enabledRuleGroupIds);
  for (const input of ruleGroupInputs()) {
    input.checked = enabledGroups.has(input.dataset.ruleGroupId ?? "");
  }

  const visiblePopupSections = new Set(settings.visiblePopupSectionIds);
  for (const input of popupSectionInputs()) {
    const sectionId = input.dataset.popupSection as PopupSectionId | undefined;
    input.checked = Boolean(sectionId && visiblePopupSections.has(sectionId));
  }

  const enabledSyncCategories = new Set(settings.syncCategoryIds);
  for (const input of syncCategoryInputs()) {
    const categoryId = input.dataset.syncCategory as SyncCategoryId | undefined;
    input.checked = Boolean(categoryId && enabledSyncCategories.has(categoryId));
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
    throw localizedUiError(
      "maxExcludedDomains",
      [String(maximumExcludedDomains)],
      `Es sind höchstens ${maximumExcludedDomains} Domain-Ausschlüsse möglich.`
    );
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const normalized = normalizeExcludedDomain(entry);
    if (!normalized) {
      throw localizedUiError(
        "invalidExcludedDomain",
        [entry],
        `Der Domain-Ausschluss „${entry}“ ist ungültig.`
      );
    }
    if (seen.has(normalized)) {
      throw localizedUiError(
        "duplicateExcludedDomain",
        [entry],
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
    processSubtitles: processSubtitlesInput.checked,
    syncCategoryIds: syncCategoryIdsFromForm(),
    visiblePopupSectionIds: popupSectionIdsFromForm()
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

function formatNoticeDiagnostic(notice: ReplacementNotice): string {
  const [first = "", second = "", third = ""] = notice.parts;

  switch (notice.code) {
    case "duplicate":
      return `„${first}“ ×2 (#${second}, #${third})`;
    case "no-op":
      return `„${first}“ → =`;
    case "deletion":
      return `„${first}“ → ∅`;
    case "protected":
      return `⛔ „${first}“`;
    case "built-in-overlap":
      return `„${first}“ ⇢ „${second}“`;
    case "case-variant":
      return `Aa ↔ aA · „${first}“ ↔ „${second}“`;
    case "overlap":
      return `„${first}“ ∩ „${second}“`;
    case "chain":
      return `„${first}“ → „${second}“ → …`;
  }
}

function createNoticeList(
  notices: readonly ReplacementNotice[]
): HTMLUListElement {
  const list = document.createElement("ul");
  const visibleNotices = notices.slice(0, 16);

  for (const notice of visibleNotices) {
    const item = document.createElement("li");
    item.className = notice.severity;
    item.dataset.diagnosticCode = notice.code;
    item.textContent = formatNoticeDiagnostic(notice);
    list.append(item);
  }

  if (notices.length > visibleNotices.length) {
    const item = document.createElement("li");
    const remaining = notices.length - visibleNotices.length;
    item.textContent = t(
      "noticeMore",
      [String(remaining)],
      `${remaining} weitere Hinweise werden aus Platzgründen nicht angezeigt.`
    );
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
    summary.textContent = t(
      "replacementsChecked",
      [String(parsed.replacements.length), String(maximumCustomReplacements)],
      `${parsed.replacements.length} von ${maximumCustomReplacements} möglichen Ersetzungen geprüft.`
    );

    if (notices.length === 0) {
      const success = document.createElement("p");
      success.className = "diagnostic-success";
      success.textContent = t(
        "noConflicts",
        undefined,
        "Keine Konflikte oder auffälligen Überschneidungen erkannt."
      );
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
    message.textContent = visibleErrorMessage(
      error,
      "customCheckFailed",
      "Eigene Ersetzungen konnten nicht geprüft werden."
    );
    customReplacementFeedback.replaceChildren(message);
    customReplacementFeedback.className = "diagnostics error";
  }
}

function renderCustomReplacementPreview(): void {
  const input = customPreviewInput.value;
  if (!input) {
    customPreviewOutput.value = "";
    customPreviewCount.textContent = t(
      "noPreviewText",
      undefined,
      "Noch kein Testtext eingegeben."
    );
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
        ? t("previewNoChange", undefined, "Keine Änderung im Testtext.")
        : result.replacements === 1
          ? t(
              "previewOneReplacement",
              [String(result.replacements)],
              "1 Ersetzung im Testtext."
            )
          : t(
              "previewManyReplacements",
              [String(result.replacements)],
              `${result.replacements} Ersetzungen im Testtext.`
            );
    customPreviewCount.classList.remove("error");
  } catch (error) {
    customPreviewOutput.value = "";
    customPreviewCount.textContent = visibleErrorMessage(
      error,
      "previewFailed",
      "Die Vorschau konnte nicht erstellt werden."
    );
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
    showStatus(
      t(
        "saved",
        undefined,
        "Gespeichert – offene Seiten werden sofort neu verarbeitet."
      )
    );
    refreshCountAfterChange();
  } catch (error) {
    showStatus(
      visibleErrorMessage(
        error,
        "saveFailed",
        "Einstellungen konnten nicht gespeichert werden."
      ),
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
      t(
        "settingsExported",
        [
          String(settings.protectedTerms.length),
          String(settings.customReplacements.length)
        ],
        `Alle Einstellungen einschließlich ${settings.protectedTerms.length} Ausnahmen und ${settings.customReplacements.length} eigener Ersetzungen exportiert.`
      )
    );
  } catch (error) {
    showStatus(
      visibleErrorMessage(
        error,
        "settingsExportFailed",
        "Die Einstellungen konnten nicht exportiert werden."
      ),
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
  generalSettings.textContent = t(
    "importGeneralSettingsRestored",
    undefined,
    "Aktivierungsstatus, Regelgruppen, Popup-Anzeige, Domain-Ausschlüsse, Zitat-, Untertitel- und Attributoptionen sowie die Auswahl der optionalen Browser-Synchronisierung wurden aus der Sicherung übernommen."
  );

  const summary = document.createElement("p");
  summary.textContent = t(
    "importSummary",
    [
      String(result.addedProtectedTerms),
      String(result.addedCustomReplacements),
      String(result.replacedCustomReplacements),
      String(result.skippedDuplicates)
    ],
    [
      `${result.addedProtectedTerms} Ausnahmen ergänzt`,
      `${result.addedCustomReplacements} Ersetzungen ergänzt`,
      `${result.replacedCustomReplacements} Ersetzungen überschrieben`,
      `${result.skippedDuplicates} Dubletten übersprungen`
    ].join(", ") + "."
  );

  const reminder = document.createElement("p");
  reminder.className = "import-reminder";
  reminder.textContent = t(
    "importPreparedNotSaved",
    undefined,
    "Der Import ist vorbereitet, aber noch nicht gespeichert."
  );

  if (result.conflicts.length === 0) {
    importSummary.replaceChildren(generalSettings, summary, reminder);
    importSummary.className = "import-summary";
    return;
  }

  const heading = document.createElement("strong");
  heading.textContent = `⚠ ${result.conflicts.length}`;
  const list = document.createElement("ul");
  for (const conflict of result.conflicts.slice(0, 12)) {
    const item = document.createElement("li");
    item.textContent = conflict;
    list.append(item);
  }
  if (result.conflicts.length > 12) {
    const item = document.createElement("li");
    item.textContent = `… +${result.conflicts.length - 12}`;
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
    throw localizedUiError(
      "importTooLarge",
      undefined,
      "Die Importdatei ist größer als 1 MB und wird nicht verarbeitet."
    );
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
    t(
      "importPrepared",
      undefined,
      "Einstellungssicherung geprüft und in das Formular übernommen. Zum Anwenden noch speichern."
    ),
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
          visibleErrorMessage(
            error,
            "importFailed",
            "Die Einstellungen konnten nicht importiert werden."
          ),
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
      showStatus(
        t(
          "resetDone",
          undefined,
          "Auf sichere Standardeinstellungen zurückgesetzt."
        )
      );
      refreshCountAfterChange();
    });
  });
}

void start();
