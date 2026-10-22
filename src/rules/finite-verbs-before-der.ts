// Capitalized only at the start of a sentence or question: `Ist der
// Lehrer*in schon da?` is a nominative subject, not a genitive after a noun
// (`Projekt der Künstler*in`). Finite auxiliaries, modals and frequent full
// verbs; a noun with the same spelling (`Macht`) loses only the genitive
// reading, never a conversion.
export const finiteVerbsBeforeDer: ReadonlySet<string> = new Set([
  "ist", "sind", "war", "waren", "wäre", "wären", "sei", "seid",
  "hat", "haben", "hatte", "hatten", "hätte", "hätten",
  "wird", "werden", "wurde", "wurden", "würde", "würden",
  "kann", "können", "konnte", "konnten", "könnte", "könnten",
  "muss", "müssen", "musste", "mussten", "müsste", "müssten",
  "soll", "sollen", "sollte", "sollten",
  "darf", "dürfen", "durfte", "durften", "dürfte", "dürften",
  "will", "wollen", "wollte", "wollten", "möchte", "möchten", "mag",
  "gibt", "gab", "bekommt", "bekam", "erhält", "erhielt", "braucht", "brauchte",
  "sucht", "suchte", "kennt", "kannte", "sieht", "sah", "findet", "fand",
  "macht", "machte", "geht", "ging", "kommt", "kam", "bleibt", "blieb",
  "steht", "stand", "weiß", "wusste", "sagt", "sagte", "schreibt", "schrieb",
  "liest", "las", "arbeitet", "arbeitete", "nutzt", "nutzte", "meldet", "meldete",
  "hilft", "half", "zeigt", "zeigte", "trägt", "trug", "übernimmt", "übernahm",
  "entscheidet", "entschied", "unterstützt", "unterstützte", "betreut", "betreute"
]);
