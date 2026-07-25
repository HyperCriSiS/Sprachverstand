# Changelog

Alle wesentlichen Änderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## 0.2.0

### Hinzugefügt

- Manifest-V3-Builds für Firefox und Chromium
- modulare TypeScript-Regel-Engine
- sichere DOM-Verarbeitung mit `MutationObserver`
- Schutz für Eingaben, Editoren, Code und technische Inhalte
- Popup, Einstellungsseite und Domain-Ausschlüsse
- GitHub-Actions-CI für Typecheck, Tests und Builds
- konservative Pluralregeln für Genderseparatoren
- explizites Flexionslexikon für unregelmäßige Pluralformen
- Binnen-I-Unterstützung im Plural
- lexikalisch geprüfte Doppelnennungen im Grundkasus
- zentraler Regressionstest-Katalog

### Sicherheit

- keine periodischen Komplettscans
- keine unnötigen Berechtigungen
- keine Veränderung unbekannter oder mehrdeutiger Formen
- singuläre und flektierte Konstruktionen bleiben ohne sicheren Kontext
  unverändert

## 0.1.0

- technisches Grundgerüst ohne produktive Sprachregeln
