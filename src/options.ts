import { ruleGroupDefinitions } from "./rules/catalog";
import {
  defaultSettings,
  maximumProtectedTermLength,
  maximumProtectedTerms,
  type Settings
} from "./settings/defaults";
import { loadSettings, saveSettings } from "./settings/storage";

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element fehlt: ${selector}`);
  }

  return element;
}

const form = requiredElement<HTMLFormElement>("#settings-form");
const enabledInput = requiredElement<HTMLInputElement>("#enabled");
const processAccessibleAttributesInput =
  requiredElement<HTMLInputElement>("#process-accessible-attributes");
const ruleGroupsContainer = requiredElement<HTMLElement>("#rule-groups");
const protectedTermsInput =
  requiredElement<HTMLTextAreaElement>("#protected-terms");
const excludedDomainsInput =
  requiredElement<HTMLTextAreaElement>("#excluded-domains");
const selectAllRulesButton =
  requiredElement<HTMLButtonElement>("#select-all-rules");
const selectNoRulesButton =
  requiredElement<HTMLButtonElement>("#select-no-rules");
const resetButton = requiredElement<HTMLButtonElement>("#reset");
const statusOutput = requiredElement<HTMLOutputElement>("#status");

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

function render(settings: Settings): void {
  enabledInput.checked = settings.enabled;
  processAccessibleAttributesInput.checked =
    settings.processAccessibleAttributes;
  protectedTermsInput.value = settings.protectedTerms.join("\n");
  excludedDomainsInput.value = settings.excludedDomains.join("\n");

  const enabledGroups = new Set(settings.enabledRuleGroupIds);
  for (const input of ruleGroupInputs()) {
    input.checked = enabledGroups.has(input.dataset.ruleGroupId ?? "");
  }
}

function readLines(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/u)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  ];
}

function readProtectedTerms(): string[] {
  const terms = readLines(protectedTermsInput.value);

  if (terms.length > maximumProtectedTerms) {
    throw new Error(`Höchstens ${maximumProtectedTerms} Ausnahmen sind erlaubt.`);
  }

  const tooLong = terms.find(
    (term) => term.length > maximumProtectedTermLength
  );
  if (tooLong) {
    throw new Error(
      `Eine Ausnahme darf höchstens ${maximumProtectedTermLength} Zeichen lang sein: ${tooLong}`
    );
  }

  return terms;
}

function readForm(): Settings {
  const enabledRuleGroupIds = ruleGroupInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.ruleGroupId)
    .filter((id): id is string => Boolean(id));

  return {
    enabled: enabledInput.checked,
    excludedDomains: readLines(excludedDomainsInput.value),
    enabledRuleGroupIds,
    protectedTerms: readProtectedTerms(),
    processAccessibleAttributes: processAccessibleAttributesInput.checked
  };
}

function showStatus(message: string, isError = false): void {
  statusOutput.textContent = message;
  statusOutput.classList.toggle("error", isError);
  window.setTimeout(() => {
    statusOutput.textContent = "";
    statusOutput.classList.remove("error");
  }, 4000);
}

async function persist(): Promise<void> {
  try {
    await saveSettings(readForm());
    showStatus("Gespeichert – offene Seiten werden sofort neu verarbeitet.");
  } catch (error) {
    showStatus(
      error instanceof Error
        ? error.message
        : "Einstellungen konnten nicht gespeichert werden.",
      true
    );
  }
}

async function start(): Promise<void> {
  createRuleGroupControls();
  render(await loadSettings());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void persist();
  });

  selectAllRulesButton.addEventListener("click", () => {
    for (const input of ruleGroupInputs()) {
      input.checked = true;
    }
  });

  selectNoRulesButton.addEventListener("click", () => {
    for (const input of ruleGroupInputs()) {
      input.checked = false;
    }
  });

  resetButton.addEventListener("click", () => {
    render(defaultSettings);
    void saveSettings(defaultSettings).then(() => {
      showStatus("Auf sichere Standardeinstellungen zurückgesetzt.");
    });
  });
}

void start();
