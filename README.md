# Sprachverstand

**Macht Webseiten wieder lesbar.**

Sprachverstand ist eine neu entwickelte Browser-Erweiterung zur kontrollierten
Normalisierung gegenderter deutscher Texte. Die Codebasis ist modular, streng
typisiert und auf möglichst geringe Fehlertreffer ausgelegt.

## Stand

Version `0.5.0` ist **Beta 5**. Sie ergänzt das SV-Logo, direkt im Popup
schaltbare Regelgruppen, einen live aktualisierten Seitenzähler, neue sichere
Singular- und Pluralformen sowie zwei bewusst optionale Regelgruppen für
mehrdeutige Umschreibungen und Stellenanzeigen-Zusätze.

Die CI erzeugt für jeden geprüften Commit Chromium-, Firefox- und
Quellcode-Pakete samt SHA-256-Prüfsummen. Die Installations- und Testanleitung
steht unter [`docs/BETA-TEST.md`](docs/BETA-TEST.md).

## Eigenschaften

- Manifest V3 für Chromium und Firefox
- Firefox für Android als offiziell vorgesehenes Mobilziel
- TypeScript-Regel-Engine mit zwölf verständlichen Regelgruppen
- jede Regelgruppe im Popup und in den Einstellungen einzeln aktivierbar und mit Beispiel erklärt
- reversible Änderungen: Ausschalten stellt eigene Änderungen ohne Reload zurück
- Live-Zähler pro Tab im Symbol, Popup und Einstellungsfenster
- persönliche literale Ausnahmen für Wörter und vollständige Phrasen
- Domain-Ausschlüsse
- SV-Monogramm als Erweiterungs-, Popup- und Einstellungslogo
- wahlweise Schutz direkt zitierter Schreibweisen in Anführungszeichen
- sichere Verarbeitung normaler Textknoten
- optional kontrollierte Verarbeitung von `alt`, `aria-label`,
  `aria-description` und `title`
- `MutationObserver` für dynamische Webseiten, Single-Page-Anwendungen und
  nachträgliche Attributänderungen
- Schutz für Eingabefelder, Editoren, Code, URLs und technische Daten
- kleiner Hintergrundprozess ausschließlich für Badge und Tab-Zähler
- automatisierte Unit-, DOM-, Änderungsumfang-, Einstellungs- und
  Regressionstests
- Firefox-Desktop- und Firefox-Android-Kompatibilitätsprüfung mit `web-ext lint`
- reproduzierbare Builds und geprüfte Beta-Pakete

## Auswählbare Regelgruppen

Die frühere Auswahl „Konservativ / Standard / Aggressiv“ wurde entfernt. Alle
aktuellen produktiven Regeln waren ohnehin als sicher eingestuft, sodass diese
Profile bislang praktisch keinen sichtbaren Unterschied erzeugten.

Stattdessen stehen konkrete Gruppen zur Verfügung:

1. Genderzeichen im Plural
2. Binnen-I im Plural
3. Doppelnennungen im Plural
4. Gegenderte Singularformen mit Artikel
5. Gegenderte Singularformen ohne Artikel
6. Doppelnennungen im Singular
7. Explizite Pronomen- und Possessivpaare
8. Künstlich gegenderte Familienformen
9. Gegenderte Titelabkürzungen
10. Partizipformen in eindeutigen Anreden
11. Geschlechtsneutrale Umschreibungen *(standardmäßig aus)*
12. Geschlechtszusätze in Stellenanzeigen *(standardmäßig aus)*

Die beiden letzten Gruppen sind bewusst deaktiviert, weil `Studierende`,
`Lesende` oder `(m/w/d)` je nach Kontext tatsächliche Information tragen können.
Sie werden nicht hinter einem unklaren Profilnamen versteckt.

## Beispiele

```text
Nutzer:innen                         → Nutzer
Mitarbeiter*innen                    → Mitarbeiter
Mitarbeiter/-innen                   → Mitarbeiter
Anfänger*innen                       → Anfänger
Zuhörer*innen                        → Zuhörer
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
Koch/Köchin                           → Koch
Bauern_Bäuerinnen                     → Bauern
Tierärztin/Tierarzt                  → Tierarzt
jede:r Nutzer:in                     → jeder Nutzer
ein/-e Frisör/-in                    → ein Frisör
eine/n Erzieher/-in                  → einen Erzieher
ein_e Handwerker_in                  → ein Handwerker
eine:n Student:in                    → einen Studenten
einem:einer Kund:in                  → einem Kunden
des:der Nutzer:in                    → des Nutzers
mein:e Nutzer:in                     → mein Nutzer
eure:n Pilot:in                      → euren Piloten
er:sie                               → er
ihm:ihr                              → ihm
seines:ihres                         → seines
Prof.in Anna Müller                  → Prof. Anna Müller
die Prof.in                          → die Professorin
Liebe Teilnehmende                   → Liebe Teilnehmer
Sehr geehrte mitarbeitende Personen  → Sehr geehrte Mitarbeiter
Makler*in                             → Makler
Expert*in                             → Experte
Ärzt_in                               → Arzt
Professor/-in                         → Professor
Direktor_in                           → Direktor
```

Bei aktivierter optionaler Gruppe **Geschlechtsneutrale Umschreibungen** gilt
zusätzlich etwa `Studierende → Studenten` und `Lesende → Leser`. Die optionale
Stellenanzeigen-Gruppe entfernt Zusätze wie `(m/w/d)`.

Ausdrücklich weibliche Aussagen wie `Die Kundin ruft an` sowie Vollformen wie
`Professorin Müller` bleiben unverändert.

## Persönliche Ausnahmen

Persönliche Ausnahmen sind wörtliche Wörter oder vollständige Phrasen:

```text
Nutzer:innen
Meine geschützte Phrase
```

- eine Ausnahme pro Zeile
- Groß- und Kleinschreibung wird ignoriert
- keine regulären Ausdrücke und keine Platzhalter
- exakte Wort- und Phrasengrenzen
- `Nutzer:innen` schützt nicht automatisch `Nutzer:innenkonto`
- maximal 100 Einträge mit jeweils 80 Zeichen
- lokale Speicherung im Browser; die Liste wird nicht über Browser-Sync
  übertragen

## Bewusst noch nicht verändert

- unmarkierte Binnen-I-Singularformen wie `eine NutzerIn`, deren Schreibweise
  ohne Separator nicht sicher von einer ausdrücklich weiblichen Form zu trennen ist
- weitere flektierte Doppelnennungen außerhalb der geprüften Formen
- unbekannte oder mehrdeutige Wortformen
- nicht in der optionalen Umschreibungsgruppe hinterlegte Partizipialformen
- Pluralkürzel wie `Prof.innen` und `Dr.innen`
- vollständige feminine Formen wie `Politikerinnen` ohne sichtbares Genderzeichen
- reguläre Begriffe wie `Testpersonen`, `ärztliche Sprechstunde` und `Benutzungshandbuch`
- nicht freigegebene Attribute wie `value`, `placeholder`, `data-*`, IDs und
  URLs

Eine ausgelassene Ersetzung ist ausdrücklich besser als eine falsche.

## Unterstützte Browser

- Firefox Desktop
- Firefox für Android
- Chromium-basierte Desktop-Browser

Google Chrome auf Android unterstützt keine Browser-Erweiterungen. Andere
Chromium-basierte Android-Browser mit eigener Erweiterungsunterstützung können
funktionieren, sind aber kein verbindliches Veröffentlichungsziel.

## Voraussetzungen

- Node.js 24 LTS oder neuer
- npm

## Einrichtung und Prüfung

```bash
npm install
npm run check
```

Die fertigen Erweiterungen liegen danach unter:

```text
dist/chromium/
dist/firefox/
```

Firefox für Android kann mit einem per ADB verbundenen Gerät getestet werden:

```bash
web-ext run --source-dir dist/firefox --target=firefox-android
```

## Manuell laden

Die vollständige Beta-Anleitung steht in
[`docs/BETA-TEST.md`](docs/BETA-TEST.md).

### Chromium Desktop

1. `chrome://extensions` öffnen.
2. Entwicklermodus aktivieren.
3. **Entpackte Erweiterung laden** auswählen.
4. `dist/chromium` auswählen.

### Firefox Desktop

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** auswählen.
3. `dist/firefox/manifest.json` auswählen.

## Repository und Identität

Das Repository bleibt bis zur späteren Übertragung auf ein separates
Projektkonto privat. Die endgültige Lizenz wird vor der ersten öffentlichen
Verteilung festgelegt.
