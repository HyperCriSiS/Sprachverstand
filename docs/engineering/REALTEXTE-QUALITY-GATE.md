# Begrenztes Realtext-Qualitätsgate

Stand: 09.10.2026

Dieses Gate ergänzt die historischen Einzelregeltests um **die vollständige
Textverarbeitung** mit allen Standardregeln im aggressiven Profil.

## Zwei ausdrücklich verschiedene Stichproben

- **Beobachtete Kurzbelege:** fünf positive und zwei negative kurze
  Oberflächenformen aus einer unabhängigen, gezielten Web-Stichprobe vom
  08.10.2026. Die URLs, Abrufdaten und Herkunftsbewertung liegen privat im
  `Generic-Datastore`, unter
  `sprachverstand/derived/review/real-web-shortforms-20261008.json`.
- **Konstruierte Gegenproben:** vierzehn positive und achtzehn negative
  vollständige Sätze. Sie prüfen insbesondere die Wellen 89–91 sowie
  Mehrdeutigkeiten, unmarkierte Begriffe, Eigennamen und technische Wörter.
  Sie sind **keine unabhängig beobachteten Korpusbelege**.

Die Vitest-Prüfung `tests/realtext-quality-gate.test.ts` vergleicht die
vollständige Ausgabe mit dem erwarteten Text und prüft, ob unmarkierte
Negativfälle unverändert bleiben. Die CI gibt die beiden Zähler getrennt aus.

## Interpretation

- Die Zahl der korrekt normalisierten **ausgewählten Positivfälle** ist
  keine repräsentative Recall-Schätzung für das deutsche Web.
- Die Zahl der unbeabsichtigt veränderten **ausgewählten Negativfälle** ist
  keine statistische False-Positive-Rate auf externen Websites.
- Das Qualitätsgate erfasst keine unbeobachteten, semantisch problematischen
  Treffer und prüft nicht automatisch alle mehrteiligen ESCO-Bezeichnungen.
- Der 12-Seiten-Live-Browserlauf bleibt unabhängig; er misst hauptsächlich
  DOM-/Performance-/Interaktionsverhalten, **keine** sprachliche Präzision.

Die beiden bekannten lexikalischen Grenzfälle `General:innen` und
`Stallknecht:innen` bleiben bewusst vor automatischer Freigabe geschützt.
Ein fehlgeschlagenes Qualitätsgate darf nicht durch stilles Umetikettieren
seiner Solltexte „repariert“ werden.
