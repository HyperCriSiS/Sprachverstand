# Aktueller Arbeitsstand

Stand: 2026-10-10  
Autorität: `main`

> **Nur aktiver Übergabe-Checkpoint.** Der [vollständige bisherige Stand](archive/CURRENT-WORK-SNAPSHOT-20261009.md) ist unverändert archiviert. Das Archiv **nicht routinemäßig lesen**: frühere „Nächste Schritte“, Store-Vorgaben und CI-Stände können überholt sein. Bei Widersprüchen neuere nachgewiesene Entscheidungen bevorzugen.

## Unabhängiger 0.7.2-Audit: aktueller Korrekturstand

- Auditsnapshot `439a3e8`: 29 Befunde (8 P1, 20 P2, 1 P3), **weiterhin NO-GO** bis zur neuen unabhängigen Abnahme.
- **Gemergt und gesamte PR-CI grün:** #378 DOM-02, #379 DOM-13/05, #380 LANG-09, #381 S1, #382 LANG-02, #383 LANG-01/03, #384 S2, #386 DOM-04, #387 Worker-Discovery-Flake, #388 DOM-07, #389 DOM-01 (Teilkorrektur), #390 DOM-08, **#392 DOM-09** (`9615b4ff`) und **#394 DOM-03** (`6c030ead`). #393 wurde nach Squash-Merge-Konflikt durch #394 ersetzt; die letztgenannte PR-CI war vollständig grün. Aktuellen `main`-HEAD bei Wiederaufnahme live prüfen.
- **Neu integriert, vollständige jeweilige PR-CI grün:** **#401 DOM-10** (nachträglich erzeugte offene ShadowRoots über 2-ms-/256-Knoten-Discovery-Scheiben, 64-ms-Atempausen und 1,5-s-Sweep-Abstand; JSdom und echte Chromium-/Firefox-Smokes einschließlich Video, Merge `0c94e242`). **#397 DOM-06** (Inline-Zitate und persönliche Mehrwortausnahmen, Merge `3699903a`), **#398 DOM-12** (Textauswahl mit lokaler `replaceData`-Differenz erhalten, Merge `188b6bcb`) und **#399 DOM-11** (tiefe/Shadow-Untertitel und dynamische Caption-Marker, Merge `320c2e3c`). Geprüft: Kernprüfung, Performance, Chromium einschließlich Video, Gecko und CodeQL. Nachgelagerte `main`-CI dieser Merges gesondert verifizieren.
- **Nächste begrenzte Einheit:** verbleibenden **DOM-01-Inline-Kontext** mit unabhängigen Gegenbeispielen prüfen und präzise nachbessern; danach fehlende LANG-/TEST-01-Regressionsfälle priorisieren. Weitere offene Grenzen: DesignMode-Off ohne Event, REL-01-Video unabhängig nativ mehrfach nachmessen, DOM-02 1k/4k/10k gegen v0.7.1, S3/S4 und vollständige unabhängige Gesamt-Revalidierung. **NO-GO bleibt bestehen.**
- **Später gesondert:** Security- und Releasegates S3/S4 sowie vollständige unabhängige Revalidierung. Keine Releases, Tags, Store-Einreichungen oder Pale-Moon-Änderungen.

## Zuletzt verifizierte Produktbaseline

- Repository `HyperCriSiS/Sprachverstand`. Für jede neue Arbeit den **aktuellen `main`-HEAD live** bestimmen; kein hier genannter Commit ersetzt diese Abfrage.
- Letzter integrierter Produkt-HEAD bei diesem Checkpoint: `0c94e2425eab28b96da1abc3ec910460bfa8790c` (**#401 DOM-10**); vorher #399 `320c2e3c`, #398 `188b6bcb`, #397 `3699903a`. Vor jeder Wiederaufnahme gegen `main` prüfen. Historische Basis #372–#374 mit Welle 93 bleibt integriert.
- Produktversion `0.7.2`, 93 integrierte Lexikonwellen (zuletzt PR **#374**); zuletzt dokumentierte öffentliche moderne Prerelease `v0.7.2-rc.12`. **Kein neuer Release-Tag oder Store-Submit** durch die Vorbereitung.
- PR-CI für #372–#374 grün: Kernprüfungen, Performance, Chromium/Video, Gecko/Firefox, CodeQL und Sammelcheck.
- **Nicht veröffentlichender** Gesamt-Preflight [Run #37975520305](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/37975520305) auf Produktstand `b26f837` vollständig erfolgreich: fünf moderne Releasepakete und SHA-Prüfungen. Artefakt `11638965688` läuft am **23.10.2026, 18:48 UTC** ab. „Technisch grün“ bedeutet nicht „veröffentlicht“ oder „Store-freigegeben“.

## Aktive Aufgaben und Blocker

1. **Moderne Releases vorbereiten:** Gegen den aktuellen `main` prüfen; verbleibende **native Windows-, Edge- und Opera-Prüfungen** sowie manuelle Browser-/Store-Checks durchführen. Geprüfte Chromium-/Firefox-CI und erzeugte Edge-/Opera-Pakete ersetzen keine echten nativen Browserprüfungen. Details: `docs/engineering/MODERN-RELEASE-READINESS-20261009.md`, `RELEASE-PREFLIGHT.md`.
2. **Store-Environment / Issue #331:** `store-production`, AMO-/Chrome-Web-Store-Credentials und OIDC sind zuletzt **nicht als konfiguriert bzw. geprüft bestätigt**. Einrichtung und Rechteprüfung durch berechtigten Eigentümer; kein Store-Submit ohne diese Voraussetzungen.
3. **Explizite Veröffentlichungsentscheidung:** Nutzer entscheidet über RC/stabile Version, Tag und Store-Ziele gesondert. Tags dürfen GitHub-Releasepakete erzeugen, aber **niemals automatisch Store-Submissions**. `store-publish.yml` nur **manuell** mit `mode: submit`, Tag, Ziel und Bestätigungsphrase; Eigentümeridentität einschließlich Reruns prüfen. Neueste Nutzerentscheidung: **kein zweiter Required Reviewer**; geschützter Branch, deaktivierter Admin-Bypass und fail-closed bleiben erforderlich. Ältere Hinweise auf einen verpflichtenden zweiten Reviewer sind überholt; tatsächlichen Workflow und `STORE-PRODUCTION-GATE.md` vor Umsetzung abgleichen.
4. **Restfehler Sprache / Issue #359:** isolierte mehrdeutige Dativform `persönlichen Betreuer:innen` offen; keine unsichere pauschale Dativ-`n`-Anfügung. Nur präzise Korrekturen mit Positiv-, Negativ- und Satztests. Gezielte Real-Web-Stichproben nicht als repräsentative Precision-/Recall-Messung darstellen.
5. **Pale Moon zuletzt**, erst nach modernen Browser-Veröffentlichungen; ehemaliger PR **#311** ohne Merge geschlossen. Paritätsproblem nicht vorziehen.

## Dauerhafte Qualitäts- und Quellengrenzen

- `language_model_first`; Quellen sind Kandidaten, keine automatische Produktfreigabe. Nur eigenständig geprüfte Exact-Mappings oder eng begrenzte Regeln; Positiv-/Negativ-, Paar-, Plural-/Kasus-, Satz- und relevante Browserregressionen wahren. **Keine generischen Personen-Suffixregeln oder pauschalen `-ende`-Regeln.**
- Geschützte DOM-Bereiche (Code, Editoren/Formulare, Shadow DOM, weitere Ausschlüsse) und Video-/Untertitelverhalten nicht beeinträchtigen. Historische Ausschlüsse wie `General:innen` und `Stallknecht:innen` sowie attributive/mehrdeutige Partizipien wahren.
- **GENDERATOR: keine weiteren Web-/Browserabrufe und keine neuen Vollimports.** 142 geprüfte Basen integriert; 449 frühere Kandidaten zurückgestellt. 72 später gefundene zusätzliche Quellpfade sind keine automatisch freigegebenen Produktkandidaten.
- Bereits geprüfte Wikipedia-, Scribbr-, Hunspell- und ESCO-Quellen nicht blind neu abarbeiten. ESCO-1.2.0→1.2.1-Deltavergleich und echte KorAP-KWIC-Belege nur mit verfügbarem, autorisiertem Zugang; keine erfundene Vollständigkeit oder repräsentative Web-/Korpusgenauigkeit.
- Private Rohquellen, Prüfbelege, Herkunfts- und Lizenzunterlagen ausschließlich im getrennten `HyperCriSiS/Generic-Datastore`. `sprachverstand/CURRENT-STATE.json` **nur für Quellen-, Provenienz-, Lizenz-, Kandidaten- oder Evidenzaufgaben** lesen; nicht bei alltäglicher Produkt-/Release-Arbeit.
- Ohne ausdrückliche Freigabe **keine Tags, GitHub-Releases, Store-Einreichungen oder destruktiven externen Aktionen**. Tatsächlichen GitHub-/CI-/PR-Stand stets prüfen; keine Behauptung allein aus alten Checkpoints.

## Kontextsparsames Wiederaufnahmeprotokoll

1. Diese Kurzdatei von **`main`** lesen, danach nur erforderliche aktuelle Branches, PRs, Issues und `main`-HEAD live verifizieren.
2. Nur aufgabenrelevanten Code, Tests und notwendige Detaildokumente öffnen. **Archiv, ganze Dokumentationsbäume und private Quellen nicht vorladen.**
3. Nach größerer Integration/Entscheidung die Kurzdatei mit **aktiven** Blockern, nächsten Schritten und wenigen Belegen aktualisieren. Abgeschlossene Chronologie nicht hier anhängen; bei Bedarf separat archivieren.
4. Aktuelle Git-/CI-/Nutzerentscheidungen haben Vorrang vor historischen Notizen und alten Chatverläufen.

## Nachschlagewerke (nur bei Bedarf)

- [Vollständige, unveränderte Historie bis 09.10.2026](archive/CURRENT-WORK-SNAPSHOT-20261009.md).
- `ROADMAP.md` (Strategie); `docs/engineering/PROJECT-PLAYBOOK.md` (Branch-/Dokumentationsregeln).
- `docs/engineering/MODERN-RELEASE-READINESS-20261009.md`, `RELEASE-PREFLIGHT.md`, `STORE-PRODUCTION-GATE.md` (relevante Release-Gates; anhand der neuesten Entscheidungen prüfen).