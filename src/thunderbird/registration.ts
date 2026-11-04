export interface MessageDisplayScripting {
  getRegisteredScripts(filter: {ids: string[]}): Promise<readonly {id: string}[]>;
  registerScripts(scripts: {id: string; js: string[]; runAt: "document_idle"}[]): Promise<void>;
}

export async function registerMessageScript(api: MessageDisplayScripting): Promise<void> {
  const id = "sprachverstand-message-display";
  const registered = await api.getRegisteredScripts({ids: [id]});
  if (!registered.some(script => script.id === id)) {
    await api.registerScripts([{id, js: ["content.js"], runAt: "document_idle"}]);
  }
}
