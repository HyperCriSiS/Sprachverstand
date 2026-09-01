import { getExtensionApi } from "./browser/api";
import { parseOptionsPageTabId } from "./browser/options";
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

interface StateUpdatedMessage {
  readonly type: "sprachverstand.state-updated";
  readonly tabId: number;
  readonly text: string;
}

interface ReplacementStateResponse {
  readonly text?: unknown;
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
const protectedTermsInput =
  requiredElement<HTMLTextAreaElement>("#protected-terms");
const customReplacementsInput =
  requiredElement<HTMLTextAreaElement>("#custom-replacements");
const customReplacementFeedback =
  requiredElement<HTMLElement>("#custom-replacement-feedback");
const customPreviewInput =
  requiredElement<HTMLTextAreaElement>("#custom-preview-input");
const customPreviewOutput =
  requiredElement<HTMLOutputElement>("#custom-preview-output");
const excludedDomainsInput =
  requiredElement<HTMLTextAreaElement>("#excluded-domains");
const popupSectionsContainer = requiredElement<HTMLElement>("#popup-sections");
const ruleGroupsContainer = requiredElement<HTMLElement>("#rule-groups");
const syncCategoriesContainer =
  requiredElement<HTMLElement>("#sync-categories");
const exportSettingsButton =
  requiredElement<HTMLButtonElement>("#export-personal-rules");
const importSettingsButton =
  requiredElement<HTMLButtonElement>("#import-personal-rules");
const importSettingsInput =
  requiredElement<HTMLInputElement>("#import-personal-rules-input");
const saveButton = requiredElement<HTMLButtonElement>("#save-settings");
const resetButton = requiredElement<HTMLButtonElement>("#reset");
const expandAllSectionsButton =
  requiredElement<HTMLButtonElement>("#expand-all-sections");
const collapseAllSectionsButton =
  requiredElement<HTMLButtonElement>("#collapse-all-sections");
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

function formatUiError(
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

function isStateUpdatedMessage(message: unknown): message is StateUpdatedMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<StateUpdatedMessage>;
  return (
    candidate.type === "sprachverstand.state-updated" &&
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
    label.className = "setting-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.ruleGroupId = group.id;

    const content = document.createElement("span");
    content.className = "setting-row-content";

    const title = document.createElement("strong");
    title.textContent = t(group.labelKey, undefined, group.label);

    const description = document.createElement("span");
    description.className = "setting-description";
    description.textContent = t(
      group.descriptionKey,
      undefined,
      group.description
    );

    const example = document.createElement("code");
    example.textContent = group.example;

    content.append(title, description, example);
    label.append(input, content);
    fragment.append(label);
  }

  ruleGroupsContainer.replaceChildren(fragment);
}

function createPopupSectionControls(): void {
  const fragment = document.createDocumentFragment();

  for (const sectionId of popupSectionIds) {
    const label = document.createElement("label");
    label.className = "setting-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.popupSectionId = sectionId;

    const content = document.createElement("span");
    content.className = "setting-row-content";

    const title = document.createElement("strong");
    title.textContent = popupSectionLabel(sectionId);

    const description = document.createElement("span");
    description.className = "setting-description";
    description.textContent = popupSectionDescription(sectionId);

    content.append(title, description);
    label.append(input, content);
    fragment.append(label);
  }

  popupSectionsContainer.replaceChildren(fragment);
}

function popupSectionLabel(sectionId: PopupSectionId): string {
  const ruleGroupId = sectionId.startsWith("rule-group:")
    ? sectionId.slice("rule-group:".length)
    : undefined;
  if (ruleGroupId) {
    const group = ruleGroupDefinitions.find((candidate) => candidate.id === ruleGroupId);
    return group ? t(group.labelKey, undefined, group.label) : ruleGroupId;
  }

  const labels: Record<Exclude<PopupSectionId, `rule-group:${string}`>, string> = {
    "active-state": t("popupSectionActiveState", undefined, "Status"),
    "correction-count": t("popupSectionCorrectionCount", undefined, "Korrekturzähler"),
    "text-options": t("popupSectionTextOptions", undefined, "Textoptionen")
  };
  return labels[sectionId as keyof typeof labels] ?? sectionId;
}

function popupSectionDescription(sectionId: PopupSectionId): string {
  if (sectionId.startsWith("rule-group:")) {
    return t(
      "popupSectionRuleGroupDescription",
      undefined,
      "Regelgruppe im Popup ein- und ausblenden."
    );
  }

  const descriptions: Record<
    Exclude<PopupSectionId, `rule-group:${string}`>,
    string
  > = {
    "active-state": t(
      "popupSectionActiveStateDescription",
      undefined,
      "Globalen Aktivierungsschalter im Popup anzeigen."
    ),
    "correction-count": t(
      "popupSectionCorrectionCountDescription",
      undefined,
      "Korrekturzähler und Detailansicht im Popup anzeigen."
    ),
    "text-options": t(
      "popupSectionTextOptionsDescription",
      undefined,
      "Optionen für zugängliche Attribute, Zitate und Untertitel anzeigen."
    )
  };
  return descriptions[sectionId as keyof typeof descriptions] ?? sectionId;
}

function createSyncCategoryControls(): void {
  const fragment = document.createDocumentFragment();

  for (const categoryId of syncCategoryIds) {
    const label = document.createElement("label");
    label.className = "setting-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.syncCategory = categoryId;

    const content = document.createElement("span");
    content.className = "setting-row-content";

    const title = document.createElement("strong");
    title.textContent = syncCategoryLabel(categoryId);

    const description = document.createElement("span");
    description.className = "setting-description";
    description.textContent = syncCategoryDescription(categoryId);

    content.append(title, description);
    label.append(input, content);
    fragment.append(label);
  }

  syncCategoriesContainer.replaceChildren(fragment);
}

function syncCategoryLabel(categoryId: SyncCategoryId): string {
  const labels: Record<SyncCategoryId, string> = {
    enabled: t("syncCategoryEnabled", undefined, "Aktivierung"),
    "rule-groups": t("syncCategoryRuleGroups", undefined, "Regelgruppen"),
    "excluded-domains": t(
      "syncCategoryExcludedDomains",
      undefined,
      "Domain-Ausschlüsse"
    ),
    "text-options": t("syncCategoryTextOptions", undefined, "Textoptionen"),
    "protected-terms": t("syncCategoryProtectedTerms", undefined, "Ausnahmen"),
    "custom-replacements": t(
      "syncCategoryCustomReplacements",
      undefined,
      "Eigene Ersetzungen"
    )
  };
  return labels[categoryId];
}

function syncCategoryDescription(categoryId: SyncCategoryId): string {
  const descriptions: Record<SyncCategoryId, string> = {
    enabled: t(
      "syncCategoryEnabledDescription",
      undefined,
      "Globalen Aktivierungsstatus zusätzlich über den Browser synchronisieren."
    ),
    "rule-groups": t(
      "syncCategoryRuleGroupsDescription",
      undefined,
      "Auswahl der aktiven Regelgruppen synchronisieren."
    ),
    "excluded-domains": t(
      "syncCategoryExcludedDomainsDescription",
      undefined,
      "Liste ausgeschlossener Domains synchronisieren."
    ),
    "text-options": t(
      "syncCategoryTextOptionsDescription",
      undefined,
      "Optionen für zugängliche Attribute, Zitate und Untertitel synchronisieren."
    ),
    "protected-terms": t(
      "syncCategoryProtectedTermsDescription",
      undefined,
      "Persönliche Ausnahmen synchronisieren."
    ),
    "custom-replacements": t(
      "syncCategoryCustomReplacementsDescription",
      undefined,
      "Eigene literale Ersetzungen synchronisieren."
    )
  };
  return descriptions[categoryId];
}

function popupSectionInputs(): HTMLInputElement[] {
  return [
    ...popupSectionsContainer.querySelectorAll<HTMLInputElement>(
      "input[data-popup-section-id]"
    )
  ];
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

function parseExcludedDomains(value: string): string[] {
  const seen = new Set<string>();
  const domains: string[] = [];

  for (const rawLine of value.split(/\r?\n/u)) {
    const domain = normalizeExcludedDomain(rawLine);
    if (!domain || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    domains.push(domain);
  }

  if (domains.length > maximumExcludedDomains) {
    throw localizedUiError(
      "excludedDomainsLimitExceeded",
      String(maximumExcludedDomains),
      `Es sind höchstens ${maximumExcludedDomains} Domain-Ausschlüsse möglich.`
    );
  }

  return domains;
}

function readProtectedTerms(): string[] {
  return parseProtectedTermsText(protectedTermsInput.value);
}

function readCustomReplacements() {
  const replacements = parseCustomReplacementsText(customReplacementsInput.value);
  if (replacements.length > maximumCustomReplacements) {
    throw localizedUiError(
      "customReplacementLimitExceeded",
      String(maximumCustomReplacements),
      `Es sind höchstens ${maximumCustomReplacements} eigene Ersetzungen möglich.`
    );
  }
  return replacements;
}

function currentEnabledRuleGroups(): string[] {
  return ruleGroupInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.ruleGroupId)
    .filter((id): id is string => Boolean(id));
}

function currentVisiblePopupSections(): PopupSectionId[] {
  return popupSectionInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.popupSectionId)
    .filter((id): id is PopupSectionId =>
      popupSectionIds.includes(id as PopupSectionId)
    );
}

function currentSyncCategories(): SyncCategoryId[] {
  return syncCategoryInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.syncCategory)
    .filter((id): id is SyncCategoryId =>
      syncCategoryIds.includes(id as SyncCategoryId)
    );
}

function readForm(): Settings {
  return {
    settingsRevision: currentSettingsRevision,
    enabled: enabledInput.checked,
    enabledRuleGroupIds: currentEnabledRuleGroups(),
    processAccessibleAttributes: processAccessibleAttributesInput.checked,
    processQuotedText: processQuotedTextInput.checked,
    processSubtitles: processSubtitlesInput.checked,
    protectedTerms: readProtectedTerms(),
    customReplacements: readCustomReplacements(),
    excludedDomains: parseExcludedDomains(excludedDomainsInput.value),
    visiblePopupSectionIds: currentVisiblePopupSections(),
    syncCategoryIds: currentSyncCategories()
  };
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

  const enabledRuleGroups = new Set(settings.enabledRuleGroupIds);
  for (const input of ruleGroupInputs()) {
    input.checked = enabledRuleGroups.has(input.dataset.ruleGroupId ?? "");
  }

  const visiblePopupSections = new Set(settings.visiblePopupSectionIds);
  for (const input of popupSectionInputs()) {
    input.checked = visiblePopupSections.has(
      input.dataset.popupSectionId as PopupSectionId
    );
  }

  const selectedSyncCategories = new Set(settings.syncCategoryIds);
  for (const input of syncCategoryInputs()) {
    input.checked = selectedSyncCategories.has(
      input.dataset.syncCategory as SyncCategoryId
    );
  }
}

function createDraftSettings(): Settings {
  try {
    return readForm();
  } catch {
    return {
      ...defaultSettings,
      enabled: enabledInput.checked,
      enabledRuleGroupIds: currentEnabledRuleGroups(),
      processAccessibleAttributes: processAccessibleAttributesInput.checked,
      processQuotedText: processQuotedTextInput.checked,
      processSubtitles: processSubtitlesInput.checked,
      protectedTerms: parseProtectedTermsText(protectedTermsInput.value),
      customReplacements: parseCustomReplacementsText(
        customReplacementsInput.value
      ),
      excludedDomains: defaultSettings.excludedDomains,
      visiblePopupSectionIds: currentVisiblePopupSections(),
      syncCategoryIds: currentSyncCategories()
    };
  }
}

function formatReplacementNotice(notice: ReplacementNotice): string {
  if (notice.type === "duplicate-source") {
    return t(
      "customReplacementDuplicateFeedback",
      notice.source,
      `Doppelte Ersetzung für „${notice.source}“. Es wird nur der erste Eintrag gespeichert.`
    );
  }
  if (notice.type === "conflicting-target") {
    return t(
      "customReplacementConflictFeedback",
      [notice.source, notice.targets.join(", ")],
      `Widersprüchliche Ziele für „${notice.source}“: ${notice.targets.join(", ")}.`
    );
  }
  if (notice.type === "case-variant") {
    return t(
      "customReplacementCaseVariantFeedback",
      notice.variants.join(", "),
      `Groß-/Kleinschreibungsvarianten erkannt: ${notice.variants.join(", ")}. Eigene Ersetzungen sind case-sensitive.`
    );
  }
  if (notice.type === "overlap") {
    return t(
      "customReplacementOverlapFeedback",
      [notice.shorter, notice.longer],
      `„${notice.shorter}“ liegt in „${notice.longer}“. Die längere Ersetzung wird zuerst ausgeführt.`
    );
  }
  if (notice.type === "chain") {
    return t(
      "customReplacementChainFeedback",
      [notice.source, notice.target, notice.nextTarget],
      `„${notice.source}“ → „${notice.target}“ → „${notice.nextTarget}“ bildet eine Ersetzungskette. Eigene Ersetzungen werden absichtlich nur einmal ausgeführt.`
    );
  }
  if (notice.type === "blocked") {
    return t(
      "customReplacementBlockedFeedback",
      [notice.source, notice.protectedTerm],
      `„${notice.source}“ wird von der Ausnahme „${notice.protectedTerm}“ geschützt und deshalb nicht ersetzt.`
    );
  }
  return t(
    "customReplacementIneffectiveFeedback",
    notice.source,
    `„${notice.source}“ ersetzt sich selbst und hat daher keine Wirkung.`
  );
}

function renderCustomReplacementFeedback(): void {
  const draft = createDraftSettings();
  const notices = analyzeCustomReplacementConflicts(
    draft.protectedTerms,
    draft.customReplacements
  );

  if (notices.length === 0) {
    customReplacementFeedback.textContent = t(
      "customReplacementNoConflicts",
      undefined,
      "Keine offensichtlichen Konflikte in den aktuellen persönlichen Regeln."
    );
    customReplacementFeedback.classList.remove("warning");
    return;
  }

  customReplacementFeedback.textContent = notices
    .map(formatReplacementNotice)
    .join(" ");
  customReplacementFeedback.classList.add("warning");
}

function renderCustomReplacementPreview(): void {
  const draft = createDraftSettings();
  const previewText = customPreviewInput.value;
  if (!previewText) {
    customPreviewOutput.textContent = "";
    return;
  }

  const enabledGroupIds = new Set(draft.enabledRuleGroupIds);
  const preview = transformText(previewText, defaultRules, {
    disabledRuleIds: disabledRuleIdsForGroups(draft.enabledRuleGroupIds),
    skipRule: (rule) => !enabledGroupIds.has(rule.groupId),
    processQuotedText: draft.processQuotedText,
    protectedTerms: draft.protectedTerms,
    customReplacements: draft.customReplacements
  });
  customPreviewOutput.textContent = preview.text;
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
  if (activeTabId === undefined) {
    countOutput.textContent = "0";
    return;
  }

  const api = getExtensionApi();
  const response = (await api.runtime.sendMessage({
    type: "sprachverstand.get-replacement-state",
    tabId: activeTabId
  })) as ReplacementStateResponse | undefined;

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
    showStatus(t("saved", undefined, "Gespeichert."), true);
    refreshCountAfterChange();
  } catch (error) {
    showStatus(formatUiError(error, "saveFailed", "Speichern fehlgeschlagen."), false);
  }
}

function resetToDefaults(): void {
  render(defaultSettings);
  renderCustomReplacementFeedback();
  renderCustomReplacementPreview();
  showStatus(
    t(
      "resetPreview",
      undefined,
      "Standardwerte geladen. Zum Anwenden noch speichern."
    ),
    false
  );
}

function showStatus(message: string, success: boolean, timeoutMs = 3000): void {
  statusOutput.textContent = message;
  statusOutput.classList.toggle("success", success);
  statusOutput.classList.toggle("error", !success);

  if (statusTimer !== undefined) {
    window.clearTimeout(statusTimer);
  }

  statusTimer = window.setTimeout(() => {
    statusOutput.textContent = "";
    statusOutput.classList.remove("success", "error");
    statusTimer = undefined;
  }, timeoutMs);
}

function downloadJsonFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createBackupFileName(): string {
  return `sprachverstand-settings-${new Date().toISOString().slice(0, 10)}.json`;
}

function exportSettingsBackup(): void {
  try {
    const document = createSettingsBackupDocument(readForm());
    downloadJsonFile(createBackupFileName(), stringifySettingsBackupDocument(document));
    showStatus(
      t(
        "settingsBackupExported",
        undefined,
        "Einstellungssicherung exportiert."
      ),
      true
    );
  } catch (error) {
    showStatus(
      formatUiError(
        error,
        "settingsBackupExportFailed",
        "Einstellungssicherung konnte nicht exportiert werden."
      ),
      false
    );
  }
}

async function readImportFile(file: File): Promise<string> {
  if (file.size > maximumSettingsBackupImportBytes) {
    throw localizedUiError(
      "settingsBackupImportTooLarge",
      String(Math.floor(maximumSettingsBackupImportBytes / 1024)),
      "Die Sicherungsdatei ist zu groß."
    );
  }
  return file.text();
}

async function importSettingsBackup(file: File): Promise<void> {
  try {
    const document = parseSettingsBackupDocument(await readImportFile(file));
    const mode: SettingsBackupImportMode = "replace";
    const result = mergeImportedSettings(readForm(), document.settings, mode);
    applyImportedSettings(result);
  } catch (error) {
    showStatus(
      formatUiError(
        error,
        "settingsBackupImportFailed",
        "Einstellungssicherung konnte nicht importiert werden."
      ),
      false,
      8000
    );
  } finally {
    importSettingsInput.value = "";
  }
}

function importStatusMessage(result: SettingsImportResult): string {
  const messages: string[] = [];
  if (result.conflicts.length > 0) {
    messages.push(
      t(
        "settingsBackupImportConflicts",
        String(result.conflicts.length),
        `${result.conflicts.length} Konflikte wurden zugunsten der importierten Werte aufgelöst.`
      )
    );
  }
  if (result.skippedDuplicates > 0) {
    messages.push(
      t(
        "settingsBackupImportDuplicates",
        String(result.skippedDuplicates),
        `${result.skippedDuplicates} bereits vorhandene Einträge wurden nicht doppelt hinzugefügt.`
      )
    );
  }
  if (messages.length === 0) {
    messages.push(
      t(
        "settingsBackupImportReady",
        undefined,
        "Einstellungssicherung geprüft und in das Formular übernommen. Zum Anwenden noch speichern."
      )
    );
  }
  return messages.join(" ");
}

function applyImportedSettings(result: SettingsImportResult): void {
  render(result.settings);
  renderCustomReplacementFeedback();
  renderCustomReplacementPreview();
  showStatus(importStatusMessage(result), false, 8000);
}

function handleRuntimeMessage(message: unknown): void {
  if (
    isStateUpdatedMessage(message) &&
    message.tabId === activeTabId
  ) {
    countOutput.textContent = message.text || "0";
  }
}

async function start(): Promise<void> {
  activeTabId = parseOptionsPageTabId(window.location.search);
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
  saveButton.addEventListener("click", () => {
    void persist();
  });
  resetButton.addEventListener("click", resetToDefaults);
  expandAllSectionsButton.addEventListener("click", () => {
    setAllSectionsOpen(true);
  });
  collapseAllSectionsButton.addEventListener("click", () => {
    setAllSectionsOpen(false);
  });
  for (const section of settingsSections) {
    section.addEventListener("toggle", refreshSectionToggleButtons);
  }
  exportSettingsButton.addEventListener("click", exportSettingsBackup);
  importSettingsButton.addEventListener("click", () => importSettingsInput.click());
  importSettingsInput.addEventListener("change", () => {
    const file = importSettingsInput.files?.[0];
    if (file) {
      void importSettingsBackup(file);
    }
  });
}

void start();
