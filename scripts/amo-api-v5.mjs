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
  form.append("license", "AGPL-3.0-only");

  return parseResponse(
    await amoFetch(
      `${apiBase}/addons/addon/${encodeURIComponent(addonId)}/versions/`,
      { method: "POST", body: form }
    )
  );
}

async function releaseNotesPayload(version, filename) {
  if (filename) {
    const document = JSON.parse(await readFile(path.resolve(filename), "utf8"));
    if (
      document?.version !== version ||
      typeof document?.release_notes !== "object"
    ) {
      fail(`AMO-Release-Notes-Datei passt nicht zu Version ${version}.`);
    }
    const entries = Object.entries(document.release_notes);
    if (
      entries.length !== 29 ||
      entries.some(
        ([, value]) => typeof value !== "string" || !value.trim()
      )
    ) {
      fail(
        "AMO-Release-Notes-Datei muss exakt 29 nichtleere Übersetzungen enthalten."
      );
    }
    return document.release_notes;
  }

  const releaseNotes = await loadStoreReleaseNotes(process.cwd(), version);
  return createAmoReleaseNotes(releaseNotes);
}

async function setReleaseNotes(version, filename) {
  const addonId = requiredEnvironment("AMO_ADDON_ID");
  const payload = {
    release_notes: await releaseNotesPayload(version, filename)
  };

  return parseResponse(
    await amoFetch(
      `${apiBase}/addons/addon/${encodeURIComponent(
        addonId
      )}/versions/${encodeURIComponent(`v${version}`)}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    )
  );
}

async function submit(xpiFilename, sourceFilename, version, releaseNotesFilename) {
  if (
    !xpiFilename ||
    !sourceFilename ||
    !/^\d+\.\d+\.\d+$/u.test(version ?? "")
  ) {
    fail(
      "Verwendung: submit <firefox.xpi> <source.zip> <x.y.z> [amo-release-notes.json]"
    );
  }

  const upload = await uploadPackage(xpiFilename, "listed");
  const validated = await waitForValidation(upload);
  if (validated.version !== version) {
    fail(
      `AMO erkannte Version ${validated.version}, erwartet wurde ${version}.`
    );
  }

  await createListedVersion({
    uploadUuid: validated.uuid,
    sourceFilename
  });
  await setReleaseNotes(version, releaseNotesFilename);

  return {
    addon: requiredEnvironment("AMO_ADDON_ID"),
    version,
    channel: "listed",
    validation: "valid",
    releaseNotesLocales: 29,
    submitted: true
  };
}

function printHelp() {
  console.log(`AMO API v5\n\nBefehle:\n  profile\n  listing-status\n  listing-update [amo-metadata.json]\n  notes <x.y.z> [amo-release-notes.json]\n  submit <firefox.xpi> <source.zip> <x.y.z> [amo-release-notes.json]\n\nUmgebung:\n  AMO_API_KEY             AMO API issuer/key (für schreibende Befehle)\n  AMO_API_SECRET          AMO API secret (für schreibende Befehle)\n  AMO_ADDON_ID            GUID, Slug oder numerische Add-on-ID\n  AMO_LISTING_APPROVAL    Für listing-update exakt AMO-LISTING-UPDATE:<AMO_ADDON_ID>\n\nDas JWT wird pro Request kurzlebig im Prozess erzeugt und nicht gespeichert. Listing-Updates werden nie ohne zusätzliche explizite Freigabe ausgeführt.`);
}

if (!command || command === "help" || command === "--help") {
  printHelp();
  process.exit(0);
}

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
  case "notes":
    if (!/^\d+\.\d+\.\d+$/u.test(args[0] ?? "")) {
      fail("Verwendung: notes <x.y.z> [amo-release-notes.json]");
    }
    result = await setReleaseNotes(args[0], args[1]);
    break;
  case "submit":
    result = await submit(args[0], args[1], args[2], args[3]);
    break;
  default:
    fail(`Unbekannter Befehl: ${command}`);
}

if (command === "profile") {
  console.log(
    JSON.stringify(
      {
        id: result?.id,
        username: result?.username,
        display_name: result?.display_name
      },
      null,
      2
    )
  );
} else {
  console.log(JSON.stringify(result, null, 2));
}
