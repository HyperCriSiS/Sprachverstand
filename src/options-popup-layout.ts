import {
  popupSectionIds,
  type PopupSectionId,
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

const popupSectionsContainer = requiredElement<HTMLElement>("#popup-sections");
const knownPopupSections = new Set<string>(popupSectionIds);

function popupSectionInputs(): HTMLInputElement[] {
  return [...popupSectionsContainer.querySelectorAll<HTMLInputElement>(
    "input[data-popup-section]"
  )];
}

function selectedPopupSections(): PopupSectionId[] {
  return popupSectionInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.popupSection)
    .filter(
      (id): id is PopupSectionId =>
        typeof id === "string" && knownPopupSections.has(id)
    );
}

function render(settings: Settings): void {
  const visible = new Set(settings.visiblePopupSectionIds ?? []);
  for (const input of popupSectionInputs()) {
    input.checked = visible.has(input.dataset.popupSection as PopupSectionId);
  }
}

async function persist(): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    visiblePopupSectionIds: selectedPopupSections()
  });
}

async function start(): Promise<void> {
  render(await loadSettings());
  popupSectionsContainer.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
      void persist();
    }
  });
}

void start();
