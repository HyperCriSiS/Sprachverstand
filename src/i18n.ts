import { getExtensionApi } from "./browser/api";

export type I18nSubstitutions = string | readonly string[];

export function t(key: string, substitutions?: I18nSubstitutions): string {
  const translated = getExtensionApi().i18n.getMessage(key, substitutions);
  return translated || key;
}
