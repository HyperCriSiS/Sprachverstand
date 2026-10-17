import {existsSync} from "node:fs";
import {appendFile, readFile} from "node:fs/promises";
import {validateNavigationFailureSummary} from "./navigation-failure-diagnostics.mjs";

const file = "artifacts/browser-smoke-navigation/navigation-failure.json";
const present = existsSync(file);
if (present) {
  const text = await readFile(file, "utf8");
  if (text.length > 64 * 1024) throw new Error("Navigation diagnostic exceeds export bound");
  validateNavigationFailureSummary(JSON.parse(text));
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `present=${present}\n`);
console.log(present ? "Bounded synthetic navigation diagnostic validated." : "No navigation diagnostic was produced.");
