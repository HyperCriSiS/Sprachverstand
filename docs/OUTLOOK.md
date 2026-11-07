# Outlook-Add-in

Portierung der Thunderbird-Ausgabe auf das Office-Add-in-Modell, für das neue
Outlook (Windows), Outlook im Web und das klassische Outlook für Windows. Stand:
Entwicklung, nicht veröffentlicht. Am 07.11.2026 in Office LTSC 2024
(klassisches Outlook) und der neuen Outlook-App unter Windows 11 mit einem
Outlook.com-Konto geprüft: Lesen klappt in beiden, die Korrektur beim Antworten
ist noch ungeprüft.

Die Outlook-Ausgabe lebt wie `thunderbird` und `palemoon` auf dem geschützten
Branch `outlook` (Änderungen nur per Pull Request mit Squash, Pflichtprüfung
„Outlook-Prüfung“ aus `.github/workflows/outlook.yml`).

## Aufbau

- `npm run build:outlook` baut nach `dist/outlook/`. Mit
  `-- --base-url https://example.org/sprachverstand/` werden alle URLs im Manifest
  auf den späteren HTTPS-Speicherort gesetzt (Standard: `https://localhost:3000/`).
- `manifests/outlook.xml` ist die Manifestvorlage (Add-in-only-Manifest, wie im
  Microsoft-Beispiel für ereignisbasierte Add-ins).
- `src/outlook/extension-shim.ts` stellt im Seitenbereich die WebExtension-API
  bereit, die Popup und Einstellungsseite nutzen. Beide Seiten laufen dadurch
  unverändert.
- `src/outlook/reader.ts` entspricht dem Nachrichtenskript der Thunderbird-Ausgabe.
- `src/outlook/launchevent.ts` entspricht `compose-background.ts` der
  Thunderbird-Ausgabe. Ohne DOM (klassisches Outlook) setzt
  `src/outlook/dom-without-browser.ts` linkedom ein, damit derselbe DOM-Kern wie
  in Thunderbird läuft. Wie ein Browser liest es Word-Bedingungen
  (`<![if !vml]>`) als Kommentare, fügt Textknoten zusammen und maskiert
  Attributwerte. `src/outlook/runtime-globals.ts` ergänzt atob, performance und
  queueMicrotask; Intl nur beim Laden, Timer nur im Dokument.
- Der Seitenbereich lädt die Beta-Fassung von Office.js: Nur sie reicht
  `item.display.body` an Outlook weiter, die stabile wirft „The feature
  setUIAsync, is only enabled on the beta api endpoint“. Microsoft rät von Beta
  in der Produktion ab; vor einer Store-Einreichung neu bewerten. Einstellungen
  und Ereignisdatei nutzen die stabile Fassung.
- Die Manifestversion ist `1.` plus Paketversion (0.9.3 wird 1.0.9.3), weil
  Microsoft Versionen unter 1.0 ablehnt.

## Verhalten

| Thunderbird | Outlook |
| --- | --- |
| Nachricht wird beim Anzeigen umgewandelt | Seitenbereich anheften. Bei jeder ausgewählten Nachricht ersetzt das Add-in die Anzeige über `item.display.body.setAsync`. Die Nachricht im Postfach bleibt unverändert. |
| Nachricht wird beim Anzeigen umgewandelt (neue Outlook-App) | Die neue App ersetzt die Anzeige nicht. Der Seitenbereich zeigt dann den Button „Korrigiert lesen“, der die umgewandelte Nachricht in einem eigenen Fenster (Office-Dialog, 60 × 85 % des Bildschirms) öffnet. Das Fenster lädt nichts von außen. Lässt es sich nicht öffnen, steht der Grund unter dem Button. |
| Symbol mit Zähler, Popup mit Ersetzungsliste | Schaltfläche „Sprachverstand“ in der Leseansicht öffnet den Seitenbereich mit demselben Popup. Ein Zähler am Symbol ist in Outlook nicht möglich. |
| Einstellungsseite in eigenem Tab | Einstellungsseite im selben Seitenbereich, „Zurück“ führt zum Popup. |
| Antworten und Weiterleitungen beim Öffnen korrigieren (optional) | Gleiche Option, über das Ereignis `OnNewMessageCompose`. Der ganze Verlauf wird umgewandelt (`bodyMode: FullBody`). Ändert Outlook den Text inzwischen (etwa durch die Signatur), bleibt er unverändert. |

## Speicher

- `storage.local` (alle Einstellungen) liegt im `localStorage` des Add-ins und
  bleibt auf dem Gerät.
- `storage.sync` liegt in den Roaming-Einstellungen des Postfachs (gemeinsam rund
  32 KB). Dorthin gehen nur die in „Browser-Synchronisierung“ gewählten Kategorien
  und der Schalter „Antworten und Weiterleitungen beim Öffnen korrigieren“.
  Schlägt das Speichern fehl, bleibt der alte Stand erhalten.

## Neues und klassisches Outlook

| | Neues Outlook, Outlook im Web | Klassisches Outlook für Windows |
| --- | --- | --- |
| Seitenbereich, Popup, Einstellungen | ja | ja, mit WebView2 |
| Schaltfläche | nur unter „Apps“; einzelne Add-ins lassen sich nicht ins Menüband holen | direkt im Menüband |
| Leseansicht ersetzen | nein: Outlook meldet den Aufruf erst nach etwa einer Minute als fehlgeschlagen, es gilt das Lesefenster (geprüft 07.11.2026) | ja: die Nachricht lädt kurz neu und erscheint korrigiert, beim Ausschalten wieder im Original (geprüft in LTSC 2024) |
| Antworten beim Öffnen korrigieren | ja, über den DOM-Kern | ja, über denselben DOM-Kern mit linkedom, also auch über Tags hinweg (`Lehrer*<b>innen</b>`). Es gelten Standardeinstellungen und synchronisierte Kategorien, weil die Ereignislaufzeit den Gerätespeicher nicht sieht. Version 2403 oder neuer (ältere Builds kennen in Ereignissen nur ES2016), Windows 10 1903 oder neuer. Outlook LTSC 2021 (Version 2108) reicht daher nicht. Kern und linkedom nutzen APIs bis ES2023 (`Object.hasOwn`, `findLast`); dass die Laufzeit sie hat, ist nur für V8 belegt. |

Ältere Clients mit Internet-Explorer-Webview werden nicht unterstützt: Der
Regelkern braucht Unicode-Klassen in regulären Ausdrücken.

## Einschränkungen

- `item.display.body` ist bei Microsoft noch Vorschau („Do not use this API in a
  production environment“). Fehlt die API oder lehnt Outlook den Aufruf ab, bietet
  der Seitenbereich das Lesefenster an. Es lädt keine externen Bilder, Schriften
  oder Stile.
- Lehnt Outlook die Anzeige-API ab, schreibt der Seitenbereich den Grund als
  Warnung „Outlook hat die Anzeige nicht ersetzt“ in die Konsole.
- Ein Seitenbereich kann nur ein Lesefenster zugleich öffnen; ein zweiter Klick
  bei offenem Fenster meldet Fehler 12007 unter dem Button.
- Die Leseansicht wird nur umgewandelt, solange der Seitenbereich offen und
  angeheftet ist. Outlook bietet kein allgemeines Ereignis beim Öffnen einer
  Nachricht.
- Ereignisgesteuerte Add-ins starten nur nach Bereitstellung durch einen Admin oder
  mit einem unbeschränkten Eintrag im Microsoft Marketplace.
- Einstellungen, die in einem zweiten Outlook-Fenster geändert werden, übernimmt
  ein offener Seitenbereich sofort (gleiches `localStorage`). Synchronisierte
  Kategorien von anderen Geräten erst nach dem nächsten Öffnen.
- Eingebettete Bilder: Outlook liefert sie im HTML als `cid:`-Verweis (klassisch
  schon immer, neu und Web seit Ende 2025). In der ersetzten Anzeige bleiben die
  Verweise stehen; ob Outlook sie dort auflöst, ist nicht dokumentiert und
  ungeprüft. Das Lesefenster setzt die Bilder aus den Anhängen als
  `data:`-URL ein (`contentId`, Mailbox 1.16, und `getAttachmentContentAsync`,
  Mailbox 1.8). Ältere Abruf-URLs von Outlook im Web blockiert sie wie alle
  externen Inhalte.
- Die ersetzte Anzeige ist auf 1 000 000 Zeichen begrenzt; längere Nachrichten
  zeigt das Lesefenster.
- Die Domain-Schaltfläche im Popup bleibt wie in Thunderbird deaktiviert sichtbar.

## Testen

- `npx vitest run tests/outlook.test.ts`: Brücke, Speicher, Umwandlung,
  Leseansicht samt Sperre der stabilen Office.js und eingebetteter Bilder,
  Korrektur beim Öffnen, Manifest. Ein Test baut die Ereignisdatei und führt sie
  in einem leeren JavaScript-Kontext aus (nur `Office` und `console`, ohne DOM,
  Timer, URL und Intl, einmal mit Timern, die `globalThis` als `this`
  verlangen), wie die Ereignislaufzeit des klassischen Outlook. Das Ergebnis muss
  dem des Browser-DOM entsprechen.
- `npx office-addin-manifest validate dist/outlook/manifest.xml`: offizielle
  Prüfung über den Onlinedienst von Microsoft, auch in der Outlook-Prüfung. Mit
  `-p` (Store-Regeln) und einer öffentlichen `--base-url` bleiben nur die
  Erreichbarkeit der Symbole und damit die echte Bereitstellung offen. Fällt der
  Dienst aus, schlägt die Outlook-Prüfung fehl.
- `npm run outlook:harness`: baut das Add-in und startet es unter
  `http://localhost:8765/` mit einer Office.js-Attrappe
  (`scripts/outlook-harness/mock-office.js`).
  - `popup/popup.html`, Parameter `mail=0|1|2|3` (3 mit eingebettetem Bild),
    `nodisplay` (ohne Anzeige-API), `displayfails` (Outlook lehnt die Anzeige
    ab), `stableoffice` (Anzeige-API wirft wie in der stabilen Office.js),
    `displayhangs` (Anzeige-API antwortet nicht, wie in der neuen Outlook-App),
    `nodialogapi` (ohne DialogApi 1.2), `dialogfails` (Outlook öffnet das
    Lesefenster nicht, 12009),
    `lang=en-US`. In der Konsole
    wechselt `harness.select(1)` die Nachricht, `harness.state.displayed` zeigt die
    ersetzten Anzeigen. „Korrigiert lesen“ zeigt das Lesefenster als Rahmen über
    der Seite; `harness.closeDialog()` schließt es wie das X.
  - `launchevent.html`: `await harness.compose("reply", "html", false)` simuliert
    `OnNewMessageCompose`; `false` entfernt den DOMParser, die Ereignisdatei
    setzt dann linkedom ein.
    Vorher die Option in den Einstellungen einschalten.

## In Outlook testen

Jeder Push auf `outlook` stellt den Build nach bestandener Prüfung unter GitHub
Pages bereit (Job „Outlook-Bereitstellung“). Ein eigener Server oder ein
Zertifikat ist nicht nötig.

1. Das Manifest herunterladen:
   <https://hypercrisis.github.io/Sprachverstand/manifest.xml>
2. Neues Outlook oder Outlook im Web: „Add-Ins abrufen“ → „Meine Add-Ins“ →
   „Benutzerdefiniertes Add-In hinzufügen“ → „Aus Datei hinzufügen“ → die Datei
   wählen. Klassisches Outlook: „Datei“ → „Add-Ins verwalten“ öffnet dieselbe
   Seite. Das Add-in gilt danach für alle Outlook-Fassungen desselben Kontos.
3. Eine Nachricht mit Genderzeichen öffnen, „Sprachverstand“ wählen, Seitenbereich
   anheften und weitere Nachrichten auswählen.
4. In der neuen App: im Seitenbereich „Korrigiert lesen“ wählen; die Nachricht
   öffnet sich korrigiert in einem eigenen Fenster.
5. Beim Antworten: Option in den Einstellungen einschalten und auf eine Nachricht
   mit Genderzeichen antworten.

Zu prüfen sind das klassische Outlook (ab 2403, z. B. Office LTSC 2024), die
neue Outlook-App und Outlook im Web. Für eine lokale Entwicklungsfassung
`npm run build:outlook -- --base-url <HTTPS-Adresse>` bauen und `dist/outlook/`
unter dieser Adresse bereitstellen.
