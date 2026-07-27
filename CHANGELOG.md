# Changelog

Alle wesentlichen Ã„nderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## UnverÃ¶ffentlicht

## 0.5.2 â€“ Beta 7 (2026-07-27)

### Korrigiert

- Das Popup verwendet weder `vw` noch `vh` fÃ¼r seine intrinsische GrÃ¶ÃŸe. Eine
  feste MindesthÃ¶he verhindert den vertikalen Zirkelschluss in Waterfox und
  Firefox; die Regelliste bleibt intern scrollbar.
- Die PNG-Daten des SV-Symbols wurden aus der gÃ¼ltigen Originaldatei neu
  erzeugt. BeschÃ¤digte 16-, 32- und 128-Pixel-Dateien wurden ersetzt.

### QualitÃ¤tssicherung

- Die CI prÃ¼ft fÃ¼r jede erzeugte PNG-Datei Signatur, Blockgrenzen, CRC-Werte,
  Abschlussblock und erwartete Abmessungen. Ein bloÃŸer DateigrÃ¶ÃŸentest reicht
  nicht mehr aus.
- Popup-CSS mit Viewport-Einheiten schlÃ¤gt kÃ¼nftig bereits in der CI fehl.

## 0.5.1 â€“ Beta 6 (2026-07-27)

### HinzugefÃ¼gt

- `PolitikerInnen` wird als eindeutig markierte Binnen-I-Form zu `Politiker`;
  die regulÃ¤re feminine Form `Politikerinnen` bleibt unverÃ¤ndert.
- Die optionale Umschreibungsgruppe ersetzt
  `Benutzungshandbuch` durch `Benutzerhandbuch`.
- `zehn ZuhÃ¶rer*innen` ist als vollstÃ¤ndiger Satzfall abgesichert.
- Ein maschinenlesbarer Kontextkatalog sammelt Partizip- und
  Personenumschreibungen mit Kontext, Sicherheitsbewertung und Umsetzungsstatus.

### GeÃ¤ndert

- Die optionale Gruppe heiÃŸt nun **Kontextgebundene Umschreibungen**.
- Einzelne Partizipformen wie `Studierende` oder `Lesende` werden auÃŸerhalb
  geprÃ¼fter Kontexte nicht mehr pauschal ersetzt.

### Datenschutz

- Der Kontextkatalog wird manuell gepflegt. Sprachverstand sammelt oder
  Ã¼bertrÃ¤gt weiterhin keine Seitentexte.

## 0.5.0 â€“ Beta 5 (2026-07-27)

### HinzugefÃ¼gt

- Das SV-Monogramm wird als Erweiterungssymbol und in Popup sowie Einstellungen
  verwendet.
- Alle zwÃ¶lf Regelgruppen sind im Popup mit Titel und Beispiel direkt schaltbar.
- Der SeitenzÃ¤hler wird Ã¼ber Hintergrundnachrichten live im Popup und im
  Einstellungsfenster aktualisiert.
- Gegenderte Singularformen ohne Artikel werden lexikalisch kontrolliert
  normalisiert, etwa `Makler*in`, `Ã„rzt_in` und `Professor/-in`.
- SchrÃ¤gstrich-Bindestrich-Artikel wie `ein/-e FrisÃ¶r/-in` und
  `eine/n Erzieher/-in` werden korrekt flektiert.
- Weitere LexikoneintrÃ¤ge und Formen fÃ¼r AnfÃ¤nger, ZuhÃ¶rer, Freunde, Chirurgen,
  KÃ¶che und Bauern wurden ergÃ¤nzt.
- Eine standardmÃ¤ÃŸig deaktivierte Gruppe ersetzt ausgewÃ¤hlte
  geschlechtsneutrale Umschreibungen wie `Studierende` oder `Lesende`.
- Eine standardmÃ¤ÃŸig deaktivierte Gruppe entfernt verbreitete
  Stellenanzeigen-ZusÃ¤tze wie `(m/w/d)`.
- Direkt zitierte Schreibweisen kÃ¶nnen Ã¼ber eine separate Option innerhalb
  gÃ¤ngiger AnfÃ¼hrungszeichen geschÃ¼tzt werden; standardmÃ¤ÃŸig werden sie weiter
  korrigiert.

### Korrigiert

- `Sehr geehrte Mitarbeitende` funktioniert auch dann, wenn das Personenwort in
  einem eigenen Inline-Textknoten liegt.
- `Sehr geehrte mitarbeitende Personen` wird zu `Sehr geehrte Mitarbeiter`.
- `Bauern_BÃ¤uerinnen`, `BÃ¤uer_innen`, `Koch/KÃ¶chin`, `ChirurgInnen`,
  `Freund:innen` und weitere gemeldete Formen werden erkannt.
- Neue Standardgruppen werden bei bestehenden Installationen einmalig aktiviert,
  ohne spÃ¤ter bewusst deaktivierte Gruppen zurÃ¼ckzusetzen.

### Bewusste Grenzen

- `Politikerinnen` bleibt als mÃ¶gliche ausdrÃ¼cklich weibliche Bezeichnung
  unverÃ¤ndert.
- `Testpersonen`, `Ã¤rztliche Sprechstunde` und `Benutzungshandbuch` sind keine
  Genderformen und bleiben unverÃ¤ndert.
- Die fehlerhafte Form `ZuhÃ¶rer*inne` wird nicht als automatische Tippkorrektur
  behandelt.

## 0.4.2 â€“ Beta 4 (2026-07-26)

### HinzugefÃ¼gt

- Gegenderte TitelabkÃ¼rzungen werden kontextabhÃ¤ngig normalisiert.
- Vor Namen und weiteren Titeln wird `Prof.in` zu `Prof.` und `Dr.in` zu `Dr.`.
- Mit eindeutig weiblichem Artikel oder alleinstehend werden die Formen zu
  `Professorin` beziehungsweise `Doktorin` ausgeschrieben.
- Die neue Funktion besitzt eine eigene, einzeln abschaltbare Regelgruppe.

### Sicherheit

- Voll ausgeschriebene weibliche Formen bleiben unverÃ¤ndert.
- Pluralformen wie `Prof.innen` und `Dr.innen` werden nicht durch die
  Singularregel angeschnitten.

## 0.4.1 â€“ Beta 3 (2026-07-26)

### HinzugefÃ¼gt

- Kontextgebundene Partizipformen in eindeutigen Anreden, etwa
  `Liebe Teilnehmende` zu `Liebe Teilnehmer`.
- SchrÃ¤gstrich-Bindestrich-Formen wie `Mitarbeiter/-innen` werden erkannt.

### Korrigiert

- Das Popup verwendet eine stabile intrinsische Breite und Ã¶ffnet nicht mehr als
  wenige Millimeter breiter Streifen.

## 0.4.0 â€“ Beta 2 (2026-07-26)

### HinzugefÃ¼gt

- Sieben konkrete, einzeln aktivierbare Regelgruppen ersetzen die abstrakten
  Profilnamen. Jede Gruppe enthÃ¤lt eine verstÃ¤ndliche Beschreibung und ein
  Beispiel.
- PersÃ¶nliche literale Ausnahmen schÃ¼tzen einzelne WÃ¶rter oder vollstÃ¤ndige
  Phrasen Ã¼ber exakte Grenzen.
- Die Verarbeitung zugÃ¤nglicher Attribute lÃ¤sst sich separat ein- und
  aussschalten.
- Firefox fÃ¼r Android wird Ã¼ber `gecko_android` als Mobilziel ausgewiesen und
  durch `web-ext lint` gegen die festgelegte Mindestversion geprÃ¼ft.
- Die Einstellungsseite ist fÃ¼r 360 Ã”€ØĞÀ‘À°Q½Õ µ	•‘¥•¹Õ¹œÕ¹M…™”É•…Ì(€…ÕÍ•±•Ğ¸(´A•ÉÏÙ¹±¥¡”ÕÍ¹…¡µ•¸İ•É‘•¸±½­…°•ÑÉ•¹¹ĞÙ½¸‘•¸Íå¹¡É½¹¥Í¥•É‰…É•¸(€ÉÕ¹‘•¥¹ÍÑ•±±Õ¹•¸•ÍÁ•¥¡•ÉĞ¸(´•ÈA½ÁÕÀµk‘¡±•È­…¹¸‘•¸	…‘”µ]•ÉĞ…Õ ¹… •¥¹•´9•ÕÍÑ…ÉĞ‘•Ì(€¡É½µ¥Õ´µM•ÉÙ¥”µ]½É­•ÉÌİ¥•‘•È…ÕÍ±•Í•¸¸((ŒŒŒ—‘¹‘•ÉĞ((´¥”™Ëñ¡•É•¸AÉ½™¥±”-½¹Í•ÉÙ…Ñ¥Ù€°MÑ…¹‘…É‘€Õ¹É•ÍÍ¥Ù€İÕÉ‘•¸…ÕÌ‘•È(€=‰•É™³‘¡”•¹Ñ™•É¹Ğ¸±±”…­ÑÕ•±±•¸ÁÉ½‘Õ­Ñ¥Ù•¸I••±¸İ…É•¸…±ÌÍ…™•€(€•¥¹•ÍÑÕ™ĞÕ¹Õ¹Ñ•ÉÍ¡¥•‘•¸Í¥ ‘…‘ÕÉ ‰¥Í±…¹œ¹¥¡Ğ¸(´±Ñ”¥¹ÍÑ•±±Õ¹•¸µ¥Ğ‘¥Í…‰±•‘IÕ±•%‘Í€İ•É‘•¸…ÕÑ½µ…Ñ¥Í …Õ˜‘¥”¹•Õ•¸(€I••±ÉÕÁÁ•¸µ¥É¥•ÉĞ¸(´	•Ñ„µÉÑ•™…­Ñ”ÑÉ…•¸‘•¸iÕÍ…Ñè‰•Ñ„¸É€¸((ŒŒŒ5½‰¥°Õ¹…Ñ•¹Í¡ÕÑè((´¥É•™½à•É­³‘ÉĞ¥´5…¹¥™•ÍĞ…ÕÍ‘Ëñ­±¥ °‘…ÍÌ­•¥¹”…Ñ•¸•Í…µµ•±Ğ½‘•È(€ƒñ‰•ÉÑÉ…•¸İ•É‘•¸¸(´½½±”¡É½µ”›ñÈ¹‘É½¥‰±•¥‰Ğ…ÕÍ•Í¡±½ÍÍ•¸°‘„‘¥•Í•È	É½İÍ•È­•¥¹”(€Éİ•¥Ñ•ÉÕ¹•¸Õ¹Ñ•ÉÍÓñÑéĞ¸((ŒŒ€À¸Ì¸ÀƒŠL	•Ñ„€Ä€ ÈÀÈØ´ÀÜ´ÈØ¤((ŒŒŒ!¥¹éÕ•›ñĞ((´áÁ±¥é¥Ğ••¹‘•ÉÑ”M¥¹Õ±…ÉÁ¡É…Í•¸İ•É‘•¸¹½Éµ…±¥Í¥•ÉĞ°İ•¹¸ÉÑ¥­•°Õ¹(€-…ÍÕÌ•¥¹‘•ÕÑ¥œµ…É­¥•ÉĞÍ¥¹°•Ñİ„©•‘”éÈ9ÕÑé•Èé¥¹€éÔ©•‘•È9ÕÑé•É€¸(´•¹¥Ñ¥Ù™½Éµ•¸İ•É‘•¸±•á¥­…±¥Í ­½ÉÉ•­Ğ•‰¥±‘•Ğ°•Ñİ„‘•Ìé‘•È9ÕÑé•Èé¥¹€(€éÔ‘•Ì9ÕÑé•ÉÍ€°‘•Ìé‘•ÈMÑÕ‘•¹Ğé¥¹€éÔ‘•ÌMÑÕ‘•¹Ñ•¹€Õ¹(€‘•Ìé‘•ÈƒÉéĞé¥¹€éÔ‘•ÌÉéÑ•Í€¸(´M¡İ… ‘•­±¥¹¥•ÉÑ”A•ÉÍ½¹•¹‰•é•¥¡¹Õ¹•¸İ•É‘•¸¥´­­ÕÍ…Ñ¥ØÕ¹…Ñ¥Ø(€­½ÉÉ•­Ğ™±•­Ñ¥•ÉĞ°•Ñİ„•¥¹”é¸MÑÕ‘•¹Ğé¥¹€éÔ•¥¹•¸MÑÕ‘•¹Ñ•¹€¸(´M•Á…É…Ñ½È´Õ¹	¥¹¹•¸µ$µM¡É•¥‰İ•¥Í•¸Ù•Éİ•¹‘•¸•¥¸•µ•¥¹Í…µ•Ìé•¹ÑÉ…±•Ì(€1•á¥­½¸›ñÈM¥¹Õ±…È´Õ¹A±ÕÉ…±™½Éµ•¸¸(´AÕ¹­ĞÍ½İ¥”ÑåÁ½É…™¥Í¡”Á½ÍÑÉ½Á¡”İ•É‘•¸…±Ì•¹‘•ÉÍ•Á…É…Ñ½É•¸•É­…¹¹Ğ¸(´9…ÓñÉ±¥ ™•µ¥¹¥¹”…µ¥±¥•¹™½Éµ•¸İ¥”5ÕÑÑ•Èé¥¹€İ•É‘•¸½¡¹”ƒ¹‘•ÉÕ¹œ‘•Ì(€É…µµ…Ñ¥Í¡•¸•Í¡±•¡ÑÌ¹½Éµ…±¥Í¥•ÉĞ¸(´áÁ±¥é¥Ñ”M¥¹Õ±…Èµ½ÁÁ•±™½Éµ•¸İ¥”-Õ¹‘”½-Õ¹‘¥¹€°ÉéĞÕ¹ƒÉéÑ¥¹€Õ¹(€Q¥•Ë‘ÉéÑ¥¸½Q¥•É…ÉéÑ€İ•É‘•¸¹ÕÈ‰•¤±•á¥­…±¥Í ¥‘•¹Ñ¥Í¡•ÈA•ÉÍ½¹•¹™½É´(€éÕÍ…µµ•¹•›ñ¡ÉĞ¸(´A½ÍÍ•ÍÍ¥Ù…ÉÑ¥­•°µ¥Ğ•¥¹‘•ÕÑ¥•´-…ÍÕÌİ•É‘•¸•µ•¥¹Í…´µ¥Ğ‘•´MÕ‰ÍÑ…¹Ñ¥Ø(€¹½Éµ…±¥Í¥•ÉĞ°•Ñİ„µ•¥¸é”9ÕÑé•Èé¥¹€éÔµ•¥¸9ÕÑé•É€Õ¹(€•ÕÉ”é¸A¥±½Ğé¥¹€éÔ•ÕÉ•¸A¥±½Ñ•¹€¸(´áÁ±¥é¥Ñ”AÉ½¹½µ•¸´Õ¹A½ÍÍ•ÍÍ¥ÙÁ……É”İ¥”•ÈéÍ¥•€°¥¡´é¥¡É€Õ¹(€Í•¥¹•Ìé¥¡É•Í€İ•É‘•¸…Õ˜‘¥”µ…Í­Õ±¥¹”½É´É•‘Õé¥•ÉĞ¸(´iÕŸ‘¹±¥¡”Q•áÑ…ÑÑÉ¥‰ÕÑ”…±Ñ€°…É¥„µ±…‰•±€°…É¥„µ‘•ÍÉ¥ÁÑ¥½¹€Õ¹Ñ¥Ñ±•€(€İ•É‘•¸µ¥Ğ‘•¹Í•±‰•¸Í¥¡•É•¸I••±¸İ¥”Í¥¡Ñ‰…É”Q•áÑ­¹½Ñ•¸Ù•É…É‰•¥Ñ•Ğ¸(´•È5ÕÑ…Ñ¥½¹=‰Í•ÉÙ•É€É•…¥•ÉĞ•é¥•±Ğ…Õ˜ÍÃ‘Ñ•É”ƒ¹‘•ÉÕ¹•¸‘•È(€™É•¥••‰•¹•¸éÕŸ‘¹±¥¡•¸ÑÑÉ¥‰ÕÑ”¸(´¥”$•Éé•ÕĞ•ÁËñ™Ñ”¡É½µ¥Õ´´°¥É•™½àµaA$´Õ¹EÕ•±±½‘”µA…­•Ñ”µ¥Ğ(€M!´ÈÔØµAËñ™ÍÕµµ•¸¸(´¥¹”±½­…±”	•Ñ„µQ•ÍÑÍ•¥Ñ”‘•­ĞÍ¥¡Ñ‰…É”Q•áÑ”°éÕŸ‘¹±¥¡”ÑÑÉ¥‰ÕÑ”°(€•Í£ñÑéÑ”	•É•¥¡”Õ¹‘å¹…µ¥Í¡”5ÕÑ…Ñ¥½¹•¸…ˆ¸(´ƒ¹‘•ÉÕ¹ÍÕµ™…¹œµI•É•ÍÍ¥½¹•¸ÍÑ•±±•¸Í¥¡•È°‘…ÍÌ•¥¹é•±¹”5ÕÑ…Ñ¥½¹•¸­•¥¹•¸(€•É¹•ÕÑ•¸-½µÁ±•ÑÑÍ…¸É¿}•ÈM•¥Ñ•¸…ÕÍ³ÙÍ•¸¸((ŒŒŒ-½ÉÉ¥¥•ÉĞ((´•¹‘•É™½Éµ•¸…´¹™…¹œéÕÍ…µµ•¹•Í•ÑéÑ•È_ÙÉÑ•Èİ•É‘•¸¹½Éµ…±¥Í¥•ÉĞ°•Ñİ„(€9ÕÑé•Èé¥¹¹•¹­½¹Ñ½€éÔ9ÕÑé•É­½¹Ñ½€Õ¹ƒÉéĞé¥¹¹•¹­…µµ•É€éÔƒÉéÑ•­…µµ•É€¸(´5ÕÑÑ•Èé¥¹¹•¹€Õ¹5ÕÑÑ•É%¹¹•¹€İ•É‘•¸éÔ7ñÑÑ•É€ì•¹ÑÍÁÉ•¡•¹‘”½Éµ•¸›ñÈ(€Q½¡Ñ•È°	ÉÕ‘•ÈÕ¹Y…Ñ•ÈİÕÉ‘•¸•‰•¹™…±±Ì•ÉŸ‘¹éĞ¸(´½ÁÁ•±¹•¹¹Õ¹•¸¥´…Ñ¥Ø‰•¡…±Ñ•¸¥¡É”±•á¥½¸°•Ñİ„(€µ¥ĞƒÉéÑ¥¹¹•¸Õ¹ƒÉéÑ•¹€éÔµ¥ĞƒÉéÑ•¹€¸(´	…Õ•Èé¥¹¹•¹€İ¥ÉéÔ	…Õ•É¹€°ß‘¡É•¹-½µÁ½Í¥Ñ„İ¥”(€5•ÍÍ•‰…Õ•È©¥¹¹•¹€­½ÉÉ•­ĞéÔ5•ÍÍ•‰…Õ•É€İ•É‘•¸¸(´!¥ÍÑ½É¥Í¡”•¡±•ÉÑÉ•™™•Èİ¥”%¹¹•¸´Õ¹×}•¹‘¥•¹ÍÑ€°1½%¹€°‘‘%¹€°(€A±Õ%¹€Õ¹É¥Ù•%¹€Í¥¹…±ÌI•É•ÍÍ¥½¹•¸•Í£ñÑéĞ¸((ŒŒŒM¥¡•É¡•¥Ğ((´¹‘•É”ÑÑÉ¥‰ÕÑ”İ¥”Ù…±Õ•€°Á±…•¡½±‘•É€°‘…Ñ„´©€°%ÌÕ¹UI1Ìİ•É‘•¸(€¹¥¡ĞÙ•Ë‘¹‘•ÉĞ¸(´%¹½É¥•ÉÑ”°Ù•ÉÍÑ•­Ñ”°•‘¥Ñ¥•É‰…É”Õ¹Ñ•¡¹¥Í¡”ÑÑÉ¥‰ÕÑ¥¹¡…±Ñ”‰±•¥‰•¸(€Õ¹‰•Ëñ¡ÉĞ¸(´ÕÍ‘Ëñ­±¥ İ•¥‰±¥¡”A•ÉÍ½¹•¹‰•é•¥¡¹Õ¹•¸İ•É‘•¸¹¥¡ĞÁ…ÕÍ¡…°Ù•Ë‘¹‘•ÉĞ¸(´U¹‰•­…¹¹Ñ”½‘•Èµ•¡É‘•ÕÑ¥”½Éµ•¸‰±•¥‰•¸Õ¹Ù•Ë‘¹‘•ÉĞ¸((ŒŒ€À¸È¸À((ŒŒŒ!¥¹éÕ•›ñĞ((´5…¹¥™•ÍĞµXÌµ	Õ¥±‘Ì›ñÈ¥É•™½àÕ¹¡É½µ¥Õ´(´µ½‘Õ±…É”QåÁ•MÉ¥ÁĞµI••°µ¹¥¹”(´Í¥¡•É”=4µY•É…É‰•¥ÑÕ¹œµ¥Ğ5ÕÑ…Ñ¥½¹=‰Í•ÉÙ•É€(´M¡ÕÑè›ñÈ¥¹…‰•¸°‘¥Ñ½É•¸°½‘”Õ¹Ñ•¡¹¥Í¡”%¹¡…±Ñ”(´A½ÁÕÀ°¥¹ÍÑ•±±Õ¹ÍÍ•¥Ñ”Õ¹½µ…¥¸µÕÍÍ¡³ñÍÍ”(´¥Ñ!ÕˆµÑ¥½¹Ìµ$›ñÈQåÁ•¡•¬°Q•ÍÑÌÕ¹	Õ¥±‘Ì(´­½¹Í•ÉÙ…Ñ¥Ù”A±ÕÉ…±É••±¸›ñÈ•¹‘•ÉÍ•Á…É…Ñ½É•¸(´•áÁ±¥é¥Ñ•Ì±•á¥½¹Í±•á¥­½¸›ñÈÕ¹É••±·“}¥”A±ÕÉ…±™½Éµ•¸(´	¥¹¹•¸µ$µU¹Ñ•ÉÍÓñÑéÕ¹œ¥´A±ÕÉ…°(´±•á¥­…±¥Í •ÁËñ™Ñ”½ÁÁ•±¹•¹¹Õ¹•¸¥´ÉÕ¹‘­…ÍÕÌ(´é•¹ÑÉ…±•ÈI•É•ÍÍ¥½¹ÍÑ•ÍĞµ-…Ñ…±½œ((ŒŒŒM¥¡•É¡•¥Ğ((´­•¥¹”Á•É¥½‘¥Í¡•¸-½µÁ±•ÑÑÍ…¹Ì(´­•¥¹”Õ¹»ÙÑ¥•¸	•É•¡Ñ¥Õ¹•¸(´­•¥¹”Y•Ë‘¹‘•ÉÕ¹œÕ¹‰•­…¹¹Ñ•È½‘•Èµ•¡É‘•ÕÑ¥•È½Éµ•¸(´Í¥¹Õ³‘É”Õ¹™±•­Ñ¥•ÉÑ”-½¹ÍÑÉÕ­Ñ¥½¹•¸‰±•¥‰•¸½¡¹”Í¥¡•É•¸-½¹Ñ•áĞ(€Õ¹Ù•Ë‘¹‘•ÉĞ((ŒŒ€À¸Ä¸À((´Ñ•¡¹¥Í¡•ÌÉÕ¹‘•ËñÍĞ½¡¹”ÁÉ½‘Õ­Ñ¥Ù”MÁÉ…¡É••±¸(