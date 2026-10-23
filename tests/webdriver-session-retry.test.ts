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
    // Gegenprüfung 24.10.2026 (N23): nur die vollständige Meldung.
    expect(isSessionTimeout(new Error("Navigation failed: WebDriver response timed out after 60000 ms."))).toBe(false);
  });

  it("räumt vor dem zweiten Versuch alle und danach alle fremden Sitzungen ab", async () => {
    const create = vi.fn().mockRejectedValueOnce(timeout()).mockResolvedValueOnce({value: {sessionId: "zwei"}});
    const cleanup = vi.fn().mockResolvedValue(undefined);
    await createSessionWithRetry(create, vi.fn(), cleanup);
    expect(cleanup.mock.calls).toEqual([[undefined], ["zwei"]]);
    expect(cleanup.mock.invocationCallOrder[0]).toBeLessThan(create.mock.invocationCallOrder[1]!);
  });

  it("räumt ohne Zeitlimit nichts ab", async () => {
    const cleanup = vi.fn();
    await createSessionWithRetry(vi.fn().mockResolvedValue({value: {sessionId: "eins"}}), vi.fn(), cleanup);
    expect(cleanup).not.toHaveBeenCalled();
  });
});
