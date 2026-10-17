# Eigene Renderer-I/O-Zähler und native Wartezeiten, 17.10.2026

[Run 38994230601](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/38994230601) auf Diagnosecommit `af72ab82b1059686272175bbac9b0484b1ec7524` ist **rot**. Vier vorab festgelegte frische Runner prüfen je ein 60-FPS-Paar, zwei je Rollenreihenfolge. Ein Erweiterungslauf überschreitet mit 316,6 ms das unveränderte 300-ms-Frame-Gate. Kein Bestätigungsversuch und keine Wiederholung nach diesem Gegenbefund. Der Produktstand entspricht dem getrennt geprüften aktuellen PR-Baum; es gibt keine neue Erweiterungslaufzeitänderung.

Alle acht Rollen erreichen 480 korrekte Endtexte und haben ausschließlich sichtbar/fokussiert beobachtete Videocallbacks. Ausgehandelt wird System-Chromium `155.0.8059.0`; eine abweichende Browserfassung würde vor der Messung abgewiesen. Videoquelle und vorhandene 60-FPS-Gates bleiben erhalten. Die erste Aufbauversion scheiterte vor der Wiedergabe an fehlendem FFmpeg; dieser ungültige Vorlauf ist kein Produktbefund. Nach Ergänzung des bestehenden Medienwerkzeug-Schritts ist die Quelle mit FFprobe als 60 FPS geprüft.

| Reihenfolge / frischer Runner | Drops Basis/Erweiterung | Maximaler Callbackabstand Basis/Erweiterung |
| --- | --- | --- |
| Basis zuerst / 1 | 6/2 | 100,0/166,7 ms |
| Basis zuerst / 2 | 1/1 | 33,5/**316,6 ms** |
| Erweiterung zuerst / 1 | 1/1 | 33,5/149,9 ms |
| Erweiterung zuerst / 2 | 1/1 | 33,5/83,4 ms |

## Zusätzliche Beobachtung

Der vorhandene begrenzte Monitor liest ausschließlich eigene Renderer, prüft Prozess-/Threadidentitäten und behält seine 50-ms-Abstände, das Workerfenster 300–2.000 ms und die Begrenzung auf 32 native Positionsabfragen. Neu sind die eigenen Prozesszähler `read_bytes` und das ohnehin zugängliche Threadfeld für I/O-Wartezeitticks. Es gibt keine Dateicacheabfrage, Vorladung, Rechteausweitung oder Änderung einer Kernelkonfiguration. Der Trace beginnt wie im historischen Aufbau erst 500 ms nach Navigation.

Im roten Erweiterungslauf:

- 13 stabile D/folio-Proben mit nicht präsenter Befehlsseite;
- 69 zusätzliche Major Faults in den begrenzt beobachteten Threadzählerintervallen;
- 4.648.960 zusätzliche gemeldete Prozess-Lesebytes insgesamt;
- zwölf umgebende Prozesszählerintervalle mit Folio-Warteprobe und steigendem Lesezähler, zusammen 4.489.216 Bytes;
- native Maximalwandzeiten `V8.OptimizeCode` 310,509 ms, `V8.OptimizeBackground` 395,507 ms und `V8.GC_TIME_TO_SAFEPOINT` 148,474 ms. Die jeweiligen maximalen CPU-Zeiten sind 1,461/4,687/0,024 ms. Wandzeit- und CPU-Maxima werden **getrennt über die Ereignisse einer Phase** ermittelt und sind keine behaupteten exakt zusammengehörigen Ereignispaare.

Damit treten die langen nativen Phasen, fehlenden Befehlsseiten und gemeldeten I/O-Zählerzuwächse auch auf dem aktuellen Produktstand gemeinsam auf. Die Zähler gehören zu den ausdrücklich größeren umgebenden Messintervallen. Sie identifizieren weder die tatsächlich fehlende Datenseite noch die genaue Datei oder den Verursacher jedes einzelnen Stillstands. Auch mehrere unauffällige Vergleichsrollen haben Warteproben und Lesezuwächse. Eine Korrelation wird nicht als vollständiger Kausalitätsnachweis ausgegeben.

Die [Kernelbeschreibung der Prozess-I/O-Zähler](https://cdn.kernel.org/doc/html/latest/filesystems/proc.html) begrenzt deren Aussage unter anderem auf die zugrunde liegende I/O-Abrechnung. `read_bytes` ist kein Ersatz für eine Abfrage einer bestimmten Cachedateiseite. [Task Delay Accounting](https://www.kernel.org/doc/html/latest/accounting/delay-accounting.html) ist in sämtlichen acht Rollen deaktiviert. Deshalb bleiben die zusätzlichen I/O-Wartezeitdeltas ausdrücklich `null`; Null-Wartezeit wird nicht behauptet. Die reine Monitor-CPU beträgt je Rolle 1,46–4,32 Prozent einer CPU bezogen auf die beobachtete Wandzeit. Der Aufbau ist instrumentiert und keine unveränderte Performancefreigabe.

## Gefundener Exportfehler und Reichweite

Der übernommene Aggregatexporter las für die maximale Page-Long-Task-Dauer `duration` statt des tatsächlich verwendeten Felds `durationMs`. Die unveränderten Originalartefakte melden deshalb bei **positiver Taskanzahl** einen ungültigen Maximalwert von 0 ms. Diese Werte dürfen nicht als Abwesenheit oder Dauer der Tasks verwendet werden. Im roten Lauf ist genau eine Page-Long-Task gezählt; das unabhängig erhaltene CI-Videolog zeigt ihre Dauer von 311 ms. Die übrigen nicht rekonstruierbaren Maxima werden nicht erfunden.

Der Auswertungsfehler ist separat im Diagnosezweig mit Commit `c2a6afa` korrigiert und regressionsgeprüft: `durationMs=311` bleibt 311; eine fehlende Dauer bleibt unbekannt. Es wird **keine neue Messung** gestartet und kein ursprüngliches Artefakt überschrieben. Die neuen I/O- und Seitenprobenzähler sind von dieser fehlerhaften Taskmaximalwert-Auswahl unabhängig. Die Rohtraceereignisse existieren nur im Arbeitsspeicher des Runners; vor dem Schreiben werden sie auf feste Zahlenaggregate reduziert. Der zusätzliche Exportvalidator und drei ausdrücklich benannte Dateipfade schließen Profile, Prozesskennungen, Pfade, absolute Zeitmarken, Rohtraces und Medien aus.

Der rote Lauf bleibt Gegenbefund. Die getrennte reguläre PR-CI auf `ea9ac03` besteht alle acht Prüfungen; sie ersetzt diese instrumentierte rote Probe nicht. PR #451 bleibt Entwurf, #419 bleibt NO-GO. Keine Vorladung oder Compileroption wird als Produktlösung übernommen.
