# Gezielte 30-FPS-Gegenproben, 17.10.2026

Die reguläre CI auf PR-Head `708cf05` scheitert weiterhin an ihrem Videogate: Basis/Erweiterung 3/45 verworfene Frames, 42 lokalisierte Quellframeauslassungen ausschließlich Restklasse 2 modulo 3. Navigation, Interaktion und 10.866 Kerntests bestehen. Der tatsächlich geprüfte synthetische CI-Baum ist `a4cf87719a5566e24f38c6a5f58090310efb9d82`. Die vollständige Framefolge dieses alten Laufs wurde nicht als Artefakt gesichert und ist nach Ende des Runners nicht wiederherstellbar. Die folgenden Kontrollen ändern diese rote Abnahme nicht rückwirkend.

## Seiteneigene Korrektur ohne Erweiterung

[Run 38991152482](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38991152482), Diagnosecommit `3d481c618d199c8ba613ffe415f62ffef147d9ab`, vergleicht eine kleine seiteneigene Literaltextkorrektur ohne installierte Erweiterung mit dem tatsächlichen Produkt. Beide Implementierungen laufen jeweils in beiden Rollenreihenfolgen, drei vorab festgelegte Paare je Bedingung. Alle zwölf Paare bestehen die unveränderten Vergleichsgrenzen. Verworfene Frames Basis/Zweitrolle:

| Korrektur | Basis zuerst | Zweitrolle zuerst |
| --- | --- | --- |
| Seiteneigene Literaltextkorrektur | 0/2, 0/1, 1/0 | 1/1, 0/1, 2/2 |
| Sprachverstand | 0/0, 1/1, 0/1 | 0/1, 1/0, 0/1 |

Die installierten Erweiterungsargumente werden geprüft; bei der Literaltextkontrolle ist auch die zweite Rolle tatsächlich ohne Erweiterung. Zähler bestätigen sämtliche erwarteten Korrekturen. Alle 24 Sitzungen haben 480 korrekte Endtexte und während der gemessenen Framecallbacks Fokus und Sichtbarkeit. Diese Reihe nutzt ausdrücklich aktiviertes Browserfenster und passive Zeitbeobachtung; sie reproduziert den alten starken Aussetzer nicht und beweist dessen Ursache nicht.

## Fensteraktivierung und passive Beobachtung

[Run 38991768806](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38991768806), Diagnosecommit `5181cc3e38883fac97982fe001bf0d575445baab`, kreuzt ausdrücklich aktiviertes Fenster mit zusätzlicher passiver Beobachtung. Vier Bedingungen, je drei frische Produktpaare in der vorab festgelegten Reihenfolge Basis zuerst / Erweiterung zuerst / Basis zuerst. Ein einmaliger anfänglicher Fokus-/Sichtbarkeitsschnappschuss ist in allen Bedingungen enthalten. Nur die passive Variante beobachtet Long Tasks und Fokus/Sichtbarkeit pro Frame.

| Fensteraktivierung | Passive Beobachtung | Verworfene Frames Basis/Erweiterung |
| --- | --- | --- |
| Standard | Aus | 4/1, 1/1, 1/0 |
| Standard | An | **81/1**, 1/1, 1/1 |
| Ausdrücklich | Aus | 3/1, 0/0, 1/1 |
| Ausdrücklich | An | 0/1, 1/1, 1/1 |

Alle relativen Vergleichsgates und alle 480 Endtexte je Sitzung bestehen. Dies bedeutet keine durchgehend fehlerfreie Wiedergabe: Die erste **Basis ohne Erweiterung** verwirft 81 Frames. Ihre vollständige synthetische Folge lokalisiert 77 Quellframeauslassungen, 31 in Restklasse 0 und 46 in Restklasse 2. In Mediensekunden 0–3 fehlen jeweils 9/10/10/10 Frames ausschließlich in Restklasse 2; gegen Sekunde 4 wechselt die Phase, Sekunden 5–7 haben 10/10/9 Auslassungen in Restklasse 0. Damit ist ein anhaltendes Dreiermuster bei derselben 30-FPS-Quelle nun auch ohne Erweiterung belegt. Es ist keine identische vollständige Signatur des alten ausschließlich in Restklasse 2 liegenden Produktlaufs und kein nativer Ursachenbeweis.

Diese auffällige Basis bleibt bei sämtlichen beobachteten Framecallbacks sichtbar und fokussiert. Ihr maximaler Callbackabstand beträgt 83,4 ms, kein Abstand überschreitet 120 ms. Ein einzelner Long Task beginnt bei 205,1 ms und dauert 52 ms; die erste beobachtete Videoframeantwort erfolgt erst danach. Er erklärt nicht allein das fortgesetzte Muster über acht Mediensekunden. Einzelne andere Sitzungen beginnen noch unfokussiert und sind später fokussiert; auch die ausdrückliche Aktivierung garantiert somit keinen Fokus bereits beim ersten Fixture-Skript. Kein stabiler kausaler Einfluss der beiden untersuchten Faktoren ist bewiesen.

## Reichweite

Beide Reihen verwenden den unveränderten 30-FPS-Quellclip (dekodiert 7.247 Bytes, SHA-256 `13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd`), 50-ms-Mutationstakt und bestehende Gates. Ausgehandelt wurden Chromium `155.0.8059.0` und Treiber `155.0.8059.39`; diese Werte werden nicht für den früheren Lauf ohne Versionsaufzeichnung erfunden. Keine automatische Wiederholung eines roten Paars in diesen Diagnosezweigen. Exportiert werden ausschließlich streng gefilterte synthetische numerische Frame-/Zeitwerte; keine nativen Traces, Medienaufnahmen, Profile, Seiteninhalte oder Sitzungskennungen.

Ein bereits früherer lokaler Windows-Aufbau besteht seine Funktions-/Filterkontrolle, scheitert jedoch mit 0/8 Drops am unveränderten Vergleichsgate. Seine fünf nicht lokalisierbaren Auslassungen sind gesonderte Evidenz und erklären den Linuxlauf nicht. Historische V8-/GC-/Navigationsbefunde bleiben ebenfalls offen. PR #451 bleibt Entwurf, #419 bleibt NO-GO. Aus diesen Gegenproben folgt weder eine neue Produktkorrektur noch eine Lockerung der Videogrenzen.

## Erhaltung regulärer Gegenbefunde

Der reguläre Videorunner schreibt zusätzlich den Quellhash, die Bildrate und ausschließlich die Versionsnummern aus den ohnehin vorhandenen Sitzungskapazitäten in seine lokale Paardatei. Keine zusätzliche Browserabfrage oder Beobachterverbindung während der Wiedergabe. Nach fehlgeschlagenem Chromium-Videoschritt filtert `scripts/sanitize-video-failure.mjs` ausschließlich die zwei bekannten 30-FPS-Paardateien. Die CI lädt nur die beiden ausdrücklich benannten bereinigten JSON-Pfade hoch, wenn die Filterung erfolgreich war und Dateien vorliegen. Fehlerstatus und Vergleichsgrenzen bleiben unverändert. Nicht beobachtete Long Tasks und Framefokuswerte bleiben ausdrücklich unbekannt; finale Sichtbarkeit ersetzt keine durchgängige Beobachtung. Ein Fehler vor Abschluss eines Paars erzeugt weiterhin keine erfundene Framefolge.

Gezielte Regressionstests prüfen Quellenbindung, Messwertgrenzen, Kennungs-/Textentfernung, Versionsfilterung, unbekannte Beobachtungen, feste Exportpfade und Überschreibschutz. Die gesamten sechs neuen Tests und 17 bestehende Navigationsdiagnosetests bestehen lokal; Typecheck und Veröffentlichungsaudit bestehen ebenfalls. Das ist eine Abnahme der Sicherung, keine Behebung der Browseraussetzer.
