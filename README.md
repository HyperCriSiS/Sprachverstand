# Sprachverstand

**Macht Webseiten wieder lesbar.**

Sprachverstand ist eine neu entwickelte Browser-Erweiterung zur kontrollierten
Normalisierung gegenderter deutscher Texte. Das Projekt beginnt mit einer neuen,
modularen Codebasis. Alte Erweiterungen dienen zunächst nur als Recherche-,
Fehler- und Testfundus.

## Stand

Version `0.1.0` enthält das technische Fundament:

- Manifest V3 für Chromium und Firefox
- kein Hintergrunddienst und damit keine unnötige Service-Worker-Abhängigkeit
- TypeScript-Regel-Engine mit Risikoprofilen
- sichere Verarbeitung normaler Textknoten
- `MutationObserver` für dynamische Webseiten und Single-Page-Anwendungen
- Schutz für Eingabefelder, Editoren, Code, technische Daten und versteckte Inhalte
- globale Aktivierung, Regelprofil und Domain-Ausschlüsse
- automatisierte Unit- und DOM-Tests
- reproduzierbare Builds mit esbuild

Es wurden in dieser Version noch keine Regeln oder Quelltextteile aus anderen
Projekten übernommen.

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

## Geplante Reihenfolge

1. Technisches Fundament
2. unabhängiger Testkatalog aus bekannten Fehlerfällen
3. konservative, sehr sichere Regeln
4. kontextabhängige Regeln
5. aggressive optionale Regeln
6. Domain- und Seitenausnahmen
7. Browser-Kompatibilität und Leistungstests
8. Signierung und Veröffentlichung

## Repository und Identität

Das spätere Repository soll unter einem separaten GitHub-Konto privat angelegt
werden. Vor dem ersten Commit muss die lokale Git-Identität für dieses Repository
explizit gesetzt werden:

```bash
git config user.name "Sprachverstand"
git config user.email "DEINE_NOREPLY_ADRESSE"
```

Die Lizenz wird vor der ersten Verteilung festgelegt, nachdem abschließend
entschieden wurde, welche fremden Inhalte tatsächlich übernommen werden.
