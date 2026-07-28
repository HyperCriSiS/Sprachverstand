import {
  maximumCustomReplacementSourceLength,
  maximumCustomReplacementTargetLength,
  maximumCustomReplacements,
  maximumProtectedTermLength,
  maximumProtectedTerms,
  type CustomReplacement
} from "./defaults";

export const personalRulesFormat = "sprachverstand.personal-rules";
export const personalRulesFormatVersion = 1;
export const maximumPersonalRulesImportBytes = 1_000_000;

export type PersonalRulesImportMode =
  | "keep-existing"
  | "prefer-imported"
  | "replace";

export interface PersonalRulesData {
  readonly protectedTerms: readonly string[];
  readonly customReplacements: readonly CustomReplacement[];
}

export interface PersonalRulesDocument extends PersonalRulesData {
  readonly format: typeof personalRulesFormat;
  readonly version: typeof personalRulesFormatVersion;
  readonly exportedAt: string;
}

export interface ReplacementNotice {
  readonly severity: "info" | "warning";
  readonly code:
    | "duplicate"
    | "no-op"
    | "deletion"
    | "protected"
    | "case-variant"
    | "chain"
    | "overlap"
    | "built-in-overlap";
  readonly message: string;
}

export interface ParsedCustomReplacements {
  readonly replacements: readonly CustomReplacement[];
  readonly notices: readonly ReplacementNotice[];
}

export interface PersonalRulesMergeResult extends PersonalRulesData {
  readonly addedProtectedTerms: number;
  readonly addedCustomReplacements: number;
  readonly replacedCustomReplacements: number;
  readonly skippedDuplicates: number;
  readonly conflicts: readonly string[];
}

function normalizedCaseKey(value: string): string {
  return value.toLocaleLowerCase("de-DE");
}

function assertSingleLine(value: string, label: string): void {
  if (/\r|\n/u.test(value)) {
    throw new Error(`${label} darf keinen Zeilenumbruch enthalten.`);
  }
}

function normalizeProtectedTermEntries(
  entries: readonly unknown[],
  label = "Ausnahme"
): string[] {
  const normalized = new Map<string, string>();

  for (const [index, entry] of entries.entries()) {
    if (typeof entry !== "string") {
      throw new Error(`${label} ${index + 1} muss Text sein.`);
    }

    const term = entry.trim();
    if (!term) {
      continue;
    }

    assertSingleLine(term, `${label} ${index + 1}`);
    if (term.length > maximumProtectedTermLength) {
      throw new Error(
        `${label} ${index + 1} darf höchstens ${maximumProtectedTermLength} Zeichen lang sein.`
      );
    }

    const key = normalizedCaseKey(term);
    if (!normalized.has(key)) {
      normalized.set(key, term);
    }
  }

  if (normalized.size > maximumProtectedTerms) {
    throw new Error(`Höchstens ${maximumProtectedTerms} Ausnahmen sind erlaubt.`);
  }

  return [...normalized.values()];
}

function normalizeCustomReplacementEntries(
  entries: readonly unknown[],
  label = "Ersetzung"
): CustomReplacement[] {
  const replacements = new Map<string, string>();

  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object") {
      throw new Error(`${label} ${index + 1} muss ein Objekt sein.`);
    }

    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.source !== "string" ||
      typeof candidate.replacement !== "string"
    ) {
      throw new Error(
        `${label} ${index + 1} benötigt die Textfelder „source“ und „replacement“.`
      );
    }

    const source = candidate.source.trim();
    const replacement = candidate.replacement.trim();
    if (!source) {
      throw new Error(`${label} ${index + 1}: Der Ausgangstext darf nicht leer sein.`);
    }

    assertSingleLine(source, `${label} ${index + 1}: Ausgangstext`);
    assertSingleLine(replacement, `${label} ${index + 1}: Zieltext`);

    if (source.length > maximumCustomReplacementSourceLength) {
      throw new Error(
        `${label} ${index + 1}: Der Ausgangstext darf höchstens ${maximumCustomReplacementSourceLength} Zeichen lang sein.`
      );
    }
    if (replacement.length > maximumCustomReplacementTargetLength) {
      throw new Error(
        `${label} ${index + 1}: Die Ersetzung darf höchstens ${maximumCustomReplacementTargetLength} Zeichen lang sein.`
      );
    }

    const existing = replacements.get(source);
    if (existing !== undefined && existing !== replacement) {
      throw new Error(
        `${label} ${index + 1}: Für „${source}“ sind widersprüchliche Ziele eingetragen.`
      );
    }
    replacements.set(source, replacement);
  }

  if (replacements.size > maximumCustomReplacements) {
    throw new Error(
      `Höchstens ${maximumCustomReplacements} eigene Ersetzungen sind erlaubt.`
    );
  }

  return [...replacements].map(([source, replacement]) => ({
    source,
    replacement
  }));
}

export function parseProtectedTermsText(value: string): string[] {
  return normalizeProtectedTermEntries(value.split(/\r?\n/u));
}

export function formatProtectedTermsText(terms: readonly string[]): string {
  return terms.join("\n");
}

function delimiterForLine(
  line: string
): { readonly index: number; readonly length: number } | undefined {
  const asciiIndex = line.indexOf("=>");
  const arrowIndex = line.indexOf("→");
  const candidates = [
    asciiIndex >= 0 ? { index: asciiIndex, length: 2 } : undefined,
    arrowIndex >= 0 ? { index: arrowIndex, length: 1 } : undefined
  ].filter(
    (candidate): candidate is { readonly index: number; readonly length: number } =>
      candidate !== undefined
  );

  return candidates.sort((left, right) => left.index - right.index)[0];
}

export function parseCustomReplacementsText(
  value: string
): ParsedCustomReplacements {
  const replacements = new Map<
    string,
    { readonly replacement: string; readonly line: number }
  >();
  const notices: ReplacementNotice[] = [];

  for (const [index, rawLine] of value.split(/\r?\n/u).entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const delimiter = delimiterForLine(line);
    if (!delimiter) {
      throw new Error(
        `Zeile ${lineNumber}: Eigene Ersetzungen müssen mit => oder → getrennt werden.`
      );
    }

    const source = line.slice(0, delimiter.index).trim();
    const replacement = line.slice(delimiter.index + delimiter.length).trim();
    if (!source) {
      throw new Error(`Zeile ${lineNumber}: Der Ausgangstext darf nicht leer sein.`);
    }
    if (source.length > maximumCustomReplacementSourceLength) {
      throw new Error(
        `Zeile ${lineNumber}: Der Ausgangstext darf höchstens ${maximumCustomReplacementSourceLength} Zeichen lang sein.`
      );
    }
    if (replacement.length > maximumCustomReplacementTargetLength) {
      throw new Error(
        `Zeile ${lineNumber}: Die Ersetzung darf höchstens ${maximumCustomReplacementTargetLength} Zeichen lang sein.`
      );
    }

    const existing = replacements.get(source);
    if (existing && existing.replacement !== replacement) {
      throw new Error(
        `Zeile ${lineNumber}: Für „${source}“ sind widersprüchliche Ersetzungen in Zeile ${existing.line} und ${lineNumber} eingetragen.`
      );
    }
    if (existing) {
      notices.push({
        severity: "info",
        code: "duplicate",
        message: `„${source}“ ist in Zeile ${existing.line} und ${lineNumber} identisch doppelt eingetragen.`
      });
      continue;
    }

    replacements.set(source, { replacement, line: lineNumber });
  }

  if (replacements.size > maximumCustomReplacements) {
    throw new Error(
      `Höchstens ${maximumCustomReplacements} eigene Ersetzungen sind erlaubt.`
    );
  }

  return {
    replacements: [...replacements].map(([source, entry]) => ({
      source,
      replacement: entry.replacement
    })),
    notices
  };
}

export function formatCustomReplacementsText(
  replacements: readonly CustomReplacement[]
): string {
  return replacements
    .map((entry) => `${entry.source} => ${entry.replacement}`)
    .join("\n");
}

export function analyzeCustomReplacementConflicts(
  replacements: readonly CustomReplacement[],
  protectedTerms: readonly string[],
  transformBuiltIn?: (source: string) => string
): ReplacementNotice[] {
  const notices: ReplacementNotice[] = [];
  const noticeKeys = new Set<string>();
  const protectedKeys = new Set(protectedTerms.map(normalizedCaseKey));

  const addNotice = (notice: ReplacementNotice): void => {
    const key = `${notice.code}\u0000${notice.message}`;
    if (!noticeKeys.has(key)) {
      noticeKeys.add(key);
      notices.push(notice);
    }
  };

  for (const entry of replacements) {
    if (entry.source === entry.replacement) {
      addNotice({
        severity: "warning",
        code: "no-op",
        message: `„${entry.source}“ wird durch denselben Text ersetzt und hat daher keine Wirkung.`
      });
    }
    if (entry.replacement === "") {
      addNotice({
        severity: "info",
        code: "deletion",
        message: `„${entry.source}“ wird vollständig entfernt.`
      });
    }
    if (protectedKeys.has(normalizedCaseKey(entry.source))) {
      addNotice({
        severity: "warning",
        code: "protected",
        message: `„${entry.source}“ ist zugleich eine persönliche Ausnahme. Die Ausnahme hat Vorrang und blockiert diese Ersetzung.`
      });
    }

    const builtInResult = transformBuiltIn?.(entry.source);
    if (builtInResult !== undefined && builtInResult !== entry.source) {
      addNotice({
        severity: "info",
        code: "built-in-overlap",
        message: `„${entry.source}“ würde eingebaut zu „${builtInResult}“ geändert. Die eigene Ersetzung hat Vorrang.`
      });
    }
  }

  for (let leftIndex = 0; leftIndex < replacements.length; leftIndex += 1) {
    const left = replacements[leftIndex];
    if (!left) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < replacements.length;
      rightIndex += 1
    ) {
      const right = replacements[rightIndex];
      if (!right) {
        continue;
      }

      const sameIgnoringCase =
        normalizedCaseKey(left.source) === normalizedCaseKey(right.source);
      if (sameIgnoringCase && left.source !== right.source) {
        addNotice({
          severity: "warning",
          code: "case-variant",
          message: `„${left.source}“ und „${right.source}“ unterscheiden sich nur in der Groß-/Kleinschreibung. Eigene Ersetzungen beachten diese Unterscheidung.`
        });
        continue;
      }

      if (
        left.source.includes(right.source) ||
        right.source.includes(left.source)
      ) {
        addNotice({
          severity: "info",
          code: "overlap",
          message: `Die Ausgangstexte „${left.source}“ und „${right.source}“ überlappen. Die längere Fundstelle wird zuerst geprüft.`
        });
      }
    }
  }

  for (const entry of replacements) {
    const chained = replacements.find(
      (candidate) =>
        candidate.source !== entry.source &&
        candidate.source === entry.replacement
    );
    if (chained) {
      addNotice({
        severity: "warning",
        code: "chain",
        message: `„${entry.source}“ wird zu „${entry.replacement}“, das zugleich Ausgangstext einer weiteren Ersetzung ist. Ersetzungsketten werden absichtlich nicht weiter ausgeführt.`
      });
    }
  }

  return notices;
}

export function createPersonalRulesDocument(
  data: PersonalRulesData,
  exportedAt = new Date().toISOString()
): PersonalRulesDocument {
  return {
    format: personalRulesFormat,
    version: personalRulesFormatVersion,
    exportedAt,
    protectedTerms: [...data.protectedTerms],
    customReplacements: data.customReplacements.map((entry) => ({ ...entry }))
  };
}

export function stringifyPersonalRulesDocument(
  document: PersonalRulesDocument
): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function parsePersonalRulesDocument(
  contents: string
): PersonalRulesDocument {
  let value: unknown;
  try {
    value = JSON.parse(contents) as unknown;
  } catch {
    throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Die ausgewählte Datei enthält kein gültiges Sprachverstand-Format.");
  }

  const input = value as Record<string, unknown>;
  if (input.format !== personalRulesFormat) {
    throw new Error("Die Datei ist kein Export persönlicher Sprachverstand-Regeln.");
  }
  if (input.version !== personalRulesFormatVersion) {
    throw new Error(
      `Die Exportversion ${String(input.version)} wird nicht unterstützt.`
    );
  }
  if (
    typeof input.exportedAt !== "string" ||
    Number.isNaN(Date.parse(input.exportedAt))
  ) {
    throw new Error("Der Exportzeitpunkt der Datei ist ungültig.");
  }
  if (!Array.isArray(input.protectedTerms)) {
    throw new Error("Die Datei enthält keine gültige Ausnahmenliste.");
  }
  if (!Array.isArray(input.customReplacements)) {
    throw new Error("Die Datei enthält keine gültige Ersetzungsliste.");
  }

  return {
    format: personalRulesFormat,
    version: personalRulesFormatVersion,
    exportedAt: input.exportedAt,
    protectedTerms: normalizeProtectedTermEntries(
      input.protectedTerms,
      "Importierte Ausnahme"
    ),
    customReplacements: normalizeCustomReplacementEntries(
      input.customReplacements,
      "Importierte Ersetzung"
    )
  };
}

export function mergePersonalRules(
  existing: PersonalRulesData,
  imported: PersonalRulesData,
  mode: PersonalRulesImportMode
): PersonalRulesMergeResult {
  if (mode === "replace") {
    return {
      protectedTerms: [...imported.protectedTerms],
      customReplacements: imported.customReplacements.map((entry) => ({
        ...entry
      })),
      addedProtectedTerms: imported.protectedTerms.length,
      addedCustomReplacements: imported.customReplacements.length,
      replacedCustomReplacements: 0,
      skippedDuplicates: 0,
      conflicts: []
    };
  }

  const protectedTerms = new Map<string, string>();
  for (const term of existing.protectedTerms) {
    protectedTerms.set(normalizedCaseKey(term), term);
  }

  let addedProtectedTerms = 0;
  let skippedDuplicates = 0;
  for (const term of imported.protectedTerms) {
    const key = normalizedCaseKey(term);
    if (protectedTerms.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    protectedTerms.set(key, term);
    addedProtectedTerms += 1;
  }

  const customReplacements = new Map(
    existing.customReplacements.map((entry) => [
      entry.source,
      entry.replacement
    ])
  );
  const conflicts: string[] = [];
  let addedCustomReplacements = 0;
  let replacedCustomReplacements = 0;

  for (const entry of imported.customReplacements) {
    const existingReplacement = customReplacements.get(entry.source);
    if (existingReplacement === undefined) {
      customReplacements.set(entry.source, entry.replacement);
      addedCustomReplacements += 1;
      continue;
    }
    if (existingReplacement === entry.replacement) {
      skippedDuplicates += 1;
      continue;
    }

    conflicts.push(
      `„${entry.source}“: vorhanden „${existingReplacement}“, importiert „${entry.replacement}“`
    );
    if (mode === "prefer-imported") {
      customReplacements.set(entry.source, entry.replacement);
      replacedCustomReplacements += 1;
    }
  }

  if (protectedTerms.size > maximumProtectedTerms) {
    throw new Error(
      `Der zusammengeführte Import überschreitet ${maximumProtectedTerms} persönliche Ausnahmen.`
    );
  }
  if (customReplacements.size > maximumCustomReplacements) {
    throw new Error(
      `Der zusammengeführte Import überschreitet ${maximumCustomReplacements} eigene Ersetzungen.`
    );
  }

  return {
    protectedTerms: [...protectedTerms.values()],
    customReplacements: [...customReplacements].map(
      ([source, replacement]) => ({ source, replacement })
    ),
    addedProtectedTerms,
    addedCustomReplacements,
    replacedCustomReplacements,
    skippedDuplicates,
    conflicts
  };
}
