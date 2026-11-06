import type {DetailedTransformResult} from "../core/transform-text";
import type {ReplacementSummaryEntry} from "../core/replacement-summary";

// Ereignisse laufen im klassischen Outlook ohne DOM. Dort wird der Text
// zwischen den Tags abschnittsweise umgewandelt; Tags, Kommentare und die
// Inhalte von head, script und style bleiben unverändert. Über Tags hinweg
// (`Lehrer*<b>innen</b>`) gibt es dabei keinen Zusammenhang.
const named: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: "\u00a0", shy: "\u00ad",
  auml: "\u00e4", ouml: "\u00f6", uuml: "\u00fc", Auml: "\u00c4", Ouml: "\u00d6", Uuml: "\u00dc", szlig: "\u00df",
  bdquo: "\u201e", ldquo: "\u201c", rdquo: "\u201d", sbquo: "\u201a", lsquo: "\u2018", rsquo: "\u2019",
  laquo: "\u00ab", raquo: "\u00bb", ndash: "\u2013", mdash: "\u2014", hellip: "\u2026"
};
const skippedElements = new Set(["head", "script", "style", "title", "textarea"]);

function decode(text: string): string | undefined {
  let unknown = false;
  const decoded = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name[0] !== "#") return named[name] ?? ((unknown = true), entity);
    const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ((unknown = true), entity);
  });
  // Unbekannte Entitäten bleiben unangetastet: der Abschnitt wird übersprungen.
  return unknown ? undefined : decoded;
}

const encode = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");

export function transformHtmlWithoutDom(html: string, transform: (text: string) => DetailedTransformResult):
  {body: string; count: number; summaries: ReplacementSummaryEntry[]} {
  const parts = html.split(/(<!--[\s\S]*?-->|<[^>]*>)/);
  const summaries: ReplacementSummaryEntry[] = [];
  let count = 0;
  let skipped: string | undefined;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    if (index % 2) {
      const tag = /^<(\/?)([a-z][a-z0-9]*)/i.exec(part);
      const name = tag?.[2]?.toLowerCase();
      if (!tag || !name) continue;
      if (tag[1] && name === skipped) skipped = undefined;
      else if (!tag[1] &&!skipped && skippedElements.has(name) && !part.endsWith("/>")) skipped = name;
      continue;
    }
    if (skipped || !/\S/.test(part)) continue;
    const decoded = decode(part);
    if (decoded === undefined) continue;
    const result = transform(decoded);
    if (!result.replacements || result.text === decoded) continue;
    parts[index] = encode(result.text);
    count += result.replacements;
    summaries.push(...result.summaries);
  }
  return {body: count ? parts.join("") : html, count, summaries};
}
