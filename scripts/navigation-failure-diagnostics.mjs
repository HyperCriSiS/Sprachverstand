import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {connectNavigationObserver} from "./navigation-start-observer.mjs";

const snapshotKeys = ["readyState", "focused", "visibility", "staticCorrect", "staticOriginal",
  "dynamicCorrect", "dynamicOriginal", "protected"];
const eventNames = new Set(["fixture-http-request", "fixture-http-response-finished",
  "fixture-network-request", "fixture-network-response", "fixture-main-frame-navigated",
  "fixture-dom-content-loaded", "fixture-load-event"]);
const rootKeys = ["schemaVersion", "browserVersion", "outcome", "navigationElapsedMs",
  "diagnosticElapsedMs", "observationScope", "fixtureDocumentConfirmed", "snapshot",
  "witness", "rawProtocolExported", "profilesExported", "sessionIdentifiersExported"];

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
const duration = value => Number.isFinite(value) && value >= 0;

export function validateNavigationFailureSummary(summary) {
  if (!exactKeys(summary, rootKeys) || summary.schemaVersion !== 1 ||
    !/^(?:unknown|\d+\.\d+\.\d+\.\d+)$/u.test(summary.browserVersion) ||
    !["renderer-timeout", "navigation-failed"].includes(summary.outcome) ||
    !duration(summary.navigationElapsedMs) || !duration(summary.diagnosticElapsedMs) ||
    summary.observationScope !== "after-navigation-failure" ||
    typeof summary.fixtureDocumentConfirmed !== "boolean" ||
    summary.rawProtocolExported !== false || summary.profilesExported !== false ||
    summary.sessionIdentifiersExported !== false) throw new Error("Invalid navigation diagnostic envelope");
  if (summary.snapshot !== null) {
    const snapshot = summary.snapshot;
    if (!exactKeys(snapshot, snapshotKeys) ||
      !["loading", "interactive", "complete"].includes(snapshot.readyState) ||
      !["visible", "hidden"].includes(snapshot.visibility) ||
      snapshotKeys.filter(key => key !== "readyState" && key !== "visibility")
        .some(key => typeof snapshot[key] !== "boolean")) throw new Error("Invalid navigation diagnostic snapshot");
  }
  const witness = summary.witness;
  if (!exactKeys(witness, ["events", "truncated"]) || !Array.isArray(witness.events) ||
    witness.events.length > 256 || typeof witness.truncated !== "boolean") throw new Error("Invalid navigation diagnostic events");
  for (const event of witness.events) {
    const response = event.event === "fixture-network-response";
    if (!exactKeys(event, response ? ["event", "atMs", "status"] : ["event", "atMs"]) ||
      !eventNames.has(event.event) || !duration(event.atMs) ||
      (response && (!Number.isInteger(event.status) || event.status < 100 || event.status > 599))) {
      throw new Error("Invalid navigation diagnostic event");
    }
  }
  return summary;
}

export async function saveNavigationFailureDiagnostic({debuggerAddress, browserVersion,
  observer, error, navigationStartedAt, outputDirectory}) {
  const diagnosticStarted = performance.now();
  let connection;
  let snapshot = null;
  try {
    // Connect only after the original navigation has failed. Do not warm up or
    // change the successful navigation path, and never raise its timeout.
    connection = await connectNavigationObserver(debuggerAddress, observer, true);
    const observed = await connection.snapshot();
    snapshot = Object.fromEntries(snapshotKeys.map(key => [key, observed[key]]));
  } catch {
    // The renderer can remain unavailable. Preserve server progress in that case.
  } finally {
    connection?.close();
  }
  const summary = {
    schemaVersion: 1,
    browserVersion: /^\d+\.\d+\.\d+\.\d+$/u.test(browserVersion ?? "") ? browserVersion : "unknown",
    outcome: /Timed out receiving message from renderer/u.test(String(error?.message))
      ? "renderer-timeout" : "navigation-failed",
    navigationElapsedMs: diagnosticStarted - navigationStartedAt,
    diagnosticElapsedMs: performance.now() - diagnosticStarted,
    observationScope: "after-navigation-failure",
    fixtureDocumentConfirmed: observer.ownDocument,
    snapshot,
    witness: observer.summary(),
    rawProtocolExported: false,
    profilesExported: false,
    sessionIdentifiersExported: false
  };
  validateNavigationFailureSummary(summary);
  await mkdir(outputDirectory, {recursive: true});
  await writeFile(path.join(outputDirectory, "navigation-failure.json"), JSON.stringify(summary, null, 2));
}
