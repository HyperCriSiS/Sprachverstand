import {summarizeOwnedTrace} from './system-io-export.mjs';
import {writeFile} from "node:fs/promises";

// Only the fresh local WebDriver session supplies this loopback address.
// Traces are opt-in diagnostics; their instrumentation changes performance.
export async function startChromiumBrowserTrace(address,
  categories = "v8,devtools.timeline,disabled-by-default-v8.compile",{deferStart=false}={}) {
  if (typeof address !== "string" || !/^(?:localhost|127\.0\.0\.1):\d+$/u.test(address)) {
    throw new Error("Lokale Chromium-Debuggeradresse fehlt.");
  }
  const response = await fetch("http://" + address + "/json/version", {signal: AbortSignal.timeout(10_000)});
  if (!response.ok) throw new Error("Chromium-Debuggerziele fehlen.");
  const target = await response.json();
  if (!target?.webSocketDebuggerUrl) throw new Error("Chromium-Browserziel fehlt.");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  let finish;
  const completed = new Promise(resolve => {finish = resolve;});
  const rejectPending = () => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer); entry.reject(new Error("Chromium-Traceverbindung geschlossen."));
    }
    pending.clear();
  };
  socket.addEventListener("close", rejectPending);
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const entry = pending.get(message.id);
    if (entry) {
      pending.delete(message.id); clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
      else entry.resolve(message.result);
    }
    if (message.method === "Tracing.tracingComplete") finish(message.params.stream);
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {pending.delete(id); reject(new Error("Chromium-Traceantwort fehlt: " + method));}, 10_000);
    pending.set(id, {resolve, reject, timer});
    try {socket.send(JSON.stringify({id, method, params}));}
    catch (error) {clearTimeout(timer); pending.delete(id); reject(error);}
  });
  let started=false,startPromise;
  const start=()=>startPromise??=(command("Tracing.start",{categories,transferMode:"ReturnAsStream"}).then(()=>{started=true;}));
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Chromium-Traceverbindung fehlt.")), 10_000);
      socket.addEventListener("open", () => {clearTimeout(timer); resolve();}, {once:true});
      socket.addEventListener("error", () => {clearTimeout(timer); reject(new Error("Chromium-Traceverbindung fehlgeschlagen."));}, {once:true});
    });
    if(!deferStart)await start();
  } catch (error) {socket.close(); rejectPending(); throw error;}
  return {start,get started(){return started;},
    cancel() {socket.close(); rejectPending();},
    async save(filename) {
      let completionTimer;
      try {
        await command("Tracing.end");
        const handle = await Promise.race([completed, new Promise((_, reject) => {
          completionTimer=setTimeout(() => reject(new Error("Chromium-Traceabschluss fehlt.")), 10_000);
        })]);
        clearTimeout(completionTimer);
        if (typeof handle !== "string") throw new Error("Chromium-Tracestream fehlt.");
        let text = "";
        while (true) {
          const chunk = await command("IO.read", {handle});
          text += chunk.base64Encoded ? Buffer.from(chunk.data,"base64").toString("utf8") : chunk.data;
          if (text.length > 128 * 1024 * 1024) throw new Error("Chromium-Trace überschreitet die Diagnosegrenze.");
          if (chunk.eof) break;
        }
        await command("IO.close", {handle});
        await writeFile(filename,summarizeOwnedTrace(filename,text));
      } finally {clearTimeout(completionTimer); socket.close(); rejectPending();}
    }
  };
}
