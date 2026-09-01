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
  popupSectionDefinitions,
  popupRuleGroupSectionId,
  type Settings,
  type SyncCategory
} from "./settings/defaults";
import {
  analyzePersonalRules,
  normalizeCustomReplacementKey,
  normalizeProtectedTerm,
  type CustomReplacement
} from "./settings/personal-rules";
import {
  createSettingsBackupDocument,
  createSettingsBackupFileName,
  parseSettingsBackupDocument,
  settingsBackupAccept,
  settingsBackupExtension,
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
const processQuotedTextInput =
  requiredElement<HTMLInputElement>("#process-quoted-text");
const processAccessibleAttributesInput =
  requiredElement<HTMLInputElement>("#process-accessible-attributes");
const processSubtitlesInput =
  requiredElement<HTMLInputElement>("#process-subtitles");
const customProtectedTermsInput =
  requiredElement<HTMLTextAreaElement>("#custom-protected-terms");
const customReplacementSourceInput =
  requiredElement<HTMLInputElement>("#custom-replacement-source");
const customReplacementTargetInput =
  requiredElement<HTMLInputElement>("#custom-replacement-target");
const addCustomReplacementButton =
  requiredElement<HTMLButtonElement>("#add-custom-replacement");
const customReplacementFeedback =
  requiredElement<HTMLElement>("#custom-replacement-feedback");
const customReplacementList =
  requiredElement<HTMLElement>("#custom-replacement-list");
const customPreviewInput =
  requiredElement<HTMLTextAreaElement>("#custom-preview-input");
const customPreviewOutput =
  requiredElement<HTMLOutputElement>("#custom-preview-output");
const excludedDomainsInput =
  requiredElement<HTMLTextAreaElement>("#excluded-domains");
const popupSectionsContainer = requiredElement<HTMLElement>("#popup-sections");
const ruleGroupsContainer = requiredElement<HTMLElement>("#rule-groups");
const countOutput = requiredElement<HTMLOutputElement>("#count");
const saveButton = requiredElement<HTMLButtonElement>("#save-settings");
const resetButton = requiredElement<HTMLButtonElement>("#reset");
const expandAllSectionsButton =
  requiredElement<HTMLButtonElement>("#expand-all-sections");
const collapseAllSectionsButton =
  requiredElement<HTMLButtonElement>("#collapse-all-sections");
const exportPersonalRulesButton =
  requiredElement<HTMLButtonElement>("#export-personal-rules");
const importPersonalRulesButton =
  requiredElement<HTMLButtonElement>("#import-personal-rules");
const importPersonalRulesInput =
  requiredElement<HTMLInputElement>("#import-personal-rules-input");
const syncCategoriesContainer =
  requiredElement<HTMLElement>("#sync-categories");
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
  fallbackKey: string,
  fallbackText: string
): string {
  if (error instanceof LocalizedUiError) {
    return error.message;
  }

  console.error(error);
  return t(fallbackKey, undefined, fallbackText);
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

  for (const section of popupSectionDefinitions) {
    const label = document.createElement("label");
    label.className = "setting-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.popupSectionId = section.id;

    const content = document.createElement("span");
    content.className = "setting-row-content";

    const title = document.createElement("strong");
    title.textContent = t(section.labelKey, undefined, section.label);

    const description = document.createElement("span");
    description.className = "setting-description";
    description.textContent = t(
      section.descriptionKey,
      undefined,
      section.description
    );

    content.append(title, description);
    label.append(input, content);
    fragment.append(label);
  }

  popupSectionsContainer.replaceChildren(fragment);
}

function createSyncCategoryControls(): void {
  const categories: readonly {
    readonly id: SyncCategory;
    readonly labelKey: string;
    readonly label: string;
    readonly descriptionKey: string;
    readonly description: string;
  }[] = [
    {
      id: "general",
      labelKey: "syncGeneralLabel",
      label: "Allgemeine Einstellungen",
      descriptionKey: "syncGeneralDescription",
      description: "Aktivierung und ausgeschlossene Domains"
    },
    {
      id: "rule-groups",
      labelKey: "syncRuleGroupsLabel",
      label: "Regelgruppen",
      descriptionKey: "syncRuleGroupsDescription",
      description: "Auswahl der aktiven Ersetzungsregeln"
    },
    {
      id: "text-options",
      labelKey: "syncTextOptionsLabel",
      label: "Textoptionen",
      descriptionKey: "syncTextOptionsDescription",
      description: "Zitate, zugängliche Attribute und Untertitel"
    },
    {
      id: "protected-terms",
      labelKey: "syncProtectedTermsLabel",
      label: "Ausnahmen",
      descriptionKey: "syncProtectedTermsDescription",
      description: "Eigene geschützte Wörter und Phrasen"
    },
    {
      id: "custom-replacements",
      labelKey: "syncCustomReplacementsLabel",
      label: "Eigene Ersetzungen",
      descriptionKey: "syncCustomReplacementsDescription",
      description: "Eigene literale Ersetzungen"
    }
  ];

  const fragment = document.createDocumentFragment();
  for (const category of categories) {
    const label = document.createElement("label");
    label.className = "setting-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.syncCategory = category.id;

    const content = document.createElement("span");
    content.className = "setting-row-content";

    const title = document.createElement("strong");
    title.textContent = t(category.labelKey, undefined, category.label);

    const description = document.createElement("span");
    description.className = "setting-description";
    description.textContent = t(
      category.descriptionKey,
      undefined,
      category.description
    );

    content.append(title, description);
    label.append(input, content);
    fragment.append(label);
  }

  syncCategoriesContainer.replaceChildren(fragment);
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

function currentEnabledRuleGroups(): string[] {
  return ruleGroupInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.ruleGroupId)
    .filter((id): id is string => Boolean(id));
}

function currentVisiblePopupSections(): string[] {
  return popupSectionInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.popupSectionId)
    .filter((id): id is string => Boolean(id));
}

function currentSyncCategories(): SyncCategory[] {
  return syncCategoryInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.syncCategory)
    .filter((id): id is SyncCategory => Boolean(id));
}

function parseProtectedTerms(value: string): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawLine of value.split(/\r?\n/u)) {
    const term = normalizeProtectedTerm(rawLine);
    if (!term || seen.has(term)) {
      continue;
    }

    seen.add(term);
    normalized.push(term);
  }

  return normalized;
}

function parseExcludedDomains(value: string): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawLine of value.split(/\r?\n/u)) {
    const domain = normalizeExcludedDomain(rawLine);
    if (!domain || seen.has(domain)) {
      continue;
    }

    seen.add(domain);
    normalized.push(domain);
  }

  return normalized.slice(0, maximumExcludedDomains);
}

function readCustomReplacementsFromUi(): CustomReplacement[] {
  return [...customReplacementList.querySelectorAll<HTMLElement>(
    "[data-custom-replacement-key]"
  )].map((item) => ({
    source: item.dataset.customReplacementKey ?? "",
    target: item.dataset.customReplacementValue ?? ""
  }));
}

function createCustomReplacementRow(
  replacement: CustomReplacement
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "custom-replacement-row";
  row.dataset.customReplacementKey = replacement.source;
  row.dataset.customReplacementValue = replacement.target;

  const source = document.createElement("code");
  source.textContent = replacement.source;

  const arrow = document.createElement("span");
  arrow.className = "custom-replacement-arrow";
  arrow.textContent = "→";
  arrow.setAttribute("aria-hidden", "true");

  const target = document.createElement("code");
  target.textContent = replacement.target || "∅";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "secondary small-button";
  removeButton.textContent = t("remove", undefined, "Entfernen");
  removeButton.addEventListener("click", () => {
    row.remove();
    renderCustomReplacementFeedback();
    renderCustomReplacementPreview();
  });

  row.append(source, arrow, target, removeButton);
  return row;
}

function renderCustomReplacements(
  replacements: readonly CustomReplacement[]
): void {
  customReplacementList.replaceChildren(
    ...replacements.map(createCustomReplacementRow)
  );
}

function renderPopupSections(settings: Settings): void {
  const visibleSections = new Set(settings.visiblePopupSectionIds);
  for (const input of popupSectionInputs()) {
    input.checked = visibleSections.has(input.dataset.popupSectionId ?? "");
  }
}

function render(settings: Settings): void {
  enabledInput.checked = settings.enabled;
  processQuotedTextInput.checked = settings.processQuotedText;
  processAccessibleAttributesInput.checked =
    settings.processAccessibleAttributes;
  processSubtitlesInput.checked = settings.processSubtitles;
  customProtectedTermsInput.value = settings.customProtectedTerms.join("\n");
  excludedDomainsInput.value = settings.excludedDomains.join("\n");

  const enabledGroups = new Set(settings.enabledRuleGroupIds);
  for (const input of ruleGroupInputs()) {
    input.checked = enabledGroups.has(input.dataset.ruleGroupId ?? "");
  }

  renderPopupSections(settings);
  renderCustomReplacements(settings.customReplacements);

  const syncCategories = new Set(settings.syncCategories);
  for (const input of syncCategoryInputs()) {
    const category = input.dataset.syncCategory as SyncCategory | undefined;
    input.checked = Boolean(category && syncCategories.has(category));
  }
}

function readForm(): Settings {
  const selectedPopupSections = new Set(currentVisiblePopupSections());
  for (const group of ruleGroupDefinitions) {
    const sectionId = popupRuleGroupSectionId(group.id);
    const input = ruleGroupInputs().find(
      (candidate) => candidate.dataset.ruleGroupId === group.id
    );
    if (input?.checked) {
      selectedPopupSections.add(sectionId);
    }
  }

  return {
    ...defaultSettings,
    settingsRevision: currentSettingsRevision,
    enabled: enabledInput.checked,
    processQuotedText: processQuotedTextInput.checked,
    processAccessibleAttributes: processAccessibleAttributesInput.checked,
    processSubtitles: processSubtitlesInput.checked,
    customProtectedTerms: parseProtectedTerms(customProtectedTermsInput.value),
    customReplacements: readCustomReplacementsFromUi(),
    excludedDomains: parseExcludedDomains(excludedDomainsInput.value),
    disabledRuleIds: disabledRuleIdsForGroups(
      currentEnabledRuleGroups()
    ),
    enabledRuleGroupIds: currentEnabledRuleGroups(),
    visiblePopupSectionIds: [...selectedPopupSections],
    syncCategories: currentSyncCategories()
  };
}

function createDraftSettings(): Settings {
  return readForm();
}

function createDraftAnalysis() {
  return analyzePersonalRules(
    createDraftSettings().customProtectedTerms,
    createDraftSettings().customReplacements
  );
}

function renderCustomReplacementFeedback(): void {
  const analysis = createDraftAnalysis();
  const feedback = new Set<string>();

  for (const duplicate of analysis.duplicateSources) {
    feedback.add(
      t(
        "customReplacementDuplicateFeedback",
        [duplicate],
        `Doppelte Ersetzung für „${duplicate}“. Es wird nur der erste Eintrag gespeichert.`
      )
    );
  }

  for (const conflict of analysis.conflictingTargets) {
    feedback.add(
      t(
        "customReplacementConflictFeedback",
        [conflict.source, conflict.targets.join(", ")],
        `Widersprüchliche Ziele für „${conflict.source}“: ${conflict.targets.join(", ")}.`
      )
    );
  }

  for (const variant of analysis.caseVariants) {
    feedback.add(
      t(
        "customReplacementCaseVariantFeedback",
        [variant.join(", ")],
        `Groß-/Kleinschreibungsvarianten erkannt: ${variant.join(", ")}. Eigene Ersetzungen sind case-sensitive.`
      )
    );
  }

  for (const overlap of analysis.overlappingSources) {
    feedback.add(
      t(
        "customReplacementOverlapFeedback",
        [overlap.shorter, overlap.longer],
        `„${overlap.shorter}“ liegt in „${overlap.longer}“. Die längere Ersetzung wird zuerst ausgeführt.`
      )
    );
  }

  for (const chain of analysis.chainedReplacements) {
    feedback.add(
      t(
        "customReplacementChainFeedback",
        [chain.source, chain.target, chain.nextTarget],
        `„${chain.source}“ → „${chain.target}“ → „${chain.nextTarget}“ bildet eine Ersetzungskette. Eigene Ersetzungen werden absichtlich nur einmal ausgeführt.`
      )
    );
  }

  for (const blocked of analysis.blockedReplacements) {
    feedback.add(
      t(
        "customReplacementBlockedFeedback",
        [blocked.source, blocked.protectedTerm],
        `„${blocked.source}“ wird von der Ausnahme „${blocked.protectedTerm}“ geschützt und deshalb nicht ersetzt.`
      )
    );
  }

  for (const ineffective of analysis.ineffectiveReplacements) {
    feedback.add(
      t(
        "customReplacementIneffectiveFeedback",
        [ineffective],
        `„${ineffective}“ ersetzt sich selbst und hat daher keine Wirkung.`
      )
    );
  }

  if (feedback.size === 0) {
    customReplacementFeedback.textContent = t(
      "customReplacementNoConflicts",
      undefined,
      "Keine offensichtlichen Konflikte in den aktuellen persönlichen Regeln."
    );
    customReplacementFeedback.classList.remove("warning");
    return;
  }

  customReplacementFeedback.textContent = [...feedback].join(" ");
  customReplacementFeedback.classList.add("warning");
}

function renderCustomReplacementPreview(): void {
  const draft = createDraftSettings();
  const previewText = customPreviewInput.value;
  if (!previewText) {
    customPreviewOutput.textContent = "";
    return;
  }

  const transformed = transformText(previewText, defaultRules, {
    disabledRuleIds: new Set(draft.disabledRuleIds),
    enabledRuleGroupIds: draft.enabledRuleGroupIds,
    processQuotedText: draft.processQuotedText,
    customProtectedTerms: draft.customProtectedTerms,
    customReplacements: draft.customReplacements
  });
  customPreviewOutput.textContent = transformed;
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
    showStatus(
      t("saved", undefined, "Gespeichert."),
      true
    );
    refreshCountAfterChange();
  } catch (error) {
    showStatus(
      formatUiError(
        error,
        "saveFailed",
        "Speichern fehlgeschlagen."
      ),
      false
    );
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

function showStatus(
  message: string,
  success: boolean,
  timeoutMs = 3000
): void {
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

function addCustomReplacement(): void {
  const source = normalizeCustomReplacementKey(customReplacementSourceInput.value);
  const target = customReplacementTargetInput.value;

  if (!source) {
    showStatus(
      t(
        "customReplacementSourceRequired",
        undefined,
        "Bitte zuerst einen Ausgangstext eingeben."
      ),
      false
    );
    return;
  }

  const current = readCustomReplacementsFromUi();
  if (current.length >= maximumCustomReplacements) {
    showStatus(
      t(
        "customReplacementLimitReached",
        [String(maximumCustomReplacements)],
        `Es können höchstens ${maximumCustomReplacements} eigene Ersetzungen gespeichert werden.`
      ),
      false
    );
    return;
  }

  if (current.some((replacement) => replacement.source === source)) {
    showStatus(
      t(
        "customReplacementSourceExists",
        [source],
        `Für „${source}“ gibt es bereits eine Ersetzung.`
      ),
      false
    );
    return;
  }

  customReplacementList.append(
    createCustomReplacementRow({ source, target })
  );
  customReplacementSourceInput.value = "";
  customReplacementTargetInput.value = "";
  renderCustomReplacementFeedback();
  renderCustomReplacementPreview();
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

async function exportSettingsBackup(): Promise<void> {
  try {
    const settings = readForm();
    downloadJsonFile(
      createSettingsBackupFileName(),
      stringifySettingsBackupDocument(createSettingsBackupDocument(settings))
    );
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

async function importSettingsBackup(
  file: File,
  mode: SettingsBackupImportMode
): Promise<void> {
  try {
    const parsed = parseSettingsBackupDocument(await file.text(), mode);
    applyImportedSettings(parsed);
    showStatus(importStatusMessage(parsed), true, 8000);
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
    importPersonalRulesInput.value = "";
  }
}

function importStatusMessage(result: SettingsImportResult): string {
  if (result.warnings.length > 0) {
    return result.warnings.join(" ");
  }

  return t(
    "settingsBackupImportReady",
    undefined,
    "Einstellungssicherung geprüft und in das Formular übernommen. Zum Anwenden noch speichern."
  );
}

function applyImportedSettings(result: SettingsImportResult): void {
  render(result.settings);
  renderCustomReplacementFeedback();
  renderCustomReplacementPreview();
  showStatus(
    importStatusMessage(result),
    false,
    8000
  );
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
  createPopupSectionControls();
  createSyncCategoryControls();
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
  addCustomReplacementButton.addEventListener("click", addCustomReplacement);
  exportPersonalRulesButton.addEventListener("click", () => {
    void exportSettingsBackup();
  });
  importPersonalRulesButton.addEventListener("click", () => {
    importPersonalRulesInput.click();
  });
  importPersonalRulesInput.addEventListener("change", () => {
    const file = importPersonalRulesInput.files?.[0];
    if (file) {
      void importSettingsBackup(file, "replace");
    }
  });
}

void start();
