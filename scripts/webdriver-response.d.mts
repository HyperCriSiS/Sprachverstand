export function fetchWebdriverResponse(url: string | URL, options?: RequestInit,
  timeoutMs?: number): Promise<{ok: boolean; status: number; text: string}>;
