# Leistungsprüfungen: Mischlast, Stresstest und reale Nutzung

Stand: 10.10.2026

## Welche Tests messen welche Situation?

| Prüfprofil | Aufbau | Aussage | Grenze |
|---|---|---|---|
| DOM-02 Extremprofil | 1.000 / 4.000 / 10.000 Textknoten, **100 %** mit Ersetzungen | Worst-Case-Durchsatz und Kosten der range-erhaltenden Ersetzung | Solche Korrekturdichten sind keine belegte typische Seitennutzung |
| DOM-02 synthetische Mischlast | 200 / 1.000 / 4.000 Textknoten, **2 %** mit Ersetzungen; unterschiedliche normale Sätze, geschütztes Code- und Eingabefeld | Verhältnis zwischen Scan-Overhead und tatsächlichen Ersetzungen unter einer sparsamen Testannahme | Die **2 % sind frei modelliert** und keinesfalls eine gemessene durchschnittliche Gender-Marker-Häufigkeit |
| Browser-Videolast | Lokales 30-FPS-WebM, 8 Sekunden Beobachtung, 480 Elemente und bis zu 48 Änderungen alle 50 ms | Dekodieren plus außergewöhnlich hohe DOM-Mutationslast (bis ca. 960 betroffene Elemente/Sekunde) | Stresstest; keine echte Streamingseite, kein 60-FPS- oder Hardware-Decoder-Vergleich |
| Externe Real-Web-Stichprobe | Frische headless Chromium-Sitzungen ohne/mit Erweiterung, drei Scrollpositionen, 3,5 Sekunden Beobachtung, DOM-Marker und Long Tasks | Frühe Integrationssignale auf wechselnden realen Webseiten | Keine längere Sitzung, kein echtes Nutzer-Klickmuster, keine repräsentative Seitenverteilung, externe Videoframes unter CI ggf. nicht verfügbar |
| Regel- und DOM-Regression | Lokale Tests und echte Chromium-/Firefox-Smokes | Funktionelle Korrektheit, schützenswerte Bereiche, Textauswahl | Kein Beweis für unmerkliche Performance auf echter Endnutzerhardware |

## Messinterpretation

Das 100-%-Profil wurde vor und nach dem Range-Schnellpfad unter identischen Bedingungen gemessen. Es hat echte Optimierungswirkung gezeigt, aber keine allgemeine Ladezeit- oder Videoverbesserung bewiesen.

Die neue Mischlast benutzt dieselbe native Browsertreiber- und A/B-Reihenfolge wie das Stressprofil. Beide Quellstände verwenden Paketversion `0.7.2`. Der Vergleich betrifft weiterhin nur `DomProcessor.start()`, **nicht die vollständige Erweiterung**. DOM-Aufbau und Einrichten der Testseite liegen außerhalb der Zeitmessung.

## Noch notwendige praxisnahe Release-Gates

1. **Erweiterung installiert:** Auf realen Seiten und kontrollierten Fixtures mit 0 %, wenigen und vielen relevanten Markern denselben Browser wiederholt mit/ohne Add-on vergleichen; Initialscan, Navigation, Scrollen, Klicks und dynamisch nachgeladene Inhalte getrennt beobachten.
2. **Interaktionslatenzen:** P95/P99 der Eingabe- und Renderlatenzen sowie Long Tasks auf durchschnittlicher und schwächerer Hardware messen. Die bisherigen CI-Linux-Runner ohne reale Nutzerinteraktionen reichen dafür nicht.
3. **Video:** 30/60 FPS, längere Wiedergabe, unterschiedliche Codecs und Player, aktivierte dynamische Untertitel und gleichzeitige Seitenmutationen in wiederholten gepaarten Läufen messen; P95/P99-Frameabstände, zusätzliche Drops, Stalls und Cue-Latenzen auswerten.
4. **Ausfallverhalten:** Ist die Korrektur zu teuer, aufschieben bzw. begrenzen. Video und Bedienbarkeit sind wichtiger als eine sofortige Korrektur einzelner Untertitel.
5. **Freigabekriterium:** Keine belastbar reproduzierbare zusätzliche Verschlechterung durch das Add-on. Die bisherige `0.8`-Frame-Callback-Ratio und weiten Gap-Toleranzen bleiben als zu schwaches bestehendes Gate markiert; sie sind **keine** abschließende Freigabe.

Die unabhängige Revalidierung und Issue #419 bleiben bis zum vollständigen Nachweis **NO-GO**. Weder Stress- noch Mischlastwerte allein sind als Endanwender-Latenz oder allgemeine Webseiten-Performance zu deklarieren.
