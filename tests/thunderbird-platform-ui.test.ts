import {afterEach, expect, it, vi} from "vitest";

afterEach(() => {document.body.innerHTML = "";});

it("hides the web-video subtitle control while retaining other text options", async () => {
  document.body.innerHTML = '<label class="popup-option-row"><span>Untertitel</span><input id="process-subtitles"></label><label><input id="process-quoted-text"></label>';
  vi.resetModules();
  await import("../src/thunderbird/platform-ui");
  const input = document.querySelector<HTMLInputElement>("#process-subtitles")!;
  expect(input.disabled).toBe(true);
  expect(input.closest("label")!.hidden).toBe(true);
  expect(input.closest("label")!.style.display).toBe("none");
  expect(document.querySelector<HTMLInputElement>("#process-quoted-text")!.disabled).toBe(false);
});
