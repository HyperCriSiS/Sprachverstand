export function isSessionTimeout(error: unknown): boolean;
export function createSessionWithRetry<T>(create: () => Promise<T>, log?: (message: string) => void): Promise<T>;
