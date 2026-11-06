import {readFileSync} from "node:fs";
import {afterEach, describe, expect, it, vi} from "vitest";
import {createOutlookApi, formatMessage, localeCandidates} from "../src/outlook/extension-shim";
import {transformBody} from "../src/outlook/body-transform";
import {correctComposeOnOpen} from "../src/outlook/launchevent";
import {connectReader} from "../src/outlook/reader";
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

  it("legt sync und local getrennt in den Roaming-Einstellungen ab und meldet Änderungen", async () => {
    const settings = roaming();
    const api = createOutlookApi(settings, "de", [], () => undefined);
    const changes = vi.fn();
    api.storage.onChanged.addListener(changes);
    await api.storage.local.set({a: {b: 1}});
    await api.storage.sync.set({a: 2});
    expect(settings.values).toEqual({"local:a": "{\"b\":1}", "sync:a": "2"});
    expect(await api.storage.local.get(["a", "fehlt"])).toEqual({a: {b: 1}});
    expect(await api.storage.local.get({fehlt: 3})).toEqual({fehlt: 3});
    await api.storage.local.remove("a");
    expect(changes).toHaveBeenLastCalledWith({a: {oldValue: {b: 1}}}, "local");
    expect(changes).toHaveBeenCalledTimes(3);
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
});

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
  const enabled = () => roaming({[`local:${composeSettingKey}`]: "true"});

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
});

describe("Outlook: Leseansicht", () => {
  function readItem(withDisplay: boolean) {
    const shown: string[] = [];
    const item: OutlookItem = {
      body: {getTypeAsync: () => undefined, getAsync: (_type, _options, callback) => callback(ok(mail))},
      ...(withDisplay ? {display: {body: {setAsync: (html: string, _options: Record<string, unknown>, callback: (result: never) => void) => {
        shown.push(html); callback(ok() as never);
      }}}} : {})
    };
    return {item, shown};
  }

  it("ersetzt nur die Anzeige und stellt sie beim Ausschalten wieder her", async () => {
    const {item, shown} = readItem(true);
    const office = officeWith(item);
    const api = createOutlookApi(office.context.roamingSettings, "de", [], () => undefined);
    (globalThis as {browser?: unknown}).browser = api;
    const states = vi.fn();
    api.runtime.onMessage.addListener(message => {states(message); return undefined;});
    const preview = vi.fn();
    connectReader(api, office, {showPreview: preview});
    await vi.waitFor(() => expect(shown).toHaveLength(1));
    expect(shown[0]).toContain("Liebe Kollegen");
    expect(await api.runtime.sendMessage({type: "sprachverstand.get-replacement-state", tabId: 1}))
      .toMatchObject({count: 2, text: "2"});
    expect(states).toHaveBeenCalledWith(expect.objectContaining({type: "sprachverstand.state-updated", tabId: 1, count: 2}));

    await api.storage.local.set({settings: {...defaultSettings, enabled: false}});
    await vi.waitFor(() => expect(shown).toHaveLength(2));
    expect(shown[1]).toBe(mail);
    expect(preview).toHaveBeenLastCalledWith(undefined);
  });

  it("zeigt ohne Anzeige-API eine umgewandelte Fassung im Seitenbereich", async () => {
    const {item} = readItem(false);
    const office = officeWith(item);
    const api = createOutlookApi(office.context.roamingSettings, "de", [], () => undefined);
    (globalThis as {browser?: unknown}).browser = api;
    const preview = vi.fn();
    connectReader(api, office, {showPreview: preview});
    await vi.waitFor(() => expect(preview).toHaveBeenCalledWith(expect.stringContaining("Liebe Kollegen")));
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
