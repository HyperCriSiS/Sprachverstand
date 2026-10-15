# Changelog

Alle wesentlichen Änderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## Unveröffentlicht

### Hinzugefügt

- Die Videodiagnose unterscheidet ausgelassene Callback-Benachrichtigungen
  von fehlenden Quellframes im Präsentationszähler des Browsers. Eindeutig
  lokalisierbare Auslassungen werden nach ihrer Position im Dreierzyklus
  ausgewertet; die bestehenden Performancegrenzen bleiben erhalten.

- Die Videoregression prüft nach dem bestehenden Nachlauf alle 480 dynamischen
  Texte auf den neuesten erwarteten Stand. Fehlende, veraltete oder nicht
  korrigierte Texte verhindern ein erfolgreiches Performanceergebnis.
- Ein ausdrücklicher manueller Videodiagnosemodus erfasst getrennt den
  Fortschritt von Seitentasks, Animationsframes und Videoframes. Begrenzte
  Beobachtungsfenster verhindern Aussagen aus fehlenden, abgeschnittenen
  oder bereits beendeten Messreihen. Der aktive Animationsbeobachter bleibt
  von der bisherigen passiven Diagnose und der normalen CI getrennt.
- Untertitel-Overlays werden zentral erkannt und standardmäßig von der
  Verarbeitung ausgenommen. Eine neue, standardmäßig deaktivierte Option
  erlaubt ihre gezielte Korrektur.

### Korrigiert

- Volle Pakete mit 32 normalen Textanfragen warten nicht mehr zusätzlich
  auf den 8-ms-Sammeltimer. Kleine Pakete behalten ihr Sammelfenster;
  Untertitelpriorität, Paketgrößen und Nebenläufigkeitsgrenzen bleiben erhalten.

- Browserprüfungen begrenzen auch ausbleibende oder unvollständige
  WebDriver-HTTP-Antworten. Der Smoke-Test begrenzt seine Seitennavigation
  auf 30 Sekunden; ausdrücklich lange Untertitelproben behalten ein
  passend längeres Antwortzeitlimit.
- Die Videountertitelprobe wartet nach dem Ausschalten innerhalb ihres
  bestehenden Zeitlimits auf Medien- und Cue-Fortschritt. Eine schnelle
  Wiederherstellung desselben Cues wird nicht mehr als Unterbrechung gewertet.

### Leistung

- Einzelne Wortänderungen in begrenzten Textknoten überspringen bei Korrektur
  und Rückgabe die vollständige Tokenplanung. Textmarkierungen bleiben
  erhalten; große Texte und Änderungen an mehreren Wörtern werden weiterhin
  in begrenzten Schritten verarbeitet.
- Leere Arbeitswarteschlangen erzeugen bei der budgetierten DOM-Verarbeitung
  keine kurzlebigen Map-/Set-Iteratoren mehr. Text-, Untertitel- und
  Rückgabereihenfolge bleiben erhalten.
- Große Folgen einzelner DOM-Strukturänderungen werden in begrenzten
  Schritten verarbeitet. Die synchrone Rückgabe entfernter Texte teilt
  sich ein Budget über den gesamten Meldungsblock; Untertitel behalten
  ihren unmittelbaren Pfad und vollständige Originale bleiben erhalten.
- Große gemeinsame Schutzlisten und eigene Ersetzungen werden innerhalb einer
  lokalen Textcharge nur einmal übertragen. Kleine und unterschiedlich
  konfigurierte Anfragen behalten ihr bisheriges Format; individuelle Kontexte,
  Schutzbereiche und die Validierungsgrenzen bleiben erhalten.
- Identische Einstellungen sowie reine Popup- oder Sync-Auswahländerungen
  lösen keine vollständige DOM-Rückgabe und Neuverarbeitung mehr aus.
  Änderungen an Textregeln, Schutzbegriffen, Domains und Textoptionen
  werden weiterhin angewendet; fehlgeschlagene Übergänge bleiben wiederholbar.
- Verbindliche lokale Einstellungen warten nicht mehr auf eine dafür
  unerhebliche Antwort des Sync-Speichers. Einstellungsänderungen werden
  bereits während des Starts beobachtet; überholte Leseantworten und
  Antworten nach dem Abmelden werden nicht mehr angewendet.
- Auch die erneute Prüfung grammatischer Folgekontexte nach Seitenänderungen
  läuft in begrenzten Schritten. Normale Antworten warten auf diese Prüfung;
  Untertitel bleiben priorisiert. Wiederholte Textänderungen desselben
  Ankers übernehmen den neuesten Kontext statt zusätzliche Scans anzuhäufen.
- Lange grammatische Kontextsuche vor einer lokalen Textanfrage wird in
  begrenzten Schritten vorbereitet. Vollständiger Kontext und Schutzregeln
  bleiben erhalten; Änderungen während der Vorbereitung verwerfen den alten
  Stand. Untertitel behalten ihren eigenen priorisierten Anfragepfad.
- Leere Inline-Nachbarn werden bei grammatischer Kontextsuche und ihrer
  erneuten Auswertung ohne zusätzliche TreeWalker verarbeitet. Leere
  Blockgrenzen und geschützte Inhalte behalten ihre bisherige Bedeutung.
- Auch die Vorbereitung der schrittweisen Wiederherstellung großer Seiten
  erfolgt jetzt innerhalb des Arbeitsbudgets. Verfolgte Originale werden
  ohne vollständige synchrone Kopie übernommen; fremde Änderungen und
  bereits begonnene Rückgaben bleiben erhalten.
- Wo die Browser-API verfügbar ist, setzt die Wiederherstellung ihre kurzen
  Arbeitsschritte mit Hintergrundpriorität fort und vermeidet wiederholte
  Mindestwartezeiten verschachtelter Timer. Andere Browser und fehlgeschlagene
  Task-Anfragen behalten den Timerpfad.
- Untertitelanfragen werden nach demselben Verarbeitungsschritt gebündelt,
  ohne auf das acht Millisekunden lange Sammelfenster für normale Texte zu
  warten. Die bestehenden Größen- und Parallelitätsgrenzen bleiben erhalten.
- Wiederkehrende Untertitel verwenden den begrenzten Cache auch bei lokaler
  Hintergrundverarbeitung. Veraltete Antworten und Ergebnisse aus früheren
  Einstellungen werden nicht wiederverwendet.
- Bei aktivierter Untertitelverarbeitung bleibt ein kleiner Anfragenplatz für
  neue Untertitel frei. Untertitel erhalten eigene lokale Batches, damit ihre
  Antworten nicht auf normale Texte im selben Batch warten müssen.
- Große Listen neu eingefügter DOM-Knoten werden in begrenzten Schritten
  eingereiht. Neutrale Textblätter erzeugen keine unnötigen Traversals;
  gleichzeitig eintreffende Untertitel behalten ihren eigenen priorisierten Pfad.
- Große Entfernungen mit wenigen veränderten Texten setzen nur die tatsächlich
  verfolgten Einträge zurück. Neutrale Textblätter lösen keine wiederholte Suche
  durch die gesamte Änderungsübersicht aus; vollständig entfernte offene
  Einfügelisten werden verworfen.
- Auch das Verwerfen bereits abgetrennter Warteschlangenknoten und die Suche
  hinter verzögerten Texten werden in begrenzten Schritten fortgesetzt.
- Webseitenverarbeitung, Textrückschreibung und Wiederherstellung werden in
  kurze Arbeitsschritte aufgeteilt. Lokale Hintergrund-Batches übernehmen die
  Sprachregeln; Untertitel erhalten Vorrang. Regelvorfilter, Suffixindizes und
  begrenzte Kontextsuche reduzieren wiederholte Arbeit. Ersetzungszähler werden
  inkrementell gepflegt. Die Performanceabnahme unter hoher dynamischer Last
  ist weiterhin offen; diese Änderungen bedeuten keine Releasefreigabe.
- Schnell wechselnde Untertitel werden pro Bild auf den zuletzt sichtbaren
  Textstand reduziert. Identische Zeilen verwenden einen begrenzten Cache;
  der normale Webseitenpfad bleibt unverändert.

## 0.6.6 (2026-08-02)

### Hinzugefügt

- 90 einzeln geprüfte Personenbezeichnungen mit sicheren Singular- und
  Pluralzielen, darunter unveränderte Plurale, schwache Flexionen,
  Sonderplurale und Binnen-I-Singularformen.
- Sichere Artikel-Adjektiv-Ketten wie `der:die neue Lehrer:in`,
  `den:die fleißige:n Schüler:in` und
  `ein*e gut ausgebildete*r Jurist*in`.
- Weitere explizite Formen wie `jene:r Nutzer:in`, `Arzt:Ärztin`,
  `Kolleg:en:innen`, `Pat*innenschaft` und `Themenpat*in`.

### Korrigiert

- Unvollständige Teilkorrekturen hinter femininen oder markierten Artikeln
  werden auch bei zwischengeschalteten Adjektiven verhindert.
- Neue `v…`-Tags lösen automatisch einen vollständigen Release-Build mit
  Chromium-ZIP, Firefox-XPI, Quellarchiv und Prüfsummen aus.

## 0.6.1 – RC2 (2026-07-29)

### Korrigiert

- **Speichern** und **Zurücksetzen** befinden sich nun oben in derselben Werkzeugleiste wie **Alle öffnen** und **Alle schließen**.
- Die beiden Schaltergruppen sind auf Desktop-Breiten bündig ausgerichtet und werden auf schmalen Ansichten übersichtlich untereinander dargestellt.
- Die bisherigen doppelten Speicher- und Rücksetzschalter am unteren Ende der Einstellungsseite wurden entfernt.
- Ein Layouttest und zusätzliche CI-Prüfungen sichern die Position aller vier Schaltflächen ab.

### Veröffentlichung

- RC2 ersetzt RC1 als finalen Veröffentlichungskandidaten unter dem unveränderlichen Tag `v0.6.1-rc.2`.
- Chromium-Paket, unsigniertes Firefox-XPI, Quellarchiv, Prüfsummen und `SOURCE_COMMIT.txt` werden erneut aus demselben finalen Commit erzeugt und geprüft.

## 0.6.1 – RC1 (2026-07-29)

### Geändert

- Alle Bereiche der erweiterten Einstellungen sind einzeln ein- und ausklappbar; globale Schalter öffnen oder schließen sämtliche Bereiche.
- Die Einstellungsbereiche wurden neu geordnet. **Einstellungen sichern und übertragen** steht vorletzte Position, **Browser-Synchronisierung** an letzter Position.
- Die Entwicklungsabhängigkeit `jsdom` wurde auf Version 30 aktualisiert.
- Redundante versionsgebundene Beta-12-Dokumente wurden entfernt und die dauerhafte öffentliche Freigabecheckliste erweitert.

### Korrigiert

- Die Test- und Datenschutzdokumentation beschreibt nun präzise, wann die Synchronisierungsauswahl übertragen wird und wann eine leere Auswahl als Deaktivierungsmetadatum verbleibt.
- Die RC-Testanleitung enthält `SOURCE_COMMIT.txt` nur einmal und verwendet die tatsächlichen RC1-Paketnamen.
- Regressionstests sichern zusätzlich `Praktiker*innen` zu `Praktiker` und `Mediziner*innen` zu `Mediziner` ab.

### Veröffentlichung

- CI und Release-Workflow erzeugen unveränderliche RC1-Pakete unter dem Tag `v0.6.1-rc.1`.
- Chromium-Paket, unsigniertes Firefox-XPI, Quellarchiv, Prüfsummen und `SOURCE_COMMIT.txt` werden erneut aus demselben finalen Commit erzeugt und geprüft.

## 0.6.1 – Beta 12 (2026-07-28)

### Hinzugefügt

- Fein gegliederte optionale Browser-Synchronisierung für sechs Datenkategorien; standardmäßig ist keine Kategorie ausgewählt.
- Die Synchronisierungsauswahl wird als eigener Metadatenschlüssel übertragen; ausgewählte Kategorien liegen zusätzlich in getrennten `storage.sync`-Schlüsseln.
- Strikte Größenprüfung vor dem Synchronisieren.
- Backup-Schema 2 mit Synchronisierungsauswahl und vollständiger Importvalidierung.
- `SECURITY.md`, öffentliche Freigabecheckliste und reproduzierbare AMO-Build-Anleitung.

### Geändert

- Der vollständige Einstellungsstand wird immer in `storage.local` gespeichert.
- Versionen in Paketdatei, Lockdatei und beiden Quell-Manifesten sind auf 0.6.1 vereinheitlicht.
- Datenschutz-, Store-, Architektur- und Backup-Dokumentation beschreiben die optionale Browser-Synchronisierung.
- Der Lizenzlink befindet sich nur noch in den erweiterten Einstellungen.

### Sicherheit

- Ungültige oder überlange Importdaten werden vollständig abgewiesen statt still gekürzt.
- Zukünftige Einstellungsrevisionen sowie unbekannte Felder und Kategorien werden abgelehnt.
- Domain-Ausschlüsse werden normalisiert, validiert, dedupliziert und begrenzt.
- Vorhandene GitHub-Release-Tags und Releases werden nicht überschrieben; Tag und Pakete müssen denselben Commit repräsentieren.

## 0.6.0 – Beta 11 (2026-07-28)

### Hinzugefügt

- Binnen-I-Singularformen wie `NutzerIn` werden als sichtbar markierte Formen
  erkannt. Artikel werden in sicheren Satz-, Verb-, Präpositions- und
  Einzelphrasenkontexten passend flektiert.
- Weitere flektierte Doppelnennungen mit Artikeln und Possessivformen in
  Nominativ, Akkusativ, Dativ und Genitiv.
- Eigene Regelgruppe für substantivierte Adjektive wie `Erwachsene:r`,
  `Beschäftigte:n`, `Volljährige:r` und `Vorgesetzte:r`.
- Exakt geprüfte Sonderformen wie `Rom*nja`, `Sinti*zze`, `Studentys`, `Lesys`,
  `Lehrys`, `Kollegys` und `Mitarbeitys`.
- Eigene literale Ersetzungen, vollständig getrennt von persönlichen Ausnahmen,
  lokal gespeichert, case-sensitive, nicht rekursiv und ohne Regex-Unterstützung.
- Maschinenlesbarer Flexions- und Sonderformenkatalog mit Positiv- und
  Negativregressionen.
- Stark erweitertes Flexionslexikon für häufige schwache, regelmäßige und
  unregelmäßige Personenformen.
- Lokale Lizenz- und Quelltextseite in der Erweiterung.

### Geändert

- Version auf 0.6.0 angehoben.
- Die sichtbaren Regelgruppen wurden um substantivierte Adjektive und weitere
  Sonderformen erweitert.
- README, Testanleitung und Release-Dokumentation beschreiben die neue Abdeckung
  und die getrennten eigenen Ersetzungen.

### Lizenz

- Der Quelltext steht unter `AGPL-3.0-only`.
- `TRADEMARKS.md` trennt die Rechte am Quelltext von Name, Logo und anderen
  Herkunftskennzeichen.
- `NOTICE` und die Erweiterungsoberfläche enthalten Copyright-, Quelltext- und
  Gewährleistungshinweise.

## 0.5.5 – Beta 10 (2026-07-28)

### Korrigiert

- README und Add-on verwenden dasselbe direkt eingebundene SV-Logo.
- Die statischen PNG-Symbole wurden ohne helle Außenkontur neu exportiert und
  nutzen die verfügbare Fläche besser.
- Der README-Live-Test wurde auf einen kurzen natürlichen Beispieltext reduziert;
  Sicherheitshinweise stehen in einem eigenen Abschnitt.

## 0.5.4 – Beta 9 (2026-07-28)

### Hinzugefügt

- Automatisierter GitHub-Prerelease mit geprüften Chromium-, Firefox- und
  Quellcodepaketen sowie SHA-256-Prüfsummen.
- Öffentliche Projektvorstellung mit Hinweisen zu Lesbarkeit, Datenschutz und
  Danksagung.
- Aktualisierte Roadmap und Beta-Testanleitung für die noch offenen Praxisprüfungen.

### Geändert

- Projektbeschreibung und Manifesttexte verwenden nun den Leitsatz
  **„Macht Webseiten leichter lesbar.“**
### Teststand

- Der reale Waterfox-Test und die daraus entstandenen Popup- und Icon-Korrekturen
  sind berücksichtigt.
- Offen bleiben insbesondere Firefox für Android auf echter Hardware,
  Screenreader-Tests sowie weitere reale Webseiten und Framework-Anwendungen.

## 0.5.3 – Beta 8 (2026-07-27)

### Hinzugefügt

- Ausgewählte substantivische Partizipformen werden kontrolliert normalisiert,
  darunter `Studierende`, `Lesende`, `Arbeitnehmende`, `Dozierende`,
  `Arbeitgebende`, `Fördergebende` und `Theatermachende`.
- Weitere geprüfte Formen aus der UdK-Handreichung und dem Genderwörterbuch sind
  abgedeckt: `Juden_Jüdinnen`, `Jüd*innen`, `Gegner*innenschaft`,
  `Professor*innenschaft`, `Verbündete_r`, `Pat*in`, `Dirigent*innen`,
  `Solist*innenraum`, `Pförtner*innen`, `Spender*innen` und
  `Tonmeister*innen`.
- Regressionstests schützen `trans* Personen`, `inter* Personen`,
  `Inter*feindlichkeit` und `Inter*diskriminierung` vor einer falschen
  Behandlung als Genderendung.

### Geändert

- Das Popup ist mit 384 Pixeln ungefähr 20 Prozent breiter.
- Jede Regelgruppe zeigt nur noch ein Beispiel.
- Regelkarten wurden durch kompakte Zeilen mit Trennlinien ersetzt; der
  Scrollbalken liegt direkt am rechten Rand.
- Das SV-Symbol nutzt die verfügbare Fläche ohne dekorativen Außenrahmen besser
  aus.

### Sicherheit

- Partizipformen mit erkennbarem Singularartikel, kleingeschriebene attributive
  Verwendungen und nachfolgende Substantive bleiben unverändert.
- Satzweite Umschreibungen, Passivkonstruktionen und terminologische Sterne
  werden nicht ohne eindeutige mechanische Regel verändert.

## 0.5.2 – Beta 7 (2026-07-27)

### Korrigiert

- Das Popup besitzt in Waterfox und Firefox wieder eine stabile intrinsische
  Höhe und öffnet nicht mehr als schmaler Streifen.
- Beschädigte PNG-Symbole wurden durch validierte Binärdateien ersetzt.
- Die CI prüft PNG-Signatur, Blockgrenzen, CRC32, Abmessungen und Dateiende.

## 0.5.1 – Beta 6 (2026-07-27)

### Hinzugefügt

- `PolitikerInnen` wird als eindeutig markierte Binnen-I-Form zu `Politiker`;
  die reguläre feminine Form `Politikerinnen` bleibt unverändert.
- Die optionale Umschreibungsgruppe ersetzt
  `Benutzungshandbuch` durch `Benutzerhandbuch`.
- `zehn Zuhörer*innen` ist als vollständiger Satzfall abgesichert.
- Ein maschinenlesbarer Kontextkatalog sammelt Partizip- und
  Personenumschreibungen mit Kontext, Sicherheitsbewertung und Umsetzungsstatus.

### Geändert

- Die optionale Gruppe heißt nun **Kontextgebundene Umschreibungen**.
- Einzelne Partizipformen wie `Studierende` oder `Lesende` werden außerhalb
  geprüfter Kontexte nicht mehr pauschal ersetzt.

### Datenschutz

- Der Kontextkatalog wird manuell gepflegt. Sprachverstand sammelt oder
  überträgt weiterhin keine Seitentexte.

## 0.5.0 – Beta 5 (2026-07-27)

### Hinzugefügt

- Das SV-Monogramm wird als Erweiterungssymbol und in Popup sowie Einstellungen
  verwendet.
- Alle zwölf Regelgruppen sind im Popup mit Titel und Beispiel direkt schaltbar.
- Der Seitenzähler wird über Hintergrundnachrichten live im Popup und im
  Einstellungsfenster aktualisiert.
- Gegenderte Singularformen ohne Artikel werden lexikalisch kontrolliert
  normalisiert, etwa `Makler*in`, `Ärzt_in` und `Professor/-in`.
- Schrägstrich-Bindestrich-Artikel wie `ein/-e Frisör/-in` und
  `eine/n Erzieher/-in` werden korrekt flektiert.
- Weitere Lexikoneinträge und Formen für Anfänger, Zuhörer, Freunde, Chirurgen,
  Köche und Bauern wurden ergänzt.
- Eine standardmäßig deaktivierte Gruppe ersetzt ausgewählte
  geschlechtsneutrale Umschreibungen wie `Studierende` oder `Lesende`.
- Eine standardmäßig deaktivierte Gruppe entfernt verbreitete
  Stellenanzeigen-Zusätze wie `(m/w/d)`.
- Direkt zitierte Schreibweisen können über eine separate Option innerhalb
  gängiger Anführungszeichen geschützt werden; standardmäßig werden sie weiter
  korrigiert.

### Korrigiert

- `Sehr geehrte Mitarbeitende` funktioniert auch dann, wenn das Personenwort in
  einem eigenen Inline-Textknoten liegt.
- `Sehr geehrte mitarbeitende Personen` wird zu `Sehr geehrte Mitarbeiter`.
- `Bauern_Bäuerinnen`, `Bäuer_innen`, `Koch/Köchin`, `ChirurgInnen`,
  `Freund:innen` und weitere gemeldete Formen werden erkannt.
- Neue Standardgruppen werden bei bestehenden Installationen einmalig aktiviert,
  ohne später bewusst deaktivierte Gruppen zurückzusetzen.

### Bewusste Grenzen

- `Politikerinnen` bleibt als mögliche ausdrücklich weibliche Bezeichnung
  unverändert.
- `Testpersonen`, `ärztliche Sprechstunde` und `Benutzungshandbuch` sind keine
  Genderformen und bleiben unverändert.
- Die fehlerhafte Form `Zuhörer*inne` wird nicht als automatische Tippkorrektur
  behandelt.

## 0.4.2 – Beta 4 (2026-07-26)

### Hinzugefügt

- Gegenderte Titelabkürzungen werden kontextabhängig normalisiert.
- Vor Namen und weiteren Titeln wird `Prof.in` zu `Prof.` und `Dr.in` zu `Dr.`.
- Mit eindeutig weiblichem Artikel oder alleinstehend werden die Formen zu
  `Professorin` beziehungsweise `Doktorin` ausgeschrieben.
- Die neue Funktion besitzt eine eigene, einzeln abschaltbare Regelgruppe.

### Sicherheit

- Voll ausgeschriebene weibliche Formen bleiben unverändert.
- Pluralformen wie `Prof.innen` und `Dr.innen` werden nicht durch die
  Singularregel angeschnitten.

## 0.4.1 – Beta 3 (2026-07-26)

### Hinzugefügt

- Kontextgebundene Partizipformen in eindeutigen Anreden, etwa
  `Liebe Teilnehmende` zu `Liebe Teilnehmer`.
- Schrägstrich-Bindestrich-Formen wie `Mitarbeiter/-innen` werden erkannt.

### Korrigiert

- Das Popup verwendet eine stabile intrinsische Breite und öffnet nicht mehr als
  wenige Millimeter breiter Streifen.

## 0.4.0 – Beta 2 (2026-07-26)

### Hinzugefügt

- Sieben konkrete, einzeln aktivierbare Regelgruppen ersetzen die abstrakten
  Profilnamen. Jede Gruppe enthält eine verständliche Beschreibung und ein
  Beispiel.
- Persönliche literale Ausnahmen schützen einzelne Wörter oder vollständige
  Phrasen über exakte Grenzen.
- Die Verarbeitung zugänglicher Attribute lässt sich separat ein- und
  ausschalten.
- Firefox für Android wird über `gecko_android` als Mobilziel ausgewiesen und
  durch `web-ext lint` gegen die festgelegte Mindestversion geprüft.
- Die Einstellungsseite ist für 360 × 640 dp, Touch-Bedienung und Safe Areas
  ausgelegt.
- Persönliche Ausnahmen werden lokal getrennt von den synchronisierbaren
  Grundeinstellungen gespeichert.
- Der Popup-Zähler kann den Badge-Wert auch nach einem Neustart des
  Chromium-Service-Workers wieder auslesen.

### Geändert

- Die früheren Profile `Konservativ`, `Standard` und `Aggressiv` wurden aus der
  Oberfläche entfernt. Alle aktuellen produktiven Regeln waren als `safe`
  eingestuft und unterschieden sich dadurch bislang nicht.
- Alte Einstellungen mit `disabledRuleIds` werden automatisch auf die neuen
  Regelgruppen migriert.
- Beta-Artefakte tragen den Zusatz `beta.2`.

### Mobil und Datenschutz

- Firefox erklärt im Manifest ausdrücklich, dass keine Daten gesammelt oder
  übertragen werden.
- Google Chrome für Android bleibt ausgeschlossen, da dieser Browser keine
  Erweiterungen unterstützt.

## 0.3.0 – Beta 1 (2026-07-26)

### Hinzugefügt

- Explizit gegenderte Singularphrasen werden normalisiert, wenn Artikel und
  Kasus eindeutig markiert sind, etwa `jede:r Nutzer:in` zu `jeder Nutzer`.
- Genitivformen werden lexikalisch korrekt gebildet, etwa `des:der Nutzer:in`
  zu `des Nutzers`, `des:der Student:in` zu `des Studenten` und
  `des:der Ärzt:in` zu `des Arztes`.
- Schwach deklinierte Personenbezeichnungen werden im Akkusativ und Dativ
  korrekt flektiert, etwa `eine:n Student:in` zu `einen Studenten`.
- Separator- und Binnen-I-Schreibweisen verwenden ein gemeinsames zentrales
  Lexikon für Singular- und Pluralformen.
- Punkt sowie typografische Apostrophe werden als Genderseparatoren erkannt.
- Natürlich feminine Familienformen wie `Mutter:in` werden ohne Änderung des
  grammatischen Geschlechts normalisiert.
- Explizite Singular-Doppelformen wie `Kunde/Kundin`, `Arzt und Ärztin` und
  `Tierärztin/Tierarzt` werden nur bei lexikalisch identischer Personenform
  zusammengeführt.
- Possessivartikel mit eindeutigem Kasus werden gemeinsam mit dem Substantiv
  normalisiert, etwa `mein:e Nutzer:in` zu `mein Nutzer` und
  `eure:n Pilot:in` zu `euren Piloten`.
- Explizite Pronomen- und Possessivpaare wie `er:sie`, `ihm:ihr` und
  `seines:ihres` werden auf die maskuline Form reduziert.
- Zugängliche Textattribute `alt`, `aria-label`, `aria-description` und `title`
  werden mit denselben sicheren Regeln wie sichtbare Textknoten verarbeitet.
- Der `MutationObserver` reagiert gezielt auf spätere Änderungen der
  freigegebenen zugänglichen Attribute.
- Die CI erzeugt geprüfte Chromium-, Firefox-XPI- und Quellcode-Pakete mit
  SHA-256-Prüfsummen.
- Eine lokale Beta-Testseite deckt sichtbare Texte, zugängliche Attribute,
  geschützte Bereiche und dynamische Mutationen ab.
- Änderungsumfang-Regressionen stellen sicher, dass einzelne Mutationen keinen
  erneuten Komplettscan großer Seiten auslösen.

### Korrigiert

- Genderformen am Anfang zusammengesetzter Wörter werden normalisiert, etwa
  `Nutzer:innenkonto` zu `Nutzerkonto` und `Ärzt:innenkammer` zu `Ärztekammer`.
- `Mutter:innen` und `MutterInnen` werden zu `Mütter`; entsprechende Formen für
  Tochter, Bruder und Vater wurden ebenfalls ergänzt.
- Doppelnennungen im Dativ behalten ihre Flexion, etwa
  `mit Ärztinnen und Ärzten` zu `mit Ärzten`.
- `Bauer:innen` wird zu `Bauern`, während Komposita wie
  `Messebauer*innen` korrekt zu `Messebauer` werden.
- Historische Fehlertreffer wie `Innen- und Außendienst`, `LogIn`, `AddIn`,
  `PlugIn` und `DriveIn` sind als Regressionen geschützt.

### Sicherheit

- Andere Attribute wie `value`, `placeholder`, `data-*`, IDs und URLs werden
  nicht verändert.
- Ignorierte, versteckte, editierbare und technische Attributinhalte bleiben
  unberührt.
- Ausdrücklich weibliche Personenbezeichnungen werden nicht pauschal verändert.
- Unbekannte oder mehrdeutige Formen bleiben unverändert.

## 0.2.0

### Hinzugefügt

- Manifest-V3-Builds für Firefox und Chromium
- modulare TypeScript-Regel-Engine
- sichere DOM-Verarbeitung mit `MutationObserver`
- Schutz für Eingaben, Editoren, Code und technische Inhalte
- Popup, Einstellungsseite und Domain-Ausschlüsse
- GitHub-Actions-CI für Typecheck, Tests und Builds
- konservative Pluralregeln für Genderseparatoren
- explizites Flexionslexikon für unregelmäßige Pluralformen
- Binnen-I-Unterstützung im Plural
- lexikalisch geprüfte Doppelnennungen im Grundkasus
- zentraler Regressionstest-Katalog

### Sicherheit

- keine periodischen Komplettscans
- keine unnötigen Berechtigungen
- keine Veränderung unbekannter oder mehrdeutiger Formen
- singuläre und flektierte Konstruktionen bleiben ohne sicheren Kontext
  unverändert

## 0.1.0

- technisches Grundgerüst ohne produktive Sprachregeln
