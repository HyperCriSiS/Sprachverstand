# Sprachverstand

**Macht Webseiten wieder lesbar.**

Sprachverstand ist eine neu entwickelte Browser-Erweiterung zur kontrollierten
Normalisierung gegenderter deutscher Texte. Die Codebasis ist modular, streng
typisiert und auf möglichst geringe Fehlertreffer ausgelegt.

## Stand

Version `0.3.0` ist der erste manuell testbare Beta-Stand. Die CI erzeugt für
jeden geprüften Commit Chromium-, Firefox- und Quellcode-Pakete samt
SHA-256-Prüfsummen. Die Installations- und Testanleitung steht unter
[`docs/BETA-TEST.md`](docs/BETA-TEST.md).

Das Projekt enthält:

- Manifest V3 für Chromium und Firefox
- keinen Hintergrunddienst und keine unnötige Service-Worker-Abhängigkeit
- TypeScript-Regel-Engine mit Risikoprofilen
- sichere Verarbeitung normaler Textknoten
- kontrollierte Verarbeitung von `alt`, `aria-label`, `aria-description` und
  `title`
- `MutationObserver` für dynamische Webseiten, Single-Page-Anwendungen und
  nachträgliche Attributänderungen
- Schutz für Eingabefelder, Editoren, Code, URLs und technische Daten
- globale Aktivierung, Regelprofil und Domain-Ausschlüsse
- automatisierte Unit-, DOM-, Änderungsumfang- und Regressionstests
- reproduzierbare Builds und geprüfte Beta-Pakete
- CI für Typecheck, getrennte Regeltests und beide Browser-Builds

### Bereits unterstützte Schreibweisen

- Pluralformen mit `:`, `*`, `_`, `/`, `·`, `•`, `.`, `’` und `‘`
- unveränderte und explizit hinterlegte unregelmäßige Pluralformen
- gegenderte Wortanfänge in Komposita
- Binnen-I im Plural
- Doppelnennungen im Grundkasus und Dativplural
- explizite Singular-Doppelformen wie `Kunde/Kundin`
- explizit gegenderte Singularphrasen mit eindeutigem Artikel- und Kasusmarker
- Possessivartikel in Nominativ, Akkusativ, Dativ und Genitiv
- explizite Pronomen- und Possessivpaare wie `er:sie` und `seinem:ihrem`
- Nominativ, Akkusativ, Dativ und Genitiv
- korrekte schwache Deklination, etwa `Student` gegenüber `Studenten`
- sichere natürliche Familienformen wie `Mutter:in`
- dieselben sicheren Regeln in sichtbarem Text und freigegebenen zugänglichen
  Attributen

Beispiele:

```text
Nutzer:innen                         → Nutzer
Mitarbeiter*innen                    → Mitarbeiter
Ärzt_innen                           → Ärzte
Student/innen                        → Studenten
US-Bürger’innen                      → US-Bürger
TierärztInnen                        → Tierärzte
Nutzer:innenkonto                    → Nutzerkonto
MutterInnen                          → Mütter
Mutter:in                            → Mutter
Bauer:innen                          → Bauern
Messebauer*innen                     → Messebauer
Nutzerinnen und Nutzer               → Nutzer
mit Ärztinnen und Ärzten             → mit Ärzten
Kunde/Kundin                         → Kunde
Tierärztin/Tierarzt                  → Tierarzt
jede:r Nutzer:in                     → jeder Nutzer
eine:n Student:in                    → einen Studenten
einem:einer Kund:in                  → einem Kunden
des:der Nutzer:in                    → des Nutzers
mein:e Nutzer:in                     → mein Nutzer
eure:n Pilot:in                      → euren Piloten
er:sie                               → er
ihm:ihr                              → ihm
seines:ihres                         → seines
```

### Bewusst noch nicht verändert

- singuläre Formen ohne eindeutigen Artikel- und Kasusmarker, etwa
  `eine NutzerIn`
- weitere flektierte Doppelnennungen außerhalb der geprüften Formen
- unbekannte oder mehrdeutige Wortformen
- Partizipialformen
- nicht freigegebene Attribute wie `value`, `placeholder`, `data-*`, IDs und
  URLs

Eine ausgelassene Ersetzung ist ausdrücklich besser als eine falsche.

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

Die vollständige Beta-Anleitung steht in
[`docs/BETA-TEST.md`](docs/BETA-TEST.md).

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

Die endgültige Lizenz wird vor der ersten öffentlichen Verteilung festgelegt,
nachdem abschließend entschieden wurde, welche fremden Inhalte tatsächlich
übernommen werden.
