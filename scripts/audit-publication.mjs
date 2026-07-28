import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "artifacts"
]);
const ignoredFiles = new Set(["scripts/audit-publication.mjs"]);
const forbiddenNames = [
  /^\.env(?:\..+)?$/u,
  /^id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?$/u,
  /\.(?:key|p12|pfx|pem|patch|orig|rej|bak|tmp|swp)$/iu,
  /^(?:Thumbs\.db|\.DS_Store)$/u
];
const secretPatterns = [
  {
    label: "privater Schlüssel",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/u
  },
  {
    label: "GitHub Personal Access Token",
    pattern: /\bghp_[A-Za-z0-9]{20,}\b/u
  },
  {
    label: "GitHub Fine-grained Token",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/u
  },
  { label: "AWS Access Key", pattern: /\bAKIA[0-9A-Z]{16}\b/u },
  { label: "Google API Key", pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/u }
];
const maximumTextBytes = 2 * 1024 * 1024;

function relative(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/");
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function looksBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  return sample.includes(0);
}

const problems = [];
const files = await collectFiles(repositoryRoot);

for (const file of files) {
  const fileRelative = relative(file);
  const basename = path.basename(file);

  if (forbiddenNames.some((pattern) => pattern.test(basename))) {
    problems.push(
      `${fileRelative}: nicht für ein öffentliches Repository geeigneter Dateiname`
    );
  }

  if (ignoredFiles.has(fileRelative)) {
    continue;
  }

  const metadata = await stat(file);
  if (metadata.size > maximumTextBytes) {
    continue;
  }

  const buffer = await readFile(file);
  if (looksBinary(buffer)) {
    continue;
  }

  const text = buffer.toString("utf8");
  for (const secret of secretPatterns) {
    if (secret.pattern.test(text)) {
      problems.push(`${fileRelative}: mögliches Geheimnis (${secret.label})`);
    }
  }
}

if (problems.length > 0) {
  console.error("Prüfung für die öffentliche Freigabe fehlgeschlagen:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Öffentliche Freigabe geprüft: ${files.length} Dateien, keine typischen Geheimnisse oder temporären Dateien gefunden.`
  );
}
