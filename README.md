# Sprachverstand

**Macht Webseiten wieder lesbar.**

Sprachverstand ist eine neu entwickelte Browser-Erweiterung zur kontrollierten
Normalisierung gegenderter deutscher Texte. Die Codebasis ist modular, streng
typisiert und auf möglichst geringe Fehlertreffer ausgelegt.

## Stand

Version `0.5.3` ist **Beta 8**. Sie nutzt ein randloses, besser ausfüllendes
SV-Symbol, verbreitert und verdichtet das Popup und ergänzt geprüfte Formen aus
der UdK-Handreichung sowie dem Genderwörterbuch. Dazu gehören unter anderem
`Studierende`, `Lesende`, `Arbeitnehmende`, `Juden_Jüdinnen`,
`Gegner*innenschaft` und `Verbündete_r`. Terminologische Schreibweisen wie
`trans* Personen` und `inter* Personen` bleiben bewusst unverändert.

Die CI erzeugt für jeden geprüften Commit Chromium-, Firefox- und
Quellcode-Pakete samt SHA-256-Prüfsummen. Die Installations- und Testanleitung
steht unter [`docs/BETA-TEST.md`](docs/BETA-TEST.md).

## Eigenschaften

- Manifest V3 für Chromium und Firefox
- Firefox für Android als offiziell vorgesehenes Mobilziel
- TypeScript-Regel-Engine mit zwölf verständlichen Regelgruppen
- jede Regelgruppe im Popup und in den Einstellungen einzeln aktivierbar und mit einem Beispiel erklärt
- reversible Änderungen: Ausschalten stellt eigene Änderungen ohne Reload zurück
- Live-Zähler pro Tab im Symbol, Popup und Einstellungsfenster
- persönliche literale Ausnahmen für Wörter und vollständige Phrasen
- Domain-Ausschlüsse
- SV-Monogramm als Erweiterungs-, Popup- und Einstellungslogo
- wahlweise Schutz direkt zitierter Schreibweisen in Anführungszeichen
- sichere Verarbeitung normaler Textknoten
- optional kontrollierte Verarbeitung von `alt`, `aria-label`,
  `aria-description` und `title`
- `MutationObserver` für dynamische Webseiten, Single-Page-Anwendungen und
  nachträgliche Attributänderungen
- Schutz für Eingabefelder, Editoren, Code, URLs und technische Daten
- kleiner Hintergrundprozess ausschließlich für Badge und Tab-Zähler
- automatisierte Unit-, DOM-, Änderungsumfang-, Einstellungs- und
  Regressionstests
- Firefox-Desktop- und Firefox-Android-Kompatibilitätsprüfung mit `web-ext lint`
