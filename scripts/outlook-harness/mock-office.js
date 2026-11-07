// Office.js-Attrappe für scripts/outlook-harness.mjs. Bildet die vom Add-in
// genutzten Teile nach; Zustand liegt in sessionStorage, damit Navigationen im
// Seitenbereich ihn behalten. Steuerung über window.harness.
(() => {
  const params = new URLSearchParams(location.search);
  const roamingKey = "harness.roaming";
  const roaming = JSON.parse(sessionStorage.getItem(roamingKey) || "{}");
  const mails = [
    "<html><head><style>p{margin:0 0 8px}</style></head><body><p>Liebe Kolleg*innen,</p><p>die Lehrer:innen und alle Mitarbeiter*innen sind eingeladen. Jede*r Teilnehmer*in bringt etwas mit.</p></body></html>",
    "<html><body><p>Newsletter f&uuml;r B&uuml;rger*innen</p><img src=\"https://tracker.invalid/pixel.gif\" alt=\"\"></body></html>",
    "<html><body><p>Ohne Genderzeichen.</p></body></html>",
    "<html><body><p>Gruß an alle Kolleg*innen</p><img src=\"cid:logo.png@01DB0001\" alt=\"Logo\" width=\"48\" height=\"48\"></body></html>"
  ];
  // Eingebettetes Bild zu Nachricht 3 (PNG, 1 x 1 Pixel).
  const logo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  const ok = value => ({status: "succeeded", value});
  const later = (callback, result) => setTimeout(() => callback && callback(result));
  const state = {mail: Number(params.get("mail") || 0), displayed: [], composeBody: undefined, displayFails: params.has("displayfails")};
  let itemChanged;

  function readItem() {
    return {
      itemType: "message", itemId: `mail-${state.mail}`,
      body: {getAsync: (type, options, callback) => later(callback, ok(mails[state.mail]))},
      attachments: state.mail === 3 ? [{id: "att-1", isInline: true, contentId: "logo.png@01DB0001", contentType: "image/png"}] : [],
      getAttachmentContentAsync: (id, options, callback) =>
        later(callback, id === "att-1" ? ok({content: logo, format: "base64"}) : {status: "failed", error: {message: "InvalidAttachmentId"}}),
      display: params.has("nodisplay") ? undefined : {body: {setAsync(html, options, callback) {
        // Wie die stabile office.js (lib/1): Die Vorschau-API wirft synchron.
        if (params.has("stableoffice")) throw new Error("The feature setUIAsync, is only enabled on the beta api endpoint");
        // Wie die neue Outlook-App: keine Antwort (dort erst nach etwa einer Minute).
        if (params.has("displayhangs")) return;
        if (state.displayFails) return later(callback, {status: "failed", error: {message: "Vorschau-API abgelehnt"}});
        state.displayed.push(html);
        later(callback, ok());
      }}}
    };
  }

  function composeItem(composeType, type) {
    state.composeBody = type === "html" ? mails[0] : "Antwort an die Lehrer:innen";
    return {
      itemType: "message",
      body: {
        getTypeAsync: callback => later(callback, ok(type)),
        getAsync: (coercion, options, callback) => later(callback, ok(state.composeBody)),
        setAsync: (data, options, callback) => {state.composeBody = data; later(callback, ok());}
      },
      getComposeTypeAsync: callback => later(callback, ok({composeType, coercionType: type}))
    };
  }

  const handlers = {};
  const mailbox = {item: readItem(), addHandlerAsync(type, handler, callback) {itemChanged = handler; later(callback, ok());}};
  window.Office = {
    onReady: () => Promise.resolve({host: "Outlook"}),
    context: {
      displayLanguage: params.get("lang") || "de-DE",
      roamingSettings: {
        get: name => roaming[name], set: (name, value) => {roaming[name] = value;}, remove: name => {delete roaming[name];},
        saveAsync(callback) {
          const size = JSON.stringify(roaming).length;
          if (size > 32 * 1024) return later(callback, {status: "failed", error: {message: "Roaming-Einstellungen über 32 KB"}});
          sessionStorage.setItem(roamingKey, JSON.stringify(roaming));
          later(callback, ok());
        }
      },
      mailbox,
      requirements: {isSetSupported: () => !params.has("nodialogapi")},
      // Dialog als Rahmen über der Seite; Nachrichten laufen über postMessage.
      ui: {
        displayDialogAsync(url, options, callback) {
          const frame = document.createElement("iframe");
          frame.id = "harness-dialog";
          frame.src = url;
          frame.style.cssText = `position:fixed;top:5%;left:${(100 - options.width) / 2}%;width:${options.width}%;height:${options.height}%;border:2px solid #888;background:#fff`;
          const events = {};
          window.addEventListener("message", event => {
            if (event.source === frame.contentWindow) events.dialogMessageReceived?.({message: event.data});
          });
          document.body.append(frame);
          state.dialog = {url, options, messages: []};
          // Wie das X des Fensters: Outlook meldet 12006.
          state.dialog.close = () => {frame.remove(); events.dialogEventReceived?.({error: 12006});};
          later(callback, ok({
            addEventHandler: (type, handler) => {events[type] = handler;},
            messageChild: message => {state.dialog.messages.push(message); frame.contentWindow.postMessage(message, "*");},
            close: () => frame.remove()
          }));
        },
        addHandlerAsync(type, handler, callback) {
          window.addEventListener("message", event => {if (event.source === window.parent) handler({message: event.data});});
          later(callback, ok());
        },
        messageParent: message => window.parent.postMessage(message, "*")
      }
    },
    MailboxEnums: {BodyMode: {FullBody: "fullBody"}},
    actions: {associate: (name, handler) => {handlers[name] = handler;}}
  };

  window.harness = {
    state,
    roaming,
    select(index) {state.mail = index; mailbox.item = readItem(); itemChanged && itemChanged();},
    // Simuliert „Korrigiert lesen“; das Versprechen erfüllt sich beim Schließen
    // (document.getElementById("harness-dialog") ist das Fenster).
    read(index = state.mail) {
      state.mail = index;
      mailbox.item = readItem();
      return new Promise(resolve => handlers.openReadWindow({completed: resolve}));
    },
    closeDialog() {state.dialog?.close();},
    // Simuliert OnNewMessageCompose; mit dom=false wie im klassischen Outlook.
    compose(composeType, type, dom = true) {
      mailbox.item = composeItem(composeType, type);
      // Ohne DOM setzt die Ereignisdatei linkedom ein; danach gilt wieder der Browser.
      const names = ["DOMParser", "Node", "Element", "Text", "ShadowRoot", "NodeFilter"];
      const saved = names.map(name => window[name]);
      if (!dom) window.DOMParser = undefined;
      return new Promise(resolve => handlers.onNewMessageComposeHandler({completed: resolve}))
        .then(() => state.composeBody)
        .finally(() => names.forEach((name, index) => {window[name] = saved[index];}));
    }
  };
})();
