import { coordinatedAdjective, numberWordSource } from "./clause-structure";
import { dativeVerbPattern } from "./dative-verbs";
import { namesPersons } from "./marker-source-repairs";

// Regex literals with Unicode property escapes stay at module level: Pale
// Moon compiles such a literal again each time a function evaluates it.

/*
 * A list of noun phrases governed by one word before its first item. Walking
 * back from a noun over the items before it finds that word: `zwischen
 * Berater*innen aus der Praxis und Wissenschaftler*innen`, `mit Richter*innen,
 * Polizist*innen, Vertreter*innen des Zollkriminalamtes, Mitarbeiter*innen von
 * Fachberatungsstellen`, `mit rund 90 Netzwerkpartner*innen am Vormittag und
 * etwa 140 Mitarbeiter*innen`. Every word on the way must belong to an item:
 * a verb, a pronoun or a sentence end stops the walk without a result.
 */
export interface ListGovernor {
  // The governing word as written and its offset in the text.
  word: string;
  index: number;
  // The head noun of the first item and the number of items before the noun.
  first: string;
  items: number;
  // The separator before the noun's own item, the head nouns of the items
  // before it and whether a conjunction joins them.
  separator: string;
  heads: string[];
  conjunction: boolean;
  // The list continues a singular prepositional object after a comma
  // (`mit dem Ziel, jugendliche Besucher*innen …`).
  singular: boolean;
  // Compound parts stand before the noun (`von Chef-, Ober- und
  // Assistenzärzt*innen`): one noun phrase with several items.
  compound: boolean;
}

// A colon or parenthesis inside a gendered form belongs to the word
// (`Wildbiolog:innen`, `Lehrer(innen)`).
const tokenPattern = /(?:[^\s,;:!?()[\]„“”"»«–—]|:(?=\p{L})|\((?=-?innen\))|(?<=\(-?innen)\))+|[,;:!?()[\]„“”"»«–—]/gu;
const abbreviations = new Set(["ca.", "bzw.", "z.b.", "u.a.", "dr.", "prof.", "inkl.", "ggf.", "evtl.", "sog.", "st."]);
const nounToken = /^\p{Lu}/u;
const compoundStub = /^\p{L}[\p{L}\p{M}-]*-$/u;
const numberToken = new RegExp(String.raw`^(?:\d[\d.,]*|${numberWordSource})$`, "u");
const yearToken = /^(?:1[89]|20)\d\d$/u;
const adjectiveToken = new RegExp(String.raw`^${coordinatedAdjective}$`, "u");
// Capitalized place adjectives right before the noun (`Gießener Bürger*innen`).
const placeAdjective = /^\p{Lu}[\p{L}\p{M}-]*er$/u;
// Lowercase words inside an attribute (`der einen Seite`, `des zivilen Lebens`).
const attributeWord = /^\p{Ll}[\p{L}\p{M}]*e[nrsm]?$/u;

const separators = new Set([",", "und", "oder", "sowie", "bzw.", "&"]);
const quantityWords = new Set(["ca.", "circa", "zirka", "rund", "etwa", "über", "mehr", "weniger", "als",
  "insgesamt", "fast", "knapp", "mindestens", "maximal", "höchstens", "gut", "bis"]);
// Determiners of a dative plural; one of them alone governs the list when no
// other word does (`den Katholik*innen, den orthodoxen Mitgliedern und …`).
const dativeDeterminers = new Set(["den", "allen", "unseren", "ihren", "euren", "meinen", "deinen", "seinen",
  "keinen", "diesen", "jenen"]);
const quantifiers = new Set(["vielen", "einigen", "wenigen", "mehreren", "beiden"]);
const dativePrepositions = new Set(["mit", "bei", "von", "zu", "aus", "nach", "seit", "gegenüber", "samt",
  "nebst", "außer", "neben", "zwischen"]);
// Words opening an attribute after a noun (`Vertreter*innen des …`,
// `Teilnehmer:innen vor Ort`) and articles after their preposition.
const attributeOpeners = new Set(["der", "des", "aus", "von", "vom", "in", "im", "am", "an", "auf", "für", "vor",
  "bei", "beim", "zur", "zum", "mit", "nach", "unter"]);
const attributeArticles = new Set(["der", "die", "das", "dem", "den", "des", "einer", "einem", "eines", "einen"]);
const genitiveArticles = new Set(["der", "des"]);
const accusativePrepositions = new Set(["für", "durch", "gegen", "ohne", "um"]);
const singularArticles = new Set(["der", "die", "das", "dem", "einer", "einem", "eines", "einen"]);
// Contracted articles open fixed attributes (`im Jahr`, `am Vormittag`).
const contractedOpeners = new Set(["im", "am", "vom", "beim", "zum", "zur"]);
const relativeWords = new Set(["deren", "denen", "dessen"]);
const conjunctions = new Set(["und", "oder", "sowie"]);
// A separator right after the noun; without one no item follows.
const listContinuesPattern = /^\s*(?:[,&]|(?:und|oder|sowie|bzw\.|wie\s+auch|als\s+auch)\s)/u;
const markedToken = /[:*_·•\/()]|\p{Ll}Innen$/u;
const dativeEndingToken = /[ns]$/u;

interface Token { text: string; lower: string; index: number }

function tokenize(text: string, offset: number): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(tokenPattern)) {
    const word = match[0];
    const lower = word.toLocaleLowerCase("de-DE");
    // A sentence end closes the list; abbreviations and numbers keep it open.
    if (word.length > 1 && word.endsWith(".") && !abbreviations.has(lower) && !/^\d/u.test(word)) {
      tokens.push({text: word.slice(0, -1), lower: lower.slice(0, -1), index: offset + match.index});
      tokens.push({text: ".", lower: ".", index: offset + match.index + word.length - 1});
      continue;
    }
    // `wie auch` and `als auch` join items like `und`.
    const previous = tokens.at(-1);
    if (lower === "auch" && (previous?.lower === "wie" || previous?.lower === "als")) {
      tokens[tokens.length - 1] = {text: `${previous.text} ${word}`, lower: "und", index: previous.index};
      continue;
    }
    tokens.push({text: word, lower, index: offset + match.index});
  }
  // A parenthesis after the conjunction takes no part (`mit Lehrern und, bei
  // Bedarf, Schüler:innen`).
  for (let i = tokens.length - 1; i >= 1; i--) {
    if (tokens[i]!.text !== "," || !["und", "oder", "sowie"].includes(tokens[i - 1]?.lower ?? "")) continue;
    const close = tokens.findIndex((token, index) => index > i && token.text === ",");
    if (close > i && close - i <= 5) tokens.splice(i, close - i + 1);
  }
  // So does a short parenthesis after a noun (`aus Auszubildenden (aller
  // Lehrjahre), FSJler*innen`).
  for (let i = tokens.length - 1; i >= 1; i--) {
    if (tokens[i]!.text !== "(" || !nounToken.test(tokens[i - 1]!.text)) continue;
    const close = tokens.findIndex((token, index) => index > i && token.text === ")");
    if (close > i && close - i <= 6) tokens.splice(i, close - i + 1);
  }
  return tokens;
}

function isGovernor(tokens: Token[], i: number): boolean {
  const token = tokens[i]!;
  if (dativeVerbPattern.test(token.text)) return true;
  if (!dativePrepositions.has(token.lower)) return false;
  // `bis zu 20` only bounds a number.
  return !(token.lower === "zu" && tokens[i - 1]?.lower === "bis");
}

interface Prefix { i: number; governor?: number; determiner?: number | undefined }

// The words of an item before its head noun, read backwards from `i`.
// Coordinated adjectives belong to it (`von Schweizer und Liechtensteiner
// Spieler:innen`).
function readPrefix(tokens: Token[], i: number): Prefix {
  let number = false;
  let determiner: number | undefined;
  for (let words = 0; i >= 0 && words < 6; words++, i--) {
    const token = tokens[i]!;
    if (isGovernor(tokens, i)) return {i, governor: i, determiner};
    const coordinated = tokens[i + 1]?.lower === "und" || tokens[i + 1]?.lower === "oder";
    if (numberToken.test(token.lower) && !yearToken.test(token.text)) number = true;
    else if (dativeDeterminers.has(token.lower) || quantifiers.has(token.lower)) determiner = i;
    else if (relativeWords.has(token.lower) && conjunctions.has(tokens[i - 1]?.lower ?? "")) {
      // a possessive after the conjunction (`sowie deren Gesellschafter*innen`)
    }
    else if ((token.lower === "und" || token.lower === "oder") && words > 0 &&
      isAdjective(tokens[i + 1]!.text, true) && isAdjective(tokens[i - 1]?.text ?? "", true)) {
      // coordinated with the adjective before
    } else if (!(number && quantityWords.has(token.lower)) && !(number && token.lower === "zu" && tokens[i - 1]?.lower === "bis") &&
      !isAdjective(token.text, words === 0 || coordinated)) break;
  }
  return {i, determiner};
}

function isAdjective(word: string, place: boolean): boolean {
  return (adjectiveToken.test(word) && !relativeWords.has(word)) || (place && placeAdjective.test(word));
}

// `start`: the list begins with this phrase, without a governing word;
// `singular`: it ends in a singular prepositional object before a comma.
interface Phrase { head: number; governor?: number; rejected?: boolean; start?: boolean; singular?: boolean }

// A noun with its attributes, read backwards from its last noun at `i`.
function readPhrase(tokens: Token[], i: number, conjunction: boolean): Phrase {
  let head = i;
  for (let attributes = 0; attributes < 3; attributes++) {
    let k = head - 1;
    // `Software- und Systementwickler*innen`
    while (k >= 1 && separators.has(tokens[k]!.lower) && compoundStub.test(tokens[k - 1]!.text)) k -= 2;
    const nounEnd = k;
    // Adjectives of the attribute, also coordinated (`der öffentlichen und
    // freien Jugendhilfe`).
    for (let words = 0; words < 4 && k >= 0; words++) {
      const word = tokens[k]!;
      const coordination = (word.lower === "und" || word.lower === "oder") && attributeWord.test(tokens[k - 1]?.text ?? "");
      // An article after another one is an adjective (`der einen Seite`).
      const article = attributeArticles.has(word.lower) && !attributeArticles.has(tokens[k - 1]?.lower ?? "");
      if (!coordination && (!attributeWord.test(word.text) || article)) break;
      k--;
    }
    let owner: number | undefined;
    let opener: number | undefined;
    const token = tokens[k];
    if (token && genitiveArticles.has(token.lower) && nounToken.test(tokens[k - 1]?.text ?? "")) {
      owner = k - 1;
    } else if (token && attributeArticles.has(token.lower) && attributeOpeners.has(tokens[k - 1]?.lower ?? "") &&
      nounToken.test(tokens[k - 2]?.text ?? "")) {
      owner = k - 2;
      opener = k - 1;
    } else if (token && attributeOpeners.has(token.lower) && !genitiveArticles.has(token.lower) &&
      nounToken.test(tokens[k - 1]?.text ?? "") && k === nounEnd) {
      owner = k - 1;
      opener = k;
    }
    if (owner === undefined) break;
    const attribute = tokens[head]!.text;
    const ownerText = tokens[owner]!.text;
    const ownerAttribute = (namesPersons(ownerText) && !namesPersons(attribute)) ||
      (opener !== undefined && contractedOpeners.has(tokens[opener]!.lower));
    if (opener === undefined) {
      // A genitive naming persons after a noun without persons takes the
      // list (`den Werken der Schriftsteller*innen und …`).
      if (namesPersons(attribute) && !namesPersons(ownerText)) return {head, rejected: true};
      // So does a genitive before the conjunction after a singular noun
      // without persons (`nach Maßgabe der Ausbildungskapazitäten und
      // geeigneten Bewerber*innen`); a plural takes the list itself (`mit den
      // Gemeinden der Region und weiteren Akteur*innen`).
      if (attributes === 0 && conjunction && !namesPersons(ownerText) && !dativeEndingToken.test(ownerText)) {
        return {head, rejected: true};
      }
    } else if (!ownerAttribute) {
      const singular = !conjunction && singularArticles.has(tokens[k]!.lower);
      // Only a person with an attribute without persons keeps it
      // (`Berater*innen aus der Praxis und …`); otherwise the list continues
      // the prepositional object (`Teams von Wissenschaftler*innen, …`,
      // `Vorteile für Unternehmen, Verbraucher*innen …`).
      // An accusative preposition governs no dative; after another one a
      // neighbour may still show the case (`Mangel an Lehrlingen und …`).
      if (isGovernor(tokens, opener)) return {head, governor: opener, singular};
      return accusativePrepositions.has(tokens[opener]!.lower) ? {head, rejected: true} : {head, start: true, singular};
    }
    head = owner;
  }
  return {head};
}

// An unmarked item naming persons outside the dative shows the list is no
// dative (`Vertreter von Tourismusverbänden, Vertreter*innen aus …`).
export function nonDativePersonPlural(word: string): boolean {
  return !markedToken.test(word) && !dativeEndingToken.test(word) && namesPersons(word);
}

// The same with a plural on -e only; a noun on -er after the list may be a
// converted singular (`zwei Stellvertreter*innen, Schriftführer*in …`).
export function nonDativePersonPluralOnE(word: string): boolean {
  return word.endsWith("e") && nonDativePersonPlural(word);
}

// Without a governing word, `word` is empty and `index` is the start of the
// list: a neighbour that can only be a dative may still make it one (`vor
// stolzen Eltern, Verwandten, Freunden, Mitschüler*innen`).
export function listGovernorBefore(text: string, offset = 0): ListGovernor | undefined {
  const tokens = tokenize(text, offset);
  // A compound part before the noun belongs to it (`der Mittelbau- und
  // Nachwuchswissenschaftler*innen`).
  let compound = false;
  while (tokens.length >= 2 && separators.has(tokens.at(-1)!.lower) && compoundStub.test(tokens.at(-2)!.text)) {
    tokens.length -= 2;
    compound = true;
  }
  let prefix = readPrefix(tokens, tokens.length - 1);
  const separator = tokens[prefix.i]?.lower ?? "";
  const heads: string[] = [];
  let first = "";
  let conjunction = separator !== ",";
  let singular = false;
  const result = (word: string, index: number): ListGovernor =>
    ({word, index, first, items: heads.length, separator, heads, conjunction, singular, compound});
  const found = (index: number): ListGovernor => result(tokens[index]!.text, tokens[index]!.index);
  for (;;) {
    if (prefix.governor !== undefined) return found(prefix.governor);
    let i = prefix.i;
    if (i < 0 || !separators.has(tokens[i]!.lower)) break;
    const joined = tokens[i]!.text !== ",";
    conjunction ||= joined;
    while (i >= 0 && separators.has(tokens[i]!.lower)) i--;
    // Anything else before the separator ends the list.
    if (i < 0 || !nounToken.test(tokens[i]!.text)) break;
    const phrase = readPhrase(tokens, i, joined);
    singular ||= phrase.singular === true;
    if (phrase.rejected || nonDativePersonPlural(tokens[phrase.head]!.text)) return undefined;
    first = tokens[phrase.head]!.text;
    heads.push(first);
    if (phrase.governor !== undefined) return found(phrase.governor);
    if (phrase.start) return result("", tokens[phrase.head]!.index);
    prefix = readPrefix(tokens, phrase.head - 1);
  }
  // Without a governing word the dative determiner of the first item governs.
  const determiner = prefix.determiner;
  if ((heads.length > 0 || compound) && determiner !== undefined && dativeDeterminers.has(tokens[determiner]!.lower)) {
    return found(determiner);
  }
  if (heads.length === 0) return undefined;
  return result("", tokens[prefix.i + 1]?.index ?? offset);
}

// The head nouns of the items after a noun, up to the end of the list. A
// noun with an adjective attribute after it starts its own phrase (`Lehrer
// und allen Schülern bekannte Autoren`). `modified`: only items with a
// determiner or adjective, which a bare source error lacks (`Freund*innen
// oder Arbeitgebern erfahren …`).
export function listHeadsAfter(text: string, modified = false): string[] {
  if (!listContinuesPattern.test(text)) return [];
  const tokens = tokenize(text, 0);
  const heads: string[] = [];
  let i = 0;
  while (i < tokens.length && heads.length < 8) {
    if (!separators.has(tokens[i]!.lower)) break;
    while (i < tokens.length && separators.has(tokens[i]!.lower)) i++;
    let words = 0;
    while (i < tokens.length && words < 4 && !nounToken.test(tokens[i]!.text) &&
      (dativeDeterminers.has(tokens[i]!.lower) || quantifiers.has(tokens[i]!.lower) ||
        numberToken.test(tokens[i]!.lower) || isAdjective(tokens[i]!.text, false))) {
      i++;
      words++;
    }
    const head = tokens[i];
    if (!head || !nounToken.test(head.text)) break;
    const next = tokens[i + 1];
    if (next && attributeWord.test(next.text) && !attributeArticles.has(next.lower) && nounToken.test(tokens[i + 2]?.text ?? "")) break;
    if (!modified || words > 0) heads.push(head.text);
    i++;
  }
  return heads;
}
