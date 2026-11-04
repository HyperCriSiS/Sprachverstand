import {readFileSync} from "node:fs";
import {describe, expect, it, vi} from "vitest";
import {registerMessageScript} from "../src/thunderbird/registration";

describe("Thunderbird message display registration", () => {
  it("registers only the message display script", async () => {
    const api = {getRegisteredScripts: vi.fn().mockResolvedValue([]), registerScripts: vi.fn().mockResolvedValue(undefined)};
    await registerMessageScript(api);
    expect(api.registerScripts).toHaveBeenCalledWith([{
      id: "sprachverstand-message-display", js: ["content.js"], runAt: "document_idle"
    }]);
  });

  it("keeps an existing registration after background restart", async () => {
    const api = {getRegisteredScripts: vi.fn().mockResolvedValue([{id: "sprachverstand-message-display"}]), registerScripts: vi.fn()};
    await registerMessageScript(api);
    expect(api.registerScripts).not.toHaveBeenCalled();
  });

  it("propagates registration failure", async () => {
    const api = {getRegisteredScripts: vi.fn().mockRejectedValue(new Error("denied")), registerScripts: vi.fn()};
    await expect(registerMessageScript(api)).rejects.toThrow("denied");
    expect(api.registerScripts).not.toHaveBeenCalled();
  });

  it("isolates mail access from browser packages and forbids compose or permanent modification", () => {
    const mail = JSON.parse(readFileSync("manifests/thunderbird.json", "utf8"));
    expect(mail.permissions).toEqual(["storage", "scripting", "messagesRead"]);
    expect(mail.optional_permissions).toEqual(["compose"]);
    expect(mail.content_scripts).toBeUndefined();
    expect(mail.action.default_popup).toBe("popup/popup.html");
    expect(mail.action.default_icon).toEqual(mail.icons);
    expect(mail.action.default_title).toBe("__MSG_extensionName__");
    expect(mail.browser_specific_settings.gecko.id).not.toBe(
      JSON.parse(readFileSync("manifests/firefox.json", "utf8")).browser_specific_settings.gecko.id
    );
    for (const target of ["firefox", "chromium", "edge", "opera"]) {
      expect(JSON.parse(readFileSync(`manifests/${target}.json`, "utf8")).permissions).toEqual(["storage"]);
    }
  });
});
