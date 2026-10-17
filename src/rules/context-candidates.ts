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
