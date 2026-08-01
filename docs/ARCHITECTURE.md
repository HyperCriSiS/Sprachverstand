# Architektur

## Leitlinien

1. **Kontrolliert vor pauschal:** Eine ausgelassene Ersetzung ist besser als eine beschädigte Webseite oder ein verfälschter Inhalt.
2. **Sichtbare Markierungen werden erkannt:** Binnen-I, Separatoren und ausdrücklich unterstützte Sonderformen werden nicht mit normalen Feminina gleichgesetzt.
3. **Keine periodischen Komplettscans:** Nach dem ersten Durchlauf verarbeitet ein `MutationObserver` nur neue oder geänderte Knoten und freigegebene Attribute.
4. **Keine unnötigen Berechtigungen:** Die Erweiterung benötigt ausschließlich `storage`.
5. **Regeln bleiben DOM-unabhängig:** Die Regel-Engine verarbeitet Zeichenketten und ist isoliert testbar.
6. **Lexikon statt breiter Rückfallregel:** Flexionen und Sonderformen stammen aus kuratierten Beständen.
7. **Attribute nur per Positivliste:** Verarbeitet werden ausschließlich `alt`, `aria-label`, `aria-description` und `title`.
8. **Lokal als Standard:** Der vollständige Einstellungsstand liegt immer in `storage.local`.
9. **Synchronisierung nur nach Auswahl:** Jede synchronisierbare Datenkategorie wird einzeln gewählt; standardmäßig ist keine ausgewählt.
10. **Importdateien sind Daten, kein Code:** Regex, Skripte, unbekannte Felder und zukünftige Schema- oder Einstellungsrevisionen werden abgewiesen.

## Datenfluss

```text
Webseite
  -> Sicherheitsprüfung des Textknotens oder freigegebenen Attributs
  -> Schutz persönlicher Ausnahmen
  -> eigene wörtliche Ersetzungen
  -> aktive eingebaute Regeln
  -> transformierter Text
  -> reversible Ersetzung im vorhandenen Textknoten oder Attribut
```

Eigene Ersetzungen sind case-sensitive, besitzen Wortgrenzen und werden genau
einmal ausgeführt. Ihr Ergebnis wird nicht erneut durch weitere Regeln geschickt.
Persönliche Ausnahmen haben Vorrang.

## DOM-Verarbeitung

Beim ersten Durchlauf werden sichtbare Textknoten und freigegebene Attribute
verarbeitet. Danach beobachtet der `MutationObserver` neue Unterbäume,
geänderte Textknoten und ausschließlich freigegebene Attribute. Eingaben,
Editoren, Quellcode, URLs, IDs und technische Daten bleiben ausgeschlossen.

## Einstellungen und Speicherorte

`src/settings/storage.ts` speichert den vollständigen normalisierten Stand unter
einem lokalen Schlüssel in `storage.local`. Dazu gehören auch die
Synchronisierungsschalter.

Für die optionale Browser-Synchronisierung existieren getrennte Schlüssel:

- `sync.selection` für die ausgewählten Kategorien

- `sync.activation`
- `sync.rule-groups`
- `sync.excluded-domains`
- `sync.text-options`
- `sync.protected-terms`
- `sync.custom-replacements`

Die Auswahl wird zusätzlich unter `sync.selection` übertragen, damit weitere
angemeldete Geräte dieselben Kategorien laden können. Nur ausgewählte Kategorien
werden gelesen und geschrieben. Nicht ausgewählte Schlüssel werden beim Speichern
aus `storage.sync` entfernt. Der lokale vollständige Stand bleibt dadurch die
belastbare Ausgangsbasis. Ist der Synchronisierungsdienst vorübergehend nicht
erreichbar, wird mit dem lokalen Stand weitergearbeitet. Vor dem Schreiben prüft
die Speicherlogik ein konservatives Byte-Limit pro Kategorie.

Da vor Beta 12 keine öffentliche Installation verteilt wurde, enthält dieser
Stand bewusst keine Migration aus dem früheren experimentellen Speicherschema.

## Vorschau und Einstellungssicherung

Die Vorschau verwendet dieselbe Funktion `transformText` wie Webseiten und
berücksichtigt die im Formular gewählten Regelgruppen, Ausnahmen, Ersetzungen und
die Zitatoption.

`src/settings/personal-rules.ts` enthält Parser, Konflikthinweise und die
deterministische Zusammenführung persönlicher Listen.
`src/settings/settings-backup.ts` kapselt das versionierte Austauschformat.

Schema 2 enthält den vollständigen Einstellungsstand einschließlich der
Synchronisierungsauswahl. Der Import prüft unbekannte Felder, Typen,
Einstellungsrevision, bekannte Regel- und Synchronisierungskategorien,
Eintragsgrenzen und Domainangaben. Eine ungültige Datei wird vollständig
abgewiesen; es gibt keine stille Kürzung. Erst **Speichern** aktiviert einen
vorbereiteten Import.

## Rückgängigmachen

Für jeden veränderten Textknoten beziehungsweise jedes Attribut werden
Originalwert, erzeugter Wert und Anzahl der Ersetzungen gespeichert. Beim
Abschalten wird nur zurückgesetzt, wenn der aktuelle Wert noch exakt dem von
Sprachverstand erzeugten Wert entspricht.

## Sprachbestände

- `known-plural-separators.ts`: sichere Personenbezeichnungen mit unverändertem maskulinem Plural
- `person-lexicon.ts`: Singular, Plural, oblique Formen, Genitiv, Komposita und unregelmäßige Flexionen
- `substantivized-adjectives.ts`: geprüfte substantivierte Adjektive
- `special-gender-forms.ts`: einzelne ausdrücklich zugeordnete Sonderformen
- `data/flexion-regression-cases.json`: kuratierte Positiv- und Negativfälle

Das Aufnahmeverfahren ist in [`LEXICON.md`](LEXICON.md) beschrieben.

## Hintergrundkontext

Der Hintergrundprozess verarbeitet keine Sprache und keine Seitentexte. Er
verwaltet ausschließlich Korrekturzähler und Badge pro Tab.

## Verzeichnisstruktur

```text
src/
├── browser/       Browser-API-Abstraktion und Badge-Hilfen
├── core/          Regel-Engine, Sicherheitslogik und DOM-Verarbeitung
├── rules/         Sprachregeln und Flexionsbestände
├── settings/      lokale Speicherung, optionale Synchronisierung und Sicherungsformat
├── content.ts     Einstieg auf Webseiten
├── background.ts  Tab-Zähler und Badge
├── popup.ts       schnelles Ein-/Ausschalten
└── options.ts     Einstellungen, Vorschau, Synchronisierung und Import/Export

data/              kuratierte Kataloge und Regressionen
static/legal/       lokale Lizenz- und Quelltexthinweise
```
