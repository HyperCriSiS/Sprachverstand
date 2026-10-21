// Necessary alternatives from the built-in rules' own early guards. This is
// deliberately broader than their matching patterns: false positives are safe.
const candidate = /in(?![a-z])|inn|nnen|verbündete|frau|nja|zze|ys|ende|benutzungshandbuch|[:*_\/·•.’‘]-?[a-zäöüß]|\(/iu;
export function isBuiltInTransformCandidate(input: string): boolean {
  return candidate.test(input);
}
