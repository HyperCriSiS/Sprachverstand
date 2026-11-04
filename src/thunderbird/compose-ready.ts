import {getExtensionApi} from "../browser/api";

// Registered compose scripts run when the compose editor is ready. One
// handshake only: no typing observer and no correction at send time.
void getExtensionApi().runtime.sendMessage({type: "sprachverstand.compose-ready"}).catch(() => undefined);
