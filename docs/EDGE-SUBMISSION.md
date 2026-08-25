# Microsoft Edge Add-ons – Einreichung

**Stand: 25. August 2026**

Diese Datei ist die operative Checkliste für die erste Veröffentlichung von
Sprachverstand bei Microsoft Edge Add-ons. Solange der Edge-Build vollständig
mit dem Chromium-Build übereinstimmt, wird für beide das gemeinsame Paket
`sprachverstand-<release>-chromium.zip` verwendet. Erst bei einer tatsächlichen
Abweichung erzeugt der Release-Workflow automatisch ein eigenes
`sprachverstand-<release>-edge.zip`.

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
- eigener Edge-Build und eigene Edge-Prüfung bleiben erhalten
- der Release-Workflow vergleicht Edge und Chromium vollständig und veröffentlicht
  nur dann ein separates Edge-Paket, wenn sich die Builds tatsächlich unterscheiden

Die Edge-Dokumentation verlangt für neue Erweiterungen Manifest V3. Das
Partner Center akzeptiert das Erweiterungspaket als ZIP-Datei.

## Empfohlene Store-Angaben

**Name:** Sprachverstand

**Kategorie:** Barrierefreiheit beziehungsweise die aktuell im Partner Center
angebotene entsprechende Accessibility-Kategorie.

**Website:** https://github.com/HyperCriSiS/Sprachverstand

**Support:** https://github.com/HyperCriSiS/Sprachverstand/issues

**Datenschutz:** https://github.com/HyperCriSiS/Sprachverstand/blob/main/PRIVACY.md

**Quellcode:** https://github.com/HyperCriSiS/Sprachverstand

**Lizenz:** AGPL-3.0-or-later

## Kurzbeschreibung – Deutsch

> Entfernt typische Gender-Sonderformen aus Webseiten und stellt lesbare deutsche
> Formulierungen direkt im Browser wieder her.

## Beschreibung – Deutsch

> Sprachverstand verarbeitet den Text einer Webseite direkt im Browser und passt
> typische gegenderte Schreibweisen nach kontrollierten Regeln an. Dazu gehören
> Formen mit Doppelpunkt, Sternchen, Unterstrich und Binnen-I, Doppelnennungen sowie
> ausgewählte Partizipformen.
>
> Beispiele:
>
> - Nutzer:innen → Nutzer
> - Mitarbeiter*innen → Mitarbeiter
> - NutzerInnen → Nutzer
> - Nutzerinnen und Nutzer → Nutzer
>
> Auch dynamisch nachgeladene Inhalte können verarbeitet werden. Untertitel in
> Videos lassen sich optional berücksichtigen, sofern sie als Text im Browser
> vorliegen und nicht fest in das Video eingebrannt sind.
>
> Sprachverstand arbeitet vollständig lokal. Es werden keine Webseitentexte an
> externe Server übertragen und keine Nutzungsdaten gesammelt.
>
> Da die deutsche Sprache viele Sonderfälle besitzt, arbeitet Sprachverstand
> bewusst konservativ. Unsichere Fälle werden eher unverändert gelassen als
> möglicherweise falsch ersetzt. Eigene geschützte Begriffe und persönliche Regeln
> können ergänzt werden.

## Short description – English

> Replaces common German gender-style spellings on websites with readable forms,
> directly and locally in the browser.

## Description – English

> Sprachverstand processes webpage text directly in the browser and adjusts common
> German gender-style spellings using controlled rules. Supported patterns include
> forms using colons, asterisks, underscores and Binnen-I, paired gender forms, and
> selected participle constructions.
>
> Examples:
>
> - Nutzer:innen → Nutzer
> - Mitarbeiter*innen → Mitarbeiter
> - NutzerInnen → Nutzer
> - Nutzerinnen und Nutzer → Nutzer
>
> Dynamically loaded content can also be processed. Video subtitles can optionally
> be handled when they are exposed as text by the webpage and are not burned into
> the video itself.
>
> Sprachverstand works entirely locally. Website text is not sent to external
> servers and no usage data is collected.
>
> German contains many linguistic edge cases, so Sprachverstand intentionally uses
> conservative rules. Ambiguous cases are preferably left unchanged rather than
> replaced incorrectly. Protected terms and personal replacement rules can be
> configured by the user.

## Suchbegriffe

Das Partner Center erlaubt bis zu sieben Suchbegriffe mit jeweils höchstens
30 Zeichen. Empfohlene Reihenfolge:

1. `entgendern`
2. `Genderzeichen entfernen`
3. `Gendersternchen entfernen`
4. `Gender Doppelpunkt`
5. `Binnen I`
6. `deutsche Sprache`
7. `Text normalisieren`

Die Suchbegriffe sollen das tatsächliche Verhalten beschreiben und keine nicht
vorhandenen Funktionen versprechen.

## Berechtigungsbegründung

### `storage`

Deutsch:

> Wird ausschließlich benötigt, um die vom Nutzer gewählten Einstellungen,
> geschützten Begriffe, persönliche Regeln und seitenbezogene Konfiguration lokal
> im Browser zu speichern.

Englisch:

> Used only to store the user's selected settings, protected terms, personal rules,
> and site-specific configuration locally in the browser.

### Zugriff auf Webseiten

Deutsch:

> Sprachverstand muss den sichtbaren Text geöffneter Webseiten lesen und lokal
> verändern können. Dieser Zugriff ist die Kernfunktion der Erweiterung. Die
> verarbeiteten Inhalte verlassen den Browser nicht.

Englisch:

> Sprachverstand needs access to visible text on opened webpages in order to process
> and locally modify it. This access is the core function of the extension. The
> processed content never leaves the browser.

## Datenschutzangaben

Für die Datenschutzfragen im Partner Center:

- keine personenbezogenen Daten gesammelt
- keine personenbezogenen Daten verkauft
- keine Nutzungsanalyse
- keine Telemetrie
- keine Werbung
- kein Tracking
- keine Übertragung des verarbeiteten Webseiteninhalts
- Einstellungen verbleiben im lokalen Erweiterungsspeicher

Falls das Partner Center nach einer Datenschutzrichtlinie fragt, auf
`PRIVACY.md` verweisen. Die Antworten im Formular dürfen keine weitergehenden
Versprechen enthalten als die tatsächlich veröffentlichte Datenschutzrichtlinie.

## Zertifizierungshinweise

Falls ein Freitextfeld für Reviewer vorhanden ist, kann folgender Text verwendet
werden:

> Sprachverstand processes visible webpage text locally in the browser. No page
> content or usage data is transmitted to external services. The `storage`
> permission stores only local extension settings. To test the main function, open
> a German webpage containing forms such as `Nutzer:innen` or use the example in the
> GitHub README. The popup allows individual rule groups to be enabled or disabled,
> and the extension can be paused at any time.

## Test vor Store-Upload

Nach dem Entpacken des Release-Pakets:

1. `edge://extensions` öffnen.
2. Entwicklermodus aktivieren.
3. **Entpackte Erweiterung laden** wählen.
4. den entpackten Ordner auswählen.
5. README-Testtext und mehrere reale Webseiten testen.
6. Popup öffnen und Korrekturzähler sowie Detailansicht prüfen.
7. Optionsseite öffnen und Regelgruppen umschalten.
8. Erweiterung deaktivieren und prüfen, dass die vorgenommenen Änderungen
   wiederhergestellt werden.

Die manuelle Real-World-Matrix steht in `docs/REAL-WORLD-TEST-MATRIX.md`.

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

- [ ] `sprachverstand-<release>-edge.zip` verwenden, falls im Release vorhanden;
  andernfalls das gemeinsame `sprachverstand-<release>-chromium.zip` verwenden
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
