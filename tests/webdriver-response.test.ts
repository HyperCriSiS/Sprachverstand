import {afterEach, beforeEach, expect, it} from "vitest";
import {createServer, type Server} from "node:http";
import {fetchWebdriverResponse} from "../scripts/webdriver-response.mjs";

let server: Server;
let url: string;
beforeEach(async () => {
  server = createServer((request, response) => {
    if (request.url === "/no-headers") return;
    if (request.url === "/partial-body") {
      response.writeHead(200, {"content-type": "application/json"});
      response.write("{");
      return;
    }
    response.writeHead(request.url === "/failure" ? 500 : 200);
    response.end('{"value":"complete"}');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test server port");
  url = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

it.each(["no-headers", "partial-body"])("aborts a stalled %s response", async (path) => {
  await expect(fetchWebdriverResponse(`${url}/${path}`, undefined, 50))
    .rejects.toThrow("WebDriver response timed out after 50 ms.");
});

it("preserves successful and failed HTTP responses for protocol validation", async () => {
  expect(await fetchWebdriverResponse(url, undefined, 2000)).toEqual({ok: true,
    status: 200, text: '{"value":"complete"}'});
  expect(await fetchWebdriverResponse(`${url}/failure`, undefined, 2000)).toEqual({ok: false,
    status: 500, text: '{"value":"complete"}'});
});

it("rejects invalid deadlines before requesting the server", async () => {
  for (const timeout of [0, -1, NaN, Infinity, 1.5]) {
    await expect(fetchWebdriverResponse(url, undefined, timeout)).rejects.toThrow("Invalid WebDriver");
  }
});
