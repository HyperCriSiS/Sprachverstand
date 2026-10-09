# Erweiterte Real-Web-Stichprobe (09.10.2026)

Die Tests `tests/real-web-extended-20261009.test.ts` ergänzen die bisherige
kleine Positiv-/Negativprüfung um **32 erwartete Normalisierungen und 26 Gegenproben**.
Es handelt sich um kurze, tatsächlich beobachtete Textoberflächen von
Anmeldeseiten, Behörden, Forschungsinstituten, Verbraucherberatung und
Veranstaltungsportalen. Einzelne Portale liefern mehrere unabhängige
Wortformen; **eine Webseite ist kein unabhängiger statistischer Versuch**.

Die Proben wurden gezielt anhand von Gender-Mustern und
unmarkierten Vergleichsbegriffen ausgewählt. Sie sind daher kein zufällig
gezogenes oder repräsentatives Korpus und liefern **keine allgemeine
Präzision, Fehlkorrekturrate oder Recall-Quote für deutsche Webseiten**.

Die CI kontrolliert die vollständige Textverarbeitung im aggressiven Profil,
vergleicht Positiva mit annotierten Zieltexten und verlangt bei Negativa
vollständige Unverändertheit. Die Kennzahlen beider Klassen erscheinen
getrennt. Herkunft, URLs und Prüfbewertungen liegen ausschließlich im
privaten Datastore und werden nicht ins öffentliche Produkt übernommen.

Sonderfälle mit lexikalisch oder syntaktisch ungeklärter Zielkorrektur dürfen
nicht zur Verbesserung eines Zählers automatisch freigegeben werden.
Für eine belastbare Qualitätsmessung folgt als eigener Schritt ein
vordefiniertes, zufällig gezogenes, blind annotiertes Webkorpus mit
Treffer- und Fehlkorrekturklassifikation.

## Erste Messung: separate Fehlertypen

Die erste vollständige PR-Ausführung ergab vier reale Dativ-Plural-Lücken
(„mit erfahrenen Forscher*innen“, „den Forscher*innen und Expert*innen“,
„mit den Betreuer*innen“, „persönlichen Betreuer:innen“). In allen vier
Fällen wurde die Markierung entfernt, das grammatisch notwendige
Dativ-`n` aber nicht ergänzt. Sie bleiben als **bekannte offene
Qualitätsabweichungen** mit Soll-/Ist-Ausgabe im Test erhalten.

Zweimal trat außerdem `Studierende → Studenten` auf. Das entspricht
der bestehenden, ausdrücklich programmierten Regel für substantivierte
Partizipien und wird deshalb nicht fälschlich als unmarkierte
Negativprobe gezählt. Ob diese Richtlinie erhalten bleiben sollte,
ist eine separate Produktentscheidung.

Die 58 Fundstellen gliedern sich daher in: **28 korrekt
normalisierte Positivfälle, 4 bekannte grammatische Abweichungen,
24 unverändert erhaltene Negativfälle und 2 beabsichtigte
Richtlinienumformungen**. Diese Kategorien haben verschiedene
Nenner und dürfen nicht zu einer vermeintlichen Webgenauigkeit
zusammengerechnet werden.

## Eng begrenzte Dativ-Korrektur (Issue #359)

Die Regel `plural.marked-dative-context` normalisiert ausdrücklich
markierte und lexikalisch bekannte Pluralbasen innerhalb von
Dativpräpositionalgruppen und nach `den`, auch in einer eng begrenzten
koordinierten Zweiergruppe. Andere Kasus werden weiterhin unverändert
der bisherigen Pluralregel überlassen.

Drei der vier ursprünglich gefundenen Dativlücken sind damit korrigiert.
Die Formulierung `persönlichen Betreuer:innen` bleibt mangels eindeutig
nachweisbarem linken Kontext bewusst als offener Soll-/Ist-Unterschied
erhalten. Keine pauschale `-n`-Endungsfreigabe und keine automatische
Umformung unmarkierter Begriffe.

Neue Stichprobenklassen: **31** richtige Positivfälle, **1** offene
grammatische Dativlücke, **24** unveränderte Negativfälle und
**2** bereits beabsichtigte Partizipumformungen.
