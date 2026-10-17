import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";

let processor: DomProcessor | undefined;
interface PendingScan {
  pendingNodes: Set<Node>;
  takeNextReadyNode(): {node?: Node; delayMs?: number};
  isProcessableRoot(node: Node): boolean;
  getBackoffRemaining(node: Text): number;
  queue(node: Node): void;
  now(): number;
}
function start(): PendingScan {
  document.body.replaceChildren();
  processor = new DomProcessor(document, {rules: [], profile: "aggressive"});
  processor.start(); processor.flush();
  return processor as unknown as PendingScan;
}
afterEach(() => {processor?.stop({restore: true}); processor = undefined; vi.restoreAllMocks(); document.body.replaceChildren();});

it("bounds the removal of stale pending nodes per scan and still reaches a live root", () => {
  const scan = start();
  for (let index = 0; index < 1000; index++) scan.pendingNodes.add(document.createTextNode("stale"));
  const live = document.createElement("p"); live.textContent = "live"; document.body.append(live);
  scan.pendingNodes.add(live);
  const inspect = vi.spyOn(scan, "isProcessableRoot");
  const first = scan.takeNextReadyNode();
  expect(inspect.mock.calls.length).toBeLessThanOrEqual(128);
  expect(first.node).toBeUndefined(); expect(first.delayMs).toBe(0);
  let ready: Node | undefined;
  for (let turn = 0; turn < 10 && !ready; turn++) ready = scan.takeNextReadyNode().node;
  expect(ready).toBe(live); expect(scan.pendingNodes.size).toBe(0);
});

it("continues past backed-off texts instead of rescanning the same prefix", () => {
  const scan = start(); const delayed: Text[] = [];
  for (let index = 0; index < 300; index++) {
    const paragraph = document.createElement("p"); const text = document.createTextNode("delayed");
    paragraph.append(text); document.body.append(paragraph); delayed.push(text); scan.pendingNodes.add(text);
  }
  const live = document.createElement("p"); live.textContent = "ready"; document.body.append(live); scan.pendingNodes.add(live);
  vi.spyOn(scan, "getBackoffRemaining").mockReturnValue(100);
  expect(scan.takeNextReadyNode().delayMs).toBe(0);
  expect(scan.takeNextReadyNode().delayMs).toBe(0);
  expect(scan.takeNextReadyNode().node).toBe(live);
  expect(scan.takeNextReadyNode().delayMs).toBeGreaterThan(0);
  expect(scan.pendingNodes.size).toBe(delayed.length);
});

it("clears an incomplete scan for synchronous flush and a later restart", () => {
  const scan = start();
  for (let index = 0; index < 300; index++) scan.pendingNodes.add(document.createTextNode("stale"));
  scan.takeNextReadyNode(); processor!.flush(); expect(scan.pendingNodes.size).toBe(0);
  processor!.stop(); processor!.start(); processor!.flush();
  const live = document.createElement("p"); document.body.append(live); scan.pendingNodes.add(live);
  expect(scan.takeNextReadyNode().node).toBe(live);
});

it("revisits a deferred text queued again after the cursor passed it", () => {
  const scan = start(); const texts: Text[] = [];
  for (let index = 0; index < 300; index++) {
    const paragraph = document.createElement("p"); const text = document.createTextNode("Nutzer:innen");
    paragraph.append(text); document.body.append(paragraph); texts.push(text); scan.pendingNodes.add(text);
  }
  let changed = false;
  vi.spyOn(scan, "getBackoffRemaining").mockImplementation(node => changed && node === texts[0] ? 0 : 100);
  scan.takeNextReadyNode(); changed = true; scan.queue(texts[0]!);
  scan.takeNextReadyNode(); expect(scan.takeNextReadyNode().node).toBe(texts[0]);
});
