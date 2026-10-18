// Bound the complete HTTP response, including a body that stops arriving.
// Callers with intentionally long async scripts supply a larger deadline.
export async function fetchWebdriverResponse(url, options, timeoutMs = 60_000) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Invalid WebDriver response deadline.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {...options, signal: controller.signal});
    const text = await response.text();
    return {ok: response.ok, status: response.status, text};
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`WebDriver response timed out after ${timeoutMs} ms.`, {cause: error});
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
