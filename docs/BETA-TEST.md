# Sprachverstand 0.5.5 – Beta 10 testen

Beta 10 bündelt den aktuellen geprüften Stand mit den README-Live-Beispielen
und dem freigegebenen SV-Monogramm. Die drei statischen PNG-Dateien werden beim
Build unverändert übernommen und vor jedem Paketbau vollständig validiert.

## Enthaltene Pakete

- `sprachverstand-0.5.5-beta.10-chromium.zip`
- `sprachverstand-0.5.5-beta.10-firefox.xpi`
- `sprachverstand-0.5.5-beta.10-source.zip`
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

### Firefox und Waterfox

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** wählen.
3. Die Firefox-XPI oder `dist/firefox/manifest.json` auswählen.

## Popup und Symbol

Prüfen:

- Das Popup öffnet sofort ungefähr 384 Pixel breit und mit normaler Höhe.
- Jede Regelgruppe zeigt nur einen Beispielausdruck.
- Die Gruppen sind kompakt durch Trennlinien statt einzelner Karten getrennt.
- Der Scrollbalken sitzt direkt am rechten Rand.
- Browserleiste, Popup, Einstellungsseite und README zeigen dasselbe freigegebene
  SV-Monogramm: dunkelblaues, abgerundetes Quadrat mit weißem S und orangem V.
- Das Motiv ist in 32, 48 und 128 Pixeln vollständig sichtbar und nicht
  abgeschnitten.
- Symbol, Popup und Einstellungsseite funktionieren im hellen und dunklen Modus.
- Alle zwölf Regelgruppen lassen sich schalten.
- Der Korrekturzähler folgt Änderungen ohne Neuladen.

## README-Live-Test

Die Vergleichstabelle auf der GitHub-Startseite bleibt absichtlich unverändert,
weil ihre Beispiele als Quellcode markiert sind. Der darunterliegende
**Live-Test** ist normaler Seitentext und muss bei aktiviertem Sprachverstand
umgewandelt werden.

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

Auf dem Gerät zusätzlich Touch-Bedienung, Scrollbarkeit, Safe Areas,
Bildschirmtastatur und Optionsseite prüfen.

## Kernfälle

```text
Studierende                    → Studenten
Lesende                        → Leser
Arbeitnehmende                 → Arbeitnehmer
Arbeitgebende                  → Arbeitgeber
Dozierende                     → Dozenten
Fördergebende                  → Förderer
Theatermachende                → Theatermacher
mitarbeitende Personen         → mitarbeiter

Juden_Jüdinnen                 → Juden
Jüd*innen                      → Juden
Jüdinnen und Juden             → Juden
Gegner*innenschaft             → Gegnerschaft
Professor*innenschaft          → Professorenschaft
Verbündete_r                   → Verbündeter
Pat*in                         → Pate
Dirigent*innen                 → Dirigenten
Solist*innenraum               → Solistenraum
Pförtner*innen                 → Pförtner
Spender*innen                  → Spender
Tonmeister*innen               → Tonmeister
```

Die vorhandenen Fälle müssen weiterhin funktionieren, insbesondere:

```text
Nutzer:innen                   → Nutzer
PolitikerInnen                 → Politiker
Ärzt:innen                     → Ärzte
Student*innen                  → Studenten
Bauern_Bäuerinnen              → Bauern
Koch/Köchin                    → Koch
jede:r Nutzer:in               → jeder Nutzer
Professor/-in                  → Professor
Sehr geehrte Mitarbeitende     → Sehr geehrte Mitarbeiter
Benutzungshandbuch             → Benutzerhandbuch
```

`Benutzungshandbuch → Benutzerhandbuch` gehört weiterhin zur standardmäßig
deaktivierten Gruppe **Kontextgebundene Umschreibungen**.

## Partizip-Sicherheitsfälle

Die ausgewählten substantivischen Formen werden ersetzt. Grammatisch anders
verwendete Partizipien müssen dagegen unverändert bleiben:

```text
Die Mitarbeitenden arbeiten.
Die seit Stunden Forschenden ruhen.
Eine Studierende wartet.
Die Lesende macht eine Pause.
lesende Kinder
Lesende Kinder öffnen das Buch.
```

## Terminologische Sterne bewusst unverändert

Diese Schreibweisen sind keine Endungen `*in` oder `*innen` und dürfen nicht
mechanisch verändert werden:

```text
trans* Personen
inter* Personen
Inter*feindlichkeit
Inter*diskriminierung
```

Ebenfalls bewusst unverändert:

```text
Politikerinnen
Testpersonen
Besuch der ärztlichen Sprechstunde
Sehr geehrte Persönlichkeiten
Liebes Kollegium
zehn Zuhörer*inne
```

## Regelgruppen und Wiederherstellung

Zehn Gruppen sind standardmäßig aktiv. Deaktiviert bleiben zunächst:

- **Kontextgebundene Umschreibungen**
- **Geschlechtszusätze in Stellenanzeigen**

Jede Gruppe einzeln ausschalten. Nur ihre eigenen Änderungen dürfen
zurückgesetzt werden. Beim erneuten Einschalten müssen die Texte ohne Reload
wieder verarbeitet werden.

## Anführungszeichen und Ausnahmen

Standardmäßig wird auch innerhalb von Anführungszeichen korrigiert:

```text
„Mitarbeiter/-innen“ → „Mitarbeiter“
```

Nach Deaktivierung der Zitatoption muss gelten:

```text
„Mitarbeiter/-innen“ und Mitarbeiter/-innen
→ „Mitarbeiter/-innen“ und Mitarbeiter
```

Als persönliche Ausnahme `Nutzer:innen` eintragen. Danach bleibt genau diese
Form unverändert, während `Nutzer:innenkonto` weiterhin zu `Nutzerkonto` wird.

## Zugängliche Attribute

Die Option für `alt`, `aria-label`, `aria-description` und `title` ausschalten.
Sichtbarer Text muss weiterhin korrigiert werden, diese Attribute aber nicht.

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
