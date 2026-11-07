import {execFileSync} from "node:child_process";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import vm from "node:vm";
import {afterEach, describe, expect, it, vi} from "vitest";
import {createOutlookApi, deviceStore, formatMessage, localeCandidates} from "../src/outlook/extension-shim";
import {transformBody} from "../src/outlook/body-transform";
import {correctComposeOnOpen} from "../src/outlook/launchevent";
import {connectReader, inlineImages, offlinePreview} from "../src/outlook/reader";
import {composeSettingKey} from "../src/outlook/compose-option";
import {defaultSettings} from "../src/settings/defaults";
import type {OfficeGlobal, OutlookItem} from "../src/outlook/office";

const mail = "<html><body><p>Liebe Kolleg*innen, die Lehrer:innen kommen.</p></body></html>";
const ok = <T>(value?: T) => ({status: "succeeded", value: value as T});

function roaming(initial: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {...initial};
  return {values, get: (name: string) => values[name], set: (name: string, value: unknown) => {values[name] = value;},
    remove: (name: string) => {delete values[name];}, saveAsync: (callback?: (result: never) => void) => callback?.(ok() as never)};
}

function officeWith(item: OutlookItem, settings = roaming()): OfficeGlobal & {changed?: () => void} {
  const office: OfficeGlobal & {changed?: () => void} = {
    onReady: async () => undefined,
    context: {roamingSettings: settings, mailbox: {item, addHandlerAsync: (_type, handler) => {office.changed = handler;}}},
    MailboxEnums: {BodyMode: {FullBody: "fullBody"}}
  };
  return office;
}

afterEach(() => {
  delete (globalThis as {browser?: unknown}).browser;
});

describe("Outlook: WebExtension-Brücke", () => {
  it("wählt vorhandene Sprachordner und ersetzt Platzhalter", () => {
    expect(localeCandidates("pt-BR")).toEqual(["pt_BR", "de"]);
    expect(localeCandidates("fr-FR")).toEqual(["fr", "de"]);
    expect(localeCandidates("xx")).toEqual(["de"]);
    expect(formatMessage({message: "$COUNT$ von $1, $$5", placeholders: {count: {content: "$2"}}}, ["a", "b"]))
      .toBe("b von a, $5");
  });

  it("legt sync im Postfach und local nur auf dem Gerät ab und meldet Änderungen", async () => {
    const settings = roaming();
    const local = deviceStore(null);
    const api = createOutlookApi(settings, "de", [], () => undefined, local);
    const changes = vi.fn();
    api.storage.onChanged.addListener(changes);
    await api.storage.local.set({a: {b: 1}});
    await api.storage.sync.set({a: 2});
    expect(settings.values).toEqual({"sync:a": "2"});
    expect(local.get("a")).toBe("{\"b\":1}");
    expect(await api.storage.local.get(["a", "fehlt"])).toEqual({a: {b: 1}});
    expect(await api.storage.local.get({fehlt: 3})).toEqual({fehlt: 3});
    await api.storage.local.remove("a");
    expect(changes).toHaveBeenLastCalledWith({a: {oldValue: {b: 1}}}, "local");
    expect(changes).toHaveBeenCalledTimes(3);
  });

  it("nutzt localStorage mit eigenem Präfix", () => {
    const store = deviceStore(localStorage);
    store.set("settings", "1");
    expect(localStorage.getItem("sprachverstand:settings")).toBe("1");
    store.remove("settings");
    expect(store.get("settings")).toBeUndefined();
  });

  it("stellt bei fehlgeschlagenem Speichern den alten Stand wieder her", async () => {
    const settings = roaming({"sync:a": "1"});
    settings.saveAsync = (callback?: (result: never) => void) =>
      callback?.({status: "failed", error: {message: "32 KB"}} as never);
    const api = createOutlookApi(settings, "de", [], () => undefined, deviceStore(null));
    const changes = vi.fn();
    api.storage.onChanged.addListener(changes);
    await expect(api.storage.sync.set({a: 2, b: 3})).rejects.toThrow("32 KB");
    expect(settings.values).toEqual({"sync:a": "1"});
    await expect(api.storage.sync.remove("a")).rejects.toThrow("32 KB");
    expect(settings.values).toEqual({"sync:a": "1"});
    expect(changes).not.toHaveBeenCalled();
  });

  it("leitet Nachrichten an alle Empfänger der Seite und liefert die erste Antwort", async () => {
    const api = createOutlookApi(roaming(), "de", [], () => undefined);
    const seen = vi.fn();
    api.runtime.onMessage.addListener(seen);
    api.runtime.onMessage.addListener(() => ({count: 2}));
    expect(await api.runtime.sendMessage({type: "x"})).toEqual({count: 2});
    expect(seen).toHaveBeenCalledWith({type: "x"}, expect.objectContaining({tab: {id: 1}}));
  });
});

describe("Outlook: Nachrichtentext", () => {
  it("wandelt HTML und Nur-Text um und meldet die Ersetzungen", () => {
    const html = transformBody(mail, true, defaultSettings);
    expect(html.count).toBe(2);
    expect(html.body).toContain("Liebe Kollegen, die Lehrer kommen.");
    expect(html.replacements.map(entry => entry.original)).toContain("Kolleg*innen");
    const text = transformBody("Die Lehrer:innen", false, defaultSettings);
    expect(text).toMatchObject({body: "Die Lehrer", count: 1});
    expect(transformBody("<p>Ohne</p>", true, defaultSettings)).toMatchObject({body: "<p>Ohne</p>", count: 0});
  });

  it("wandelt im klassischen Outlook ohne DOM wie mit DOM um, auch über Tags hinweg", () => {
    // Die gebaute Ereignisdatei in einem leeren JavaScript-Kontext: nur Office
    // und console, kein DOM, kein Timer, kein URL, kein Intl (Ereignislaufzeit
    // des klassischen Outlook).
    const out = mkdtempSync(path.join(tmpdir(), "sprachverstand-outlook-"));
    execFileSync(process.execPath, ["scripts/build-outlook.mjs", "--out", out], {stdio: "ignore"});
    const code = readFileSync(path.join(out, "launchevent.js"), "utf8");
    rmSync(out, {recursive: true, force: true});
    const samples = [
      "<html><body><p>Liebe Lehrer*<b>innen</b>, das Projekt der <em>Künstler*in</em>.</p></body></html>",
      "<html><head><style>.Lehrer\:innen{}</style><!--[if gte mso 9]><xml>Kolleg*innen</xml><![endif]--></head>" +
        "<body><p class=MsoNormal>B&uuml;rger*innen &amp; Lehrer:innen&nbsp;<o:p></o:p></p><!-- Kolleg*innen -->" +
        "<code>Kolleg*innen</code><pre>Lehrer:innen</pre><img alt=\"Schüler*innen\" src=\"cid:image001.png@01DB\">" +
        "<script>Kolleg*innen</script></body></html>",
      "<html><body><div>Danke!</div><blockquote><p>Die Kolleg<span style=\"color:red\">*</span>innen und " +
        "<a href=\"https://example.org/Lehrer*innen\">Lehrer*innen</a></p><table><tr><td>Mitarbeiter:in</td></tr></table>" +
        "</blockquote></body></html>",
      // Entitäten zwischen Wörtern, maskierte Attributwerte.
      "<html><body><p>jede*r&nbsp;Teilnehmer*in und Lehrer&shy;*innen</p>" +
        "<a href=\"https://shop.example/?id=1&amp;region=de\">Kolleg*innen</a></body></html>",
      // Word-Bedingungen außerhalb von Kommentaren.
      "<html><body><p>Kolleg*innen</p><!--[if gte vml 1]><v:shape>Bild</v:shape><![if x]><![endif]><![endif]-->" +
        "<![if !vml]><img src=\"cid:image002.png@01DB\"><![endif]></body></html>",
      "<div>Liebe Kolleg*innen</div>"
    ];
    // Ohne Timer und mit eingebauten Timern, die globalThis als this verlangen.
    const strictTimers = "globalThis.setTimeout = globalThis.clearTimeout = function () {" +
      "if (this !== globalThis) throw new TypeError(\"Illegal invocation\"); return 0; };";
    const outputs = [false, true].flatMap(timers => samples.map(sample => {
      const office = composeOffice(sample);
      const context = vm.createContext({Office: office.Office, console});
      // Ein Bericht zu Build 2406 nennt Intl als fehlend.
      vm.runInContext("delete globalThis.Intl", context);
      expect(vm.runInContext("[typeof setTimeout, typeof URL, typeof location, typeof Intl].join()", context))
        .toBe("undefined,undefined,undefined,undefined");
      if (timers) vm.runInContext(strictTimers, context);
      vm.runInContext(code, context);
      // Der Intl-Ersatz gilt nur beim Laden, Timer bleiben unberührt.
      expect(vm.runInContext("[typeof setTimeout, typeof Intl].join()", context))
        .toBe(timers ? "function,undefined" : "undefined,undefined");
      return office;
    }));
    return Promise.all(outputs.map(office => office.done)).then(results => {
      const body = (html: string) => new DOMParser().parseFromString(html, "text/html").body.innerHTML;
      results.forEach((result, index) => {
        const expected = transformBody(samples[index % samples.length]!, true, defaultSettings);
        expect(expected.count).toBeGreaterThan(0);
        expect(body(result!)).toBe(body(expected.body));
      });
      expect(body(results[0]!)).toBe("<p>Liebe Lehrer<b></b>, das Projekt des <em>Künstlers</em>.</p>");
      expect(results[1]).toContain("cid:image001.png@01DB");
      expect(results[3]).toContain('href="https://shop.example/?id=1&amp;region=de"');
      expect(body(results[3]!)).toContain("jeder&nbsp;Teilnehmer und Lehrer</p>");
      expect(results[4]).toContain("<!--[if gte vml 1]><v:shape>Bild</v:shape><![if x]><![endif]><![endif]-->");
      expect(results[4]).toContain("<!--[if !vml]--><img src=\"cid:image002.png@01DB\"><!--[endif]-->");
      expect(body(results[5]!)).toBe("<div>Liebe Kollegen</div>");
    });
  }, 60_000); // baut die Ereignisdatei mit esbuild
});

// Office-Attrappe für die gebaute Ereignisdatei: Antwort mit eingeschalteter
// Option, done liefert den gesetzten Text.
function composeOffice(body: string) {
  let handler: ((event: {completed(): void}) => void) | undefined;
  let written: string | undefined;
  const item = {
    body: {getTypeAsync: (callback: (result: unknown) => void) => callback(ok("html")),
      getAsync: (_type: string, _options: unknown, callback: (result: unknown) => void) => callback(ok(body)),
      setAsync: (data: string, _options: unknown, callback: (result: unknown) => void) => {written = data; callback(ok());}},
    getComposeTypeAsync: (callback: (result: unknown) => void) => callback(ok({composeType: "reply"}))
  };
  const Office = {context: {roamingSettings: roaming({[`sync:${composeSettingKey}`]: "true"}), mailbox: {item}},
    MailboxEnums: {BodyMode: {FullBody: "fullBody"}},
    actions: {associate: (_name: string, callback: typeof handler) => {handler = callback;}}};
  return {Office, get done() {
    return new Promise<string | undefined>(resolve => handler!({completed: () => resolve(written)}));
  }};
}

function composeItem(composeType: string, type = "html", body = mail) {
  const setAsync = vi.fn((_data: string, _options: Record<string, unknown>, callback: (result: never) => void) => callback(ok() as never));
  const getAsync = vi.fn((_type: string, _options: Record<string, unknown>, callback: (result: never) => void) => callback(ok(body) as never));
  const item: OutlookItem = {
    body: {getTypeAsync: callback => callback(ok(type)), getAsync, setAsync},
    getComposeTypeAsync: callback => callback(ok({composeType, coercionType: type}))
  };
  return {item, setAsync, getAsync};
}

describe("Outlook: Antworten und Weiterleitungen beim Öffnen", () => {
  const enabled = () => roaming({[`sync:${composeSettingKey}`]: "true"});

  it("bleibt ohne die Option unverändert", async () => {
    const {item, setAsync} = composeItem("reply");
    await correctComposeOnOpen(officeWith(item));
    expect(setAsync).not.toHaveBeenCalled();
  });

  it("korrigiert Antworten samt Verlauf, aber keine neuen Nachrichten", async () => {
    const reply = composeItem("reply");
    await correctComposeOnOpen(officeWith(reply.item, enabled()));
    expect(reply.getAsync).toHaveBeenCalledWith("html", {bodyMode: "fullBody"}, expect.any(Function));
    expect(reply.setAsync.mock.calls[0]?.[0]).toContain("Liebe Kollegen");
    expect(reply.setAsync.mock.calls[0]?.[1]).toEqual({coercionType: "html"});

    const forward = composeItem("forward", "text", "Die Lehrer:innen");
    await correctComposeOnOpen(officeWith(forward.item, enabled()));
    expect(forward.setAsync.mock.calls[0]?.[0]).toBe("Die Lehrer");

    const fresh = composeItem("newMail");
    await correctComposeOnOpen(officeWith(fresh.item, enabled()));
    expect(fresh.setAsync).not.toHaveBeenCalled();
  });

  it("lässt den Text stehen, wenn Outlook ihn zwischendurch ändert (Signatur)", async () => {
    const changed = composeItem("reply");
    let reads = 0;
    changed.getAsync.mockImplementation((_type, _options, callback) =>
      callback(ok(reads++ ? `${mail}<p>Signatur</p>` : mail) as never));
    await correctComposeOnOpen(officeWith(changed.item, enabled()));
    expect(changed.setAsync).not.toHaveBeenCalled();
  });
});

describe("Outlook: Leseansicht", () => {
  function readItem(withDisplay: boolean, fails: false | "callback" | "throw" | "hang" = false) {
    const shown: string[] = [];
    const item: OutlookItem = {
      itemId: "1",
      body: {getTypeAsync: () => undefined, getAsync: (_type, _options, callback) => callback(ok(mail))},
      ...(withDisplay ? {display: {body: {setAsync: (html: string, _options: Record<string, unknown>, callback: (result: never) => void) => {
        // Die stabile office.js wirft synchron („only enabled on the beta api endpoint“).
        if (fails === "throw") throw new Error("The feature setUIAsync, is only enabled on the beta api endpoint");
        if (fails === "hang") return;
        if (fails) return callback({status: "failed", error: {message: "Vorschau"}} as never);
        shown.push(html);
        callback(ok() as never);
      }}}} : {})
    };
    return {item, shown};
  }

  function start(item: OutlookItem) {
    const office = officeWith(item);
    const api = createOutlookApi(office.context.roamingSettings, "de", [], () => undefined, deviceStore(null));
    (globalThis as {browser?: unknown}).browser = api;
    const preview = vi.fn();
    connectReader(api, office, {showPreview: preview});
    return {api, preview};
  }

  it("ersetzt nur die Anzeige und stellt sie beim Ausschalten wieder her", async () => {
    const {item, shown} = readItem(true);
    const {api, preview} = start(item);
    const states = vi.fn();
    api.runtime.onMessage.addListener(message => {states(message); return undefined;});
    await vi.waitFor(() => expect(shown).toHaveLength(1));
    expect(shown[0]).toContain("Liebe Kollegen");
    expect(await api.runtime.sendMessage({type: "sprachverstand.get-replacement-state", tabId: 1}))
      .toMatchObject({count: 2, text: "2"});
    await vi.waitFor(() => expect(states).toHaveBeenCalledWith(
      expect.objectContaining({type: "sprachverstand.state-updated", tabId: 1, count: 2})));

    await api.storage.local.set({settings: {...defaultSettings, enabled: false}});
    await vi.waitFor(() => expect(shown).toHaveLength(2));
    expect(shown[1]).toBe(mail);
    expect(preview).toHaveBeenLastCalledWith(undefined);
  });

  it("zeigt ohne Anzeige-API eine umgewandelte Fassung im Seitenbereich", async () => {
    const {preview} = start(readItem(false).item);
    await vi.waitFor(() => expect(preview).toHaveBeenCalledWith(expect.stringContaining("Liebe Kollegen")));
  });

  it("fällt auf die Fassung im Seitenbereich zurück, wenn Outlook die Anzeige ablehnt", async () => {
    for (const fails of ["callback", "throw"] as const) {
      const {item, shown} = readItem(true, fails);
      const {preview} = start(item);
      await vi.waitFor(() => expect(preview).toHaveBeenCalledWith(expect.stringContaining("Liebe Kollegen")));
      expect(shown).toHaveLength(0);
    }
  });

  it("zeigt die Fassung im Seitenbereich, ohne auf die Antwort der Vorschau-API zu warten", async () => {
    const {api, preview} = start(readItem(true, "hang").item);
    await vi.waitFor(() => expect(preview).toHaveBeenCalledWith(expect.stringContaining("Liebe Kollegen")));
    expect(await api.runtime.sendMessage({type: "sprachverstand.get-replacement-state", tabId: 1}))
      .toMatchObject({count: 2});
  });

  it("setzt eingebettete Bilder in die Fassung im Seitenbereich ein", async () => {
    const getAttachmentContentAsync = vi.fn((id: string, _options: Record<string, unknown>,
      callback: (result: never) => void) => callback((id === "a" ? ok({content: "QUJD", format: "base64"})
      : {status: "failed", error: {message: "InvalidAttachmentId"}}) as never));
    const item: OutlookItem = {
      ...readItem(false).item,
      attachments: [{id: "a", isInline: true, contentId: "<logo@01>", contentType: "image/png"},
        {id: "b", isInline: true, contentId: "fehlt@01"}, {id: "c", isInline: false, contentId: "anhang@01"}],
      getAttachmentContentAsync
    };
    const html = '<img src="cid:logo@01"><img src="cid:logo@01"><img src="cid:fehlt@01"><img src="cid:anhang@01">';
    expect(await inlineImages(item, html)).toBe('<img src="data:image/png;base64,QUJD"><img src="data:image/png;base64,QUJD">' +
      '<img src="cid:fehlt@01"><img src="cid:anhang@01">');
    expect(getAttachmentContentAsync.mock.calls.map(([id]) => id)).toEqual(["a", "b"]);

    // Präfixe (img1, img10), Großschreibung und %-Kodierung.
    const prefixed: OutlookItem = {...item, attachments: [{id: "b", isInline: true, contentId: "img1"},
      {id: "a", isInline: true, contentId: "img10@01"}]};
    expect(await inlineImages(prefixed, '<img src="CID:img10%4001"><img src="cid:img1">'))
      .toBe('<img src="data:image/png;base64,QUJD"><img src="cid:img1">');
  });

  it("verarbeitet im Verfassen nichts (keine itemId)", async () => {
    const {item, shown} = readItem(true);
    const {itemId: _ignored, ...compose} = item;
    const {preview} = start(compose);
    await vi.waitFor(() => expect(preview).toHaveBeenCalledWith(undefined));
    expect(shown).toHaveLength(0);
  });

  it("lädt in der Fassung im Seitenbereich nichts von außen", () => {
    const doc = new DOMParser().parseFromString(
      offlinePreview("<html><head></head><body><img src=\"https://x.invalid/p.gif\"></body></html>"), "text/html");
    expect(doc.head.querySelector("meta[http-equiv=Content-Security-Policy]")?.getAttribute("content"))
      .toBe("default-src 'none'; img-src data:; style-src 'unsafe-inline'");
  });
});

describe("Outlook: Manifest", () => {
  it("ist wohlgeformt und nutzt nur die beiden Platzhalter", () => {
    const source = readFileSync("manifests/outlook.xml", "utf8");
    const doc = new DOMParser().parseFromString(source, "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(new Set(source.match(/\{\{[A-Z_]+\}\}/g))).toEqual(new Set(["{{VERSION}}", "{{BASE_URL}}"]));
    expect(source).toContain('LaunchEvent Type="OnNewMessageCompose" FunctionName="onNewMessageComposeHandler"');
    expect(readFileSync("src/outlook/launchevent.ts", "utf8")).toContain('associate("onNewMessageComposeHandler"');
  });
});
