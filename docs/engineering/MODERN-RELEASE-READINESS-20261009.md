# Moderne Browser-Releases: technischer Stand vom 09.10.2026

## Validierte, nicht veröffentlichte Basis

- **Geprüfter `main`-Commit:** `2f6fa9b5d5fd19dffeb43739f5dfa23deee564a3`.
- **Paketversion im Quellstand:** `0.7.2`. Letztes zum Prüfzeitpunkt veröffentlichtes modernes GitHub-Release: `v0.7.2-rc.12` vom 07.09.2026. Daraus folgt **keine** automatische Freigabe für `v0.7.2`; die Release-Version und -Art sind separat zu entscheiden.
- **Nicht veröffentlichender Preflight:** [GitHub Actions #37949645173](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/37949645173), Ergebnis `success`, gestartet 09.10.2026 15:09 UTC, beendet 15:12 UTC. CI, produktive Qualitätsprüfungen, Chromium samt Video/Untertiteln und Firefox bestanden.
- Der Workflow erstellt und prüft fünf Archive: Chromium-ZIP, Firefox-XPI (unsigniert), Edge-ZIP, Opera-ZIP und Quell-ZIP. In der Workflow-Validierung wurden Versionen, Archive, Quellmanifest-Gleichheit, Edge-/Opera-Dateiinhalt gegen Chromium und SHA-256-Prüfsummen geprüft. **Kein echter Edge- oder Opera-Browsertest** und kein Store-Upload.
- **Interne GitHub-Actions-Artefakte:** ID `11625781348`, Name `modern-release-preflight-2f6fa9b5d5fd19dffeb43739f5dfa23deee564a3`, ca. 3,39 MB, bis **23.10.2026 15:12 UTC** verfügbar; danach gegebenenfalls auf einem neu bestätigten `main` den Preflight erneut ausführen. Artefakte sind keine GitHub-Releases.
- Der letzte produktive Partizip-Merge (`5b901107e454ed8f278dd22b43a7310d0964ffc1`, PR #364) ist im geprüften `main` enthalten.

## Verifizierte Sicherungen und verbleibende Blocker

- `main` wird durch das **aktive Ruleset „Main“**, ID `19909828`, geschützt: PR-Pflicht, Verbot von Löschung und Non-Fast-Forward und erforderlicher Statuscheck `check`. Ein `404` am *klassischen* Branch-Protection-Endpunkt bedeutet hier nicht, dass `main` ungeschützt ist.
- **Store-Production-Environment fehlt:** REST `GET /environments/store-production` meldet `404` (09.10.2026). Ein Administrator muss eine getrennte, geschützte Umgebung mit mindestens einem berechtigten zweiten Reviewer, deaktivierter Selbstfreigabe, deaktiviertem Admin-Bypass und Schutz auf zulässige Branches einrichten; Details in [Issue #331](https://github.com/HyperCriSiS/Sprachverstand/issues/331) und `docs/engineering/STORE-PRODUCTION-GATE.md`.
- Repository-Actions-Variablen sind für den aktuellen Zugriff **nicht lesbar (`403`)**. Über Store-Token, Google-OIDC und Rechte wird daher weder Vorhandensein noch Funktion behauptet.
- Für eine echte Veröffentlichung sind **Quellschluss, Versions- und Release-Typ-Entscheidung** sowie eine neue ausdrückliche Freigabe nötig. Der `release.yml`-Workflow ist tagwirksam und darf nicht als Ersatz für den Preflight ausgeführt werden. Der Store-Workflow `store-publish.yml` bleibt gesperrt, solange die administrativen Freigaben fehlen.
- Bekannte produktive Sprachgrenze: die noch offene Dativ-Mehrdeutigkeit aus **Issue #359**. Die lexikalische und grammatische Testabdeckung ist keine repräsentative Fehlerrate des gesamten Webs.

## Nächste Freigabeschritte

1. Die für das moderne Release gewünschte Version und den Reifegrad (z. B. weiterer RC oder stabil) **explizit entscheiden**, zusätzlich zu den bestehenden CI-Ergebnissen.
2. Admin-/Reviewer-Schutz für `store-production` und Store-Credentials/OIDC in [Issue #331](https://github.com/HyperCriSiS/Sprachverstand/issues/331) erledigen.
3. Nach einem **gesondert freigegebenen** modernen GitHub-Release ausschließlich den `validate`-Pfad der vorhandenen Artefakte ausführen; eine echte Store-Einreichung erfordert nochmals separate Freigabe.
4. Edge/Opera in ihren eigenen Verfahren testen; Pale Moon bleibt eine spätere, unabhängige Phase.

**In dieser Arbeitseinheit wurden weder Tag oder GitHub-Release angelegt noch Store-Credentials geändert oder Store-Einreichungen ausgelöst.**
