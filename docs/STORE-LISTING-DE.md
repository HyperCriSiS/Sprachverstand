# Storetexte für Sprachverstand

**Stand: 28. Juli 2026**

Diese Datei ist die versionierte deutschsprachige Quelle für die Einträge bei
Firefox Add-ons und im Chrome Web Store. Storetexte, Berechtigungsbegründungen
und Datenschutzangaben müssen bei jeder Änderung an Funktionen, Berechtigungen
oder Datenverarbeitung gemeinsam geprüft werden.

Die öffentliche Datenschutzerklärung steht in [`PRIVACY.md`](../PRIVACY.md).

## Gemeinsame Angaben

**Name:** Sprachverstand

**Leitsatz:** Macht Webseiten leichter lesbar.

**Kurzbeschreibung:**

> Passt gegenderte Schreibweisen lokal im Browser an persönliche Lesegewohnheiten an – ohne Cloud, Tracking oder Telemetrie.

**Einzelzweck:**

> Sprachverstand passt unterstützte gegenderte Schreibweisen in
> deutschsprachigen Webseitentexten lokal und nach konfigurierbaren Regeln an die
> persönlichen Lesegewohnheiten des Nutzers an.

## Firefox Add-ons

**Empfohlene Kategorie:** Sprachunterstützung

### Ausführliche Beschreibung

Sprachverstand passt die Darstellung deutschsprachiger Webseitentexte an Deine
persönlichen Lesegewohnheiten an.

Gegenderte Schreibweisen wie „Nutzer:innen“, „Mitarbeiter*innen“, „NutzerInnen“,
Doppelnennungen, substantivierte Adjektive und ausgewählte Partizipformen werden
direkt im Browser nach kontrollierten Regeln angepasst.

Beispiele:

- Nutzer:innen → Nutzer
- Mitarbeiter*innen → Mitarbeiter
- NutzerInnen → Nutzer
- NutzerIn → Nutzer
- eine NutzerIn → ein Nutzer
- Nutzerinnen und Nutzer → Nutzer
- Student*innen → Studenten
- Studierende → Studenten
- Erwachsene:r → Erwachsener
- Studentys → Studenten

Die Webseite selbst und ihre Serverdaten bleiben unverändert. Sprachverstand
verändert ausschließlich die lokale Darstellung im Browser. Beim Ausschalten
werden die vorgenommenen Änderungen ohne Neuladen rückgängig gemacht.

Funktionen:

- Verarbeitung normaler und dynamisch nachgeladener Webseiteninhalte
- vollständige Wiederherstellung beim Ausschalten
- einzeln aktivierbare Regelgruppen
- Korrekturzähler für den aktuellen Tab
- persönliche Ausnahmen für Wörter und vollständige Formulierungen
- eigene wörtliche Ersetzungen, getrennt von Ausnahmen und ohne Regex
- Live-Vorschau und Konflikthinweise vor dem Speichern eigener Regeln
- lokaler JSON-Import und -Export persönlicher Ausnahmen und Ersetzungen
- drei wählbare Strategien für Zielkonflikte beim Import
- Ausschluss einzelner Domains
- optionaler Schutz von Texten in Anführungszeichen
- optionale Verarbeitung von `alt`, `aria-label`, `aria-description` und `title`
- Schutz von Eingabefeldern, Editoren, Quellcode, URLs und technischen Daten

Sprachverstand arbeitet bewusst konservativ. Unbekannte oder mehrdeutige
Schreibweisen bleiben unverändert, wenn keine ausreichend sichere Ersetzung
möglich ist. Eigene Ersetzungen werden genau einmal und ausschließlich lokal
ausgeführt; persönliche Ausnahmen haben Vorrang.

Datenschutz:

- Verarbeitung ausschließlich lokal im Browser
- keine Übertragung von Webseitentexten oder aufgerufenen Adressen
- keine Cloud und keine externe Sprach-API
- kein Tracking und keine Telemetrie
- keine Werbung und keine Nutzerprofile
- Einstellungen, Ausnahmen und eigene Ersetzungen bleiben im Browser
- Importdateien werden nur nach bewusster Auswahl lokal gelesen
- Exportdateien werden lokal erzeugt und nicht hochgeladen

Unterstützt werden Firefox für Desktop und Firefox für Android.

### Firefox-Datenerfassung

Für `browser_specific_settings.gecko.data_collection_permissions` gilt:

```json
{
  "required": ["none"]
}
```

Begründung: Sprachverstand sammelt oder überträgt keine Daten zur Verarbeitung
außerhalb der Erweiterung oder des lokalen Browsers.

## Chrome Web Store

**Empfohlene Kategorie:** Barrierefreiheit

### Ausführliche Beschreibung

Sprachverstand passt gegenderte deutsche Webseitentexte lokal an Deine
persönlichen Lesegewohnheiten an.

Schreibweisen wie „Nutzer:innen“, „Mitarbeiter*innen“, „NutzerInnen“, sichtbare
Binnen-I-Singularformen, Doppelnennungen, substantivierte Adjektive und
ausgewählte Partizipformen werden direkt im Browser nach kontrollierten Regeln
angepasst.

Beispiele:

- Nutzer:innen → Nutzer
- Mitarbeiter*innen → Mitarbeiter
- NutzerInnen → Nutzer
- NutzerIn → Nutzer
- eine NutzerIn → ein Nutzer
- Nutzerinnen und Nutzer → Nutzer
- jede:r Nutzer:in → jeder Nutzer
- Student*innen → Studenten
- Studierende → Studenten
- Erwachsene:r → Erwachsener
- Studentys → Studenten

Die aufgerufene Webseite und ihre Serverdaten werden nicht verändert.
Sprachverstand passt ausschließlich die Darstellung auf Deinem Gerät an. Beim
Ausschalten werden die vorgenommenen Änderungen ohne Neuladen vollständig
rückgängig gemacht.

Wichtige Funktionen:

- automatische Verarbeitung beim Laden einer Webseite
- Unterstützung dynamisch nachgeladener Inhalte
- einzeln aktivierbare Regelgruppen
- Korrekturzähler für den aktuellen Tab
- persönliche Wort- und Phrasenausnahmen
- eigene wörtliche Ersetzungen ohne Regex
- Live-Vorschau und Konflikthinweise für eigene Regeln
- lokaler JSON-Import und -Export persönlicher Einträge
- ausdrücklich wählbare Importstrategie bei Zielkonflikten
- Ausschluss bestimmter Domains
- optionaler Schutz zitierter Schreibweisen
- optionale Verarbeitung zugänglicher Textattribute
- Schutz von Eingabefeldern, Editoren, URLs und Quellcode

Sprachverstand arbeitet bewusst vorsichtig: Unbekannte oder mehrdeutige Formen
werden lieber unverändert gelassen als möglicherweise falsch ersetzt.

Die gesamte Textverarbeitung erfolgt lokal im Browser. Es werden keine
Webseitentexte, Adressen, Einstellungen oder Nutzungsdaten an den Entwickler
oder andere Anbieter übertragen. Sprachverstand verwendet keine Cloud-Dienste,
keine externe Sprach-API, kein Tracking, keine Telemetrie und keine Werbung.
Importdateien werden nur nach einer bewussten Dateiauswahl lokal gelesen;
Exportdateien werden lokal erzeugt.

## Chrome Web Store – Datenschutzformular

### Einzelzweck

> Sprachverstand passt unterstützte gegenderte Schreibweisen in
> deutschsprachigen Webseitentexten lokal und nach konfigurierbaren Regeln an die
> persönlichen Lesegewohnheiten des Nutzers an.

### Begründung der Berechtigung `storage`

> Die Speicherberechtigung wird ausschließlich benötigt, um die vom Nutzer
> gewählten Einstellungen, aktivierten Regelgruppen, persönlichen Textausnahmen,
> eigenen wörtlichen Ersetzungen und ausgeschlossenen Domains lokal im Browser
> zu speichern.

### Begründung des Zugriffs auf alle Webseiten

> Sprachverstand muss den sichtbaren Text auf den vom Nutzer aufgerufenen
> Webseiten lesen und lokal verändern können, um unterstützte Schreibweisen zu
> erkennen und ihre Darstellung anzupassen. Der Zugriff wird ausschließlich für
> diese Kernfunktion verwendet. Webseiteninhalte werden nicht übertragen oder
> dauerhaft gespeichert.

### Import und Export persönlicher Regeln

> Persönliche Ausnahmen und eigene Ersetzungen können auf ausdrückliche
> Nutzeraktion als JSON-Datei lokal exportiert oder über den Dateiauswahldialog
> lokal importiert werden. Hierfür wird keine zusätzliche Netzwerk- oder
> Dateisystemberechtigung verwendet. Die Dateien werden nicht übertragen.

### Remote-Code

> Nein. Die Erweiterung lädt oder führt keinen extern bereitgestellten Code aus.
> Der gesamte ausführbare Code ist im Erweiterungspaket enthalten.

### Lokal verarbeitete Datenarten

**Website-Inhalte und Ressourcen**

> Sichtbare Webseitentexte und optional zugängliche Textattribute werden lokal
> verarbeitet, um die Darstellung anzupassen. Die Inhalte werden nicht an den
> Entwickler oder Dritte übertragen und nicht dauerhaft gespeichert.

**Web-Browsing-Aktivität**

> Die Adresse beziehungsweise Domain der aktuell geöffneten Seite wird lokal
> verwendet, um die Erweiterung auszuführen, persönliche Domain-Ausschlüsse zu
> berücksichtigen und den Status dem richtigen Tab zuzuordnen. Es wird kein
> Browserverlauf erstellt, gespeichert oder übertragen.

**Vom Nutzer bereitgestellte Einstellungen**

> Regelgruppen, persönliche Textausnahmen, eigene wörtliche Ersetzungen und
> Domain-Ausschlüsse werden lokal im Erweiterungsspeicher gespeichert und
> ausschließlich für die gewählte Konfiguration verwendet. Bei einem bewusst
> ausgelösten Export werden nur persönliche Ausnahmen und eigene Ersetzungen in
> eine lokale JSON-Datei geschrieben.

### Eingeschränkte Datennutzung

- Die Datenverarbeitung ist auf die beschriebene Kernfunktion beschränkt.
- Daten werden nicht verkauft oder an Dritte übertragen.
- Daten werden nicht für Werbung oder Profilbildung verwendet.
- Daten werden nicht für Kreditwürdigkeitsprüfungen oder Finanzzwecke verwendet.
- Menschen erhalten keinen Zugriff auf die lokal verarbeiteten Webseiteninhalte.

## Veröffentlichungscheckliste

- [ ] Repository oder Datenschutzseite öffentlich erreichbar
- [ ] `PRIVACY.md` im Store als Datenschutz-URL hinterlegt
- [ ] Support-URL und öffentliche Kontaktmöglichkeit geprüft
- [ ] Screenshots und Werbegrafiken entsprechen der aktuellen Oberfläche
- [ ] Berechtigungen stimmen mit dem eingereichten Paket überein
- [ ] Kein Remote-Code und keine externen Skripte enthalten
- [ ] Storeangaben mit der eingereichten Version abgeglichen
- [ ] Chrome-Hinweis zur lokalen Verarbeitung vor der Aktivierung sichtbar
- [ ] Firefox-Datenerfassung weiterhin auf `none` geprüft
