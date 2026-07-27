# Sprachverstand 0.5.1 – Beta 6 testen

Diese Beta ergänzt einen versionierten Kontextkatalog, eine sichere
Binnen-I-Regel für `PolitikerInnen`, die optionale Stilform
`Benutzungshandbuch → Benutzerhandbuch` und zusätzliche Satzregressionen.

## Enthaltene Pakete

- `sprachverstand-0.5.1-beta.6-chromium.zip`
- `sprachverstand-0.5.1-beta.6-firefox.xpi`
- `sprachverstand-0.5.1-beta.6-source.zip`
- `SHA256SUMS.txt`

## Prüfsummen kontrollieren

```bash
sha256sum -c SHA256SUMS.txt
```

Unter Windows können die Werte mit
`Get-FileHash -Algorithm SHA256 DATEINAME` verglichen werden.

## Desktop installieren

### Chromium

1. Chromium-ZIP entpacken.
2. `chrome://extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Entpackte Erweiterung laden** wählen.
5. Den entpackten Ordner auswählen.

### Firefox

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** wählen.
3. Die Firefox-XPI oder `dist/firefox/manifest.json` auswählen.

## Firefox für Android testen

Google Chrome auf Android unterstützt keine Erweiterungen. Das verbindliche
Mobilziel ist Firefox für Android ab Version 142.

```bash
npm install
npm run build:firefox
npx web-ext run \
  --source-dir dist/firefox \
  --target=firefox-android
```

Auf dem Gerät prüfen:

- neues SV-Symbol in der Erweiterungsliste
- Popup vollständig sichtbar und vertikal scrollbar
- alle Regelgruppen per Touch schaltbar
- Optionsseite im normalen Tab
- Bildschirmtastatur verdeckt Speichern nicht dauerhaft
- Systemhelligkeit und Dunkelmodus
- Counter im Popup, falls Android kein Badge am Symbol zeigt

## Popup und Zähler

Im Popup müssen sichtbar sein:

- SV-Logo
- globaler Aktivschalter
- Zahl der Korrekturen im aktiven Tab
- alle zwölf Regelgruppen nur mit Titel und Beispiel
- Schaltfläche für Ausnahmen und weitere Einstellungen

Regelgruppen und Aktivschalter im Popup mehrfach umschalten. Die Seite muss ohne
Reload wiederhergestellt und neu verarbeitet werden. Der Zähler muss dabei
innerhalb kurzer Zeit folgen und darf nicht auf einem alten Wert stehen bleiben.

Wird die Einstellungsseite aus dem Popup geöffnet, zeigt sie die Zahl des zuvor
betrachteten Seitentabs. Änderungen nach dem Speichern müssen dort ebenfalls
live erscheinen.

## Regelgruppen

Zehn Gruppen sind standardmäßig aktiv. Zwei riskantere Gruppen sind zunächst aus:

- **Kontextgebundene Umschreibungen**
- **Geschlechtszusätze in Stellenanzeigen**

Jede Gruppe einzeln deaktivieren und prüfen, dass nur ihre eigenen Änderungen
zurückgesetzt werden.

## Neue Kernfälle

```text
Sehr geehrte Mitarbeitende           → Sehr geehrte Mitarbeiter
Sehr geehrte mitarbeitende Personen  → Sehr geehrte Mitarbeiter
Anfänger*innen                       → Anfänger
Zuhörer*innen                        → Zuhörer
Freund:innen                         → Freunde
ChirurgInnen                         → Chirurgen
PolitikerInnen                       → Politiker
zehn Zuhörer*innen                   → zehn Zuhörer
Bäuer_innen                          → Bauern
Bauern_Bäuerinnen                    → Bauern
Koch/Köchin                          → Koch
ein/-e Frisör/-in                    → ein Frisör
eine/n Erzieher/-in                  → einen Erzieher
ein_e Handwerker_in                  → ein Handwerker
Lehrer/-in                           → Lehrer
Verkäufer/-in                        → Verkäufer
Mitarbeiter/-in                      → Mitarbeiter
Makler*in                            → Makler
Expert*in                            → Experte
Ärzt_in                              → Arzt
Professor/in                         → Professor
Professor/-in                        → Professor
Direktor_in                          → Direktor
```

## Kontextgebundene Umschreibungen

Nach Aktivierung von **Kontextgebundene Umschreibungen**:

```text
mitarbeitende Personen  → Mitarbeiter
Benutzungshandbuch      → Benutzerhandbuch
```

Einzelne Partizipformen werden außerhalb bereits sicher erkannter Anreden nicht
mehr pauschal verändert:

```text
Studierende
Lesende
Teilnehmende
Nutzende
```

Die Fundstellen und Entscheidungen stehen in
`data/neutral-context-catalog.json`. Neue Beispiele werden mit vollständigem
Kontext gesammelt, bevor daraus eine Regel entsteht.

Nach Aktivierung von **Geschlechtszusätze in Stellenanzeigen**:

```text
eine/n Erzieher/-in (m/w/d) → einen Erzieher
```

## Anführungszeichen

Standardmäßig werden Genderformen auch innerhalb von Anführungszeichen
korrigiert:

```text
„Mitarbeiter/-innen“ → „Mitarbeiter“
```

Die Option **Text innerhalb von Anführungszeichen korrigieren** ausschalten.
Danach muss innerhalb desselben Textabschnitts gelten:

```text
„Mitarbeiter/-innen“ und Mitarbeiter/-innen
→ „Mitarbeiter/-innen“ und Mitarbeiter
```

Direkte Zitate, die über mehrere getrennte HTML-Elemente laufen, sind noch ein
manueller Grenztest.

## Bewusst unverändert

```text
Besuch der ärztlichen Sprechstunde
Politikerinnen
Testpersonen
zehn Zuhörer*inne
Sehr geehrte Persönlichkeiten
Liebes Kollegium
```

- `Politikerinnen` kann ausdrücklich nur Frauen meinen; `PolitikerInnen` wird
  wegen des sichtbaren Binnen-I dagegen zu `Politiker`.
- `Testpersonen` und `ärztliche Sprechstunde` bleiben als normale Begriffe unverändert.
- `Benutzungshandbuch` ist keine Genderzeichenform, wird aber in der optionalen
  Stilgruppe zu `Benutzerhandbuch`.
- `Zuhörer*inne` ist eine fehlerhafte Schreibweise; Sprachverstand ist kein
  allgemeines Rechtschreibprogramm.

## Titelabkürzungen

```text
Prof.in Anna Müller       → Prof. Anna Müller
Dr.in Eva Schmidt         → Dr. Eva Schmidt
Prof.in Dr.in Lea Weber   → Prof. Dr. Lea Weber
die Prof.in               → die Professorin
mit der Dr.in             → mit der Doktorin
```

Unverändert bleiben `Professorin Müller`, `Doktorin Schmidt`, `Prof.innen`,
`Dr.innen`, `Prof. Weber` und `Dr. König`.

## Persönliche Ausnahmen

Als persönliche Ausnahme eintragen:

```text
Nutzer:innen
```

Danach gilt:

```text
Nutzer:innen       → bleibt unverändert
Nutzer:innenkonto  → wird weiterhin zu Nutzerkonto
```

## Zugängliche Attribute

Die Option für `alt`, `aria-label`, `aria-description` und `title` ausschalten.
Sichtbarer Text muss weiterhin korrigiert werden, diese Attribute aber nicht.

## Lokale Testseite

```bash
python -m http.server 8080
```

Danach öffnen:

```text
http://127.0.0.1:8080/tests/manual/beta-fixture.html
```

## Reale Seitentests

Besonders wichtig bleiben:

1. DHL-Anmeldung
2. ARD und andere Mediatheken
3. rebuy und weitere Single-Page-Anwendungen
4. große Nachrichtenseiten
5. React-, Angular- und Vue-Seiten
6. Screenreader-Test der zugänglichen Attribute
7. dieselben kritischen Wege in Firefox für Android

## Fehler melden

Eine Meldung sollte Browser, Version, Betriebssystem, Adresse, Ausgangstext,
Ergebnis, Erwartung, aktive Regelgruppen und reproduzierbare Schritte enthalten.
Keine Zugangsdaten, privaten Nachrichten oder persönlichen Inhalte mitsenden.
