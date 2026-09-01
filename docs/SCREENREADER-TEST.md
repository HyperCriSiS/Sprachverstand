# Screenreader-Test

Status: manueller Freigabetest offen. Diese Checkliste ergänzt die automatisierten Accessibility-Preflight-Tests, ersetzt aber keinen echten Screenreader-Test.

## Ziel

Popup und Einstellungsseite müssen mit Tastatur beziehungsweise Touch-Erkundung verständlich und vollständig bedienbar sein. Dynamische Zustände dürfen nicht nur visuell vermittelt werden.

## Desktop – Firefox

Empfohlene Kombinationen:

- Windows: NVDA + aktuelles Firefox
- Linux: Orca + aktuelles Firefox, sofern verfügbar

### Popup

- [ ] Erweiterung über die Browser-Symbolleiste öffnen.
- [ ] Prüfen, dass zuerst Produktname und Status sinnvoll angekündigt werden.
- [ ] Aktivierungsschalter fokussieren und prüfen, dass Name, Rolle und Zustand angekündigt werden.
- [ ] Aktivierung umschalten und prüfen, dass der neue Zustand verständlich angekündigt wird.
- [ ] Korrekturzähler prüfen; Änderungen dürfen nicht mehrfach oder störend vorgelesen werden.
- [ ] Alle sichtbaren Regelgruppen durchlaufen; jede Checkbox muss einen eindeutigen Namen und Zustand haben.
- [ ] Optionen für Bildbeschreibungen, Zitate und Untertitel durchlaufen.
- [ ] Schaltfläche „Ausnahmen und weitere Einstellungen“ aktivieren.
- [ ] Gesamte Bedienung zusätzlich nur mit Tastatur prüfen; Fokus darf nicht verloren gehen.

### Einstellungsseite

- [ ] Überschriftennavigation prüfen: genau eine Hauptüberschrift, logisch benannte Bereiche.
- [ ] Alle `details`-Bereiche öffnen und schließen; Zustand muss angekündigt werden.
- [ ] Werkzeugleiste mit Speichern, Zurücksetzen, Alle öffnen und Alle schließen prüfen.
- [ ] Jede Checkbox auf eindeutigen Namen und Zustand prüfen.
- [ ] Persönliche Ausnahmen, eigene Ersetzungen, Vorschau und Domain-Ausschlüsse prüfen.
- [ ] Importmodus und Import-Schaltfläche prüfen.
- [ ] Browser-Synchronisierung einschließlich aller Kategorien prüfen.
- [ ] Speichern auslösen; Statusmeldung muss einmal verständlich angekündigt werden.
- [ ] Eine ungültige eigene Ersetzung erzeugen; Diagnose muss angekündigt werden.
- [ ] Eine Importdatei auswählen; Importzusammenfassung muss angekündigt werden.
- [ ] Links „Probleme melden“ und „Lizenz und Quelltext“ prüfen.

## Android – Firefox

Empfohlene Kombination:

- Android: TalkBack + Firefox für Android

### Popup und Einstellungen

- [ ] Popup per Touch-Erkundung vollständig durchlaufen.
- [ ] Prüfen, dass die visuelle Reihenfolge der Fokus-/TalkBack-Reihenfolge entspricht.
- [ ] Aktivierungsschalter und Regelgruppen umschalten; Rolle, Name und Zustand müssen korrekt angesagt werden.
- [ ] Einstellungsseite öffnen und alle Bereiche per Wischgesten erreichen.
- [ ] `details`-Bereiche öffnen/schließen und Statusansage prüfen.
- [ ] Textfelder fokussieren, Text eingeben und wieder verlassen; Label muss erhalten bleiben.
- [ ] Vorschauausgabe prüfen; dynamische Meldungen dürfen nicht in einer Endlosschleife wiederholt werden.
- [ ] Speichern und Zurücksetzen prüfen.
- [ ] Browser-Zurück und erneutes Öffnen prüfen; Fokus darf nicht in einem nicht erreichbaren Element landen.
- [ ] Hoch- und Querformat prüfen.

## Sprachprüfung

Je Plattform einmal mit deutscher und englischer Browser-Oberfläche testen:

- [ ] UI-Texte werden in der erwarteten Sprache angekündigt.
- [ ] Produktname bleibt „Sprachverstand“.
- [ ] Keine gemischten deutschen/englischen Beschriftungen innerhalb eines Controls.
- [ ] Dynamische Status- und Fehlermeldungen werden ebenfalls lokalisiert vorgelesen.

## Freigabekriterium

Der Roadmap-Punkt „Screenreader-Test auf Desktop und Android“ darf erst abgehakt werden, wenn mindestens NVDA + Firefox auf Desktop und TalkBack + Firefox für Android vollständig nach dieser Checkliste geprüft wurden. Gefundene Probleme werden vor dem Abhaken als Regressionstest oder dokumentierter Fix abgesichert.
