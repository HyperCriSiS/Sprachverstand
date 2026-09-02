import { readFile } from "node:fs/promises";
import path from "node:path";

const command = process.argv[2];
const argument = process.argv[3];

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

async function parseResponse(response) {
  const text = await response.text();
  let body = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Nicht jede Fehlerantwort ist JSON; der Rohtext bleibt dann erhalten.
    }
  }

  if (!response.ok) {
    const rendered =
      typeof body === "string" ? body : JSON.stringify(body, null, 2);
    fail(`Chrome Web Store API ${response.status}: ${rendered}`);
  }
  return body;
}

async function resolveAccessToken() {
  const directToken = process.env.CWS_ACCESS_TOKEN?.trim();
  if (directToken) {
    return directToken;
  }

  const clientId = requiredEnvironment("CWS_CLIENT_ID");
  const clientSecret = requiredEnvironment("CWS_CLIENT_SECRET");
  const refreshToken = requiredEnvironment("CWS_REFRESH_TOKEN");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const result = await parseResponse(response);
  if (!result?.access_token) {
    fail("OAuth-Antwort enthält kein access_token.");
  }
  return result.access_token;
}

function endpointBase() {
  const publisherId = requiredEnvironment("CWS_PUBLISHER_ID");
  const extensionId = requiredEnvironment("CWS_EXTENSION_ID");
  return {
    api: `https://chromewebstore.googleapis.com/v2/publishers/${encodeURIComponent(
      publisherId
    )}/items/${encodeURIComponent(extensionId)}`,
    upload: `https://chromewebstore.googleapis.com/upload/v2/publishers/${encodeURIComponent(
      publisherId
    )}/items/${encodeURIComponent(extensionId)}`
  };
}

async function authorizedFetch(url, options = {}) {
  const token = await resolveAccessToken();
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

async function status() {
  const { api } = endpointBase();
  return parseResponse(
    await authorizedFetch(`${api}:fetchStatus`, {
      method: "GET"
    })
  );
}

async function upload(filename) {
  if (!filename) {
    fail("Für upload muss der Pfad zum ZIP-Paket angegeben werden.");
  }
  const absolutePath = path.resolve(filename);
  const data = await readFile(absolutePath);
  const { upload: uploadBase } = endpointBase();
  return parseResponse(
    await authorizedFetch(`${uploadBase}:upload`, {
      method: "POST",
      headers: { "Content-Type": "application/zip" },
      body: data
    })
  );
}

async function publish() {
  const { api } = endpointBase();
  return parseResponse(
    await authorizedFetch(`${api}:publish`, {
      method: "POST"
    })
  );
}

async function waitForUpload(timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const current = await status();
    const uploadState = current?.lastAsyncUploadState ?? current?.uploadState;
    if (
      ["SUCCEEDED", "UPLOAD_SUCCEEDED", "SUCCESS", "UPLOAD_SUCCESS"].includes(
        uploadState
      )
    ) {
      return current;
    }
    if (
      ["FAILED", "UPLOAD_FAILED", "FAILURE", "UPLOAD_FAILURE", "NOT_FOUND"].includes(
        uploadState
      )
    ) {
      fail(`Chrome-Web-Store-Upload fehlgeschlagen: ${JSON.stringify(current)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  fail("Chrome-Web-Store-Upload hat das Zeitlimit von 180 Sekunden überschritten.");
}

async function cancelSubmission() {
  const { api } = endpointBase();
  return parseResponse(
    await authorizedFetch(`${api}:cancelSubmission`, {
      method: "POST"
    })
  );
}

async function setRollout(rawPercentage) {
  const percentage = Number(rawPercentage);
  if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
    fail("Der Rollout-Prozentsatz muss eine ganze Zahl zwischen 0 und 100 sein.");
  }
  const { api } = endpointBase();
  return parseResponse(
    await authorizedFetch(`${api}:setPublishedDeployPercentage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deployPercentage: percentage })
    })
  );
}

function printHelp() {
  console.log(`Chrome Web Store API V2\n\nBefehle:\n  status\n  upload <paket.zip>\n  wait\n  publish\n  cancel\n  rollout <0-100>\n\nAuthentifizierung:\n  CWS_PUBLISHER_ID und CWS_EXTENSION_ID sind immer erforderlich.\n  Bevorzugt CWS_ACCESS_TOKEN aus einem kurzlebigen GitHub-OIDC/Google-WIF-Token setzen.\n  Alternativ CWS_CLIENT_ID, CWS_CLIENT_SECRET und CWS_REFRESH_TOKEN verwenden.`);
}

if (!command || command === "--help" || command === "help") {
  printHelp();
  process.exit(0);
}

let result;
switch (command) {
  case "status":
    result = await status();
    break;
  case "upload":
    result = await upload(argument);
    break;
  case "wait":
    result = await waitForUpload();
    break;
  case "publish":
    result = await publish();
    break;
  case "cancel":
    result = await cancelSubmission();
    break;
  case "rollout":
    result = await setRollout(argument);
    break;
  default:
    fail(`Unbekannter Befehl: ${command}`);
}

if (typeof result === "string") {
  console.log(result);
} else {
  console.log(JSON.stringify(result, null, 2));
}
