# Erweiterte Real-Web-Stichprobe (09.10.2026)

Die Tests `tests/real-web-extended-20261009.test.ts` ergänzen die bisherige
kleine Positiv-/Negativprüfung um **32 Positiv- und 26 Negativfälle**.
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
