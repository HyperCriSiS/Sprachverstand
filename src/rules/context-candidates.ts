// Shared by the local rule engine and the lightweight DOM metadata.
export const participleSource = [
  "Mitarbeitende", "Teilnehmende", "Nutzende", "Studierende", "Forschende",
  "Lehrende", "Lesende", "Zuhörende", "Arbeitnehmende", "Arbeitgebende",
  "Dozierende", "Fördergebende", "Theatermachende"
].join("|");
export const markedPluralWordSource = String.raw`[\p{L}\p{M}’'-]+(?:(?:[/∕⁄／]-?|[:*_·•.’‘'])innen|\(-?innen\)|[/∕⁄／]inne[/∕⁄／]n)`;
export const markedLeadingCandidate = new RegExp(String.raw`^\s*${markedPluralWordSource}`, "iu");
export const participleLeadingCandidate = new RegExp(
  String.raw`^\s*(?:${participleSource})(?:\s+Personen)?(?![\p{L}\p{M}])`, "iu"
);
// A marked singular opening an inline element, possibly after up to two
// attributes; its article may sit in the previous text node (`mit der
// <em>Patient*in</em>`, `mit der <b>neuen Kolleg*in</b>`).
export const markedSingularLeadingCandidate =
  /^\s*(?:\p{Ll}[\p{L}\p{M}-]*(?:e|en|er|es|em)\s+){0,2}[\p{L}\p{M}’'-]+(?:[:*_·•’‘]in|\/-?in|\(-?in\)|\p{Ll}In)(?![\p{L}\p{M}])/u;
