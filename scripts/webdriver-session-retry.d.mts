export function isSessionTimeout(error: unknown): boolean;
export function createSessionWithRetry<T>(create: () => Promise<T>, log?: (message: string) => void,
  cleanup?: (keepSessionId: string | undefined) => Promise<void>,
  sessionIdOf?: (response: T) => string | undefined): Promise<T>;
