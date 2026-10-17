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

## Seitenthread und zeitliche Überlappung

Zwei zusätzliche, jeweils auf zwei vorab festgelegte Produktpaare begrenzte
Diagnoseeinheiten schließen konkrete Zuordnungslücken. Die bestehenden Gates
und der Produktlaufzeitcode bleiben unverändert. Beide verwenden denselben
vollständigen Hintergrundcode mit ausgewähltem echten Regelbackend. Ein
Marker nach der Wiedergabe identifiziert den Testseitenthread im Browsertrace;
Kennungen bleiben ausschließlich im Speicher. Fehlende oder mehrdeutige
Zuordnung wird nicht als Nullmessung ausgegeben.

- [Run 39008983474](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39008983474),
  Quelle `e57625c4a4d951da55c05833d89594be13abc2e4`: beide nativen
  Seitenthread-Zeugen bestätigt, vier gültige Rollen und 1.920 korrekte Texte.
  Basis-zuerst bleibt mit nur 72,3 Prozent Videocallbacks rot (245/339;
  Drops Erweiterung/Basis 140/0; maximaler Frameabstand 233,3/33,5 ms).
  Auf dem bestätigten Seitenthread liegt eine Safepoint-Phase von 207,718 ms
  Wandzeit bei 0,025 ms CPU-Zeit **desselben Ereignisses**. Der damalige Export
  beweist keine genaue Überschneidung dieses Ereignisses mit der Videolücke.
  Die andere Reihenfolge besteht. Kein Bestätigungsversuch.
- [Run 39009180440](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39009180440),
  Quelle `c9e80e239ef556467ef34bebc31733bed3be3b35`: beide Paare bestehen,
  erneut vier gültige Rollen und 1.920 korrekte Texte. Der ergänzte Export
  verwendet tatsächliche Callback-Eintrittszeiten, Trace-Offset und gemessene
  Uhrenunsicherheit. Im Basis-zuerst-Erweiterungslauf überlappt eine
  Seitenthread-Safepoint-Phase einen Callback-Abstand über 120 ms garantiert
  um mindestens 118,701 ms; konservative obere Schranke 128,913 ms bei
  3,25 ms Uhrenunsicherheit. Die beobachtete maximale Safepoint-Dauer dieser
  Rolle ist 125,201 ms mit 0,026 ms CPU im selben maximalen Ereignis. Die
  separate Überlappungsaggregation bindet dieses Maximum nicht zusätzlich
  an genau das überlappende Ereignis. In der anderen Reihenfolge gibt es
  keinen Callback-Abstand über 120 ms. Historische rote Läufe bleiben offen.

Die Intervallrechnung exportiert nur feste Zahlenaggregate. Tests decken
Zeitoffset-Vorzeichen, unsichere Grenzfälle, getrennte Intervalle, fehlende
Callback-Eintrittszeiten, rückläufige Zeitfolgen und unveränderte Schwelle ab.
Es werden keine Rohzeiten, Threadkennungen, Profile oder Aufnahmen exportiert.

### Versionsbezogene Quellenprüfung

Der offizielle [Chromium-Tag 155.0.8059.0, DEPS](https://github.com/chromium/chromium/blob/155.0.8059.0/DEPS)
(Blob `82931b980b808e5574643e5e012100df2c3a2bd2`) referenziert V8
`17abeb50acb4563e253edebd0db09062d39c8c91`. Dessen
[safepoint.cc](https://github.com/v8/v8/blob/17abeb50acb4563e253edebd0db09062d39c8c91/src/heap/safepoint.cc)
setzt die TIME_TO_SAFEPOINT-Messung um die Safepoint-Anforderung an die
übrigen laufenden LocalHeaps und das Warten auf deren Rückmeldung. Dies
ordnet die Phase dem Synchronisationsvorgang zu, nicht der anschließenden
vollständigen Speicherbereinigung. Die Quellbindung gilt für den offiziellen
Versionsstand; sie ist kein eigenständiger Nachweis der Build-Provenienz des
Runner-Binaries. Der konkret verzögerte Hintergrundthread und der Auslöser
seiner Verzögerung bleiben unbestimmt. Eine zeitliche Überlappung ist noch
kein vollständiger Ursachenbeweis und kein nachgewiesener Produktfix.

## Aktuelle Abnahmematrix nach den Komponentenproben

Diese Matrix ergänzt die bestehende Abnahme von Issue #419; sie ersetzt weder
Gates noch den ursprünglichen Auftrag. Grün in einzelnen Diagnoseläufen ist
keine Gesamtfreigabe. Keine der folgenden Einheiten ändert Produktlaufzeitcode.

| Befund / Anforderung | Verifizierte Evidenz | Verbleibende Grenze / Status |
| --- | --- | --- |
| Langes Seitenthread-Safepoint-Warten | Marker bindet Thread; konservative Callback-Überlappung bestätigt | Ursprung des verzögerten Threads nicht vollständig kausal identifiziert |
| Worker-Seitenwarten während Seitenthread-Safepoint | Run 39009509446: je eine stabile fehlende Worker-Befehlsseitenprobe innerhalb Seitenthread-Safepoint und Optimierung desselben Workers, beide Produktrollen | Zeitliche Koexistenz, keine Identifikation des konkret blockierenden Barriere-Teilnehmers |
| Lange Optimierungsphase: synchron oder nebenläufig? | Run 39009766108: 13/14 nebenläufige Vorbereitungen mit maximal 0,101/0,94 ms; keine synchronen Unterphasen. Umfassender Scope 195,751/121,707 ms | Roter Callbackanteil 77,0 % in einem Paar bleibt gültig. Kein Funktionsname im Ereignis; kein belegter Quellfunktionsfix |
| Hauptthread-Seitenwarten innerhalb Optimierung | Run 39009957914: beide Produktrollen je drei stabile D/folio-Proben mit fehlender Befehlsseite der Browserprogrammdatei innerhalb des markierten Seitenthread-Optimierungs-Scopes | Speicher-/I/O-Warteanteil gestützt. Programmzähler ist keine behauptete exakte Fehleradresse; nachzuladende Datei-/Datenseite bleibt unbestimmt |
| Dieselbe genaue Warteklasse ohne Erweiterung? | Run 39010119067: keine Erweiterung in allen vier Rollen, aktive reale DOM-Komponente mit 7.681/7.537 Literal-Anfragen. Seitenthread-Safepoint überlappt Callback-Abstand garantiert 148,956 ms; ein stabiler Worker-Befehlsseitenbefund innerhalb Safepoint und gleicher Workeroptimierung | Safepoint-/Worker-Kombination braucht keine Erweiterungsinstallation. Hauptthread-Seitenwarten innerhalb Optimierung in dieser begrenzten Kontrolle nicht beobachtet; weder allgemein ausgeschlossen noch frühere Produktbefunde erklärt |
| Reguläres 30-FPS-Muster und Navigationstimeout | Separate vorhandene Kontrollen und automatische Fehlersicherung dokumentiert | Historische Gegenbefunde weiterhin offen; native Compilerproben erklären sie nicht rückwirkend |
| Strengere endgültige Qualitätsabnahme aus #419 | Bestehende Gates bleiben in allen Diagnoseeinheiten unverändert; Ausreißer werden erhalten | Die bestehenden 0,8-/Drop-/Gap-Gates sind laut #419 nur Sicherheitsnetz. Noch kein Nachweis der dort verlangten vollständigen verschärften Gesamt-/Plattformabnahme |

Die Läufe sind öffentlich nachvollziehbar:
[Worker](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39009509446),
[Compilerpfade](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39009766108),
[Hauptthread](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39009957914),
[ohne Erweiterungsinstallation](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39010119067).
Alle vier Einheiten haben je vier gültige, sichtbar/fokussierte Rollen mit
1.920 korrekten Endtexten. Ein roter Lauf wird durch nachfolgende grüne
Kontrollen nicht ersetzt. Zeitangaben der tatsächlichen Callback-Eintritte
und des rVFC-Renderingzeitstempels sind getrennte Größen; ihre Maxima dürfen
nicht gleichgesetzt werden. Aggregierte Überschneidungen verschiedener
Phasen werden nicht addiert und nicht ohne Episodenbindung derselben
Videolücke zugeschrieben. Keine Cachevorladung, Kernelrechte oder dauerhafte
Compilerflags werden als Produktkorrektur verwendet.

## Nachprüfung nach den Statusoptimierungen

Der Produktstand `98c80cd` begrenzt die Auswahl der veröffentlichten Ersetzungsübersicht und vermeidet bereits erfolgreich veröffentlichte identische Hintergrundzustände. Seine reguläre CI [39011606216](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39011606216) besteht alle acht Prüfungen. Das ist keine vollständige Performancefreigabe.

Die native Nachprüfung [39012047167](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39012047167) verwendet Diagnosequelle `e29131f`, deren Produktquellen gegenüber `98c80cd` unverändert sind; die vorherigen Backend-Testumschaltungen sind entfernt. Beide Reihenfolgen erreichen alle 480 Endtexte je Rolle mit gültigen Sichtbarkeits-/Fokusbedingungen. Baseline zuerst besteht; Erweiterung zuerst scheitert am Callbackanteil von 75,8 Prozent. In letzterem Paar betragen die maximalen Callbackabstände 33,4/300,1 ms, die verworfenen Bilder 1/6 und der Seiten-Long-Task-Maximalwert 265 ms.

In der roten Produktrolle liegen vier stabile fehlende Hauptthread-Befehlsseitenproben innerhalb der Optimierung und sechs entsprechende Workerproben innerhalb Seitenthread-Safepoint und Optimierung desselben Workers. Konservative garantierte Callback-Überlappungen erreichen 190,398 ms bei `V8.OptimizeCode` und 282,288 ms beim Safepoint. Das sind unabhängige Maxima; sie dürfen weder addiert noch ohne Ereignisabgleich derselben Episode zugeschrieben werden. Die Proben identifizieren weiterhin keine exakte fehlende Datenseite und keinen kausal blockierenden Barriere-Teilnehmer.

Die beiden Statusoptimierungen sind funktional und in der regulären CI verifiziert, reichen aber für diesen nativen Gegenbefund nicht aus. PR #451 bleibt Entwurf und #419 NO-GO. Versuche zur Zuordnung einer konkreten optimierten JavaScript-Funktion sind bislang nur Diagnosevorprüfungen; fehlende Compiler-Ausgabe oder ein abgebrochener Sessionstart beweisen keine gelöste Produktursache.

## Minimale Gegenprobe ohne DOM-Prozessor oder Erweiterung

Die neue Kontrolle [39026902636](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39026902636), Quelle `b8bcb7f`, reduziert die aktive Seite auf den Kontextklassifikator mit den bestehenden 18 Regelmetadaten und zwei Kontextkandidaten sowie einen kleinen synthetischen Literaladapter. Sie lädt weder `DomProcessor` noch Erweiterungs-API, Hintergrundtransport oder Lexikon. In sämtlichen vier Rollen ist die Erweiterungsinstallation durch die tatsächlichen Browserargumente ausgeschlossen. Compiler-Diagnoseflags sind in dieser Kontrolle nicht gesetzt. Der Export bezeichnet sie ausdrücklich als `classifier-literal`.

Beide Reihenfolgen bestehen die unveränderten Diagnosegates und erreichen je Rolle alle 480 Endtexte bei gültigen Sichtbarkeits-/Fokusbedingungen. Die aktive Minimalkontrolle verarbeitet 7.681 beziehungsweise 7.633 Klassifikationsanfragen. Auf ihrem exakt markierten Seitenthread ist jeweils eine `V8.OptimizeCode`-Phase von 74,746 beziehungsweise 117,797 ms erfasst; die zugehörigen CPU-Zeiten desselben Ereignisses betragen nur 0,757 beziehungsweise 0,440 ms. In beiden aktiven Rollen liegen jeweils zwei stabile fehlende Hauptthread-Befehlsseitenproben mit Browser-Executable-Zuordnung und Folio-Warten innerhalb dieser Optimierungsphase. Die maximale Callbacklücke der Minimalkontrolle beträgt 66,7 beziehungsweise 116,7 ms.

Damit ist auch diese zuvor nur im vollständigen Produkt beobachtete Hauptthread-Warteklasse ohne Erweiterung und ohne den realen DOM-Prozessor nachgewiesen. Der Klassifikator und sein Literaladapter sind weiterhin gemeinsam aktiv; der Befund weist nicht einem einzelnen JavaScript-Aufruf die fehlende Seite als Ursache zu. Er erklärt weder die größeren historischen Produktpausen noch den Navigationstimeout oder das 30-FPS-Auslassungsmuster rückwirkend. Der Vergleich über unabhängige VMs erlaubt keine Subtraktion angeblicher Erweiterungskosten. Die Gesamtfreigabe bleibt offen.

## Kontrollierter Dateizugriff und verworfener Kontextindex

Die minimale Schleifenkontrolle [39045814300](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39045814300) zeigt: Ein vorgefiltertes Array mit zwei statt 18 Regeln verhindert in dieser Minimalkontrolle den beobachteten Optimierungsstart. Das allein ist kein Produktnachweis. Im vollständigen gepaarten Produktvergleich [39046361842](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39046361842) folgt die lange native Pause der zuerst ausgeführten Rolle: alter Stand zuerst maximal 283,3 ms Callbackabstand, Index zuerst 150 ms; die jeweils zweite Rolle bleibt bei rund 33,4 ms. Der funktional getestete Kontextindex wurde deshalb nicht übernommen. Produktstand bleibt `98c80cd`.

Eine eigentumsgeprüfte Kopie derselben Browserdistribution erlaubt eine rechtmäßige read-only Seitenresidenzprobe ohne zusätzliche Kernelrechte. [39048124572](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39048124572) beobachtet auf diesem anderen Dateisystemmedium jedoch keine gesuchte lange Warteklasse. Zwei erfasste Residenzproben sind beide instabil. Eine kalte Kontrollseite beweist keine vollständig kalten Compilerseiten. Drei Jobs bestehen; ein Job scheitert an einem damals nicht weiter klassifizierten Qualitätsgate. Dieser Lauf widerlegt die Befunde auf der originalen Browserdatei nicht.

Die neue Frage lautet daher, ob gezieltes Lesen der originalen Browserprogrammdatei gegenüber gleich langer Wartezeit und gleicher Prozess-CPU-Arbeit einen Unterschied macht. Der erste Vergleich [39049330733](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39049330733) zeigte einen Unterschied, hatte aber ungleiche Vorbereitungskosten. Die anschließende Kontrolle [39050325303](https://github.com/HyperCriSiS/Sprachverstand/actions/runs/39050325303), Quelle `9cd0775`, gleicht diese ausdrücklich an: vier Bedingungen, beide Reihenfolgen, acht frische VMs. Der Dateipfad bleibt privat; die unveränderte Originaldatei wird für alle Bedingungen erst nach der Messung vollständig per SHA-256 verifiziert. Die tatsächlichen Renderer sind jeweils an diese Originaldatei gebunden.

| Vorbereitung | Zeit / Prozess-CPU vor jeder Rolle | Optimierung maximal, beide Erweiterungsrollen | Safepoint maximal | Callbackabstand maximal |
| --- | --- | --- | --- | --- |
| Unmittelbar | keine zusätzliche Vorbereitung | 143,230 / 67,501 ms | 167,821 / 34,507 ms | 183,4 / 83,4 ms |
| Nur warten | 30 s / rund 3–4 ms | 23,007 / 20,825 ms | 66,159 / 76,779 ms | 66,6 / 83,4 ms |
| Nullpuffer verarbeiten | 30 s / 2 s | 150,847 / 35,528 ms | 7,947 / 107,343 ms | 150,0 / 116,7 ms |
| Originaldatei lesen und CPU angleichen | 30 s / 2 s | 0,145 / 0,182 ms | 0,254 / 0,029 ms | 33,4 / 33,4 ms |

Alle 16 Rollen erfüllen die strengen Vorbereitungsbudgets, Fokus-/Sichtbarkeitsbedingungen, Trace-/Dateibindung und jeweils 480 korrekte Endtexte, insgesamt 7.680. Alle acht Jobs und die Quellprüfung bestehen. Beim angeglichenen Dateilesen treten weder Long Tasks noch stabile fehlende Hauptthread-/Worker-Befehlsseitenproben innerhalb der betreffenden Phasen auf. In den anderen Bedingungen bleiben solche Befunde erhalten: unmittelbar Hauptthreadproben 2/1, Nullpuffer 3/0; nur Warten je eine Workerprobe innerhalb Safepoint und Optimierung desselben Workers. Einzelne Maxima werden nicht addiert und unabhängige VMs nicht als Erweiterungskosten voneinander abgezogen.

Damit ist in dieser kontrollierten Reihe ein Einfluss des gezielten Browserdateizugriffs auch nach Zeit-/CPU-Angleichung belegt. Das stützt Browser-/Host-I/O bei der Bereitstellung ausführbaren Codes. Der genaue Cachelayer, die nachzuladende Datenseite und ein konkret blockierender Barriere-Teilnehmer sind weiterhin nicht identifiziert. Diese Diagnose führt weder Dateivorladung, Wartezeit, Compilerflags noch gelockerte Gates als Produktfix ein. Historische 300-ms-Pausen, das 30-FPS-Muster und der Navigationstimeout sind dadurch nicht rückwirkend vollständig erklärt. Insbesondere enthält diese Reihe keine getrennten Messzeiten für Sitzungserzeugung und Navigation. Die endgültige Qualitäts-/Plattformabnahme bleibt offen; PR #451 bleibt Entwurf, #419 NO-GO.
