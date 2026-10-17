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

## Reale DOM-Komponente ohne installierte Erweiterung

Der [Komponentenvergleich 39007368580](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39007368580) auf `8943bed` verwendet vier vorab festgelegte frische Runner: reale DOM-Komponente mit einem minimalen asynchronen Literal-Ergebnislieferanten versus tatsächliches Produkt, jeweils in beiden Rollenreihenfolgen. Die No-Addon-Variante lädt denselben `DomProcessor`, dieselben DOM-Regelmetadaten, Kandidatenprüfung und Standardoptionen wie das Produkt. Sie lädt keine Erweiterungs-API, keinen Hintergrundtransport und kein allgemeines Lexikon. Sie ist somit umfangreicher als die frühere kleine MutationObserver-Literalprobe, aber kein vollständiger Ersatz des Produktpfads.

Die Browserargumente bestätigen in sämtlichen No-Addon-Rollen das Fehlen der Sprachverstand-Installation; die Produktrolle verlangt dagegen den tatsächlichen Installationspfad. Ein gemeinsamer Bundle-Hash und die aufgezeichneten Browser-/Treiberversionen binden die Kontrollen an ihre Quellen. Der Komponentenbuild verwendet wie der Produktbuild eine unminifizierte ES2022-IIFE. Vor der Messung bestehen Fixture-Syntaxprüfung, 480 Korrekturen mit geschütztem Code/Eingabefeld und vollständiger Wiederherstellung sowie die Export-/Unbekanntwerttests. Alle acht nativen Rollen erreichen 480 korrekte Endtexte mit ausschließlich sichtbar/fokussiert beobachteten Callbacks.

| Zweitrolle / Reihenfolge | Installierte Erweiterung | Max. Callbackabstand der Zweitrolle | Max. Page-Long-Task | Stabile fehlende Befehlsseitenproben |
| --- | --- | --- | --- | --- |
| Reale DOM-Komponente / Basis zuerst | Nein | 100,0 ms | 103 ms | 7 |
| Reale DOM-Komponente / Zweitrolle zuerst | Nein | 183,4 ms | 171 ms | 14 |
| Produkt / Basis zuerst | Ja | 450,0 ms | 212 ms | 18 |
| Produkt / Zweitrolle zuerst | Ja | 416,7 ms | 198 ms | 18 |

Die beiden Komponentenpaare bestehen die bestehenden Vergleichsgates. Die beiden Produktpaare bleiben **rot**: einmal fünf zusätzliche Abstände über 120 ms, einmal nur 67,7 Prozent der Baseline-Callbacks. Es gibt keinen Bestätigungs- oder Wiederholungslauf. Die No-Addon-Komponente ist tatsächlich aktiv: 7.633 beziehungsweise 7.393 Transformationsanfragen mit jeweils einem erkannten Literalmarker, jeweils 481 aktuell gemeldete Ersetzungen. Die konfigurierte 50-ms-Mutationslast bleibt gleich; ausgeführte Arbeit und Timerfortschritt dürfen wegen der Pausen nicht pauschal als identisch behauptet werden.

Auch ohne Erweiterung sind die zuvor untersuchten nativen Phasen vorhanden: maximale `V8.OptimizeCode`-Wandzeiten 77,426/167,662 ms, Hintergrundoptimierung 327,822/389,857 ms und Safepoint-Warten 102,033/169,837 ms. Die jeweiligen CPU-Maxima bleiben gering; auch hier sind Wall-/CPU-Maxima getrennte Ereignismaxima. Die eigenen gemeldeten Lesezähler steigen um 4.722.688/5.300.224 Bytes, mit 68/87 zusätzlich beobachteten Thread-Major-Faults. Das belegt diese Phasenklasse bei der DOM-Komponente samt Literal-Ergebnislieferant **ohne** installierte Erweiterung. Es identifiziert keine genaue fehlende Datei und beweist weder, dass allein der DOM-Prozessor noch dass der Hintergrundtransport die vollständigen längeren Produktpausen verursacht.

Im vollständigen Produkt sind Safepoint-Maximalwandzeiten 374,122/406,368 ms und Hintergrundoptimierung 1.051,066/733,602 ms erfasst. Der Unterschied ist ein Ansatz zur weiteren Komponententrennung, keine kausale Kostensubtraktion zwischen unterschiedlichen VMs. Der korrigierte Long-Task-Exporter ist hier von Beginn an aktiv; die früher ungültigen Nullmaxima werden nicht weiterverwendet. Die reine Monitor-CPU liegt in den vier Zweitrollen bei 3,19–4,02 Prozent einer CPU bezogen auf Wandzeit. Nur feste Zahlenaggregate werden exportiert, keine Rohtraces, Profile, Prozesskennungen oder Medien.

Der frühere Vorlauf `39007224979` auf `eb507de` scheiterte vor der Videomessung: Der Linux-esbuild-Binärstart wurde fälschlich über Node aufgerufen. Die portable JavaScript-API korrigiert den Aufbau in `8943bed`; aus dem ungültigen Vorlauf wird kein Produktbefund abgeleitet. Produktlaufzeitcode und Berechtigungen bleiben unverändert. PR #451 bleibt Entwurf, #419 NO-GO.

## Matched background backend comparison, 17 October 2026

Run [39008606568](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39008606568)
completed successfully on diagnostic source `35508e7f77073a531b0caa7990dc4e473f30983b`.
Four fresh jobs compare literal/rules backends in both pair orders. All existing
60-FPS gates remain unchanged, with no automatic confirmation run. All eight
roles are visible/focused, diagnostically complete, and reach 480/480 correct
texts (3,840 total). Twelve strictly filtered aggregate files are retained locally.

The extension packages have identical content scripts, manifests, UI and assets.
Both background scripts retain the complete rules and lexicon initialization;
the complete bundled body is identical, with SHA-256
`d064d90b72828203eebeaf6246ebc0e2e2464aca083a7b737369ef9cf06d2ec0`.
Only a runtime selector banner differs. Before each session the runner checks
selector, full background hash, common body hash and selected installation path.
The browser command-line check confirms the extension in the second role and
its absence in the baseline. Baseline backend metadata describes the intended
paired package, not an installed baseline extension.

| Backend | Pair order | Maximum callback gap baseline/extension (ms) | Maximum page long task baseline/extension (ms) | Drops baseline/extension |
| --- | --- | --- | --- | --- |
| Literal | baseline-first | 33.5 / 133.3 | 0 / 67 | 2 / 1 |
| Literal | extension-first | 33.4 / 166.6 | 0 / 0 | 4 / 1 |
| Rules | baseline-first | 83.3 / 66.6 | 0 / 75 | 0 / 2 |
| Rules | extension-first | 50.1 / 149.9 | 57 / 91 | 3 / 2 |

There is no consistent literal-backend advantage in this bounded sample.
This supplies no supported product fix based on replacing or simplifying the
general rule execution. Independent VM/browser I/O states prevent interpreting
the differences as a quantified rule cost. Both variants retain lexicon startup,
so the comparison does not isolate that initialization. All-green outcomes do
not invalidate earlier red runs or close their unresolved causes. No product
runtime change or overall performance acceptance follows from this experiment.
