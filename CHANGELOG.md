# Changelog

Alle wesentlichen Änderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## Unveröffentlicht

## 0.9.0 (2026-10-31)

### Hinzugefügt

- `npm run setup:local-browsers` lädt die festgelegte Chrome-for-Testing-Version samt chromedriver direkt von der offiziellen Quelle nach `artifacts/local-tools/` (Windows, macOS, Linux) und prüft die Version. Lokale Live-Prüfungen brauchen damit kein gesichertes Browserpaket mehr.
- `npm run setup:local-browsers` lädt zusätzlich die festgelegte Firefox-Version (SHA256-geprüft gegen Mozillas `SHA256SUMS`) und geckodriver nach `artifacts/local-tools/`; `--only chrome|firefox` lädt gezielt.
- Neue, standardmäßig aktive Regelgruppe „Englische Lehnwörter“: „Maker:innen“,
  „Researcher*in“ oder „Creator*innen“ werden wie deutsche
  Personenbezeichnungen umgewandelt und lassen sich gesondert abschalten.

### Geändert

- Einträge in Auswahllisten (`<option>`) werden umgewandelt, wenn sie ein eigenes `value` haben: Gesendet wird dann der Wert, nicht der sichtbare Text. Optionen ohne `value` bleiben geschützt, weil ihr Text der Formularwert ist; wird `value` nachträglich entfernt, kehrt der Originaltext zurück.
- Die Kasusregeln teilen sich jetzt eine Erkennung für Satzanfang, Nebensatz,
  Hilfsverben und Präpositionen. „Zu diesem Zweck entfernt der Operateur …“
  wird dadurch richtig umgewandelt.

### Leistung

- Schnellere Textänderung im DOM-Kern: Die Prüfung vor der Bereichs-erhaltenden Änderung legt keine Kinderlisten (`childNodes`, `children`) mehr pro Textknoten an, und Elemente ohne Attribute überspringen die Untertitelprüfung. Synchroner Initialscan in Chrome 155 um 22–31 %, in Firefox 158 um 14–41 % schneller.
- Eigene Ersetzungen schalten den schnellen Vorfilter nicht mehr für die
  ganze Seite ab: Texte, die keinen eigenen Ausgangstext enthalten, werden
  wie ohne eigene Ersetzungen früh übersprungen.
- Persönliche Ausnahmen und eigene Ersetzungen werden einmal vorbereitet
  statt bei jedem Text neu sortiert und zusammengesetzt (2.000 kurze Texte
  mit je 100 Einträgen: rund 118 ms → 49 ms).
- Pale Moon: Die Regelverarbeitung ist wieder schneller als vor den
  Sprachkorrekturen der letzten Tage, neutraler Text etwa doppelt so
  schnell. Pale Moon übersetzte Suchmuster mit Unicode-Klassen bei jedem
  Aufruf neu; die betroffenen Muster der zwei teuersten Regeln werden jetzt
  einmal angelegt. Ergebnisse unverändert.
- Pale Moon: Sätze mit markierten Pluralen werden etwa ein Fünftel schneller
  verarbeitet. Weitere Suchmuster mit Unicode-Klassen in Dativ-, Singular-,
  Satzbau- und Begleitwortregeln werden einmal angelegt statt bei jedem
  Treffer neu. Ergebnisse unverändert.
- Die letzten Unicode-Suchmuster in Funktionen liegen jetzt auf Modulebene.
  In Pale Moon ist neutraler Text dadurch etwa dreimal so schnell, markierter
  Text etwa ein Drittel schneller.
- Die Singularregel bricht ab, sobald kein markierter Singular mehr übrig
  ist. Sätze mit markiertem Singular werden dadurch etwa ein Drittel
  schneller verarbeitet; die Ergebnisse bleiben unverändert.
- Die Singularregel prüft nur noch Texte mit einem markierten Singular
  (`:in`, `*in`, `/-in`, `(in)`, Binnen-I). Gewöhnliche Wörter auf -in wie
  „ein“, „Berlin“ oder „Lehrerin“ starten keine Kontextprüfungen mehr; die
  reine Regelverarbeitung solcher Texte ist rund viermal schneller, die
  Ergebnisse sind unverändert.

### Behoben

- Steht das Begleitwort vor einem hervorgehobenen oder verlinkten Wort
  (`Das Projekt der <em>Künstler*in</em>`), wird es jetzt mit umgewandelt:
  „Das Projekt des Künstlers“, „mit dem Patienten“, auch mit Attribut im
  Element („mit dem neuen Kollegen“). Bisher blieb die ganze Phrase
  unverändert. Die Änderung am vorangehenden Text wird wie jede eigene
  Änderung wiederhergestellt; ist er inzwischen geändert oder geschützt,
  bleibt die Phrase wie bisher unverändert.
- Bildunterschriften mit Kennungen wie `data-testid="image-caption"` gelten nicht mehr als Video-Untertitel. Ihr Text blieb bei ausgeschalteter Untertitelverarbeitung bisher unverändert (z. B. auf bechtle.com).
- „Schüler-/innen“ und „Fachinformatiker-/in“ (Bindestrich vor dem
  Schrägstrich) werden bei bekanntem Stamm umgewandelt. Paare aus Kurz- und
  Langform der Präposition werden ganz aufgelöst: „vom:von der Arbeitgeber:in“
  ergab „vom:von der Arbeitgeber“ und wird jetzt zu „vom Arbeitgeber“, ebenso
  „beim:bei der …“ und „von der:vom …“. Begleitwortpaare mit Leerraum um Stern
  oder Doppelpunkt („zum* zur Gärtner*in“) werden wie „der / die“ behandelt.
- Großbuchstaben im Wortinneren bleiben erhalten: „AfDler*innen“ wurde zu
  „Afdler“, „TikToker*in“ zu „tiktoker“ und „CMV-positiven“ zu „Cmv-positiven“;
  jetzt bleibt die Schreibung des Originals („AfDler“, „TikToker“). Dadurch
  sind weitere 45 Bezeichnungen wie BWLer, EDEKAner oder PJler aufgenommen.
- Licht- und Farbunterschiede in den Flächen der Erweiterungsicons in 32, 48
  und 128 Pixeln bereinigt. Originalkonturen und der Übergang vom S zum V
  bleiben erhalten.
- Verb am Satzanfang ist kein Nomen vor Genitiv-„der“: `Ist der Lehrer*in schon da?` → „Ist der Lehrer schon da?“ statt „Ist des Lehrers …“ (Regression aus #479).
- Relativpronomen folgen dem umgewandelten Singular: „…, dessen Praxis“, „…, der uns hilft“, „…, den wir kennen“, „…, dem wir vertrauen“. Nach „zum/zur/als“ und bei mehrdeutigen Fällen bleibt das Pronomen.
- Dativ vor „obliegen“, „zustehen“ u. ä.: `Umsetzung der Antragsteller:in obliegen` → „Umsetzung dem Antragsteller obliegen“.
- Ein markierter Singular am Anfang eines Inline-Elements (`mit der <em>Patient*in</em>`) wird nicht mehr halb umgewandelt; mit passendem Begleitwort davor (`mit dem <em>…</em>`) korrekt flektiert.
- `Diese Doppelposition Studierende_r und Mitarbeiter_in` wird ganz umgewandelt; „Beamter/in“, „Beamte/r“, „Beamt:innen“ und „Nageldesigner:in“ ergänzt.
- Dateinamen und URLs ohne Schema im Fließtext bleiben unverändert:
  „Verhaltensregeln_Funktionaer_innen.pdf“ wurde zu
  „Verhaltensregeln_Funktionaere.pdf“, ein Pfad wie
  „uni-berlin.de/…/Mitarbeiter_innen/…“ wurde mit umgeschrieben. Der übrige
  Text im selben Absatz wird weiter umgewandelt.
- Zusammengesetzte Personennomen bekommen nach Dativauslösern das Dativ-n:
  „mit Humanmediziner*innen“ wird zu „mit Humanmedizinern“, „aus
  Sportmediziner*innen“ zu „aus Sportmedizinern“. Dadurch werden viele
  Aufzählungen nicht mehr nur halb umgewandelt.
- Dativlisten auch mit rechtem Nachbarn („von Politik, Arbeitgeber:innen und
  allen Verantwortungsträgern“ → „Arbeitgebern“), langem Genitivattribut und
  Herkunftsadjektiv („jüdischen Ostberliner Interviewpartner:innen“).
- Aufzählungen neben einem eindeutigen Dativ werden vollständig umgewandelt
  („bei Spielern, Helfern, FunktionärInnen und SponsorInnen“ → „… Funktionären
  und Sponsoren“). Kein Dativ mehr, wenn die Liste einen neuen Satz beginnt
  („Wir sehen den Wagen, Lehrer:innen und Schüler:innen kommen“) oder ein Verb
  in der Wortgruppe steht („Auf den Bühnen treffen Politiker:innen …“).
- Dativlisten werden über eine gemeinsame Listenerkennung umgewandelt, auch mit
  Attributen, Mengenangaben und Wortteilen („zwischen Beratern aus der Praxis
  und Wissenschaftlern“). Sachen wie „Fertigteilhäusern“ gelten nicht mehr als
  Personen, und Adverbien wie „erneut“ oder „sofort“ nicht mehr als Verben.
- Dativverben erkennen ein eigenes Subjekt vor dem Verb: „Auch die Eltern
  helfen Lehrer:innen“ wird wieder zu „… helfen Lehrern“, „Wir helfen
  Lehrer:innen der Schule“ zu „… Lehrern der Schule“; „Wir folgen
  Lehrer:innen“ zu „… folgen Lehrern“. Nach „Vielleicht“, „Danach“, „Den
  Kindern“ oder „Jeden Tag“ bleibt der Plural Subjekt („Vielleicht helfen
  Lehrer …“), vor „gut auszubilden“ Objekt des Infinitivs.
- Nach Verben mit Dativobjekt (danken, helfen, gratulieren, vertrauen,
  begegnen, folgen, zuhören) bekommen Pluralformen das Dativ-n: „Wir danken
  Lehrer:innen“ → „Wir danken Lehrern“, „Das Projekt hilft vielen
  Schüler*innen“ → „vielen Schülern“. Das Substantiv „Vertrauen“ zählt nicht.
- Ändert eine Seite ein Nomen, dessen Begleitwort im vorangehenden Text
  mitumgewandelt wurde („Das Projekt des <em>Künstlers</em>“), wird das
  Begleitwort zurückgesetzt und mit dem neuen Nomen neu berechnet. Bisher
  blieb „des“ stehen und das neue Nomen markiert („des Lehrer*in“).
- Ein Begleitwort in geschütztem Text (`<code>`, editierbare Bereiche) wird
  nicht gelesen, verhindert aber, dass das folgende Nomen allein umgewandelt
  wird, wenn sich das Begleitwort dafür ändern müsste („Das Projekt
  <code>der </code><em>Künstler*in</em>“ bleibt).
- „jede Kund*in … in ihrer Sprache“ wird zu „jeder Kunde … in seiner
  Sprache“, „jede Teilnehmer*in ihren Ort, ihre Rolle“ zu „jeder Teilnehmer
  seinen Ort, seine Rolle“. Nur im selben Teilsatz und nur, wenn davor kein
  anderer möglicher Besitzer steht („Die Firmen beraten jede Kund*in in
  ihren Filialen“ bleibt).
- Pluralreparatur prüft Dativauslöser erst, wenn einer in der Nähe steht.
- Relativpronomen: „verpflichtet sich, die … Kosten zu übernehmen“ wurde
  zu „der … Kosten“; ein Infinitivsatz ist kein Relativsatz. „Händler:in und
  alle, die …“ und „Entscheidung der*des Therapeut*in, die …“ behalten „die“,
  weil sich der Satz auf „alle“ bzw. „Entscheidung“ bezieht. „die oder der“
  wird zu „der“ statt „der oder der“.
- Dativ-n bei Pluralen auf -er: nicht mehr nach einem Relativ-„den“ oder
  wenn eine Präpositionalgruppe zu einem vorangehenden Personenplural
  gehört („Überlebende von Genoziden und Zeichner“, „Rechtsanwälte aus
  Bremen und Nebenklagevertreter“). Neu auch über Zahlen und
  Namensbestandteile hinweg („bis zu 20 Teilnehmern“, „bei den RosaLila
  Panthern“, „8 InteGREATern“), Jahreszahlen ausgenommen. „Partern:innen“
  wird wieder zu „Partner“.
- „jedem*r“ und „jedem/r“ werden mit dem Nomen umgewandelt („von jedem
  Bewohner“, „jedem VSD-Kandidaten“); bisher blieb die Kurzform teils vor
  dem bereits umgewandelten Nomen stehen.
- Kurzformen mit Schrägstrich und mehreren Adjektiven („eine/n
  erfolgreiche/n und zufriedene/n Mitarbeiter/in“) sowie durch Komma
  getrennte Adjektive („eine:n engagierte:n, motivierte:n Mitarbeiter:in“)
  werden vollständig umgewandelt.
- Ein zweites „und/oder einer X*in“ nach einem umgewandelten Genitiv wird
  ebenfalls Genitiv („eines Wählers der Grünen oder eines Politikers“);
  bisher blieb es markiert oder wurde zu „der Pate werden“.
- Satzbau: Eine bekannte maskuline Person nach der Phrase kann selbst
  Subjekt sein („Heute besucht die Ärzt*in der Patient“); dann bleibt die
  Phrase geschützt. Eine Kopula am Satzende macht sie prädikativ („dass er
  der Arzt ist“, „ein Lehrer genannt wird“), und „Sie wird den Arzt am
  Montag anrufen“ erkennt das Futur auch über Zeitangaben hinweg.
- Ein Dativverb nach einer Genitivphrase gehört zum Kopfnomen, wenn es ein
  eigenes Dativobjekt hat („Das Haus des Lehrers gehört dem Staat“).
- Abkürzungen und mehrteilige Attribute zwischen Begleitwort und Nomen:
  „einen hauptamtl. Lehrer“, „einen z. B. erfahrenen Lehrer“, „einen
  Dipl.-Psych. Lehrer“, „der erste und bisher einzige deutsche Künstler“.
- Weitere eindeutige Satzformen: „Den Arzt besuche ich“, „ein Arzt werde
  eingeladen“, „der ein Arzt ist“, „Den Arzt kontaktieren“ als Schaltfläche,
  „Der Künstler, der dort arbeitet, kommt“, „In vielen Fällen veranlasst der
  Arzt“, „diese*r“ als Pronomen.
- Kurzformen: „Wahl de:r Schatzmeister:in“ → „Wahl des Schatzmeisters“,
  „aus je eine:r Hundeführer:in, eine:r SAR-Helfer:in“ → „aus je einem
  Hundeführer, einem SAR-Helfer“.
- Titel mit nicht aufgelöstem markiertem Attribut oder Paar („Studentische/-r
  OP Assistent/-in“, „zur/zum EnergieauditorIn“, „zur Manual Therapeut*in“)
  werden nicht mehr halb umgewandelt.
- „bis zu“ vor einer Zahl verlangt keinen Dativ mehr: „Bis zu 20 Bewerber
  werden eingeladen“, „für bis zu 20 Teilnehmer“; „mit bis zu 20 Lehrern“
  bleibt Dativ.
- Dativverben (helfen, danken, begegnen …) machen ein nachgestelltes
  Subjekt nicht mehr zum Dativobjekt: „Heute helfen Lehrer den Kindern“,
  „Im Museum begegnen Besucher der Kunst“, „In der Schulbibliothek helfen
  Audible-Mitarbeiter, …“. Auch nach „Wem“ und vor einem zu-Infinitiv
  bleibt der Plural ohne Dativ.
- Koordinationen im Dativ werden vollständig umgewandelt, auch mit Zahlen,
  Attributen und Kommalisten: „mit 12 Hundeführern und 17 Helfern“, „aus 38
  Bäckern, Konditoren, Produktionshelfern und Fahrern“, „mit Kollegen aus
  Kantonen und Vertretern“.
- „die vielen Unterstützer“ und „In einigen Fällen wurden Bewerber“ bleiben
  ohne Dativ; „Das Vertrauen unseren Lehrern gegenüber“ behält ihn.
- Entfernt oder ersetzt eine Seite das Nomen samt Inline-Element (etwa durch
  `<strong>Gemeinde</strong>`), wird das dafür geänderte Begleitwort sofort
  zurückgesetzt („Das Projekt der Gemeinde“ statt „des Gemeinde“).
- Ein geschützter Artikel mit eigenem Leerraumknoten davor
  (`<code>der</code> <em>Künstler*in</em>`) verhindert die Umwandlung des
  Nomens allein ebenfalls.
- Das Possessiv nach „jede X*in“ wird nur noch angeglichen, wenn im Satz
  und im Satz davor kein anderer möglicher Besitzer steht: „Maria bittet
  darum, dass jeder Lehrer ihrer Tochter hilft“ und „Die Eltern wünschen,
  dass jeder Lehrer ihre Kinder unterstützt“ behalten „ihr-“.
- Ein zweites „einer/der X*in“ wird nur noch Genitiv, wenn keine andere
  Lesart möglich ist: Nach einem Dativ-Kopf („dem Sohn eines Lehrers und
  …“), nach einem Präpositionalattribut, vor einem Pluralverb („Name des
  Weines und der Pat:in werden …“) oder vor einem neuen Satzteil bleibt es
  stehen.
- „dass er die Ärzt*in möge/würde/sollte …“ wird zu „den Arzt“ statt zu
  „der Arzt“.
- „Für fast alle Kinder helfen Lehrer:innen“ bleibt „… helfen Lehrer“;
  „Das Insulin wirkt“ gilt nicht mehr als möglicher Besitzer für „ihre“;
  „neben VertreterInnen“ wird zu „neben Vertretern“; „Die Galerie eines
  Lehrers und der Ärzt*in werden …“ bleibt ein koordiniertes Subjekt.
- „zwischen“ setzt Personen in den Dativ („Zwischen Lehrer:innen und
  Schüler:innen …“ → „Zwischen Lehrern und Schülern …“). Weitere Subjekte
  vor „folgen“ („Peter und Anna“, „Wir alle“); „Manchmal helfen
  Lehrer:innen den Eltern“ bleibt „… Lehrer …“; „Auch das Foto eines
  Lehrers und einer Ärzt*in …“ wird umgewandelt.
- Weitere Satzbauvarianten: „Die Eltern der Kinder folgen Lehrer:innen“ wird
  zu „… Lehrern“, „Die überaus vielen Lehrer:innen“ zu „… Lehrer“,
  „Draußen regnet es. Jede Lehrer*in kennt ihre …“ zu „… seine …“, „dass die
  Mutter die Ärzt*in möge“ zu „… den Arzt möge“.
- „zwischen“ und „neben“ nach Richtungsverben bleiben Akkusativ („Wir stellen
  uns zwischen Lehrer und Schüler“). Listen übernehmen den Dativ nicht mehr aus
  Attributen oder über neue Sätze; „Sie kennt jeder Lehrer*in“ bleibt Subjekt;
  Datumsangaben sind keine Mengen; eingebettete Partizipialattribute („den von
  den Schulen entsandten Lehrern“) und ausgeschriebene Zahlen („mit rund zehn
  Lehrern“) werden erkannt; Doppelpunkt beginnt einen neuen Satz.
- Befunde der Gegenprüfung vom 28.10.2026: weibliche Namen und Pluralsubjekte als
  mögliche Besitzer, Richtungsverben nur als Verbformen, Begleitwortpaare mit
  Doppelpunkt, „bis zu“ vor Zahlen, Punkte in Adressen und Abkürzungen,
  erweiterte Partizipialattribute, weitere Zahlwörter und Inline-Elemente nach
  Richtungsverben.
- Befunde der Gegenprüfung vom 29.10.2026: Die Listenerkennung überträgt den
  Dativ nicht mehr aus Attributen, Prädikaten oder Einschüben, Genitivreihen
  behalten ihren Rang, und „bis zu“ vor Mengenwörtern regiert keinen Dativ.
- Befunde der Gegenprüfung vom 30.10.2026: Als mögliche Besitzerin gelten
  wieder nur Namen mit weiblichem Beleg, nicht jedes großgeschriebene Wort am
  Satzanfang. Echte Komma-Dativlisten bleiben erhalten; gezählte Glieder nach
  einem Attribut, Prädikate nach Kopula mit Adjektiv und Genitive nach
  Singularen auf -n/-s übernehmen keinen Dativ mehr.
- Gezählte Listen behalten den übergeordneten Dativ. Kopulasätze mit Artikeln,
  Adjektiven und Fokusgruppen übertragen keinen Dativ aus einem Attribut;
  Singularattribute behalten ihre eigenen Dativlisten. Die nachfolgende
  Formenreparatur berücksichtigt die strukturelle Listenentscheidung.
- Richtungsinfinitive nach Kommas und verstärkten Adjektiven, Kommalisten nach
  eindeutigen Dativverben und Mengenangaben mit „bis zu recht/ziemlich vielen“
  erhalten den passenden Kasus. Sachwörter wie „Schnee“ gelten nicht als Namen;
  Personenplural mit Gradwort oder weiterem Zahlwort bleibt möglicher Besitzer.

Auch über Inline-Elementgrenzen bleibt der Dativ nach Mengenangaben wie „mit bis zu recht vielen“ erhalten, einschließlich Binnen-I. Unmarkierte feminine Formen und Akkusativkontrollen bleiben unverändert.
- Koordinierter Genitiv am Satzanfang wird wieder umgewandelt: „Das Foto
  eines Lehrers und einer Ärzt*in sehen wir hier“ wird zu „… und eines
  Arztes …“.
- Viele bisher geschützte Singularformen werden jetzt umgewandelt, wenn
  Begleitwort oder Satzbau den Fall eindeutig machen: Begleitwortpaare mit
  Attributen („eine/n engagierte/n Student/in“ → „einen engagierten
  Studenten“, „zur/zum Anästhesietechnische*r Assistent*in“), kompakte
  Formen („Eine*r Beamt*in“, „de*r Kolleg*in“), flektierte Formen vor dem
  Marker („zum/zur Pflegefachassistenten/-in“), Subjekt am Satzanfang, nach
  Kopula, nach dem Verb an zweiter Stelle („Dann griff die Referent*in …“)
  oder nach Relativpronomen im Dativ/Akkusativ („über den die Patient*in
  verfügen kann“), Akkusativ nach „Wir suchen …“, Genitiv „einer“ nach
  einem Nomen („Comic einer Autor*in“), Dativ nach „mit einer“ und „laut
  der“, Objekt nach Subjektpronomen („Werden Sie die Ärzt*in anrufen?“ →
  „den Arzt“, „Sind Sie die Ärzt*in?“ → „der Arzt“), Objekt nach
  vorangestelltem Subjekt bei Verben mit typischem Personenobjekt („Das
  Projekt unterstützt die Künstler*in“) sowie Überschriften ohne Trennung
  vom Fließtext.
- Eigenkreationen und Gruppennamen werden wie Personenbezeichnungen
  umgewandelt („InteGREATer:innen“ → „InteGREATer“, „RosaLila PantherInnen“
  → „RosaLila Panther“).
- „Geben Sie der Ärzt*in Bescheid“ wird nicht mehr fälschlich zu „des
  Arztes“.
- „mit der oder die Kolleg*in“ und „mit der/die Kolleg*in“ ergaben „mit der
  Kollege“; die Präposition legt jetzt den Fall fest („mit dem Kollegen“,
  „für den neuen Kollegen“). „Wir danken der Patient*in“ ergab „der
  Patient“ und wird jetzt zu „dem Patienten“ (ebenso helfen, folgen,
  gratulieren und weitere Verben mit Dativobjekt).
- Gegendert ist gegendert, auch wenn erkennbar eine Frau gemeint ist: Die
  Schutzprüfung liest nicht mehr über Satzgrenzen hinweg („Unterstützen Sie
  unsere Arbeit. Werden Sie Umweltstifter*in!“), und weitere Satzbauten
  geben den Fall: Subjekt nach dem Verb mit Präpositionalgruppe, Adverb oder
  Plural im Vorfeld („Trotz eingehender Untersuchungen findet die Ärzt*in“,
  „Solche Fehlbelastungen erkennt die Orthopäd*in“), im Nebensatz („wenn
  eine Verkäufer:in …“, „dass der Vertrag die Arbeitnehmer:in …“), Objekt
  nach Subjekt („wählt eine Jury die Preisträger:in“), Prädikativ mit und
  ohne Begleitwort („Ist die Natur die bessere Chemiker*in?“, „Diakon*in
  werden“, „nicht Psychotherapeut*in … sind“), Akkusativ nach „an/über/für
  die …“, Objekt im Infinitivsatz („eine Kolleg*in … zu begrüßen“) und
  Genitiv nach Possessiv („Institution ihrer externen Betreuer*in“).
- Berufsbezeichnungen ohne Begleitwort in Aufzählungen und Titeln werden
  umgewandelt („die Berufe Altenpfleger*in, …“, „die Ebene Leiter*in“, „rund
  um Choreograf*in Alvin Collantes“), ebenso Komposita nach dem Marker
  („Jugendleiter*in-Card“ → „Jugendleiter-Card“, „Täter*in-Opfer-Umkehr“ →
  „Täter-Opfer-Umkehr“), Plurale auf -er ohne Lexikoneintrag
  („Widerstandkämpfer:innen“, „Ü60-Frankfurter*innen“, mit Dativ-n nach
  „von … und“), Abkürzungen („StB*innen“ → „StB“) und weitere Kurzformen
  („dem*er“, „einem/-er“, „Ihres:r“, „ein/ -e“, „keine: passende:n“).
- Im Nebensatz mit eigenem Subjekt ist die Gruppe vor einem Modalverb im
  Konjunktiv oder „werde“ + Infinitiv Objekt: „dass er heute die Ärzt*in
  möge“ wird zu „… den Arzt möge“, „dass Peter die Ärzt*in möge“ zu „…
  den Arzt möge“.
- Aufzählungen übernehmen den Dativ nicht mehr über Satz- und Attributgrenzen:
  „Wir sehen den Mann, Lehrer:innen und Schüler:innen kommen später“ bleibt
  „… Lehrer und Schüler kommen“, „den Werken der SchriftstellerInnen und
  Künstler*innen“ wird zu „… Schriftsteller und Künstler“, „Mitarbeitende von
  Stiftungen, Politiker:innen sowie …“ zu „… Politiker sowie …“.
- Koordinierte markierte Singulare nach Präposition bekommen beide den richtigen Kasus: `zwischen der Spender:in und Empfänger:in` → „zwischen dem Spender und Empfänger“ statt „zwischen der Spender und Empfänger“. Zweiseitige Präpositionen wie zwischen, neben, vor, an und auf werden mit femininem `der` als Dativ erkannt.
- `Medizinisch:e-Technische:r Assistent:in` → „Medizinisch-Technischer Assistent“; vorher blieb der Adjektivteil halb markiert.
- `Inklusionsbeauftragte*r der Arbeitgeber*in` → „Inklusionsbeauftragter des Arbeitgebers“ (Genitiv).
- Binnen-I nach Substantiv im Genitiv: `Das Projekt der KünstlerIn` → „Das Projekt des Künstlers“ statt „der Künstler“.
- Weitere kurze Begleitwortpaare werden aufgelöst: „mit einem*r Dozent*in“
  blieb unverändert und wird jetzt zu „mit einem Dozenten“, „einer*m
  Mentor*in“ ergab „einer*m Mentor“ und wird jetzt zu „einem Mentor“
  (ebenso dem/r, der*m, des/r, eines/r, jeder*m, einer/s).
- Zweite Lexikontranche aus der Webanalyse: rund 1.250 bisher offene
  Personenbezeichnungen werden umgewandelt, jede einzeln geprüft, darunter
  seltene Bildungen („Kurzfilmer*innen“), schwache Komposita
  („Sprachpat*innen“ → „Sprachpaten“), Bauer-Komposita („Kleinbauer*innen“
  → „Kleinbauern“ statt „Kleinbauer“), Gruppen- und Herkunftsbezeichnungen
  sowie Ausgangsschreibweisen, die nur entgendert, nicht korrigiert werden.
- Mengenwörter nach Artikel oder Possessiv lösen keinen Dativ mehr aus, auch
  mit Gradadverb, nach Genitiv-Possessiv oder in einer Koordination: „Die
  sehr vielen LehrerInnen kommen“ wird zu „… Lehrer kommen“, „ihrer wenigen
  lauten Gegner*innen“ zu „… Gegner“, „für die Menschen und vielen
  MitarbeiterInnen“ zu „… Mitarbeiter“.
- Die Domain-Schaltfläche im Popup bricht lange Beschriftungen auf zwei Zeilen um, statt sie mit „…“ abzuschneiden; „Erweiterung aktiv“ bleibt einzeilig.
- Possessiv nach „jede …*in“: „Es regnet“ gilt nicht mehr als möglicher
  Besitzer, „ihre eigene“ bezieht sich auf das Subjekt („Jeder Lehrer kennt
  seine eigene Telefonnummer“). Weibliche Nomen wie „Tante“, „Ärztin“ oder
  „Die Schule ist …“ und Namen mit Verb in den zwei Sätzen davor behalten
  „ihre“.
- Ungewöhnliche Paarschreibungen nach markiertem Adjektiv werden umgewandelt:
  „staatlich anerkannte/n Heilpädagogen/in“ → „staatlich anerkannten
  Heilpädagogen“, „Sozialpädagogische/n Assistentin/en“ → „Sozialpädagogischen
  Assistenten“.
- „Wir suchen eine/r Lehrer*in“ wird zu „… einen Lehrer“; männliche Vornamen
  und Städte gelten nicht als Besitzer für „ihre“; Mengenangaben zwischen
  Auslöser und Nomen („mit rund 15.000 Teilnehmer*innen“ → „Teilnehmern“,
  „mit teilweise bis zu 250 …“); Adjektiv nach „und“ in Dativkoordinationen
  („mit Fachleuten und kommunalen Praktiker*innen“ → „Praktikern“).
- Weitere Satzbaufälle: „Heute gilt: jede Lehrer*in hilft“ wird umgewandelt,
  „Sie sagt jeder Lehrer*in …“ wird zu „… jedem Lehrer …“, „dem Lehrer und
  der Ärzt*in“ zu „… dem Arzt“, „dass Peter die Ärzt*in unterstützen könne“ zu
  „… den Arzt …“.
- Schrägstrich- und Koordinationspaare werden nicht mehr halb umgewandelt: `die Hausärzt:in/Fachärzt:in` und `Spender:in und Empfänger:in` bleiben als Ganzes stehen, `bei Ihrem:r Hausärzt:in/Fachärzt:in` und `mit seinem/r Betreuer*in` werden vollständig zu „bei Ihrem Hausarzt/Facharzt“ und „mit seinem Betreuer“.
- Feminines „der“ direkt vor markiertem Singular wird nicht mehr als
  maskuliner Nominativ gelesen, sondern in den maskulinen Singular gesetzt:
  „Publikationen der Expert*in“ ergab „der Experte“ und wird jetzt zu „des
  Experten“, „mit der neuen Kolleg*in“ ergab „mit der neuen Kollege“ und wird
  jetzt zu „mit dem neuen Kollegen“. Ohne bekannte Kasusform bleibt die Stelle
  unverändert. Eine Präposition direkt vor dem Nomen beendet den
  Mehrdeutigkeitsschutz: „Die Kosten pro Schüler:in“ wird zu „pro Schüler“.
- „Wir suchen eine Medizinpädagoge/-in“ ergab „eine Medizinpädagoge“; jetzt
  „einen Medizinpädagogen“. Zusammengesetzte Formen, die nur der Singular
  kennt, werden wie einfache behandelt, und ein stehengebliebenes weibliches
  Begleitwort verhindert, dass nur das Nomen umgewandelt wird.
- Weitere eindeutige Fälle: vorangestelltes Objekt vor Pluralverb und
  Subjektpronomen („Ihre Stromanbieter:in können Sie …“ → „Ihren
  Stromanbieter“), Subjekt vor Singularverb mit „Sie“ als Objekt („Ihre
  Ärzt*in kann Sie beraten“ → „Ihr Arzt“), „es gibt“ mit Akkusativ, Subjekt
  eines mit „und“ angeschlossenen Satzes, „den/die“ vor markiertem Plural
  („Über den/die Herausgeber:innen“ → „Über die Herausgeber“) und „Schwarze“
  als großgeschriebenes Adjektiv („mit einer Schwarzen Künstler:in“).
- Markierte Partizipien werden ganz umgewandelt: `Mitarbeitende:r` → „Mitarbeiter“ statt „Mitarbeiter:r“, `Studierende_r` → „Student“ statt „Studenten_r“, `eine:n Mitarbeitende:n` → „einen Mitarbeiter“.
- Substantivierte Adjektive als Kompositum und mit vorangestelltem Adjektiv: `Medizinische/r Fachangestellte/r` → „Medizinischer Fachangestellter“, `Verwaltungsfachangestellte/-r` → „Verwaltungsfachangestellter“, `eine:n Kaufmännische:n Angestellte:n` → „einen Kaufmännischen Angestellten“.
- `die Angestellte/r` und `der Angestellte/r` werden nicht mehr zu „die Angestellter“ bzw. „der Angestellter“; `der/die Besucherin` wird nicht mehr zu „der Besucherin“.
- Titel werden vollständig umgewandelt: „zur/zum EnergieauditorIn und
  EnergieberaterIn“ → „zum Energieauditor und Energieberater“, „zur Manual
  Therapeut*in“ → „zum Manual Therapeuten“, „»Studentische/-r OP
  Assistent/-in«“ → „»Studentischer OP Assistent«“.
- Kurzform-Adjektive ohne Begleitwort mit `-n` werden aufgelöst („als
  Medizinisch-technischen Assistenten“, „Wir suchen engagierten
  Elementarpädagogen“), ebenso ganze Adjektivlisten („erster und letzter
  Ansprechpartner“). Nach Dativpräpositionen bleibt `e*n` unverändert, weil
  die maskuline Form dort `-em` hieße.
- Personenbezeichnungen auf -or mit Plural -oren werden stark dekliniert
  („des Auditors“, „zum Energieauditor“).
- Wörter mit weichem Trennstrich werden mit ihrem Begleitwort und ihren
  Adjektiven umgewandelt, wie derselbe Text ohne Trennstrich: „angehende*r
  Theater­wissen­schaftler*in“ → „angehender Theaterwissenschaftler“, „mit
  unseren inter­na­tionalen Partnern“. Unveränderte Wörter behalten ihre
  Trennstriche; eine Halbumwandlung wie „eine spezialisierte Anwalt“
  entsteht nicht mehr.
- Ein Trennstrich mit Leerzeichen mitten in „-innen“ („Mieter*in­ nen“) wird
  als ein Wort gelesen.
- Ein weicher Trennstrich im Satz hebt richtige Partizipersetzungen nicht
  mehr auf: „Für die Exkur­sionen haben wir gezielt Dozierende gefragt“
  wird wieder zu „… Dozenten gefragt“.

### Hinzugefügt

- Untertitel-Overlays werden zentral erkannt und standardmäßig von der
  Verarbeitung ausgenommen. Eine neue, standardmäßig deaktivierte Option
  erlaubt ihre gezielte Korrektur.

### Leistung

- Schnell wechselnde Untertitel werden pro Bild auf den zuletzt sichtbaren
  Textstand reduziert. Identische Zeilen verwenden einen begrenzten Cache;
  der normale Webseitenpfad bleibt unverändert.
- Regeln und Lexikon laufen nicht mehr im Seitenprozess, sondern lokal im
  Erweiterungshintergrund (ohne externe API oder neue Berechtigung). Das
  Content-Script schrumpft von rund 340 auf rund 97 KB. Schnelle
  Kandidatenprüfungen überspringen neutrale Texte; die Regelverarbeitung ist
  auf neutralem Text rund viermal, auf gegendertem Text rund doppelt so schnell
  bei identischen Ergebnissen.
- DOM-Arbeit läuft in kurzen, zeitbegrenzten Scheiben mit Hintergrundpriorität.
  Große Einfüge-, Entfernungs- und Wiederherstellungsvorgänge sowie lange
  Kontexte werden kooperativ abgearbeitet; Untertitel haben Vorrang.
  Warteschlangen führen ihren Lesezeiger fort, statt gelöschte Einträge
  wiederholt zu durchlaufen.
- Einstellungen, die die Textverarbeitung nicht betreffen, starten die
  DOM-Verarbeitung nicht mehr neu; die Optionsseite wartet nicht mehr auf den
  Live-Zähler.

### Behoben

- Markierter Singular nach Präposition und femininem Begleitwort wird wie
  beim Binnen-I aufgelöst: „mit der Patient*in“ ergab „mit der Patient“ und
  wird jetzt zu „mit dem Patienten“, „für die Kolleg:in“ zu „für den
  Kollegen“. „zur Erzieher*in“ ergab „zur Erzieher“ und wird jetzt zu „zum
  Erzieher“. Paare, Komposita und Koordinationen bleiben unberührt.
- Dativ nach großgeschriebenem Begleitwort wieder richtig: „mit Ihren
  Schüler*innen“ ergab seit der Phrasengrenze aus #470 „mit Ihren Schüler“
  und wird wieder zu „mit Ihren Schülern“; ebenso „von Deinen …“ und nach
  Mengennomen („von Tausenden Unterstützer:innen“ → „Unterstützern“).
- Ausgangsfehler im Marker werden nicht mehr falsch umgewandelt:
  „Schüler*in-nen“ (Zeilentrennung) ergab „Schüler-nen“ und wird jetzt zu
  „Schüler“; „Praktikant*in*in“ ergab „Praktikant*in“ und wird jetzt zu
  „Praktikant“. Nur bei bekanntem Stamm, keine Rechtschreibkorrektur.
- Eine URL oder E-Mail-Adresse schützt nicht mehr den ganzen Textknoten,
  sondern nur ihre eigene Spanne: „Nutzer*innen lesen auf https://…“ →
  „Nutzer lesen auf https://…“, die Adresse bleibt bytegleich. Reine
  Technikknoten, Code, Editoren und Attribute bleiben wie bisher geschützt.
- Bindestrich-Komposita mit bekanntem Personenkopf werden umgewandelt:
  „US-Amerikaner*innen“, „NS-Zeitzeug:innen“, „AfD-Sympathisant*innen“,
  „Exil-IranerInnen“. Der Kopf nach dem letzten Bindestrich muss großgeschrieben
  und als Person bekannt sein; „Bilanzbuch-halter/in“ bleibt.
- Kein falscher Dativ mehr über Phrasengrenzen: „Mit ihnen können Lehrer*innen
  arbeiten“ und „Seit Wochen streiken Lehrer*innen“ ergaben „Lehrern“.
  Zwischen Auslöser und Nomen zählen nur noch Begleiter und Adjektive. Neu:
  Dativ beim Binnen-I („von LehrerInnen“ → „von Lehrern“ statt „von Lehrer“).
- Lexikontranche aus der Webanalyse vom 21.10.2026: Wissenschafter, Innovator,
  Wiedereinsteiger, Pensionist, Dissertant, Ohrenzeuge (Paradigmen gegen
  Duden geprüft), dazu regelmäßige Formen auf mehreren Domains wie
  Asylwerber, Zuweiser, Dienstnehmer, Zuseher, Kollegiat, Initiant,
  Famulant, Promotor, Junior, Mandatar, Kassier und Lesepate. Berufe auf
  „-bauer“ („Metallbauer/in“, „Straßenbauer/in“) werden im Singular
  erkannt; ihre weibliche Form ist „-bauerin“, nicht „-bäuerin“.
- Markierte Wörter mit zerlegten Umlauten (Unicode NFD, z. B. aus Mac- oder
  CMS-Texten) werden erkannt: zerlegtes „Schüler:innen“ → „Schüler“. Nur solche Wörter
  werden für die Regeln zusammengesetzt; der übrige Text behält seine
  Codeeinheiten, und beim Ausschalten wird exakt wiederhergestellt.
- Begleitwortpaare und Singularkontext: „der / die Nutzer*in“ und „der oder
  die Nutzer*in“ → „der Nutzer“, „eine/einen Sachbearbeiter/-in“ → „einen
  Sachbearbeiter“, „Ihrer/Ihrem Leser/in“ → „Ihrem Leser“, „Ausbildung
  zum/zur Erzieher/-in“ → „Ausbildung zum Erzieher“, „Medizinische/r
  Technologe/in“ → „Medizinischer Technologe“. Vorher entstanden teils halbe
  oder falsche Formen („zum/zur Sozialpädagoge“, „einer*einem Facharzt“).
  „Ihre Angaben als Teilnehmer*in“ wird umgewandelt: „als“ beginnt eine neue
  Phrase. Ein nicht auflösbares markiertes Adjektiv davor schützt das Nomen
  („mit engagierte*n Mitarbeiter*in“ bleibt).
- Marker hinter einer schon flektierten maskulinen Form werden entfernt:
  „Kollegen/-innen“, „Patienten*innen“, „Ärzte/innen“ → „Kollegen“,
  „Patienten“, „Ärzte“; Dativ „mit Mitarbeitern/innen“ → „mit
  Mitarbeitern“; Singular „Psychologe/in“ → „Psychologe“, „zum
  Assistenten/in“ → „zum Assistenten“, „ein/e Kollege:in“ → „ein Kollege“.
  Die maskuline Form stammt aus dem Text selbst; sie muss im Lexikon genau
  so gebildet werden. In der Webanalyse vom 21.10.2026 war das mit rund
  1.560 Vorkommen auf über 500 Domains die größte zusammenhängende Lücke.
  Unbekannte Stämme („Kinderwagen/in“), Dateinamen, Schrägstrichreihen und
  nicht auflösbare Paare davor bleiben unverändert. „Gewerkschaftern/innen“
  war bisher bewusst ausgenommen und wird jetzt ebenfalls umgewandelt.
- Verschachtelte Komposita mit zwei Markern werden vollständig umgewandelt:
  „Patient*innenvertreter*innen“ → „Patientenvertreter“, „mit
  Schüler*innenvertreter*innen“ → „mit Schülervertretern“. Bisher blieb
  „Patientenvertreter*innen“ stehen. Ist das äußere Wort keine bekannte
  Person („Nutzer*innenkonto*innen“), gilt das bisherige Verhalten.
- Markierter Singular nach `dem`, `des`, `eines`, `den` usw. erhält den
  passenden Kasus: „dem Kund*in“ → „dem Kunden“, „eines Patient*in“ →
  „eines Patienten“, „des neuen Mitarbeiter*in“ → „des neuen Mitarbeiters“.
  Bisher entstand der Nominativ („dem Kunde“). Ohne bekannte Kasusform und
  bei Begleitwortpaaren bleibt der Text unverändert.
- „des:der Azubi“ wird zu „des Azubis“: Nach einem aufgelösten
  Genitiv-Begleitwort erhält ein geschlechtsneutrales Lexikonnomen seine
  Genitivform. Unbekannte Nomen bleiben unverändert.
- Dreigeteilte Formen wie `Lehrer<span>*</span>innen` und
  `Lehrer*<b>innen</b>` werden erkannt; der getrennte Marker wird nur entfernt,
  wenn er ungeschützt und unverändert ist, und mit wiederhergestellt.
- Substantivierte Adjektive und Partizipien im markierten Plural ohne
  eigenes -e (`Angestellt:innen`, `Vorgesetzt*innen`, `BeschäftigtInnen`) werden
  mit der zum Begleitwort passenden Endung umgewandelt (`die Angestellten`,
  `viele Angestellte`). Ohne eindeutigen Anker bleibt der Text unverändert.
- Häufige Formen `Azubi:innen`, `Fan:innen` und `Flüchtling:innen` werden zu
  „Azubis“, „Fans“ und „Flüchtlinge“ umgewandelt.
- Über Inline-Elemente getrennte Genderformen wie `Lehrer<em>:innen</em>`,
  `<a>Lehrer</a>:innen` oder `Mitarbeiter<b>Innen</b>` werden erkannt. Geändert
  wird nur der Markerteil; Elementstruktur und Wiederherstellung bleiben
  erhalten. Formen mit Umlautwechsel bleiben bewusst unverändert.
- Ein Dativauslöser in einem vorangehenden Inline-Element wird auch erkannt,
  wenn das trennende Leerzeichen erst im folgenden Text steht
  (`Mit <em>allen</em> Lehrer*innen` → „Lehrern“).
- Acht bereits geprüfte Berufsbezeichnungen werden auch in ihrer ß-Schreibweise
  erkannt; etwa Berufsfußballer und Straßenartist. Plural, Singularpaare und
  Kasus bewahren die Schreibweise, bestehende ss-Varianten bleiben unterstützt.
- Die exakt geprüften Berufsbezeichnungen Marketer und Fertigungsmodelleur
  werden mit passendem Plural, Singularpaar und Kasus erkannt.
- 190 exakt geprüfte Berufsbezeichnungen unterstützen zusätzlich zu ihren
  bisherigen markierten Pluralformen auch ausgeschriebene Singularpaare und
  die passende Kasusflexion. Kürzel und bestehende Schreibweisen bleiben erhalten.
- 13 exakt geprüfte Berufsbezeichnungen mit abweichenden Singular- und
  Femininumstämmen werden als Paarformen und in markierten Schreibweisen
  mit passender Flexion erkannt, etwa Audiologe/Audiologin und Matrose/Matrosin.
- Nach einem Update oder Deaktivieren der Erweiterung beendet ein in Chromium
  verbliebenes Content-Script seine Arbeit, statt Anfragen an den nicht mehr
  vorhandenen Hintergrund jede Sekunde zu wiederholen.
- Spät angehängte offene ShadowRoots innerhalb bekannter ShadowRoots werden
  erkannt.

### Tests

- Der Reale-Seiten-Test sammelt nach der Verarbeitung noch sichtbare
  Markerwörter als mögliche Abdeckungslücken und akzeptiert mit
  `--sites-config` eine eigene Seitenliste.
- Die Chromium-Videoprüfung vergleicht drei Paare in wechselnder Reihenfolge
  über den Median. Verworfene Frames zählen wie die übrigen Kennzahlen erst
  nach der Startphase; funktionale Prüfungen gelten weiterhin für jedes Paar.

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
