import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {connectNavigationObserver} from "./navigation-start-observer.mjs";

const snapshotKeys = ["documentNowMs", "loadEventEndMs", "readyState", "focused", "visibility", "staticCorrect", "staticOriginal",
  "dynamicCorrect", "dynamicOriginal", "protected"];
const eventNames = new Set(["fixture-http-request", "fixture-http-response-finished",
  "fixture-network-request", "fixture-network-response", "fixture-main-frame-navigated",
  "fixture-dom-content-loaded", "fixture-load-event"]);
const rootKeys = ["schemaVersion", "browserVersion", "outcome", "navigationElapsedMs",
  "navigationStartedAtWitnessMs", "failureObservedAtWitnessMs", "pageLoadLimitMs",
  "diagnosticElapsedMs", "observationScope", "fixtureDocumentConfirmed", "snapshot",
  "loadEventEndWitnessIntervalMs", "loadEventCompletedBeforeFailure", "loadEventProvenBeforeTimeout",
  "witness", "rawProtocolExported", "profilesExported", "sessionIdentifiersExported"];

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
const duration = value => Number.isFinite(value) && value >= 0;
const completedBeforeFailure = (interval, failureAt) => interval === null ? null
  : interval[1] < failureAt ? true : interval[0] > failureAt ? false : null;
const provenBeforeTimeout = (interval, startedAt, limit) =>
  interval !== null && limit !== null && interval[1] < startedAt + limit ? true : null;

export function validateNavigationFailureSummary(summary) {
  if (!exactKeys(summary, summary?.schemaVersion===3?[...rootKeys,"observerConnection"]:rootKeys) || ![2,3].includes(summary.schemaVersion) ||
    !/^(?:unknown|\d+\.\d+\.\d+\.\d+)$/u.test(summary.browserVersion) ||
    !["renderer-timeout", "navigation-failed"].includes(summary.outcome) ||
    !duration(summary.navigationElapsedMs) || !duration(summary.diagnosticElapsedMs) ||
    !duration(summary.navigationStartedAtWitnessMs) || !duration(summary.failureObservedAtWitnessMs) ||
    Math.abs(summary.failureObservedAtWitnessMs - summary.navigationStartedAtWitnessMs - summary.navigationElapsedMs) > 0.001 ||
    (summary.pageLoadLimitMs !== null && (!Number.isSafeInteger(summary.pageLoadLimitMs) || summary.pageLoadLimitMs <= 0)) ||
    summary.observationScope !== "after-navigation-failure" ||
    typeof summary.fixtureDocumentConfirmed !== "boolean" ||
    summary.rawProtocolExported !== false || summary.profilesExported !== false ||
    summary.sessionIdentifiersExported !== false) throw new Error("Invalid navigation diagnostic envelope");
  if(summary.schemaVersion===3){
    const state=summary.observerConnection;
    const stages=["not-attempted","address","discovery","target-selection","endpoint-validation","socket-open","enable-domains","ready","snapshot","complete"];
    if(!exactKeys(state,["stage","targetState","pageCount"])||!stages.includes(state.stage)||
      !["unobserved","none","multiple","fixture","webdriver-blank","other"].includes(state.targetState)||
      (state.pageCount!==null&&(!Number.isSafeInteger(state.pageCount)||state.pageCount<0||state.pageCount>256))||
      (state.targetState==="unobserved"?state.pageCount!==null:state.targetState==="none"?state.pageCount!==0:state.targetState==="multiple"?state.pageCount<2:state.pageCount!==1))throw Error("Invalid observer connection metadata");
  }
  if (summary.snapshot !== null) {
    const snapshot = summary.snapshot;
    if (!exactKeys(snapshot, snapshotKeys) ||
      !["loading", "interactive", "complete"].includes(snapshot.readyState) ||
      !["visible", "hidden"].includes(snapshot.visibility) ||
      !duration(snapshot.documentNowMs) || (snapshot.loadEventEndMs !== null && !duration(snapshot.loadEventEndMs)) ||
      snapshotKeys.filter(key => !["documentNowMs", "loadEventEndMs", "readyState", "visibility"].includes(key))
        .some(key => typeof snapshot[key] !== "boolean")) throw new Error("Invalid navigation diagnostic snapshot");
  }
  const interval = summary.loadEventEndWitnessIntervalMs;
  if (interval !== null && (!Array.isArray(interval) || interval.length !== 2 ||
    !interval.every(Number.isFinite) || interval[1] < interval[0] ||
    !summary.fixtureDocumentConfirmed || !(summary.snapshot?.loadEventEndMs > 0))) {
    throw new Error("Invalid navigation timing interval");
  }
  if (summary.loadEventCompletedBeforeFailure !== completedBeforeFailure(interval, summary.failureObservedAtWitnessMs)) {
    throw new Error("Invalid navigation timing conclusion");
  }
  if (summary.loadEventProvenBeforeTimeout !== provenBeforeTimeout(interval, summary.navigationStartedAtWitnessMs, summary.pageLoadLimitMs)) {
    throw new Error("Unproven navigation timeout conclusion");
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
  pageLoadLimitMs, observer, error, navigationStartedAt, outputDirectory}) {
  const diagnosticStarted = performance.now();
  let connection;
  let snapshot = null;
  let loadEventEndWitnessIntervalMs = null;
  try {
    // Connect only after the original navigation has failed. Do not warm up or
    // change the successful navigation path, and never raise its timeout.
    connection = await connectNavigationObserver(debuggerAddress, observer, true);
    observer.connectionState.stage="snapshot";
    const readStarted = performance.now();
    const observed = await connection.snapshot();
    const readFinished = performance.now();
    observer.connectionState.stage="complete";
    snapshot = Object.fromEntries(snapshotKeys.map(key => [key, observed[key]]));
    if (observer.ownDocument && snapshot.loadEventEndMs > 0) {
      // The browser sampled documentNow inside this request/response window.
      // Keep a conservative extra millisecond for timer quantization.
      const delta = snapshot.loadEventEndMs - snapshot.documentNowMs - observer.started;
      loadEventEndWitnessIntervalMs = [readStarted + delta - 1, readFinished + delta + 1];
    }
  } catch {
    // The renderer can remain unavailable. Preserve server progress in that case.
  } finally {
    connection?.close();
  }
  const summary = {
    schemaVersion: 3,
    observerConnection:{...observer.connectionState},
    browserVersion: /^\d+\.\d+\.\d+\.\d+$/u.test(browserVersion ?? "") ? browserVersion : "unknown",
    outcome: /Timed out receiving message from renderer/u.test(String(error?.message))
      ? "renderer-timeout" : "navigation-failed",
    navigationElapsedMs: diagnosticStarted - navigationStartedAt,
    navigationStartedAtWitnessMs: navigationStartedAt - observer.started,
    failureObservedAtWitnessMs: diagnosticStarted - observer.started,
    pageLoadLimitMs: Number.isSafeInteger(pageLoadLimitMs) && pageLoadLimitMs > 0 ? pageLoadLimitMs : null,
    diagnosticElapsedMs: performance.now() - diagnosticStarted,
    observationScope: "after-navigation-failure",
    fixtureDocumentConfirmed: observer.ownDocument,
    snapshot,
    loadEventEndWitnessIntervalMs,
    loadEventCompletedBeforeFailure: completedBeforeFailure(loadEventEndWitnessIntervalMs, diagnosticStarted - observer.started),
    loadEventProvenBeforeTimeout: provenBeforeTimeout(loadEventEndWitnessIntervalMs,
      navigationStartedAt - observer.started, Number.isSafeInteger(pageLoadLimitMs) && pageLoadLimitMs > 0 ? pageLoadLimitMs : null),
    witness: observer.summary(),
    rawProtocolExported: false,
    profilesExported: false,
    sessionIdentifiersExported: false
  };
  validateNavigationFailureSummary(summary);
  await mkdir(outputDirectory, {recursive: true});
  await writeFile(path.join(outputDirectory, "navigation-failure.json"), JSON.stringify(summary, null, 2));
}
