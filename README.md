# Sprachverstand

**Macht Webseiten wieder lesbar.**

Sprachverstand ist eine neu entwickelte Browser-Erweiterung zur kontrollierten
Normalisierung gegenderter deutscher Texte. Die Codebasis ist modular, streng
typisiert und auf möglichst geringe Fehlertreffer ausgelegt.

## Stand

Version `0.2.0` ist die erste funktionale Entwicklungsversion. Sie enthält:

- Manifest V3 für Chromium und Firefox
- kein Hintergrunddienst und keine unnötige Service-Worker-Abhängigkeit
- TypeScript-Regel-Engine mit Risikoprofilen
- sichere Verarbeitung normaler Textknoten
- `MutationObserver` für dynamische Webseiten und Single-Page-Anwendungen
- Schutz für Eingabefelder, Editoren, Code, URLs und technische Daten
- globale Aktivierung, Regelprofil und Domain-Ausschlüsse
- automatisierte Unit-, DOM- und Regressionstests
- reproduzierbare Builds mit esbuild
- CI für Typecheck, Tests und beide Browser-Builds

### Bereits unterstützte Schreibweisen

- Pluralformen mit `:`, `*`, `_`, `/`, `·` und `•`
- unveränderte und explizit hinterlegte unregelmäßige Pluralformen
- Binnen-I im Plural
- Doppelnennungen im Grundkasus

Beispiele:

```text
Nutzer:innen                 → Nutzer
Mitarbeiter*innen            → Mitarbeiter
Ärzt_innen                   → Ärzte
Student/innen                → Studenten
TierärztInnen                → Tierärzte
Nutzerinnen und Nutzer       → Nutzer
Koautorinnen/Koautoren       → Koautoren
```

### Bewusst noch nicht verändert

- singuläre Formen ohne sicheren Artikel- und Kasuskontext
- flektierte Doppelnennungen wie `Ärztinnen und Ärzten`
- unbekannte oder mehrdeutige Wortformen
- Partizipialformen

Eine ausgelassene Ersetzung ist derzeit ausdrücklich besser als eine falsche.

## Voraussetzungen

- Node.js 24 LTS oder neuer
- npm

## Einrichtung

```bash
npm install
npm run check
```

Die fertigen Erweiterungen liegen danach unter:

```text
dist/chromium/
dist/firefox/
```

## Entwicklung

```bash
npm run dev
```

Der Chromium-Build wird bei Änderungen automatisch aktualisiert.

## Manuell laden

### Chromium

1. `chrome://extensions` öffnen.
2. Entwicklermodus aktivieren.
3. **Entpackte Erweiterung laden** auswählen.
4. `dist/chromium` auswählen.

### Firefox

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** auswählen.
3. `dist/firefox/manifest.json` auswählen.

## Qualitätssicherung

```bash
npm run typecheck
npm test
npm run build
```

Oder vollständig:

```bash
npm run check
```

Jede neue Sprachregel benötigt positive und negative Tests. Bekannte Fehlerfälle
aus den Rechercheprojekten werden als unabhängige Regressionstests erfasst.

## Repository und Identität

Das Repository bleibt bis zur späteren Übertragung auf ein separates Projektkonto
privat. Vor lokalen Commits sollte für dieses Repository eine eigene Git-Identität
gesetzt werden:

```bash
git config user.name "Sprachverstand"
git config user.email "DEINE_NOREPLY_ADRESSE"
```

Die endgültige Lizenz wird vor der ersten Verteilung festgelegt, nachdem
abschließend entschieden wurde, welche fremden Inhalte tatsächlich übernommen
werden.
