# Opera Add-ons – Einreichung

**Stand: 25. August 2026**

Diese Datei ist die operative Checkliste für die erste Veröffentlichung von
Sprachverstand bei Opera Add-ons. Solange der Opera-Build vollständig mit dem
Chromium-Build übereinstimmt, wird das gemeinsame Paket
`sprachverstand-<release>-chromium.zip` verwendet. Erst bei einer tatsächlichen
Abweichung erzeugt der Release-Workflow automatisch ein eigenes
`sprachverstand-<release>-opera.zip`.

Offizielle Referenzen:

- https://help.opera.com/en/extensions/
- https://help.opera.com/en/extensions/testing/
- https://help.opera.com/en/extensions/publishing-guidelines/
- https://addons.opera.com/

Die aktuelle Opera-Version basiert auf Chromium. Opera bezeichnet Manifest V3
als neuen Standard und hat angekündigt, den eigenen Erweiterungs-Store auf MV3
auszurichten. Die öffentlich erreichbaren technischen Hilfeseiten enthalten
teilweise noch ältere Manifest-V2-Beispiele; für Sprachverstand wird deshalb
bewusst der aktuelle Chromium-/MV3-Pfad verwendet.

## Technischer Stand

- Manifest V3
- Hintergrundlogik als Service Worker
- einzige Erweiterungsberechtigung: `storage`
- Content-Script auf `<all_urls>` für die lokale Kernfunktion
- keine Opera-spezifische API erforderlich
- keine extern geladenen Skripte
- kein Remote-Code
- kein Tracking und keine Telemetrie
- deutsche und englische Lokalisierung
- eigener Opera-Build und eigene Opera-Prüfung bleiben erhalten
- der Release-Workflow vergleicht Opera und Chromium vollständig und veröffentlicht
  nur dann ein separates Opera-Paket, wenn sich die Builds tatsächlich unterscheiden

## Empfohlene Store-Angaben

**Name:** Sprachverstand

**Kategorie:** Accessibility / Barrierefreiheit, sofern diese Kategorie im
aktuellen Upload-Formular angeboten wird.

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

## Datenschutzangaben

Für die Datenschutzfragen im Opera-Portal:

- keine personenbezogenen Daten gesammelt
- keine personenbezogenen Daten verkauft
- keine Nutzungsanalyse
- keine Telemetrie
- keine Werbung
- kein Tracking
- keine Übertragung des verarbeiteten Webseiteninhalts
- Einstellungen verbleiben im lokalen Erweiterungsspeicher

## Screenshot-Plan

Opera verlangt mindestens ein kleines Werbebild mit 440×280 Pixeln. Für die
Galerie werden Screenshots mit 640×480 Pixeln beschrieben.

Empfohlene Motive:

1. Popup mit Status und Korrekturzähler
2. Detailansicht mit konkreten Ersetzungen
3. Optionsseite mit Regelgruppen und geschützten Begriffen

Mindestens ein Screenshot soll die Erweiterung in Aktion und einer ihre
Position beziehungsweise Oberfläche im Browser zeigen.

## Manueller Opera-Test

Opera verlangt ausdrücklich gründliche Tests und empfiehlt Windows und macOS
sowie niedrige und hohe Bandbreite.

1. `sprachverstand-<release>-opera.zip` entpacken, falls es im Release vorhanden
   ist; andernfalls `sprachverstand-<release>-chromium.zip` verwenden.
2. `opera:extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Load unpacked extension** wählen und den entpackten Ordner laden.
5. Popup und Optionsseite prüfen.
6. GitHub-README von Sprachverstand öffnen und den Abschnitt
   **Direkt ausprobieren** kontrollieren.
7. Erweiterung ausschalten: alle Änderungen müssen ohne Seiten-Reload
   zurückgenommen werden.
8. wieder einschalten und dynamisch nachgeladene Inhalte prüfen.
9. reale Testmatrix stichprobenartig ausführen, insbesondere Kununu, taz,
   YouTube und die große Wikipedia-Nvidia-GPU-Liste.
10. mindestens einen Durchlauf mit gedrosselter Verbindung durchführen.

## Paket für die Store-Einreichung

Die aktuelle öffentliche Opera-Dokumentation beschreibt die Einreichung über das
**Upload Extensions**-Formular, nennt auf der Publishing-Seite aber kein
eindeutiges aktuelles Dateiformat. Das bereitgestellte ZIP ist deshalb das
reproduzierbare Release- und Testartefakt. Falls das aktuelle Upload-Formular
beim Einreichen ein von Opera gepacktes CRX verlangt, den identischen geprüften
Inhalt des verwendeten ZIPs in Opera über **Pack Extension** paketieren. Es dürfen
dabei keine Quell- oder Funktionsänderungen gegenüber dem geprüften ZIP erfolgen.

## Vor der Einreichung

- [ ] `sprachverstand-<release>-opera.zip` verwenden, falls im Release vorhanden;
  andernfalls das gemeinsame `sprachverstand-<release>-chromium.zip` verwenden
- [ ] SHA256 mit `SHA256SUMS.txt` prüfen
- [ ] entpackte Version in aktuellem Opera Stable testen
- [ ] mindestens zusätzlich Windows oder macOS gegenprüfen
- [ ] einen Test mit gedrosselter Verbindung durchführen
- [ ] reale Testmatrix stichprobenartig abarbeiten
- [ ] Kategorie **Barrierefreiheit** wählen
- [ ] deutsche und englische Zusammenfassung/Beschreibung eintragen
- [ ] aktuelle Screenshots im Opera-Format hochladen
- [ ] Support-, Projekt- und Datenschutzlinks prüfen
- [ ] Einreichung erst nach vollständigem Test abschicken
