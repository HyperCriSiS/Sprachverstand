# Moderne Release-Vorabprüfung

Der manuell gestartete GitHub-Actions-Workflow `.github/workflows/release-preflight.yml`
baut den aktuellen modernen `main`-Stand, ohne Tags, GitHub-Releases oder
Store-Einreichungen zu erstellen. Pale Moon ist ausdrücklich nicht beteiligt.

## Ablauf

1. In GitHub unter **Actions → Moderne Release-Vorabprüfung → Run workflow**
   den Branch `main` wählen.
2. Der Workflow prüft die vollständige Produkt-, Store- und Browsermatrix
   einschließlich Chromium, Firefox, Video und DOM-Untertiteln.
3. Für die aktuelle Paketversion entstehen **Chromium-ZIP**, **unsignierte
   Firefox-XPI** und **Quell-ZIP** plus Prüfsummen und Store-Arbeitsunterlagen.
   Der Preflight-Suffix in den Dateinamen vermeidet Verwechslungen mit einem
   veröffentlichten Release.
4. Der Workflow prüft Archivinhalte und Versionsgleichheit einschließlich
   aller vier modernen Quellmanifeste und der Release-Notes.
5. Ergebnisse stehen in der Job-Zusammenfassung. Die Pakete werden für 14 Tage
   als **CI-Artefakt** hinterlegt, nicht als öffentliche GitHub-Release-Assets.

## Freigabegrenzen

- Ein grüner Preflight autorisiert **keine Veröffentlichung**.
- Die echte Veröffentlichung erfolgt erst nach eigenständiger Versions-,
  Quellschluss- und Release-Entscheidung über `release.yml`.
- Die Store-Einreichung erfordert einen stabilen modernen Tag,
  `store-publish.yml` und eine separate ausdrückliche Freigabe.
- Die produktive Store-Umgebung und ihre Berechtigungen sind vor einer
  Einreichung gemäß Issue #331 gesondert abzusichern.
- Edge und Opera verwenden die Chromium-Paketbasis; ihre Store-Prozesse
  werden separat validiert.
- Externe Live-Webseiten sind diagnostisch und ersetzen keine deterministischen
  Browser-/Videoregressionen.
