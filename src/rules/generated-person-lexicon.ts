export interface GeneratedPersonForms {
  readonly plural: string;
  readonly singular?: string;
  readonly feminineSingular?: string;
  readonly obliqueSingular?: string;
  readonly genitiveSingular?: string;
}

// Automatisch erzeugte, normalisierte Produktdaten.
const generatedPersonForms: Readonly<Record<string, GeneratedPersonForms>> =
  Object.freeze({
    "abenteurer": {
      plural: "abenteurer",
      singular: "abenteurer",
      feminineSingular: "abenteurerin",
      obliqueSingular: "abenteurer",
      genitiveSingular: "abenteurers"
    },
    "abiturient": {
      plural: "abiturienten",
      singular: "abiturient",
      feminineSingular: "abiturientin",
      obliqueSingular: "abiturienten",
      genitiveSingular: "abiturienten"
    },
    "absender": {
      plural: "absender",
      singular: "absender",
      feminineSingular: "absenderin",
      obliqueSingular: "absender",
      genitiveSingular: "absenders"
    },
    "admiral": {
      plural: "admirale",
      singular: "admiral",
      feminineSingular: "admiralin",
      obliqueSingular: "admiral",
      genitiveSingular: "admirals"
    },
    "afrikaner": {
      plural: "afrikaner",
      singular: "afrikaner",
      feminineSingular: "afrikanerin",
      obliqueSingular: "afrikaner",
      genitiveSingular: "afrikaners"
    },
    "akademiker": {
      plural: "akademiker",
      singular: "akademiker",
      feminineSingular: "akademikerin",
      obliqueSingular: "akademiker",
      genitiveSingular: "akademikers"
    },
    "allergiker": {
      plural: "allergiker",
      singular: "allergiker",
      feminineSingular: "allergikerin",
      obliqueSingular: "allergiker",
      genitiveSingular: "allergikers"
    },
    "allgemeinmediziner": {
      plural: "allgemeinmediziner",
      singular: "allgemeinmediziner",
      feminineSingular: "allgemeinmedizinerin",
      obliqueSingular: "allgemeinmediziner",
      genitiveSingular: "allgemeinmediziners"
    },
    "alphabet": {
      plural: "alphabeten",
      singular: "alphabet",
      feminineSingular: "alphabetin",
      obliqueSingular: "alphabeten",
      genitiveSingular: "alphabeten"
    },
    "altenpfleger": {
      plural: "altenpfleger",
      singular: "altenpfleger",
      feminineSingular: "altenpflegerin",
      obliqueSingular: "altenpfleger",
      genitiveSingular: "altenpflegers"
    },
    "amateur": {
      plural: "amateure",
      singular: "amateur",
      feminineSingular: "amateurin",
      obliqueSingular: "amateur",
      genitiveSingular: "amateurs"
    },
    "amerikaner": {
      plural: "amerikaner",
      singular: "amerikaner",
      feminineSingular: "amerikanerin",
      obliqueSingular: "amerikaner",
      genitiveSingular: "amerikaners"
    },
    "analphabet": {
      plural: "analphabeten",
      singular: "analphabet",
      feminineSingular: "analphabetin",
      obliqueSingular: "analphabeten",
      genitiveSingular: "analphabeten"
    },
    "analyst": {
      plural: "analysten",
      singular: "analyst",
      feminineSingular: "analystin",
      obliqueSingular: "analysten",
      genitiveSingular: "analysten"
    },
    "angler": {
      plural: "angler",
      singular: "angler",
      feminineSingular: "anglerin",
      obliqueSingular: "angler",
      genitiveSingular: "anglers"
    },
    "angreifer": {
      plural: "angreifer",
      singular: "angreifer",
      feminineSingular: "angreiferin",
      obliqueSingular: "angreifer",
      genitiveSingular: "angreifers"
    },
    "anhalter": {
      plural: "anhalter",
      singular: "anhalter",
      feminineSingular: "anhalterin",
      obliqueSingular: "anhalter",
      genitiveSingular: "anhalters"
    },
    "anhänger": {
      plural: "anhänger",
      singular: "anhänger",
      feminineSingular: "anhängerin",
      obliqueSingular: "anhänger",
      genitiveSingular: "anhängers"
    },
    "anleger": {
      plural: "anleger",
      singular: "anleger",
      feminineSingular: "anlegerin",
      obliqueSingular: "anleger",
      genitiveSingular: "anlegers"
    },
    "kellner": {
      plural: "kellner",
      singular: "kellner",
      feminineSingular: "kellnerin",
      obliqueSingular: "kellner",
      genitiveSingular: "kellners"
    }
  });

export const generatedPersonFormCount = Object.keys(generatedPersonForms).length;

export function getGeneratedPersonForms(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return generatedPersonForms[normalizedBase];
}
