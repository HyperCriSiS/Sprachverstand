// @vitest-environment node
import {afterEach, expect, it, vi} from "vitest";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {NavigationStartObserver} from "../scripts/navigation-start-observer.mjs";
import {saveNavigationFailureDiagnostic, validateNavigationFailureSummary}
  from "../scripts/navigation-failure-diagnostics.mjs";

const fixtureUrl = "http://127.0.0.1:2345/extension-smoke.html";
const directories = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const directory of directories.splice(0)) {
    if (!path.resolve(directory).startsWith(path.join(os.tmpdir(), "sprachverstand-nav-diagnostic-"))) {
      throw new Error("Test cleanup outside own temporary directory");
    }
    await rm(directory, {recursive: true, force: true});
  }
});

const snapshot = () => ({documentNowMs: 1000, loadEventEndMs: 100, readyState: "complete", focused: true, visibility: "visible",
  staticCorrect: true, staticOriginal: false, dynamicCorrect: true,
  dynamicOriginal: false, protected: true});
function installOwnDebuggerReply(observed, malformed = false) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ok: true, json: async () => [{type: "page",
    url: fixtureUrl, webSocketDebuggerUrl: "ws://127.0.0.1:1234/devtools/page/PRIVATE"}]})));
  vi.stubGlobal("WebSocket", class extends EventTarget {
    constructor() {super(); queueMicrotask(() => this.dispatchEvent(new Event("open")));}
    send(text) {
      const command = JSON.parse(text);
      const result = command.method === "Runtime.evaluate"
        ? {result: {value: JSON.stringify(observed)}} : {};
      queueMicrotask(() => this.dispatchEvent(new MessageEvent("message", {
        data: malformed ? "malformed PRIVATE protocol" : JSON.stringify({id: command.id, result})
      })));
    }
    close() {this.dispatchEvent(new Event("close"));}
  });
}
async function save({address = "127.0.0.1:1234", version = "155.0.8059.0"} = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sprachverstand-nav-diagnostic-"));
  directories.push(directory);
  const observer = new NavigationStartObserver(fixtureUrl);
  observer.served(); observer.finished();
  observer.protocol({method: "Network.responseReceived", params: {response: {
    url: "https://private.invalid/PRIVATE", status: 200
  }}});
  await saveNavigationFailureDiagnostic({debuggerAddress: address, browserVersion: version, pageLoadLimitMs: 30000,
    observer, navigationStartedAt: performance.now(),
    error: new Error("PRIVATE session/path: Timed out receiving message from renderer: 30.000"),
    outputDirectory: directory});
  const text = await readFile(path.join(directory, "navigation-failure.json"), "utf8");
  expect(text).not.toMatch(/PRIVATE|private\.invalid|session\/path|127\.0\.0\.1/u);
  const summary = JSON.parse(text);
  expect(() => validateNavigationFailureSummary(summary)).not.toThrow();
  return summary;
}

it("keeps the original timeout classification and server progress when the debugger is unavailable", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const summary = await save({address: "https://private.invalid/PRIVATE", version: "PRIVATE"});
  expect(fetch).not.toHaveBeenCalled();
  expect(summary.outcome).toBe("renderer-timeout");
  expect(summary.browserVersion).toBe("unknown");
  expect(summary.snapshot).toBeNull();
  expect(summary.witness.events.map(event => event.event))
    .toEqual(["fixture-http-request", "fixture-http-response-finished"]);
});

it("exports only booleans and fixed state enums from an independently read fixture", async () => {
  installOwnDebuggerReply({...snapshot(), sessionId: "PRIVATE", profile: "PRIVATE"});
  const summary = await save();
  expect(summary.snapshot).toEqual(snapshot());
  expect(summary.fixtureDocumentConfirmed).toBe(true);
  expect(summary.loadEventCompletedBeforeFailure).toBe(true);
  expect(summary.loadEventProvenBeforeTimeout).toBe(true);
});

it("keeps a malformed independent snapshot out of the diagnostic", async () => {
  installOwnDebuggerReply({...snapshot(), protected: "PRIVATE"});
  expect((await save()).snapshot).toBeNull();
});

it("preserves the navigation failure when the independent protocol reply is malformed", async () => {
  installOwnDebuggerReply(snapshot(), true);
  expect((await save()).snapshot).toBeNull();
});

it("does not infer prior load completion from readyState without a load timestamp", async () => {
  installOwnDebuggerReply({...snapshot(), loadEventEndMs: 0});
  const summary = await save();
  expect(summary.snapshot.readyState).toBe("complete");
  expect(summary.loadEventEndWitnessIntervalMs).toBeNull();
  expect(summary.loadEventProvenBeforeTimeout).toBeNull();
});

const validSummary = () => ({schemaVersion: 2, browserVersion: "155.0.8059.0",
  outcome: "renderer-timeout", navigationElapsedMs: 30000, diagnosticElapsedMs: 20,
  navigationStartedAtWitnessMs: 50, failureObservedAtWitnessMs: 30050,
  pageLoadLimitMs: 30000,
  observationScope: "after-navigation-failure", fixtureDocumentConfirmed: true,
  snapshot: snapshot(), witness: {events: [{event: "fixture-http-request", atMs: 50}], truncated: false},
  loadEventEndWitnessIntervalMs: [100, 102], loadEventCompletedBeforeFailure: true,
  loadEventProvenBeforeTimeout: true,
  rawProtocolExported: false, profilesExported: false, sessionIdentifiersExported: false});

it.each([
  ["unexpected envelope key", summary => {summary.sessionId = "PRIVATE";}],
  ["unexpected snapshot key", summary => {summary.snapshot.profile = "PRIVATE";}],
  ["unexpected event key", summary => {summary.witness.events[0].url = "PRIVATE";}],
  ["raw protocol", summary => {summary.rawProtocolExported = true;}],
  ["invalid timing", summary => {summary.navigationElapsedMs = -1;}],
  ["inconsistent witness clocks", summary => {summary.failureObservedAtWitnessMs += 1;}],
  ["invalid negotiated timeout", summary => {summary.pageLoadLimitMs = "PRIVATE";}],
  ["unproven load conclusion", summary => {summary.loadEventCompletedBeforeFailure = false;}],
  ["unproven timeout conclusion", summary => {summary.loadEventProvenBeforeTimeout = false;}],
  ["unbounded event list", summary => {summary.witness.events = Array(257).fill({event: "fixture-http-request", atMs: 1});}],
  ["invalid response status", summary => {summary.witness.events = [{event: "fixture-network-response", atMs: 1, status: "PRIVATE"}];}]
])("blocks export for %s", (_name, mutate) => {
  const summary = validSummary(); mutate(summary);
  expect(() => validateNavigationFailureSummary(summary)).toThrow();
});

it("keeps load completion after the earliest timeout unproven even before the error response", () => {
  const summary = validSummary();
  summary.navigationElapsedMs = 31000;
  summary.failureObservedAtWitnessMs = 31050;
  summary.loadEventEndWitnessIntervalMs = [30500, 30502];
  summary.loadEventProvenBeforeTimeout = null;
  expect(() => validateNavigationFailureSummary(summary)).not.toThrow();
});

it('records completion of own fixture observation without exporting discovery URLs',async()=>{
 installOwnDebuggerReply(snapshot());
 const summary=await save();
 expect(summary.schemaVersion).toBe(3);
 expect(summary.observerConnection).toEqual({stage:'complete',targetState:'fixture',pageCount:1});
});
it('records address or discovery failure independently of the original renderer timeout',async()=>{
 expect((await save({address:'PRIVATE'})).observerConnection).toEqual({stage:'address',targetState:'unobserved',pageCount:null});
 vi.stubGlobal('fetch',vi.fn(async()=>{throw Error('PRIVATE discovery');}));
 const summary=await save();
 expect(summary.observerConnection).toEqual({stage:'discovery',targetState:'unobserved',pageCount:null});
 expect(summary.outcome).toBe('renderer-timeout');
});
it.each([
 {pages:[],targetState:'none',count:0},
 {pages:[{type:'page',url:'https://private.invalid/PRIVATE'}],targetState:'other',count:1},
 {pages:[{type:'page',url:'about:blank'}],targetState:'other',count:1},
 {pages:[{type:'page',url:fixtureUrl},{type:'page',url:'PRIVATE'}],targetState:'multiple',count:2}
])('keeps strict target selection for $targetState',async({pages,targetState,count})=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>pages})));
 const socket=vi.fn();vi.stubGlobal('WebSocket',socket);
 const summary=await save();
 expect(summary.observerConnection).toEqual({stage:'target-selection',targetState,pageCount:count});
 expect(socket).not.toHaveBeenCalled();expect(summary.snapshot).toBeNull();
});
it('rejects an escaped websocket endpoint and records only the fixed stage',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>[{type:'page',url:fixtureUrl,webSocketDebuggerUrl:'ws://private.invalid/PRIVATE'}]})));
 const summary=await save();
 expect(summary.observerConnection).toEqual({stage:'endpoint-validation',targetState:'fixture',pageCount:1});
});
it('distinguishes snapshot failure after connecting to a known fixture',async()=>{
 installOwnDebuggerReply({...snapshot(),protected:'PRIVATE'});
 const summary=await save();
 expect(summary.observerConnection).toEqual({stage:'snapshot',targetState:'fixture',pageCount:1});
});
it.each([
 {stage:'PRIVATE',targetState:'fixture',pageCount:1},
 {stage:'complete',targetState:'PRIVATE',pageCount:1},
 {stage:'discovery',targetState:'unobserved',pageCount:1},
 {stage:'target-selection',targetState:'none',pageCount:1},
 {stage:'target-selection',targetState:'multiple',pageCount:null},
 {stage:'complete',targetState:'fixture',pageCount:257},
 {stage:'complete',targetState:'fixture',pageCount:1,url:'PRIVATE'}
])('rejects invalid or private connection metadata %j',state=>{
 const summary={...validSummary(),schemaVersion:3,observerConnection:state};
 expect(()=>validateNavigationFailureSummary(summary)).toThrow();
});
it('continues accepting the unchanged legacy schema without inventing a connection stage',()=>{
 const summary=validSummary();expect(summary.schemaVersion).toBe(2);
 expect(()=>validateNavigationFailureSummary(summary)).not.toThrow();
 expect(summary.observerConnection).toBeUndefined();
});
it('rejects missing and non-object diagnostic envelopes',()=>{
 for(const report of [null,undefined,[],{}])expect(()=>validateNavigationFailureSummary(report)).toThrow();
});
