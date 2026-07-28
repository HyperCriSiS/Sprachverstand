# Flexionslexikon und Aufnahmeverfahren

Sprachverstand verwendet kein unkontrolliertes Abschneiden von Endungen. Jede
unregelmäßige oder kontextabhängige Personenform wird mit ihrer erwarteten
Singular-, Plural- und Kasusflexion modelliert und durch Positiv- und
Negativtests abgesichert.

## Datenquellen

Der produktive Bestand wird eigenständig kuratiert. Grundlage sind:

- reale Fundstellen aus Praxistests und Fehlermeldungen,
- allgemeinsprachliche Flexionsangaben aus öffentlich zugänglichen
  Wörterbuch- und Grammatikseiten,
- dokumentierte Sonderformen und ihre beschriebenen Bildungsregeln,
- negative Beispiele, bei denen eine ähnlich aussehende Form ausdrücklich
  unverändert bleiben muss.

Es wird kein vollständiges fremdes Wörterbuch und keine fremde Regel- oder
Regexsammlung importiert. Wörterbuchangaben werden zur Prüfung einzelner
Flexionen herangezogen; die Auswahl, Datenstruktur, Regelimplementierung und
Tests entstehen im Projekt neu.

## Maschinenlesbarer Regressionskatalog

`data/flexion-regression-cases.json` enthält kuratierte Einzelfälle mit:

- eindeutiger ID,
- Ausgangstext,
- erwarteter Darstellung,
- Herkunfts- oder Prüfkategorie,
- positiven und negativen Regressionen.

`tests/flexion-regression-cases.test.ts` führt den gesamten Katalog gegen die
produktive Regel-Engine aus. Dadurch kann ein Lexikoneintrag nicht unbemerkt
eine bereits geprüfte Form beschädigen.

## Aufnahme neuer Formen

Eine neue Form wird nur produktiv aufgenommen, wenn folgende Punkte geklärt
sind:

1. Die Fundstelle liegt mit ausreichend Satz- oder UI-Kontext vor.
2. Singular, Plural und relevante Kasusformen sind bestimmt.
3. Komposita und Großschreibung wurden berücksichtigt.
4. Mindestens ein positiver Regressionstest wurde ergänzt.
5. Naheliegende Fehlertreffer wurden als Negativtests erfasst.
6. Die Form wird der passenden, abschaltbaren Regelgruppe zugeordnet.
7. Bei mehrdeutigen Formen wird entweder ein sicherer Kontext verlangt oder auf
   eine automatische Ersetzung verzichtet.

## Aktuelle Abdeckung

Der Bestand umfasst unter anderem:

- unveränderte maskuline Pluralformen wie `Nutzer`, `Mitarbeiter`, `Techniker`
  und `Wissenschaftler`,
- schwach deklinierte Formen wie `Student`, `Patient`, `Journalist`,
  `Fotograf`, `Korrespondent` und `Psychologe`,
- unregelmäßige Formen wie `Arzt/Ärzte`, `Anwalt/Anwälte`, `Gast/Gäste`,
  `Koch/Köche`, `Vorstand/Vorstände` und `Beamter/Beamte`,
- substantivierte Adjektive wie `Erwachsener`, `Beschäftigter`,
  `Volljähriger`, `Vorgesetzter` und `Erziehungsberechtigter`,
- exakt geprüfte Sonderformen wie `Rom*nja`, `Sinti*zze` und mehrere
  Phettberg-Pluralformen auf `-ys`.

## Quellenhinweise

- Duden: Deklination und substantivierte Adjektive
- Bundeszentrale für politische Bildung: Entgendern nach Phettberg
- Zentralrat Deutscher Sinti und Roma: Kontroverse zur gegenderten
  Selbstbezeichnung
- die in `UPSTREAMS.md` dokumentierten öffentlichen Fehler- und Grenzfälle

Die konkreten Links und Zuordnungen stehen direkt im maschinenlesbaren Katalog.
