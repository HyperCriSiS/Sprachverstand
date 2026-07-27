# Changelog

Alle wesentlichen Änderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## Unveröffentlicht

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
