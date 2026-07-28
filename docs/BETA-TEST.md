# Sprachverstand 0.6.0 – Beta 11 testen

Beta 11 erweitert den Sprachkern deutlich, ergänzt eigene lokale Ersetzungen
und führt die endgültige Open-Source-Lizenz ein. Die Regel-Engine bleibt
lexikon- und testgestützt; breit abschneidende Rückfall-Regex werden weiterhin
vermieden.

## Enthaltene Pakete

- `sprachverstand-0.6.0-beta.11-chromium.zip`
- `sprachverstand-0.6.0-beta.11-firefox.xpi`
- `sprachverstand-0.6.0-beta.11-source.zip`
- `SHA256SUMS.txt`
- `BETA-TEST.md`

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

### Firefox und Waterfox

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** wählen.
3. Die Firefox-XPI oder `dist/firefox/manifest.json` auswählen.

## Oberfläche, Symbol und Rechtshinweise

Prüfen:

- Popup öffnet sofort ungefähr 384 Pixel breit und mit normaler Höhe.
- Alle 14 Regelgruppen sind sichtbar und einzeln schaltbar.
- 12 Regelgruppen sind standardmäßig aktiv.
- **Kontextgebundene Umschreibungen** und
  **Geschlechtszusätze in Stellenanzeigen** sind standardmäßig deaktiviert.
- Browserleiste, Popup, Einstellungsseite und README verwenden dasselbe
  SV-Monogramm.
- Symbol ist in 32, 48 und 128 Pixeln vollständig sichtbar.
- Korrekturzähler folgt Änderungen ohne Neuladen.
- Der Link **Lizenz, Quelltext und Gewährleistung** öffnet die lokale
  Rechtshinweisseite.
- Rechtshinweisseite nennt `AGPL-3.0-only`, Quelltextadresse, fehlende
  Gewährleistung sowie die getrennte Behandlung von Name und Logo.

## Sichtbar markiertes Binnen-I im Singular

Das große I innerhalb des Wortes ist die Markierung und wird für bekannte
Personenbezeichnungen erkannt:

```text
NutzerIn                       → Nutzer
StudentIn                      → Student
ÄrztIn                         → Arzt
PolitikerIn                    → Politiker
```

Bei einem bereits maskulin flektierten Artikel wird dessen Kasus übernommen:

```text
ein NutzerIn                   → ein Nutzer
einen StudentIn                → einen Studenten
einem PatientIn                → einem Patienten
eines ÄrztIn                   → eines Arztes
```

Bei der femininen Artikelform `eine` wird nur in abgesicherten Kontexten
umflektiert:

```text
eine NutzerIn                  → ein Nutzer
Eine NutzerIn arbeitet heute.  → Ein Nutzer arbeitet heute.
Ich sehe eine NutzerIn.        → Ich sehe einen Nutzer.
Wir suchen eine StudentIn.     → Wir suchen einen Studenten.
Es gibt eine ÄrztIn.            → Es gibt einen Arzt.
Das ist eine NutzerIn.         → Das ist ein Nutzer.
für eine ÄrztIn                → für einen Arzt
mit einer StudentIn            → mit einem Studenten
wegen einer ÄrztIn             → wegen eines Arztes
```

Ein nicht sicher einzuordnender Satzteil bleibt unverändert:

```text
Vielleicht eine NutzerIn im Team
```

## Flektierte Doppelnennungen

### Singular

```text
eine Nutzerin oder ein Nutzer              → ein Nutzer
einen Studenten und eine Studentin         → einen Studenten
einer Studentin und einem Studenten        → einem Studenten
eines Arztes oder einer Ärztin              → eines Arztes
meine Kollegin und mein Kollege             → mein Kollege
```

### Plural

```text
die Nutzerinnen und die Nutzer              → die Nutzer
den Ärztinnen und den Ärzten                → den Ärzten
der Studentinnen und der Studenten          → der Studenten
Nutzerinnen und Nutzer                       → Nutzer
Ärzte oder Ärztinnen                         → Ärzte
```

Paarungen unterschiedlicher Begriffe müssen unverändert bleiben, etwa
`Nutzerinnen und Kunden` oder `Mütter und Väter`.

## Substantivierte Adjektive

Die neue Regelgruppe verarbeitet nur einen geprüften Katalog und eine zur
Flexion passende sichtbare Markierung:

```text
Erwachsene:r                    → Erwachsener
Erwachsene:n                    → Erwachsenen
Erwachsene:m                    → Erwachsenem
ein:e Erwachsene:r             → ein Erwachsener
eine:n Erwachsene:n            → einen Erwachsenen
einem:einer Arbeitslose:n       → einem Arbeitslosen
der:die Beschäftigte:r          → der Beschäftigte
Vorgesetzte:r                   → Vorgesetzter
Erziehungsberechtigte:r         → Erziehungsberechtigter
```

Nicht passende oder attributive Formen bleiben unverändert:

```text
ein:e Erwachsene:n
erwachsene Kinder
zuständige Mitarbeiter
```

## Weitere sichtbare Genderformen

Die Zuordnungen sind ausdrücklich und nicht als allgemeine Suffixregel
implementiert:

```text
Rom*nja                         → Roma
Rom:nja                         → Roma
Sinti*zze                       → Sinti
Sinti:zze                       → Sinti
Studentys                       → Studenten
Lesys                           → Leser
Lehrys                          → Lehrer
Kollegys                        → Kollegen
Mitarbeitys                     → Mitarbeiter
Kommilitonys                    → Kommilitonen
Wirtys                          → Wirte
```

Unmarkierte oder zufällig ähnlich endende Wörter bleiben unverändert:

```text
Romnja
Sintizze
Hobbys und Handys
```

## Erweiterter Flexionsbestand

Stichproben:

```text
Anwält:innen                    → Anwälte
Gäst:innen                      → Gäste
Köch:innen                      → Köche
Beamt:innen                     → Beamte
Vorständ:innen                  → Vorstände
Minister:innen                  → Minister
Lehrling:innen                  → Lehrlinge
Zeitzeug:innen                  → Zeitzeugen
Fotograf:innen                  → Fotografen
Bibliothekar:innen              → Bibliothekare
Psycholog:innen                 → Psychologen
Korrespondent:innen             → Korrespondenten
Parlamentarier:innen            → Parlamentarier
Bundeskanzler:innen             → Bundeskanzler
```

Der technische Fehlertreffer `Robot:innen` muss unverändert bleiben.

## Eigene Ersetzungen

Unter **Eigene Ersetzungen** stehen persönliche wörtliche Zuordnungen getrennt
von **Persönliche Ausnahmen**. Pro Zeile gilt:

```text
Ausgangstext => Ersetzung
```

Testfolge:

1. `Sonderform => gewünschte Form` eintragen und speichern.
2. `Sonderform` auf einer Testseite prüfen.
3. Groß-/Kleinschreibung prüfen: `sonderform` darf nicht automatisch mit
   ersetzt werden.
4. `A => B` und `B => C` eintragen: Aus `A` darf nur `B`, nicht `C` werden.
5. `Nutzer:innen => Leser` eintragen: Die eigene Ersetzung muss vor der
   eingebauten Regel greifen.
6. Zusätzlich `Nutzer:innen` als persönliche Ausnahme eintragen: Die Ausnahme
   muss Vorrang haben und den Text unverändert lassen.
7. Eine leere Zielseite wie `Testzusatz =>` muss den Ausgangstext entfernen.
8. Prüfen, dass die Einträge nur lokal gespeichert werden.

Benutzerdefinierte Regex, Platzhalter und rekursive Ersetzungsketten werden
absichtlich nicht unterstützt.

## Bestehende Kernfälle

```text
Nutzer:innen                   → Nutzer
Mitarbeiter*innen              → Mitarbeiter
NutzerInnen                    → Nutzer
Ärzt:innen                     → Ärzte
Student*innen                  → Studenten
Bauern_Bäuerinnen              → Bauern
Koch/Köchin                    → Koch
jede:r Nutzer:in               → jeder Nutzer
Professor/-in                  → Professor
Sehr geehrte Mitarbeitende     → Sehr geehrte Mitarbeiter
Studierende                    → Studenten
Arbeitnehmende                 → Arbeitnehmer
Juden_Jüdinnen                 → Juden
Gegner*innenschaft             → Gegnerschaft
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
```

## Wiederherstellung, Zitate und Attribute

- Jede Regelgruppe einzeln ausschalten. Nur ihre eigenen Änderungen dürfen
  zurückgesetzt werden.
- Beim erneuten Einschalten müssen Texte ohne Reload wieder verarbeitet werden.
- Nach Deaktivierung der Zitatoption bleibt `„Mitarbeiter/-innen“` geschützt,
  während derselbe Ausdruck außerhalb des Zitats korrigiert wird.
- Die Option für `alt`, `aria-label`, `aria-description` und `title` ausschalten:
  sichtbarer Text muss weiterhin korrigiert werden, diese Attribute nicht.

## README-Direkttest

Die Vergleichstabelle auf der GitHub-Startseite bleibt absichtlich unverändert,
weil ihre Beispiele als Quellcode markiert sind. Der Abschnitt
**Direkt ausprobieren** ist normaler Seiteninhalt und muss bei aktiviertem
Sprachverstand angepasst werden.

## Firefox für Android

Google Chrome auf Android unterstützt keine Erweiterungen. Das vorgesehene
Mobilziel ist Firefox für Android ab Version 142.

```bash
npm install
npm run build:firefox
npx web-ext run \
  --source-dir dist/firefox \
  --target=firefox-android
```

Auf dem Gerät Touch-Bedienung, Scrollbarkeit, Safe Areas, Bildschirmtastatur,
Optionsseite, eigene Ersetzungen und die lokale Rechtshinweisseite prüfen.

## Lokale Testseite

```bash
python -m http.server 8080
```

Danach `http://127.0.0.1:8080/tests/manual/beta-fixture.html` öffnen.

## Reale Seitentests

Besonders wichtig bleiben DHL-Anmeldung, Mediatheken, große Nachrichtenseiten,
rebuy, React-/Angular-/Vue-Seiten, Firefox für Android und ein Screenreader-Test
der zugänglichen Attribute.

Eine Fehlermeldung sollte Browser, Version, Betriebssystem, Adresse,
Ausgangstext, Ergebnis, Erwartung, aktive Regelgruppen und reproduzierbare
Schritte enthalten. Keine Zugangsdaten oder privaten Inhalte mitsenden.
