import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const command = process.argv[2] || "status";
const slug = process.env.AMO_ADDON_SLUG || "sprachverstand";
const apiBase = "https://addons.mozilla.org/api/v5";

function fail(message) {
  throw new Error(message);
}

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function createJwt(apiKey, apiSecret) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const payload = {
    iss: apiKey,
    jti: randomUUID(),
    iat: now,
    exp: now + 60
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload)
  )}`;
  const signature = createHmac("sha256", apiSecret)
    .update(unsigned)
    .digest("base64url");

  return `${unsigned}.${signature}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    fail(
      `AMO-API ${response.status} ${response.statusText}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return data;
}

function translationLocales(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.keys(value).filter((key) => key !== "_default").sort();
}

async function showStatus() {
  const addon = await request(
    `${apiBase}/addons/addon/${encodeURIComponent(slug)}/`
  );

  console.log(
    JSON.stringify(
      {
        slug: addon.slug,
        default_locale: addon.default_locale,
        current_version: addon.current_version?.version ?? null,
        summary_locales: translationLocales(addon.summary),
        description_locales: translationLocales(addon.description),
        url: addon.url
      },
      null,
      2
    )
  );
}

async function updateListing() {
  const apiKey = process.env.AMO_API_KEY;
  const apiSecret = process.env.AMO_API_SECRET;

  if (!apiKey || !apiSecret) {
    fail(
      "Für AMO-Updates müssen AMO_API_KEY und AMO_API_SECRET gesetzt sein."
    );
  }

  const metadataPath = path.join(
    root,
    "store",
    "generated",
    "amo-metadata.json"
  );
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));

  if (
    !metadata.summary ||
    !metadata.description ||
    Object.keys(metadata.summary).length !== 34 ||
    Object.keys(metadata.description).length !== 34
  ) {
    fail(
      "Die erzeugten AMO-Metadaten müssen exakt 34 Summary- und Description-Locales enthalten."
    );
  }

  const token = createJwt(apiKey, apiSecret);
  const result = await request(
    `${apiBase}/addons/addon/${encodeURIComponent(slug)}/`,
    {
      method: "PATCH",
      headers: {
        Authorization: `JWT ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        default_locale: metadata.default_locale || "de",
        summary: metadata.summary,
        description: metadata.description
      })
    }
  );

  console.log(
    `AMO-Listing aktualisiert: ${slug}; ` +
      `${translationLocales(result.summary).length} Summary-Locales, ` +
      `${translationLocales(result.description).length} Description-Locales.`
  );
}

if (command === "status") {
  await showStatus();
} else if (command === "update-listing") {
  await updateListing();
} else {
  fail(
    `Unbekannter Befehl "${command}". Erlaubt sind "status" und "update-listing".`
  );
}
