export interface MessageDisplayScripting {
  getRegisteredScripts(filter: {ids: string[]}): Promise<readonly {id: string; runAt?: string}[]>;
  registerScripts(scripts: {id: string; js: string[]; runAt: "document_end"}[]): Promise<void>;
  unregisterScripts(filter: {ids: string[]}): Promise<void>;
}

export async function registerMessageScript(api: MessageDisplayScripting): Promise<void> {
  const id = "sprachverstand-message-display";
  const registered = await api.getRegisteredScripts({ids: [id]});
  const existing = registered.find(script => script.id === id);
  if (existing?.runAt === "document_end") return;
  if (existing) await api.unregisterScripts({ids: [id]});
  await api.registerScripts([{id, js: ["content.js"], runAt: "document_end"}]);
}
