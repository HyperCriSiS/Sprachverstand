// Chromium occasionally lets the first `POST /session` run into the response
// deadline while the browser is still starting on a cold runner. One more
// attempt is allowed for exactly that case; any other error, and a second
// timeout, fail as before.
export function isSessionTimeout(error) {
  return error instanceof Error && /^WebDriver response timed out after \d+ ms\.$/u.test(error.message);
}

// The timed-out request may still have created a session on the driver; its
// browser would keep running. `cleanup(keepSessionId)` removes every other
// session: before the second attempt (nothing to keep) and after it.
export async function createSessionWithRetry(create, log = console.error, cleanup = async () => {},
  sessionIdOf = (response) => response?.value?.sessionId ?? response?.sessionId) {
  try {
    return await create();
  } catch (error) {
    if (!isSessionTimeout(error)) throw error;
    log(`WebDriver-Sitzungsstart: ${error.message} Einmaliger neuer Versuch.`);
    await cleanup(undefined);
    const response = await create();
    await cleanup(sessionIdOf(response));
    return response;
  }
}
