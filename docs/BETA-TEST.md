# Sprachverstand 0.6.1 – RC2 testen

RC2 ist der korrigierte Veröffentlichungskandidat für die öffentliche Freigabe
des Repositorys und die Einreichung bei Firefox Add-ons. Diese Anleitung bündelt
die technischen, sprachlichen und manuellen Prüfungen des finalen Kandidaten.

## Enthaltene Pakete

- `sprachverstand-0.6.1-rc.2-chromium.zip`
- `sprachverstand-0.6.1-rc.2-firefox.xpi`
- `sprachverstand-0.6.1-rc.2-source.zip`
- `SHA256SUMS.txt`
- `SOURCE_COMMIT.txt`
- `BETA-TEST.md`
- `AMO-SOURCE-INSTRUCTIONS.md`

## Prüfsummen und Commit kontrollieren

```bash
sha256sum -c SHA256SUMS.txt
```

Unter Windows können die Werte mit
`Get-FileHash -Algorithm SHA256 DATEINAME` verglichen werden.

Der Inhalt von `SOURCE_COMMIT.txt` muss mit dem Commit des RC2-Tags
`v0.6.1-rc.2` übereinstimmen. Chromium-Paket, Firefox-XPI und Quellarchiv müssen
aus diesem Commit stammen.

## Desktop installieren

### Chromium

1. Chromium-ZIP entpacken.
2. `chrome://extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Entpackte Erweiterung laden** wählen.
5. Den entpackten Ordner auswählen.

### Firefox und Waterfox

Für einen temporären Test:

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** wählen.
3. Die Firefox-XPI oder `dist/firefox/manifest.json` auswählen.

Das für Mozilla bestimmte XPI ist absichtlich unsigniert. Vor der Einreichung darf
es kein `META-INF`-Signaturverzeichnis enthalten.

## Oberfläche und Symbole

Prüfen:

- Das Popup öffnet sofort ungefähr 384 Pixel breit und mit normaler Höhe.
- Alle vierzehn Regelgruppen sind sichtbar und einzeln schaltbar.
- Zwölf Regelgruppen sind standardmäßig aktiv.
- **Kontextgebundene Umschreibungen** und **Geschlechtszusätze in Stellenanzeigen** sind standardmäßig deaktiviert.
- Browserleiste, Popup, Einstellungsseite und README verwenden dasselbe SV-Monogramm.
- Das Symbol ist in 32, 48 und 128 Pixeln vollständig sichtbar.
- Der Korrekturzähler folgt Änderungen ohne Neuladen.
- Der Link **Lizenz und Quelltext** befindet sich nur in den erweiterten Einstellungen.
- Die Rechtshinweisseite nennt `AGPL-3.0-only`, Quelltextadresse, fehlende Gewährleistung und die getrennte Behandlung von Name und Logo.

## Erweiterte Einstellungen

- **Speichern** und **Zurücksetzen** stehen oben links in derselben Werkzeugleiste wie **Alle öffnen** und **Alle schließen** rechts.
- Die beiden Schaltergruppen sind auf Desktop-Breiten horizontal bündig ausgerichtet.
- Auf schmalen Ansichten werden die beiden Zweiergruppen übersichtlich untereinander dargestellt.
- Am unteren Ende der Einstellungsseite befinden sich keine doppelten Speicher- oder Rücksetzschalter.
- **Allgemein** und **Was soll korrigiert werden?** sind beim Öffnen ausgeklappt.
- Alle anderen Bereiche sind zunächst eingeklappt.
- **Alle öffnen** öffnet sämtliche Bereiche.
- **Alle schließen** schließt sämtliche Bereiche.
- **Untertitel korrigieren** ist standardmäßig deaktiviert.
- Die Reihenfolge lautet:
  1. Allgemein
  2. Was soll korrigiert werden?
  3. Wo soll korrigiert werden?
  4. Persönliche Ausnahmen
  5. Eigene Ersetzungen
  6. Ausgeschlossene Domains
  7. Einstellungen sichern und übertragen
  8. Browser-Synchronisierung

## Lokale Speicherung und optionale Browser-Synchronisierung

1. Erweiterung mit einem frischen Profil laden. Alle sechs Synchronisierungskategorien müssen deaktiviert sein.
2. Einstellungen ändern und speichern. Der vollständige Stand muss in `storage.local` liegen. Solange die Synchronisierung noch nie aktiviert wurde, dürfen keine Sprachverstand-Schlüssel in `storage.sync` entstehen.
3. Nur **Aktivierungsstatus** und **Regelgruppen** auswählen und speichern. `storage.sync` muss die Auswahl sowie ausschließlich die beiden ausgewählten Kategorien enthalten.
4. Auf einem zweiten angemeldeten Browserprofil prüfen, dass sowohl die ausgewählten Kategorien als auch deren Werte übernommen werden. Nicht ausgewählte Kategorien müssen lokal bleiben.
5. Eine der Kategorien wieder abwählen und speichern. Ihr Synchronisierungsschlüssel muss entfernt werden; die Auswahl muss entsprechend aktualisiert werden. Der lokale Wert bleibt erhalten.
6. Nach vorheriger Nutzung alle Kategorien abwählen und speichern. Sämtliche Kategorieschlüssel müssen entfernt werden. Die leere Auswahl darf als Metadatum verbleiben, damit andere Geräte die vollständige Deaktivierung übernehmen.
7. Eine sehr große Liste eigener Ersetzungen zur Synchronisierung auswählen. Bei Überschreitung des sicheren Limits muss eine verständliche Meldung erscheinen.
8. Die Erweiterung muss bei nicht erreichbarer Browser-Synchronisierung mit dem lokalen Stand weiter funktionieren.

## Vollständiger Export und strenger Import

Der Export muss enthalten:

- `format: "sprachverstand.settings-backup"`
- `version: 2`
- gültigen ISO-Zeitstempel
- aktuellen Einstellungsstand
- `syncCategoryIds`
- persönliche Ausnahmen
- eigene Ersetzungen

Ein Import darf zunächst nur das Formular verändern und erst nach **Speichern**
wirksam werden.

Vollständig abzuweisen sind insbesondere:

- ungültiges JSON
- fremdes Format oder unbekannte höhere Schemaversion
- zukünftige `settingsRevision`
- unbekannte Felder, Regelgruppen oder Synchronisierungskategorien
- falsche Feldtypen
- mehr als 100 Domains, Ausnahmen oder eigene Ersetzungen
- leere, typwidrige oder zu lange Einträge
- ungültige oder gleichwertig doppelte Domains
- doppelte Ausgangstexte bei eigenen Ersetzungen
- Dateien über dem zulässigen Größenlimit

## Eigene Ersetzungen und Konflikthinweise

Testfolge:

1. `Sonderform => gewünschte Form` eintragen und speichern.
2. `Sonderform` auf einer Testseite prüfen.
3. `sonderform` darf wegen der Groß-/Kleinschreibung nicht automatisch ersetzt werden.
4. Bei `A => B` und `B => C` darf aus `A` nur `B`, nicht `C` werden.
5. `Nutzer:innen => Leser` muss vor der eingebauten Regel greifen.
6. Eine zusätzliche persönliche Ausnahme `Nutzer:innen` muss Vorrang haben.
7. `Testzusatz =>` muss den Ausgangstext entfernen.
8. Dubletten, widersprüchliche Ziele, Ketten, Überschneidungen, blockierende Ausnahmen und wirkungslose Ersetzungen müssen verständlich gemeldet werden.

Benutzerdefinierte Regex, Platzhalter und rekursive Ersetzungsketten werden nicht
unterstützt.

## Repräsentative Sprachfälle

```text
Nutzer:innen                    → Nutzer
Mitarbeiter*innen               → Mitarbeiter
NutzerInnen                     → Nutzer
NutzerIn                        → Nutzer
eine NutzerIn                   → ein Nutzer
Ich sehe eine NutzerIn.         → Ich sehe einen Nutzer.
Student*innen                   → Studenten
Ärzt:innen                      → Ärzte
Bauern_Bäuerinnen               → Bauern
Koch/Köchin                     → Koch
jede:r Nutzer:in                → jeder Nutzer
Professor/-in                   → Professor
Sehr geehrte Mitarbeitende      → Sehr geehrte Mitarbeiter
Studierende                     → Studenten
Arbeitnehmende                  → Arbeitnehmer
Praktiker*innen                 → Praktiker
Mediziner*innen                 → Mediziner
Erwachsene:r                    → Erwachsener
Rom*nja                         → Roma
Sinti*zze                       → Sinti
Studentys                       → Studenten
Gegner*innenschaft              → Gegnerschaft
Nutzer:innenkonto               → Nutzerkonto
```

`Benutzungshandbuch → Benutzerhandbuch` gehört zur standardmäßig deaktivierten
Gruppe **Kontextgebundene Umschreibungen**.

## Schutzfälle

Unverändert bleiben insbesondere:

```text
Politikerinnen
Professorin
Testpersonen
Besuch der ärztlichen Sprechstunde
Sehr geehrte Persönlichkeiten
Liebes Kollegium
zehn Zuhörer*inne
trans* Personen
inter* Personen
Inter*feindlichkeit
Inter*diskriminierung
Die seit Stunden Forschenden ruhen.
lesende Kinder
Robot:innen
Innen- und Außendienst
LogIn
AddIn
PlugIn
DriveIn
```

Paarungen unterschiedlicher Begriffe müssen unverändert bleiben, etwa
`Nutzerinnen und Kunden` oder `Mütter und Väter`.

## Wiederherstellung, Zitate, Untertitel und Attribute

- Jede Regelgruppe einzeln ausschalten. Nur ihre eigenen Änderungen dürfen zurückgesetzt werden.
- Beim erneuten Einschalten müssen Texte ohne Neuladen wieder verarbeitet werden.
- Beim globalen Ausschalten müssen alle Änderungen ohne Neuladen verschwinden.
- Nach Deaktivierung der Zitatoption bleibt `„Mitarbeiter/-innen“` geschützt, während derselbe Ausdruck außerhalb des Zitats korrigiert wird.
- Bei deaktivierter Attributoption dürfen `alt`, `aria-label`, `aria-description` und `title` nicht verändert werden; sichtbarer Text muss weiter funktionieren.
- Auf YouTube ein Video mit Untertiteln abspielen. Bei deaktivierter
  Untertiteloption müssen Untertitel unverändert bleiben und das Video flüssig
  laufen, während Beschreibung und Kommentare weiter verarbeitet werden.
- Die Untertiteloption aktivieren und eine Zeile mit `Nutzer:innen` testen. Die
  Korrektur muss ohne sichtbares Stocken erfolgen. Schnelle wortweise Updates
  dürfen nur den zuletzt sichtbaren Stand verarbeiten.
- Eingabefelder, Editoren, Quellcode, URLs, IDs und technische Daten bleiben unberührt.

## README-Direkttest

Die Vergleichstabelle auf der GitHub-Startseite bleibt unverändert, weil ihre
Beispiele als Quellcode markiert sind. Der Abschnitt **Direkt ausprobieren** ist
normaler Seiteninhalt und muss bei aktiviertem Sprachverstand angepasst werden.

## Firefox für Android

Das vorgesehene Mobilziel ist Firefox für Android ab Version 142.

```bash
npm ci
npm run build:firefox
npx web-ext run \
  --source-dir dist/firefox \
  --target=firefox-android
```

Auf dem Gerät Touch-Bedienung, Scrollbarkeit, Safe Areas, Bildschirmtastatur,
Popup, Optionsseite, Untertitel bei ein- und ausgeschalteter Option, eigene
Ersetzungen, Synchronisierung und die lokale
Rechtshinweisseite prüfen.

## Lokale Testseite

```bash
python -m http.server 8080
```

Danach `http://127.0.0.1:8080/tests/manual/beta-fixture.html` öffnen.

## Reale Seiten und Last

Besonders wichtig sind:

- DHL-Anmeldung
- ARD und andere Mediatheken
- rebuy und weitere Single-Page-Anwendungen
- große Nachrichtenseiten
- React-, Angular- und Vue-Anwendungen
- Firefox für Android
- Screenreader-Test der zugänglichen Attribute
- CPU- und Speicherverhalten bei dynamisch nachgeladenen Inhalten

Eine Fehlermeldung sollte Browser, Version, Betriebssystem, Adresse, Ausgangstext,
Ergebnis, Erwartung, aktive Regelgruppen und reproduzierbare Schritte enthalten.
Keine Zugangsdaten oder privaten Inhalte mitsenden.
