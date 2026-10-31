# Storetexte für Sprachverstand

**Stand: 30. Oktober 2026**

Diese Datei dokumentiert die deutschen Storetexte. Maßgebliche Quellen sind
`store/listings/de.json` für Chrome und `store/amo-listings/de.json` für Firefox.
Die Exporte werden mit `npm run store:generate` erzeugt. Die Einträge bei
Firefox Add-ons und im Chrome Web Store bleiben getrennt. Storetexte, Berechtigungsbegründungen
und Datenschutzangaben müssen bei jeder Änderung an Funktionen, Berechtigungen
oder Datenverarbeitung gemeinsam geprüft werden.

Die öffentliche Datenschutzerklärung steht in [`PRIVACY.md`](../PRIVACY.md).

## Gemeinsame Angaben

**Name:** Sprachverstand

**Leitsatz:** Gendern von Webseiten entfernen. Lokal in deinem Browser.

**Firefox-Kurzbeschreibung:**

> Gendern von Webseiten entfernen: Gendersternchen, Doppelpunkt und Binnen-I werden lokal umgewandelt. Ohne Tracking.

Chrome verwendet weiterhin die lokalisierte `extensionDescription` aus
`static/_locales/*/messages.json`. Produktname und GUI-Texte werden mit dieser
redaktionellen Überarbeitung nicht geändert.

Die vollständigen Chrome-Beschreibungen liegen bereits für alle 51 konfigurierten
Locales unter `store/listings/` vor. Der neue Einstieg ist in allen 51 Fassungen
übersetzt; die übrigen bestehenden Übersetzungen bleiben erhalten. Das belegt die
Repository-Abdeckung, nicht den Stand im öffentlichen Store. Die deutsche
Chrome-Fassung bettet Suchbegriffe in den Fließtext ein. Die bestehende deutsche
Firefox-Suchwortliste wird separat als `keywords` gepflegt und vom Generator nur
an die deutsche AMO-Beschreibung angehängt.

**Einzelzweck:**

> Sprachverstand passt unterstützte gegenderte Schreibweisen in
> deutschsprachigen Webseitentexten lokal und nach konfigurierbaren Regeln an die
> persönlichen Lesegewohnheiten des Nutzers an.

## Firefox Add-ons

**Empfohlene Kategorie:** Sprachunterstützung

### Ausführliche Beschreibung

Gendern von Webseiten entfernen. Lokal in deinem Browser.

Sprachverstand wandelt Gendersternchen, Gender-Doppelpunkte und Binnen-I in herkömmliche deutsche Personenbezeichnungen um. Du bestimmst, wie du liest. Die Verarbeitung läuft lokal auf deinem Gerät, und die Regelgruppen lassen sich einzeln ein- und ausschalten.

So liest sich das mit Sprachverstand:
• Nutzer:innen → Nutzer
• Mitarbeiter*innen → Mitarbeiter
• NutzerInnen → Nutzer
• jede:r Nutzer:in → jeder Nutzer
• Nutzerinnen und Nutzer → Nutzer
• Student*innen → Studenten
• Studierende → Studenten (über eine eigene Regelgruppe steuerbar)

Dein Browser. Deine Sprache.

• Sofort rückgängig: Beim Ausschalten den ursprünglichen Text ohne Neuladen wiederherstellen.
• Nach deinen Vorstellungen: Regelgruppen einzeln wählen, Webseiten ausschließen und persönliche Ausnahmen oder eigene wörtliche Ersetzungen anlegen.
• Vorher ausprobieren: Eigene Regeln vor dem Speichern mit Live-Vorschau und Konflikthinweisen prüfen.
• Auch dynamische Inhalte: Unterstützte Schreibweisen in nachgeladenen Texten umwandeln.
• Einstellungen sichern: Den vollständigen Einstellungsstand lokal als JSON exportieren und wieder einlesen.

Optional auch Untertitel und Beschriftungen

Auf Wunsch verarbeitet Sprachverstand erkannte Untertitel, wenn die Webseite sie als Text bereitstellt. Die Untertitelkorrektur ist standardmäßig ausgeschaltet. Fest ins Video eingebrannte Untertitel können nicht verändert werden. Auch zugängliche Beschriftungen wie alt, aria-label, aria-description und title lassen sich optional verarbeiten.

Lokal und datenschutzfreundlich

Webseitentexte werden ausschließlich lokal verarbeitet. Sprachverstand überträgt sie weder an den Entwickler noch an externe Sprachdienste. Keine externe Sprach-API, kein Tracking, keine Telemetrie und keine Werbung.

Deine Einstellungen bleiben standardmäßig auf deinem Gerät. Optional kannst du ausdrücklich ausgewählte Einstellungskategorien über Firefox Sync synchronisieren. Diese Funktion ist standardmäßig deaktiviert; Webseitentexte und Browserverläufe werden dabei nicht übertragen.

Bewusst vorsichtig

Weibliche Bezeichnungen ohne Genderzeichen wie „Professorin“ oder „Politikerinnen“ bleiben erhalten. Eingabefelder, Editoren, Quellcode, URLs und technische Daten sind von der regulären Verarbeitung ausgeschlossen. Ist eine Ersetzung nicht ausreichend sicher, bleibt die betreffende Schreibweise stehen. Fehlende oder falsche Ersetzungen kannst du über die verlinkte GitHub-Hilfeseite melden.

Sprachverstand entfernt Gendern aus deutschsprachigen Webseiten. Unterstützt werden Firefox für Desktop und Firefox für Android.

Tags:
Barrierefreies Lesen, Gender, kein Gendern, No-Gender, No Gender, Gendern, Gendern ausschalten, Gendern deaktivieren, Gendern entfernen, Gendersprache entfernen, Gendersprache korrigieren, Gendersprache ausschalten, Texte entgendern, Webseiten entgendern, Entgendern, Genderismus, Anti-Gender, Anti-Gender-Addon, Genderstern, Gendersternchen entfernen, Gender-Doppelpunkt entfernen, Binnen-I entfernen, Gendergap, Gender-Gap entfernen, Genderzeichen entfernen, Doppelnennungen vereinfachen, gegenderte Sprache umwandeln, geschlechtergerechte Sprache entfernen, generisches Maskulinum

### Firefox-Datenerfassung

Für `browser_specific_settings.gecko.data_collection_permissions` gilt:

```json
{
  "required": ["none"]
}
```

Begründung: Sprachverstand sammelt keine Daten für den Entwickler oder einen vom Projekt betriebenen Dienst. Eine optionale, vom Nutzer kategorieweise aktivierte `storage.sync`-Synchronisierung wird ausschließlich durch den verwendeten Browserdienst ausgeführt und ist standardmäßig deaktiviert.

## Chrome Web Store

**Empfohlene Kategorie:** Barrierefreiheit

### Ausführliche Beschreibung

Gendern von Webseiten entfernen. Lokal in deinem Browser. Du bestimmst, wie du liest.

Sprachverstand wandelt Gendersternchen, Gender-Doppelpunkte und Binnen-I in herkömmliche deutsche Personenbezeichnungen um. Auch Gendergap und Unterstrich, Doppelnennungen sowie ausgewählte Partizipformen lassen sich nach einzeln wählbaren Regeln anpassen. Die Erweiterung übersetzt keine Webseiten und verändert keine Serverdaten. Unterstützt werden unter anderem Gendersternchen, Gender-Doppelpunkt, Binnen-I und Gender Gap, Singularformen mit und ohne Artikel, substantivierte Adjektive, Pronomen- und Possessivpaare, Titelabkürzungen und einzeln abschaltbare Geschlechtszusätze in Stellenanzeigen wie (m/w/d).

Beispiele:
- Nutzer:innen → Nutzer
- Mitarbeiter*innen → Mitarbeiter
- NutzerInnen → Nutzer
- NutzerIn → Nutzer
- Nutzerinnen und Nutzer → Nutzer
- Student*innen → Studenten
- Studierende → Studenten
- Erwachsene:r → Erwachsener

Wichtige Funktionen:
- einzeln aktivierbare Regelgruppen
- Verarbeitung normaler und dynamisch nachgeladener Webseiteninhalte
- Korrekturzähler für den aktuellen Tab
- persönliche Ausnahmen für Wörter und vollständige Formulierungen
- eigene wörtliche Ersetzungen ohne reguläre Ausdrücke
- Live-Vorschau und Konflikthinweise für eigene Regeln
- lokaler JSON-Import und -Export des vollständigen Einstellungsstands
- optionale Browser-Synchronisierung pro Datenkategorie, standardmäßig deaktiviert
- Ausschluss bestimmter Domains
- optionaler Schutz von Texten in Anführungszeichen
- optionale Korrektur erkannter Untertitel-Overlays
- optionale Verarbeitung von alt, aria-label, aria-description und title
- Schutz von Eingabefeldern, Editoren, Quellcode, URLs und technischen Daten

Sprachverstand arbeitet bewusst vorsichtig. Unbekannte oder mehrdeutige Formen bleiben unverändert, wenn keine ausreichend sichere Ersetzung möglich ist. Beim Ausschalten werden Änderungen auf offenen Seiten ohne Neuladen rückgängig gemacht.

Datenschutz:
- Webseitentexte werden ausschließlich lokal im Browser verarbeitet
- keine Übertragung von Webseitentexten oder aufgerufenen Adressen an den Entwickler
- keine eigene Cloud und keine externe Sprach-API
- kein Tracking, keine Telemetrie, keine Werbung und keine Nutzerprofile
- Einstellungen bleiben standardmäßig lokal
- optionale Synchronisierung verwendet nur den Synchronisierungsdienst des Browsers und nur ausdrücklich ausgewählte Kategorien
- Importdateien werden nur nach bewusster Auswahl lokal gelesen; Exportdateien werden lokal erzeugt

Sprachverstand ist für Menschen gedacht, die deutschsprachige Webseiten lesen und bestimmte gegenderte Schreibweisen lokal nach ihren persönlichen Lesegewohnheiten anpassen möchten.

## Chrome Web Store – Datenschutzformular

### Einzelzweck

> Sprachverstand passt unterstützte gegenderte Schreibweisen in
> deutschsprachigen Webseitentexten lokal und nach konfigurierbaren Regeln an die
> persönlichen Lesegewohnheiten des Nutzers an.

### Begründung der Berechtigung `storage`

> Die Speicherberechtigung wird benötigt, um den vollständigen Einstellungsstand lokal im Browser zu speichern. Zusätzlich kann der Nutzer für Aktivierungsstatus, Regelgruppen, Domain-Ausschlüsse, Textoptionen, persönliche Ausnahmen und eigene Ersetzungen getrennt festlegen, ob die Kategorie über den standardisierten Synchronisierungsdienst des Browsers übertragen wird. Standardmäßig ist keine Kategorie ausgewählt.

### Begründung des Zugriffs auf alle Webseiten

> Sprachverstand muss den sichtbaren Text auf den vom Nutzer aufgerufenen
> Webseiten lesen und lokal verändern können, um unterstützte Schreibweisen zu
> erkennen und ihre Darstellung anzupassen. Der Zugriff wird ausschließlich für
> diese Kernfunktion verwendet. Webseiteninhalte werden nicht übertragen oder
> dauerhaft gespeichert.

### Import und Export der Einstellungen

> Der vollständige Einstellungsstand kann auf ausdrückliche Nutzeraktion als
> JSON-Datei lokal exportiert oder über den Dateiauswahldialog lokal importiert
> werden. Enthalten sind Aktivierung, Regelgruppen, Domain-Ausschlüsse, Zitat-
> und Attributoptionen, persönliche Ausnahmen und eigene Ersetzungen. Hierfür
> wird keine zusätzliche Netzwerk- oder Dateisystemberechtigung verwendet. Die
> Dateien werden nicht übertragen.

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

> Regelgruppen, persönliche Textausnahmen, eigene wörtliche Ersetzungen und Domain-Ausschlüsse werden standardmäßig lokal im Erweiterungsspeicher gespeichert und ausschließlich für die gewählte Konfiguration verwendet. Nur ausdrücklich ausgewählte Kategorien werden zusätzlich über den Browser-Synchronisierungsdienst übertragen. Bei einem bewusst ausgelösten Export wird der vollständige Einstellungsstand einschließlich dieser Auswahl in eine lokale JSON-Datei geschrieben.

### Eingeschränkte Datennutzung

- Die Datenverarbeitung ist auf die beschriebene Kernfunktion beschränkt.
- Daten werden nicht verkauft oder an den Entwickler beziehungsweise vom Projekt betriebene Dritte übertragen.
- Bei freiwillig aktivierter Browser-Synchronisierung verarbeitet der Browseranbieter ausschließlich die ausgewählten Einstellungskategorien.
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
