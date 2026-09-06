import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createAmoReleaseNotes,
  loadStoreReleaseNotes
} from "./store-release-notes-lib.mjs";

const apiBase = "https://addons.mozilla.org/api/v5";
const command = process.argv[2];
const args = process.argv.slice(3);

function fail(message) {
  throw new Error(message);
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`Umgebungsvariable fehlt: ${name}`);
  }
  return value;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createJwt() {
  const issuer = requiredEnvironment("AMO_API_KEY");
  const secret = requiredEnvironment("AMO_API_SECRET");
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: issuer,
    jti: randomUUID(),
    iat: issuedAt,
    exp: issuedAt + 60
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload)
  )}`;
  // AMO verlangt für seine JWT-Authentifizierung ausdrücklich HS256.
  // Das AMO_API_SECRET ist ein zufälliger API-Schlüssel und kein Benutzerpasswort;
  // ein langsamer Passwort-Hash wie bcrypt/PBKDF2 würde das JWT-Protokoll brechen.
  // lgtm[js/insufficient-password-hash]
  const signature = createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

async function parseResponse(response) {
  const text = await response.text();
  let body = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // AMO kann bei Infrastrukturfehlern auch Klartext liefern.
    }
  }

  if (!response.ok) {
    const rendered =
      typeof body === "string" ? body : JSON.stringify(body, null, 2);
    fail(`AMO API ${response.status}: ${rendered}`);
  }
  return body;
}

async function amoFetch(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `JWT ${createJwt()}`);
  headers.set("Accept", "application/json");
  return fetch(url, { ...options, headers });
}

async function publicAmoFetch(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  return fetch(url, { ...options, headers });
}

function translatedLocales(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.keys(value)
    .filter((locale) => locale !== "_default")
    .sort();
}

async function profile() {
  return parseResponse(await amoFetch(`${apiBase}/accounts/profile/`));
}

async function listingStatus() {
  const addonId = requiredEnvironment("AMO_ADDON_ID");
  const addon = await parseResponse(
    await publicAmoFetch(
      `${apiBase}/addons/addon/${encodeURIComponent(addonId)}/`
    )
  );

  return {
    id: addon?.id ?? null,
    slug: addon?.slug ?? null,
    default_locale: addon?.default_locale ?? null,
    current_version: addon?.current_version?.version ?? null,
    summary_locales: translatedLocales(addon?.summary),
    description_locales: translatedLocales(addon?.description),
    url: addon?.url ?? null
  };
}

async function listingPayload(filename) {
  const metadataPath = path.resolve(
    filename || path.join("store", "generated", "amo-metadata.json")
  );
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const summaryEntries = Object.entries(metadata?.summary ?? {});
  const descriptionEntries = Object.entries(metadata?.description ?? {});

  if (
    summaryEntries.length !== 34 ||
    descriptionEntries.length !== 34 ||
    summaryEntries.some(([, value]) => typeof value !== "string" || !value.trim()) ||
    descriptionEntries.some(
      ([, value]) => typeof value !== "string" || !value.trim()
    )
  ) {
    fail(
      "AMO-Listing-Metadaten müssen exakt 34 nichtleere Summary- und Description-Übersetzungen enthalten."
    );
  }

  return {
    default_locale: metadata.default_locale || "de",
    summary: metadata.summary,
    description: metadata.description
  };
}

async function updateListing(filename) {
  const addonId = requiredEnvironment("AMO_ADDON_ID");
  const expectedApproval = `AMO-LISTING-UPDATE:${addonId}`;
  if (process.env.AMO_LISTING_APPROVAL !== expectedApproval) {
    fail(
      `Keine explizite AMO-Listing-Freigabe. Erwartet: ${expectedApproval}`
    );
  }

  const payload = await listingPayload(filename);
  const addon = await parseResponse(
    await amoFetch(
      `${apiBase}/addons/addon/${encodeURIComponent(addonId)}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    )
  );

  return {
    addon: addonId,
    default_locale: addon?.default_locale ?? payload.default_locale,
    summary_locales: translatedLocales(addon?.summary).length,
    description_locales: translatedLocales(addon?.description).length,
    updated: true
  };
}

async function uploadPackage(filename, channel = "listed") {
  if (!filename) fail("Pfad zum Firefox-XPI fehlt.");
  if (!["listed", "unlisted", "enterprise"].includes(channel)) {
    fail(`Ungültiger AMO-Kanal: ${channel}`);
  }

  const absolutePath = path.resolve(filename);
  const data = await readFile(absolutePath);
  const form = new FormData();
  form.append("upload", new Blob([data]), path.basename(absolutePath));
  form.append("channel", channel);

  const upload = await parseResponse(
    await amoFetch(`${apiBase}/addons/upload/`, {
      method: "POST",
      body: form
    })
  );

  if (!upload?.uuid) fail("AMO-Upload enthält keine UUID.");
  return upload;
}

async function waitForValidation(upload, timeoutMs = 180_000) {
  const started = Date.now();
  const statusUrl = upload.url || `${apiBase}/addons/upload/${upload.uuid}/`;

  while (Date.now() - started < timeoutMs) {
    const status = await parseResponse(await amoFetch(statusUrl));
    if (status?.processed) {
      if (!status.valid) {
        fail(
          `AMO-Validierung fehlgeschlagen: ${JSON.stringify(status.validation)}`
        );
      }
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  fail("AMO-Validierung hat das Zeitlimit von 180 Sekunden überschritten.");
}

async function createListedVersion({ uploadUuid, sourceFilename }) {
  const addonId = requiredEnvironment("AMO_ADDON_ID");
  const sourcePath = path.resolve(sourceFilename);
  const source = await readFile(sourcePath);
  const form = new FormData();
  form.append("upload", uploadUuid);
  form.append("source", new Blob([source]), path.basename(sourcePath));

  return parseResponse(
    await amoFetch(
      `${apiBase}/addons/addon/${encodeURIComponent(addonId)}/versions/`,
      {
        method: "POST",
        body: form
      }
    )
  );
}

async function updateReleaseNotes(version, notesFile) {
  const addonId = requiredEnvironment("AMO_ADDON_ID");
  const notes = JSON.parse(await readFile(path.resolve(notesFile), "utf8"));

  return parseResponse(
    await amoFetch(
      `${apiBase}/addons/addon/${encodeURIComponent(addonId)}/versions/${encodeURIComponent(version)}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ release_notes: notes })
      }
    )
  );
}

async function main() {
  let result;

  switch (command) {
    case "profile":
      result = await profile();
      break;
    case "listing-status":
      result = await listingStatus();
      break;
    case "listing-update":
      result = await updateListing(args[0]);
      break;
    case "upload":
      result = await uploadPackage(args[0], args[1]);
      break;
    case "validate": {
      const upload = await uploadPackage(args[0], args[1]);
      result = await waitForValidation(upload);
      break;
    }
    case "publish": {
      const [xpi, sourceZip, channel = "listed"] = args;
      const upload = await uploadPackage(xpi, channel);
      const validation = await waitForValidation(upload);
      const version = await createListedVersion({
        uploadUuid: validation.uuid,
        sourceFilename: sourceZip
      });
      result = { upload: validation, version };
      break;
    }
    case "notes": {
      const [version, releaseNotesFile] = args;
      if (!version || !releaseNotesFile) {
        fail("Version oder Pfad zu den AMO-Release-Notes fehlt.");
      }
      const releaseNotes = await loadStoreReleaseNotes(releaseNotesFile);
      result = await updateReleaseNotes(
        version,
        await createAmoReleaseNotes(releaseNotes, path.dirname(releaseNotesFile))
      );
      break;
    }
    default:
      fail(
        "Befehl fehlt. Erlaubt: profile, listing-status, listing-update, upload, validate, publish, notes"
      );
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
