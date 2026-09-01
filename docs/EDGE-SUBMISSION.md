# Microsoft Edge Add-ons – Einreichung

**Stand: 25. August 2026**

Diese Datei ist die operative Checkliste für die erste Veröffentlichung von
Sprachverstand bei Microsoft Edge Add-ons. Das einzureichende Paket wird vom
Release-Workflow als `sprachverstand-<release>-edge.zip` erzeugt.

Offizielle Referenzen:

- https://learn.microsoft.com/microsoft-edge/extensions/publish/publish-extension
- https://learn.microsoft.com/microsoft-edge/extensions/getting-started/manifest-format
- https://learn.microsoft.com/microsoft-edge/extensions/publish/create-dev-account

## Technischer Stand

- Manifest V3
- Hintergrundlogik als Service Worker
- einzige Erweiterungsberechtigung: `storage`
- Content-Script auf `<all_urls>` für die Kernfunktion der lokalen Textanpassung
- keine extern geladenen Skripte
- kein Remote-Code
- kein Tracking und keine Telemetrie
- deutsche und englische Lokalisierung im Paket
- eigenes Edge-Artefakt, obwohl der ausführbare Inhalt bewusst mit dem
  Chromium-Build übereinstimmt
- CI prüft, dass Edge und Chromium außerhalb von `manifest.json` bytegleich
  gebaut werden

Die Edge-Dokumentation verlangt für neue Erweiterungen Manifest V3. Das
Partner Center akzeptiert das Erweiterungspaket als ZIP-Datei.

## Empfohlene Store-Angaben

**Name:** Sprachverstand

**Kategorie:** Barrierefreiheit beziehungsweise die aktuell im Partner Center
angebotene entsprechende Accessibility-Kategorie.

**Website:** https://github.com/HyperCriSiS/Sprachverstand

**Support:** https://github.com/HyperCriSiS/Sprachverstand/issues

**Datenschutz:** https://github.com/HyperCriSiS/Sprachverstand/blob/main/PRIVACY.md

**Ausgereifte Inhalte:** Nein.

### Deutsch – Kurzbeschreibung

> Passt gegenderte Schreibweisen lokal im Browser an persönliche Lesegewohnheiten an – ohne Tracking, Telemetrie oder eigene Cloud.

### Deutsch – Beschreibung

Sprachverstand passt gegenderte deutsche Webseitentexte lokal an persönliche
Lesegewohnheiten an.

Schreibweisen wie „Nutzer:innen“, „Mitarbeiter*innen“, „NutzerInnen“,
Doppelnennungen, substantivierte Adjektive und ausgewählte Partizipformen werden
direkt im Browser nach kontrollierten Regeln angepasst. Regelgruppen lassen sich
einzeln aktivieren oder deaktivieren.

Die aufgerufene Webseite und ihre Serverdaten werden nicht verändert.
Sprachverstand passt ausschließlich die lokale Darstellung auf dem eigenen Gerät
an. Beim Ausschalten werden die vorgenommenen Änderungen ohne Neuladen
zurückgesetzt.

Zusätzlich bietet Sprachverstand persönliche Ausnahmen, eigene wörtliche
Ersetzungen, Live-Vorschau und Konflikthinweise, JSON-Import und -Export,
optionale Browser-Synchronisierung pro Datenkategorie, Domain-Ausschlüsse,
optionale Untertitelkorrektur und die optionale Verarbeitung zugänglicher
Textattribute.

Die gesamte Textverarbeitung erfolgt lokal im Browser. Webseitentexte,
Browserverläufe und Nutzungsdaten werden nicht an den Entwickler übertragen.
Sprachverstand verwendet keine eigene Cloud, keine externe Sprach-API, kein
Tracking, keine Telemetrie und keine Werbung.

### Englisch – Kurzbeschreibung

> Normalizes selected gendered forms in German website text locally in your browser, with configurable rules and no tracking or telemetry.

### Englisch – Beschreibung

Sprachverstand makes German websites easier to read by normalizing selected
gendered forms directly in the browser. It can help readers who prefer
conventional grammatical forms and people learning German who find forms such as
the gender colon, gender asterisk, Binnen-I or double forms harder to parse.

Rule groups can be enabled or disabled separately. Personal exceptions, literal
custom replacements, JSON backup and restore, optional per-category browser
synchronization, domain exclusions, optional subtitle handling and accessible
text attributes are included.

All website-text processing happens locally. Sprachverstand does not send
website text, browsing history or usage data to the developer and does not use
an external language service, tracking, telemetry or advertising.

## Suchbegriffe

Microsoft erlaubt derzeit bis zu sieben Suchbegriffe mit zusammen höchstens
21 Wörtern; jeder Suchbegriff darf höchstens 30 Zeichen haben.

### Deutsch

1. `Gendern`
2. `Entgendern`
3. `Gendersprache`
4. `Gendersternchen`
5. `Gender-Doppelpunkt`
6. `deutsche Sprache`
7. `Lesbarkeit`

### Englisch

1. `German gender language`
2. `German readability`
3. `gender star`
4. `gender colon`
5. `German text`
6. `accessibility`
7. `reading aid`

## Datenschutzformular

### Einzelner Zweck

> Sprachverstand passt unterstützte gegenderte Schreibweisen in deutschsprachigen
> Webseitentexten lokal und nach konfigurierbaren Regeln an die persönlichen
> Lesegewohnheiten des Nutzers an.

### Berechtigung `storage`

> Die Speicherberechtigung wird benötigt, um den Einstellungsstand lokal im
> Browser zu speichern. Optional kann der Nutzer einzelne Kategorien über den
> standardisierten Synchronisierungsdienst des Browsers synchronisieren.
> Standardmäßig ist keine Synchronisierungskategorie aktiviert.

### Zugriff auf Webseiten

> Sprachverstand muss den sichtbaren Text der vom Nutzer aufgerufenen Webseiten
> lesen und lokal verändern können, um unterstützte Schreibweisen zu erkennen und
> ihre Darstellung anzupassen. Webseiteninhalte werden nicht an den Entwickler
> übertragen und nicht dauerhaft gespeichert.

### Remote-Code

**Antwort:** Nein.

> Der gesamte ausführbare Code ist im Erweiterungspaket enthalten. Es werden
> keine extern gehosteten Skripte oder andere ausführbare Codebestandteile
> nachgeladen.

### Datennutzung

- Webseitentext wird nur lokal und flüchtig verarbeitet.
- Die aktuelle Domain wird lokal für Domain-Ausschlüsse und Tab-Zuordnung
  verwendet.
- Einstellungen bleiben standardmäßig lokal.
- Nur ausdrücklich ausgewählte Einstellungskategorien können über den
  Synchronisierungsdienst des Browsers übertragen werden.
- Keine Daten werden an den Entwickler verkauft oder für Werbung,
  Profilbildung, Kreditwürdigkeit oder andere fremde Zwecke verwendet.

## Zertifizierungshinweise

Diesen Text in das Feld für Zertifizierungshinweise übernehmen:

> Sprachverstand benötigt kein Testkonto und keine Anmeldung. Nach der
> Installation kann die Erweiterung auf jeder deutschsprachigen Webseite getestet
> werden. Ein reproduzierbarer Test steht im öffentlichen Repository:
> https://github.com/HyperCriSiS/Sprachverstand
>
> Im Abschnitt „Direkt ausprobieren“ steht normaler Webseitentext mit
> „Mitarbeiter*innen“, „Nutzer:innen“, „Student*innen“, „Jede:r Nutzer:in“,
> „Studierende“ und „Arbeitnehmende“. Bei aktivierter Erweiterung werden die
> unterstützten Formen lokal angepasst. Das Popup zeigt die Anzahl der
> Korrekturen; über „Anzeigen“ kann die temporäre Übersicht der tatsächlich
> vorgenommenen Ersetzungen geöffnet werden.
>
> Die Verarbeitung erfolgt ausschließlich lokal. Es gibt keinen Remote-Code,
> keine externe Sprach-API, kein Tracking und keine Telemetrie. `storage` wird
> für Einstellungen und die optional vom Nutzer aktivierbare
> Browser-Synchronisierung verwendet.

## Store-Grafiken

Für den Edge-Eintrag vorbereiten:

- Logo: vorhandenes 128×128-PNG erfüllt die Mindestgröße; Microsoft empfiehlt
  300×300 Pixel.
- bis zu sechs Screenshots
- zulässige Screenshotgrößen: 640×480 oder 1280×800 Pixel
- sinnvoller Satz:
  1. Popup mit Seitenstatus und Korrekturzähler
  2. Detailansicht der tatsächlichen Ersetzungen
  3. erweiterte Einstellungen und Regelgruppen

## Vor der Einreichung

- [ ] neuestes `sprachverstand-<release>-edge.zip` verwenden
- [ ] SHA256 mit `SHA256SUMS.txt` prüfen
- [ ] Paket in Microsoft Edge über `edge://extensions` als entpackte Erweiterung testen
- [ ] Popup, Detailansicht, Optionsseite und Wiederherstellung beim Ausschalten testen
- [ ] reale Testmatrix mindestens stichprobenartig in Edge ausführen
- [ ] deutsche und englische Storetexte eintragen
- [ ] Suchbegriffe eintragen
- [ ] Datenschutzangaben mit `PRIVACY.md` abgleichen
- [ ] aktuelle Screenshots hochladen
- [ ] Zertifizierungshinweise eintragen
- [ ] erst danach zur Zertifizierung übermitteln
