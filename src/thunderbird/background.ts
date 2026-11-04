import {getExtensionApi} from "../browser/api";
import {registerMessageScript, type MessageDisplayScripting} from "./registration";
import {connectMessageUi} from "./message-ui";
import {connectComposeCorrection} from "./compose-background";
import type {ThunderbirdComposeApi} from "./compose-api";
import {connectBackgroundTransform} from "./background-transform";

const api = getExtensionApi() as ReturnType<typeof getExtensionApi> & {
  readonly scripting: {readonly messageDisplay: MessageDisplayScripting};
};

connectMessageUi(api);
connectBackgroundTransform(api);
connectComposeCorrection(api as typeof api & ThunderbirdComposeApi);

// Run on every background startup, not only installation. Registration is
// reconciled by ID so a background restart cannot register the script twice.
void registerMessageScript(api.scripting.messageDisplay).catch((error: unknown) => {
  console.error("Sprachverstand: Thunderbird registration failed.", error);
});
