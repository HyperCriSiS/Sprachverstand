import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Restliste der Webanalyse: bisher geschützte, aber eindeutig entgenderbare
// Fälle. Gegendert ist gegendert, auch wenn erkennbar eine Frau gemeint ist.
describe("Satzgrenze vor dem Begleitwort", () => {
  it.each([
    ["Unterstützen Sie unsere Arbeit. Werden Sie Umweltstifter*in!", "Unterstützen Sie unsere Arbeit. Werden Sie Umweltstifter!"],
    ["Teil einer Gemeinschaft. Jetzt Genoss*in werden", "Teil einer Gemeinschaft. Jetzt Genosse werden"],
    ["Institut ein. Wenn Sie Ärzt:in sind", "Institut ein. Wenn Sie Arzt sind"],
    // Abkürzungen beenden keinen Satz.
    ["die ggf. neue Lehrer*in", "die ggf. neue Lehrer*in"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Subjekt nach dem Verb an zweiter Stelle", () => {
  it.each([
    ["Trotz eingehender Untersuchungen findet die Ärzt*in aber oft keine klare Ursache.", "Trotz eingehender Untersuchungen findet der Arzt aber oft keine klare Ursache."],
    ["Diese Fragen griff die Referent*in Alex Gerber in ihrem Workshop auf.", "Diese Fragen griff der Referent Alex Gerber in ihrem Workshop auf."],
    ["Bei der Operation nach Wilhelm unterbricht oder verödet die Chirurg*in die Nervenfasern.", "Bei der Operation nach Wilhelm unterbricht oder verödet der Chirurg die Nervenfasern."],
    ["Nahtlos knüpfte die Vertreter:in der Abteilung daran an.", "Nahtlos knüpfte der Vertreter der Abteilung daran an."],
    ["Knöcherne Abrisse fixiert die Handchirurg*in mit Schrauben.", "Knöcherne Abrisse fixiert der Handchirurg mit Schrauben."],
    ["Solche Fehlbelastungen erkennt die Orthopäd*in in einer Laufanalyse.", "Solche Fehlbelastungen erkennt der Orthopäde in einer Laufanalyse."],
    ["Ergänzend zur Suche erlangt die Nutzer:in dank der KI ein besseres Verständnis.", "Ergänzend zur Suche erlangt der Nutzer dank der KI ein besseres Verständnis."],
    ["Im Rahmen der Reihe stellt je eine Leipziger Philosoph/-in ihr Buch vor.", "Im Rahmen der Reihe stellt je ein Leipziger Philosoph ihr Buch vor."],
    ["Während der Konzern Gewinn macht, sagt eine Arbeiter*in der Fabrik: „Gold“.", "Während der Konzern Gewinn macht, sagt ein Arbeiter der Fabrik: „Gold“."],
    ["„Manchmal wird es 4 Uhr“, berichtet eine bulgarische Näher*in der Fabrik.", "„Manchmal wird es 4 Uhr“, berichtet ein bulgarischer Näher der Fabrik."],
    ["Welche Sexarbeiter*in wird offiziell eine Wohnung anmelden?", "Welcher Sexarbeiter wird offiziell eine Wohnung anmelden?"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Vorangestellte Nominalphrase im Singular kann selbst Subjekt sein.
    "Der Verein leitet die Künstler*in an.",
    "Diese Frage beschäftigt die Ärzt*in."
  ])("bleibt: %s", (input) => expect(t(input)).toBe(input));
});

describe("Subjekt am Satzanfang und im Nebensatz", () => {
  it.each([
    ["Das Ziel. Die Gestalter*in tritt über diese Materie in Bezug.", "Das Ziel. Der Gestalter tritt über diese Materie in Bezug."],
    ["Die Liturg*in benötigt eine Klangschale.", "Der Liturg benötigt eine Klangschale."],
    ["Die südafrikanische Fotograf:in Zanele Muholi dokumentiert den Widerstand.", "Der südafrikanische Fotograf Zanele Muholi dokumentiert den Widerstand."],
    ["Was tun, wenn eine Verkäufer:in die Garantie verweigert?", "Was tun, wenn ein Verkäufer die Garantie verweigert?"],
    ["Klar ist das, bevor die Nutzer*in daraufklickt.", "Klar ist das, bevor der Nutzer daraufklickt."],
    ["Auch spielt eine Rolle, wie die Forscher*in die Erkenntnisse ausformuliert.", "Auch spielt eine Rolle, wie der Forscher die Erkenntnisse ausformuliert."],
    ["Einfach, weil eine Theaterleitung oder eine Regisseur:in meine Kontakte hatte.", "Einfach, weil eine Theaterleitung oder ein Regisseur meine Kontakte hatte."],
    ["Ich glaube dass die Ärzt*in kommt.", "Ich glaube dass der Arzt kommt."],
    // Subjekt vor der Phrase: Akkusativobjekt.
    ["Wichtig ist, dass der Vertrag die Arbeitnehmer:in nicht verpflichtet.", "Wichtig ist, dass der Vertrag den Arbeitnehmer nicht verpflichtet."],
    ["Ist es antidemokratisch, wenn es keine Vertreter*in der AfD auf das Podium setzt?", "Ist es antidemokratisch, wenn es keinen Vertreter der AfD auf das Podium setzt?"],
    ["Außerdem verpflichtet das Gesetz die Investor*in zur Zustimmung.", "Außerdem verpflichtet das Gesetz den Investor zur Zustimmung."],
    ["Aus den Einsendungen wählt eine Jury die Preisträger:in.", "Aus den Einsendungen wählt eine Jury den Preisträger."],
    ["Oft sehe ich die Redner:in nicht.", "Oft sehe ich den Redner nicht."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Kopula und Prädikativ", () => {
  it.each([
    ["Bei Fragen ist für die Nachbehandlung Ihr Kinderarzt Ihre Ansprechpartner:in.", "Bei Fragen ist für die Nachbehandlung Ihr Kinderarzt Ihr Ansprechpartner."],
    ["Wer ist für Sie die größte Wissenschaftler:in der Geschichte?", "Wer ist für Sie der größte Wissenschaftler der Geschichte?"],
    ["Ist die Natur die bessere Chemiker*in?", "Ist die Natur der bessere Chemiker?"],
    ["Zugleich ist zum dritten Mal in Folge eine Doktorand:in der Schule ausgezeichnet.", "Zugleich ist zum dritten Mal in Folge ein Doktorand der Schule ausgezeichnet."],
    ["sofern Täter oder die Betroffene Österreicher:in ist", "sofern Täter oder die Betroffene Österreicher ist"],
    ["Personen, die zwar nicht Psychotherapeut*in im Sinne des Gesetzes sind", "Personen, die zwar nicht Psychotherapeut im Sinne des Gesetzes sind"],
    ["Er bleibt bis zum Ende seiner Wahlperiode Präsident*in im Sinne des Statuts.", "Er bleibt bis zum Ende seiner Wahlperiode Präsident im Sinne des Statuts."],
    ["Alle, die im Martineum Diakon*in werden, lernen viel.", "Alle, die im Martineum Diakon werden, lernen viel."],
    ["Haben wirklich alle die gleichen Chancen Pirat*in zu werden?", "Haben wirklich alle die gleichen Chancen Pirat zu werden?"],
    ["Wir unterstützen Sie darin, eine gute Arbeitgeber*in zu werden.", "Wir unterstützen Sie darin, ein guter Arbeitgeber zu werden."],
    ["Dir ist bewusst, dass du eine möglicher Überträger*in sein kannst.", "Dir ist bewusst, dass du ein möglicher Überträger sein kannst."],
    ["Auch muss die Person nicht Teilnehmer:in am Projekt sein.", "Auch muss die Person nicht Teilnehmer am Projekt sein."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Präposition und Infinitiv geben den Fall", () => {
  it.each([
    ["Ganz unkompliziert über die Schulsozialarbeiter*in oder über OJAD.", "Ganz unkompliziert über den Schulsozialarbeiter oder über OJAD."],
    ["Anforderungen an die Berater*in:", "Anforderungen an den Berater:"],
    ["Sie versenden es an die Anbieter:in.", "Sie versenden es an den Anbieter."],
    ["damit du eine E-Mail an deine Kantonsvertreter*in senden kannst", "damit du eine E-Mail an deinen Kantonsvertreter senden kannst"],
    ["Damit wäre für eine weitere Stammzellspender:in gesorgt.", "Damit wäre für einen weiteren Stammzellspender gesorgt."],
    ["für eine neue Betreuer:in", "für einen neuen Betreuer"],
    ["oder eine menschliche Gastautor*in einzuladen.", "oder einen menschlichen Gastautor einzuladen."],
    ["Das Team freut sich, erneut eine Kolleg*in mit Erfahrung zu begrüßen.", "Das Team freut sich, erneut einen Kollegen mit Erfahrung zu begrüßen."],
    ["Schloss Moosham sucht zur Verstärkung des Teams eine engagierte Schlossmitarbeiter*in auf Teilzeitbasis.", "Schloss Moosham sucht zur Verstärkung des Teams einen engagierten Schlossmitarbeiter auf Teilzeitbasis."],
    // Fall aus dem koordinierten Nachbarn.
    ["beispielsweise einer möglichen Zeug*in oder eines Verräters", "beispielsweise eines möglichen Zeugen oder eines Verräters"],
    // Genitiv nach Nomen mit Possessiv.
    ["an der Institution ihrer externen Betreuer*in bzw. am Kolloquium", "an der Institution ihres externen Betreuers bzw. am Kolloquium"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Berufsbezeichnungen in Aufzählungen und als Titel", () => {
  it.each([
    ["Die bisher getrennten Berufe Altenpfleger*in, Kinderkrankenpfleger und Krankenpfleger", "Die bisher getrennten Berufe Altenpfleger, Kinderkrankenpfleger und Krankenpfleger"],
    ["über den Konzern sowie die Berufsbilder Lokführer:in, Verschublokführer und Fahrdienstleiter", "über den Konzern sowie die Berufsbilder Lokführer, Verschublokführer und Fahrdienstleiter"],
    ["Vorgestellt wurden die Ausbildungsberufe Fachlagerist*in, Textil- und Modeschneider", "Vorgestellt wurden die Ausbildungsberufe Fachlagerist, Textil- und Modeschneider"],
    ["In Bielefeld standen die Berufe Gärtner:in, Werker im Gartenbau", "In Bielefeld standen die Berufe Gärtner, Werker im Gartenbau"],
    ["Die Studienangebote Wirtschaftsfachwirt*in (VWA), Betriebswirt (VWA)", "Die Studienangebote Wirtschaftsfachwirt (VWA), Betriebswirt (VWA)"],
    ["Hier stellen sich die Berufe Assistent/-in Gesundheit und Soziales vor.", "Hier stellen sich die Berufe Assistent Gesundheit und Soziales vor."],
    ["Informationen für die Ebene Leiter*in.", "Informationen für die Ebene Leiter."],
    ["für die Ausbildungsbereiche Übungsleiter*in Breitensport", "für die Ausbildungsbereiche Übungsleiter Breitensport"],
    ["Damit wurde die Kategorie Zivilist:in faktisch aufgehoben.", "Damit wurde die Kategorie Zivilist faktisch aufgehoben."],
    ["Prüfung ihrer DOSB Übungsleiter:in B-Lizenz", "Prüfung ihrer DOSB Übungsleiter B-Lizenz"],
    ["für die Marke DWV-Wanderführer*in® ab 2019", "für die Marke DWV-Wanderführer® ab 2019"],
    ["Die Tänzer rund um Choreograf*in Alvin Collantes", "Die Tänzer rund um Choreograf Alvin Collantes"],
    // Ausgeschriebene männliche Form vor dem Marker mit (m/w/d).
    ["Medizinpädagoge/-in (m/w/d)", "Medizinpädagoge"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Komposita mit Bindestrich nach dem Marker", () => {
  it.each([
    ["Die Jugendleiter*in-Card (Juleica) ist ein Ausweis.", "Die Jugendleiter-Card (Juleica) ist ein Ausweis."],
    ["Ihre Ausbilder:in-Checkliste", "Ihre Ausbilder-Checkliste"],
    ["In Potsdam begann die Trainer:in-B-Ausbildung.", "In Potsdam begann die Trainer-B-Ausbildung."],
    ["Für die monatlichen Mentor*in-Mentee-Treffen", "Für die monatlichen Mentor-Mentee-Treffen"],
    ["Mit dieser Täter*in-Opfer-Umkehr versucht die Partei", "Mit dieser Täter-Opfer-Umkehr versucht die Partei"],
    ["Im Rahmen deiner dualen Steinmetz*in- bzw. Steinbildhauer*in-Ausbildung", "Im Rahmen deiner dualen Steinmetz- bzw. Steinbildhauer-Ausbildung"],
    ["Werden Sie «Schenk mir eine Geschichte»-Leseanimator:in.", "Werden Sie «Schenk mir eine Geschichte»-Leseanimator."],
    ["Der Basiskurs für «Schenk mir eine Geschichte»-Leseanimator:innen findet statt.", "Der Basiskurs für «Schenk mir eine Geschichte»-Leseanimatoren findet statt."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Pluralformen ohne Lexikoneintrag", () => {
  it.each([
    ["von Antifaschisten und Widerstandkämpfer:innen gegründet", "von Antifaschisten und Widerstandkämpfern gegründet"],
    ["Unterstützung russischer Kriegsdienstverweigerer*innen", "Unterstützung russischer Kriegsdienstverweigerer"],
    ["was einigen Cineasten und Ü60-Frankfurter*innen bekannt ist", "was einigen Cineasten und Ü60-Frankfurtern bekannt ist"],
    ["dass die Gewalt von LEGIDA-Anhängern*innen ausging", "dass die Gewalt von LEGIDA-Anhängern ausging"],
    ["Solange von Sozialgeldbeziehern/-innen oder von Beziehern/-innen Leistungen", "Solange von Sozialgeldbeziehern oder von Beziehern Leistungen"],
    ["Forum Junge StB*innen beim Steuerberatertag", "Forum Junge StB beim Steuerberatertag"],
    ["zwischen Komponisten und -InterpretInnen, die", "zwischen Komponisten und -Interpreten, die"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Kurzformen von Begleitwörtern", () => {
  it.each([
    ["Holen Sie die Zustimmung Ihres:r Arbeitgeber:in ein.", "Holen Sie die Zustimmung Ihres Arbeitgebers ein."],
    ["Das Presswerk schenkt dem*er Gewinner*in einen Preis.", "Das Presswerk schenkt dem Gewinner einen Preis."],
    ["der aus einem/einer Vorsitzenden, einem/-er Stellvertreter*in und dem/-r Schatzmeister*in besteht", "der aus einem/einer Vorsitzenden, einem Stellvertreter und dem Schatzmeister besteht"],
    ["Sie sind ein/ -e qualifizierte Alltagsbegleiter*in nach § 43b", "Sie sind ein qualifizierter Alltagsbegleiter nach § 43b"],
    ["Will ein Arbeitgeber eine*n begünstigt*en behinderten Arbeitnehmer*in kündigen", "Will ein Arbeitgeber einen begünstigten behinderten Arbeitnehmer kündigen"],
    ["findet jeder Zehnte keine: passende:n Spender:in. Jede neue", "findet jeder Zehnte keinen passenden Spender. Jede neue"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
