import { describe, expect, it, vi } from "vitest";
import { createSessionWithRetry, isSessionTimeout } from "../scripts/webdriver-session-retry.mjs";

const timeout = () => new Error("WebDriver response timed out after 60000 ms.");

describe("Einmaliger Retry beim WebDriver-Sitzungsstart", () => {
  it("versucht nach einem Zeitlimit genau einmal erneut", async () => {
    const create = vi.fn().mockRejectedValueOnce(timeout()).mockResolvedValueOnce({value: {sessionId: "s"}});
    const log = vi.fn();
    await expect(createSessionWithRetry(create, log)).resolves.toEqual({value: {sessionId: "s"}});
    expect(create).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledOnce();
  });

  it("scheitert beim zweiten Zeitlimit", async () => {
    const create = vi.fn().mockRejectedValue(timeout());
    await expect(createSessionWithRetry(create, vi.fn())).rejects.toThrow("timed out");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("wiederholt andere Fehler nicht", async () => {
    const create = vi.fn().mockRejectedValue(new Error("WebDriver POST /session fehlgeschlagen: {}"));
    await expect(createSessionWithRetry(create, vi.fn())).rejects.toThrow("fehlgeschlagen");
    expect(create).toHaveBeenCalledOnce();
  });

  it("erkennt nur die Zeitlimitmeldung des Antwortbegrenzers", () => {
    expect(isSessionTimeout(timeout())).toBe(true);
    expect(isSessionTimeout(new Error("session not created"))).toBe(false);
    expect(isSessionTimeout("timed out")).toBe(false);
  });
});
