# Outlook-Add-in

Portierung der Thunderbird-Ausgabe auf das Office-Add-in-Modell, für das neue
Outlook (Windows), Outlook im Web und das klassische Outlook für Windows. Stand:
Entwicklung, nicht veröffentlicht, nur mit der Office-Attrappe geprüft, noch nicht
in einem echten Outlook.

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
  Thunderbird-Ausgabe.

## Verhalten

| Thunderbird | Outlook |
| --- | --- |
| Nachricht wird beim Anzeigen umgewandelt | Seitenbereich anheften. Bei jeder ausgewählten Nachricht ersetzt das Add-in die Anzeige über `item.display.body.setAsync`. Die Nachricht im Postfach bleibt unverändert. |
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
| Seitenbereich, Popup, Einstellungen | ja | ja, mit WebView2 (Microsoft 365, Outlook 2021 und neuer) |
| Leseansicht ersetzen | sobald `item.display.body` verfügbar ist, sonst Fassung im Seitenbereich | laut Berichten verfügbar, sonst Fassung im Seitenbereich |
| Antworten beim Öffnen korrigieren | ja, über den DOM-Kern | ja, ohne DOM: Text zwischen den Tags wird abschnittsweise umgewandelt; Formen über Tags hinweg (`Lehrer*<b>innen</b>`) bleiben. Es gelten Standardeinstellungen und synchronisierte Kategorien, weil die Ereignislaufzeit den Gerätespeicher nicht sieht. Windows 10 1903 oder neuer. |

Ältere Clients mit Internet-Explorer-Webview werden nicht unterstützt: Der
Regelkern braucht Unicode-Klassen in regulären Ausdrücken.

## Einschränkungen

- `item.display.body` ist bei Microsoft noch Vorschau („Do not use this API in a
  production environment“). Fehlt die API oder lehnt Outlook den Aufruf ab, zeigt
  der Seitenbereich die umgewandelte Nachricht oberhalb der Einstellungen. Diese
  Fassung lädt keine externen Bilder, Schriften oder Stile.
- Die Leseansicht wird nur umgewandelt, solange der Seitenbereich offen und
  angeheftet ist. Outlook bietet kein allgemeines Ereignis beim Öffnen einer
  Nachricht.
- Ereignisgesteuerte Add-ins starten nur nach Bereitstellung durch einen Admin oder
  mit einem unbeschränkten Eintrag im Microsoft Marketplace.
- Einstellungen, die in einem zweiten Outlook-Fenster geändert werden, übernimmt
  ein offener Seitenbereich sofort (gleiches `localStorage`). Synchronisierte
  Kategorien von anderen Geräten erst nach dem nächsten Öffnen.
- Eingebettete Bilder (`cid:`) in der ersetzten Anzeige sind ungeprüft.
- Die Domain-Schaltfläche im Popup bleibt wie in Thunderbird deaktiviert sichtbar.

## Testen

- `npx vitest run tests/outlook.test.ts`: Brücke, Speicher, Umwandlung mit und
  ohne DOM, Leseansicht, Korrektur beim Öffnen, Manifest.
- `npm run outlook:harness`: baut das Add-in und startet es unter
  `http://localhost:8765/` mit einer Office.js-Attrappe
  (`scripts/outlook-harness/mock-office.js`).
  - `popup/popup.html`, Parameter `mail=0|1|2`, `nodisplay` (ohne Anzeige-API),
    `displayfails` (Outlook lehnt die Anzeige ab), `lang=en-US`. In der Konsole
    wechselt `harness.select(1)` die Nachricht, `harness.state.displayed` zeigt die
    ersetzten Anzeigen.
  - `launchevent.html`: `await harness.compose("reply", "html", false)` simuliert
    `OnNewMessageCompose`; `false` entfernt den DOM wie im klassischen Outlook.
    Vorher die Option in den Einstellungen einschalten.

## In Outlook testen

1. `npm run build:outlook`
2. `dist/outlook/` per HTTPS unter `https://localhost:3000/` bereitstellen.
3. Neues Outlook oder Outlook im Web: „Add-Ins abrufen“ → „Meine Add-Ins“ →
   „Benutzerdefiniertes Add-In hinzufügen“ → `dist/outlook/manifest.xml`.
   Klassisches Outlook: „Datei“ → „Add-Ins verwalten“ öffnet dieselbe Seite.
4. Eine Nachricht mit Genderzeichen öffnen, „Sprachverstand“ wählen, Seitenbereich
   anheften und weitere Nachrichten auswählen.
