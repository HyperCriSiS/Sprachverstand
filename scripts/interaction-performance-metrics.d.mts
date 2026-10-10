// Typen für den lokalen Chromium-Diagnosehelfer.
export const messfelder: readonly string[];
export function median(werte: readonly number[]): number | null;
export interface InteraktionsLauf {
  status?: string;
  staticText?: string;
  dynamicText?: string;
  protectedOk?: boolean;
  interactionCount?: number;
  mutationTicks?: number;
  rafCount?: number;
  longTaskSupported?: boolean;
  [key: string]: string | number | boolean | null | undefined;
}
export interface InteraktionsPaar {
  baseline?: InteraktionsLauf;
  extension?: InteraktionsLauf;
}
export function pruefePaar(paar: InteraktionsPaar): {ok: boolean; grund?: string};
export function zusammenfassung(paare: readonly InteraktionsPaar[]): {
  angefordert: number;
  gueltig: number;
  phasen: Record<string, {deltaMedian: number | null}>;
  longTaskPaareMessbar: number;
};
