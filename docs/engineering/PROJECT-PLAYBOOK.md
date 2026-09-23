# Project playbook

## Documentation authority

Default branch: `main`.

Project-global current state has a single source of truth on `main`. This includes the project roadmap, priorities/status, whole-project architecture or API state, release/process policy, and other management documentation.

Development branches document their own delta, not an independent copy of the project's global state. Appropriate branch-local documentation includes feature design, API changes introduced by that branch, migrations, ADRs, branch-specific test specifications, and temporary implementation notes.

A copy of a canonical document on a non-default branch is only a proposed delta and must not be treated as current project state. Operational roadmap/status updates should target `main` promptly; do not maintain a separate roadmap on a long-lived side branch.

Before using or changing canonical documentation from a side branch:

1. read the current version from `main`,
2. describe only the branch-specific delta where possible,
3. reconcile any canonical-document edits with the latest `main` before merge, and
4. after integration, ensure `main` reflects the resulting project state and remove or condense temporary delta documentation where appropriate.

Do not blindly overwrite newer canonical state from an older branch.

## Pale Moon exception

`palemoon` is a deliberately long-lived implementation branch for the technically separate Goanna/legacy port. It may own documentation that is exclusively about Pale-Moon-specific implementation, compatibility, porting or release behavior. Cross-project planning, shared architecture, project status and other global management state remain authoritative on `main`.

## Operativer Arbeitsstand und Wiederaufnahme

Der kompakte operative Übergabestand liegt in `docs/engineering/CURRENT-WORK.md` auf `main`. Die Roadmap bleibt strategisch und wird nicht als laufendes Sitzungsprotokoll verwendet.

Bei Wiederaufnahme bestehender Arbeit gilt diese Reihenfolge:

1. `docs/engineering/CURRENT-WORK.md` aus `main` lesen,
2. den dort genannten `main`-Commit sowie Branches, Pull Requests oder Issues gegen den aktuellen GitHub-Zustand verifizieren,
3. nur die dort als aktiv markierten Arbeitsströme fortsetzen, sofern der Nutzer keine andere Priorität vorgibt,
4. nach einem logisch abgeschlossenen Integrations- oder Entscheidungsstand den Checkpoint zeitnah aktualisieren.

Der zuletzt aktualisierte Branch oder Pull Request ist ausdrücklich **kein** Ersatz für diesen Übergabestand. Chatverlauf, lokale Scratch-Daten und Tool-Historie sind ebenfalls keine Projekt-Source-of-Truth.

## Optionale nicht öffentliche Projektzustände

Sprachverstand besitzt Aufgabenklassen, bei denen autorisierte nicht öffentliche Recherche-, Quellen- oder Evidenzdaten außerhalb dieses Repositories benötigt werden. Diese Ebene ist **opt-in** und wird nur geladen, wenn die konkrete Aufgabe Quellenimport, Quellenaudit, Provenienz/Lizenzprüfung, Kandidatengenerierung oder Coverage-/Evidenzauswertung betrifft.

Für normale Produktarbeit — Feature, UI, Bugfix, Refactoring, Browser-Kompatibilität, Release oder allgemeine Wartung — darf diese externe Ebene nicht automatisch geladen oder als notwendiger Kontext vorausgesetzt werden.

Der öffentliche Übergabestand enthält nur eine sichere Lookup-Regel und den Hinweis, wann externe Zustände relevant sind. Rohquellen, private URLs, Herkunftsmetadaten und nicht öffentliche Prüfdaten bleiben außerhalb des öffentlichen Repositories; öffentlich persistiert werden nur quellenneutrale Produktdaten, eigenständig entwickelte Regeln und Regressionstests.
