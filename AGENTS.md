# Repository instructions

- Follow `docs/engineering/PROJECT-PLAYBOOK.md` for project-wide engineering and documentation authority rules.
- Treat project-global planning and current-state documentation as authoritative only on `main`.
- On non-default branches, document the branch delta rather than maintaining an independent project-wide state.
- Before planning or updating `ROADMAP.md` from a side branch, compare against the current `main` version.
- `palemoon` is authoritative only for Pale-Moon-specific implementation, porting and release deltas; project-global state remains owned by `main`.
- Bei „fortfahren“, Wiederaufnahme nach Abbruch oder unklarem Anschluss zuerst `docs/engineering/CURRENT-WORK.md` aus `main` lesen und die dort genannten Live-Refs verifizieren; nicht aus Chatverlauf, Branch-Aktualität oder dem zuletzt geänderten PR auf die aktive Arbeit schließen.
- Nicht öffentliche/externe Projektzustände nur laden, wenn `CURRENT-WORK.md` sie für die konkrete Aufgabenklasse ausdrücklich als relevant markiert; bei normaler Feature-, UI-, Bugfix- oder Wartungsarbeit nicht danach suchen.
- `ROADMAP.md` bleibt strategisch. Kurzfristige aktive PRs, Blocker und unmittelbare nächste Schritte gehören in `docs/engineering/CURRENT-WORK.md`.
