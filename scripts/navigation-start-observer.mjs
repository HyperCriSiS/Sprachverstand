import fs from 'node:fs';
import path from 'node:path';

export function resolveNavigationExecutable(configured, name, findCommand) {
  let candidate;
  if (configured) {
    candidate = fs.existsSync(configured) && fs.statSync(configured).isDirectory()
      ? path.join(configured, name) : configured;
  } else candidate = findCommand(name);
  if (!candidate || !fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    throw new Error('Configured navigation executable is not a file');
  }
  return candidate;
}

// Bounded allowlist for our synthetic fixture. Never export protocol payloads.
export class NavigationStartObserver {
  constructor(fixtureUrl, now = () => performance.now()) {
    const fixture = new URL(fixtureUrl);
    if (fixture.hostname !== '127.0.0.1' || fixture.pathname !== '/extension-smoke.html') {
      throw new Error('Only the own loopback fixture is supported');
    }
    this.fixtureUrl = fixture.href;
    this.now = now;
    this.started = now();
    this.events = [];
    this.ownDocument = false;
    this.truncated = false;
  }
  mark(event, details = {}) {
    if (this.events.length === 256) { this.truncated = true; return; }
    this.events.push({event, atMs: this.now() - this.started, ...details});
  }
  served() { this.mark('fixture-http-request'); }
  finished() { this.mark('fixture-http-response-finished'); }
  protocol(message) {
    const {method, params = {}} = message;
    if (method === 'Network.requestWillBeSent' && params.request?.url === this.fixtureUrl) {
      this.mark('fixture-network-request');
    } else if (method === 'Network.responseReceived' && params.response?.url === this.fixtureUrl) {
      const status = params.response.status;
      if (Number.isInteger(status) && status >= 100 && status <= 599) this.mark('fixture-network-response', {status});
    } else if (method === 'Page.frameNavigated' && !params.frame?.parentId && params.frame?.url === this.fixtureUrl) {
      this.ownDocument = true;
      this.mark('fixture-main-frame-navigated');
    } else if (this.ownDocument && method === 'Page.domContentEventFired') {
      this.mark('fixture-dom-content-loaded');
    } else if (this.ownDocument && method === 'Page.loadEventFired') {
      this.mark('fixture-load-event');
    }
  }
  summary() { return {events: this.events, truncated: this.truncated}; }
}

export async function connectNavigationObserver(address, observer) {
  if (typeof address !== 'string' || !/^(localhost|127\.0\.0\.1):\d+$/u.test(address)) {
    throw new Error('Own loopback debugger address required');
  }
  const response = await fetch(`http://${address}/json/list`, {signal: AbortSignal.timeout(5000)});
  if (!response.ok) throw new Error('Debugger discovery failed');
  const pages = (await response.json()).filter(target => target.type === 'page');
  if (pages.length !== 1 || pages[0].url !== 'data:,') throw new Error('Expected one fresh WebDriver data page');
  const websocket = new URL(pages[0].webSocketDebuggerUrl);
  const expected = new URL(`http://${address}`);
  if (websocket.protocol !== 'ws:' || websocket.hostname !== expected.hostname || websocket.port !== expected.port) {
    throw new Error('Debugger connection escaped own endpoint');
  }
  const socket = new WebSocket(websocket.href), pending = new Map();
  let ordinal = 0;
  const rejectPending = () => {
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('Observer disconnected')); }
    pending.clear();
  };
  socket.addEventListener('close', rejectPending);
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method) observer.protocol(message);
    const entry = pending.get(message.id);
    if (entry) {
      pending.delete(message.id); clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error('Observer command rejected'));
      else entry.resolve(message.result);
    }
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++ordinal;
    const timer = setTimeout(() => {pending.delete(id); reject(new Error('Observer response deadline'));}, 3000);
    pending.set(id, {timer, resolve, reject});
    try { socket.send(JSON.stringify({id, method, params})); }
    catch { clearTimeout(timer); pending.delete(id); reject(new Error('Observer send failed')); }
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Observer connect deadline')), 5000);
      socket.addEventListener('open', () => {clearTimeout(timer); resolve();}, {once: true});
      socket.addEventListener('error', () => {clearTimeout(timer); reject(new Error('Observer connect failed'));}, {once: true});
    });
    await command('Network.enable');
    await command('Page.enable');
    return {
      async snapshot() {
        const result = await command('Runtime.evaluate', {
          expression: `JSON.stringify({readyState:document.readyState,focused:document.hasFocus(),visibility:document.visibilityState,staticCorrect:document.querySelector('#static-target')?.textContent==='Nutzer',staticOriginal:document.querySelector('#static-target')?.textContent==='Nutzer:innen',dynamicCorrect:document.querySelector('#dynamic-target')?.textContent==='Nutzer',dynamicOriginal:document.querySelector('#dynamic-target')?.textContent==='Nutzer:innen',protected:document.querySelector('#protected-code')?.textContent==='Nutzer:innen'&&document.querySelector('#protected-input')?.value==='Nutzer:innen'})`,
          returnByValue: true
        });
        if (result.exceptionDetails || typeof result.result?.value !== 'string') throw new Error('Invalid fixture snapshot');
        const value = JSON.parse(result.result.value);
        if (!['loading', 'interactive', 'complete'].includes(value.readyState) || !['visible', 'hidden'].includes(value.visibility)) throw new Error('Invalid fixture state');
        for (const key of ['focused', 'staticCorrect', 'staticOriginal', 'dynamicCorrect', 'dynamicOriginal', 'protected']) {
          if (typeof value[key] !== 'boolean') throw new Error('Invalid fixture boolean');
        }
        return value;
      },
      close() { socket.close(); rejectPending(); }
    };
  } catch (error) { socket.close(); rejectPending(); throw error; }
}
