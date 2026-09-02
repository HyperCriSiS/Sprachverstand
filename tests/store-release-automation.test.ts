import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const locales = JSON.parse(
  readFileSync("config/locales.json", "utf8")
) as Array<{ code: string }>;
const current = JSON.parse(
  readFileSync("store/release-notes/current.json", "utf8")
) as { version: string };
const releaseNotes = JSON.parse(
  readFileSync(`store/release-notes/${current.version}.json`, "utf8")
) as {
  version: string;
  locales: Record<string, { heading: string; notes: string }>;
};
const storeWorkflow = readFileSync(
  ".github/workflows/store-publish.yml",
  "utf8"
);
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");
const amoScript = readFileSync("scripts/amo-api-v5.mjs", "utf8");
const chromeScript = readFileSync("scripts/chrome-web-store-v2.mjs", "utf8");

const googleAuthSha = "7c6bc770dae815cd3e89ee6cdf493a5fab2cc093";

describe("Store-Release-Automatisierung", () => {
  it("hält nutzerorientierte Release-Notes für exakt alle 51 Store-Locales vor", () => {
    expect(locales).toHaveLength(51);
    expect(releaseNotes.version).toBe(current.version);
    expect(Object.keys(releaseNotes.locales).sort()).toEqual(
      locales.map((locale) => locale.code).sort()
    );

    for (const locale of locales) {
      expect(releaseNotes.locales[locale.code]?.heading.trim()).toBeTruthy();
      expect(releaseNotes.locales[locale.code]?.notes.trim()).toBeTruthy();
    }
  });

  it("trennt Validierung von geschützter Store-Einreichung", () => {
    expect(storeWorkflow).toContain("mode:");
    expect(storeWorkflow).toContain('"validate"');
    expect(storeWorkflow).toContain('"submit"');
    expect(storeWorkflow).toContain("environment: store-production");
    expect(storeWorkflow).toContain("refs/heads/main");
    expect(storeWorkflow).toContain("ref: main");
    expect(storeWorkflow).toContain(
      "Store-Einreichungen sind nur für stabile Tags"
    );
  });

  it("hält AMO-Secrets im Environment und verwendet kurzlebige JWTs", () => {
    expect(storeWorkflow).toContain("secrets.AMO_API_KEY");
    expect(storeWorkflow).toContain("secrets.AMO_API_SECRET");
    expect(storeWorkflow).toContain("vars.AMO_ADDON_ID");
    expect(storeWorkflow).toContain("artifacts/amo-release-notes.json");
    expect(amoScript).toContain("exp: issuedAt + 60");
    expect(amoScript).toContain("randomUUID()");
    expect(amoScript).toContain('Authorization", `JWT ${createJwt()}`');
    expect(amoScript).toContain('case "notes"');
  });

  it("bezieht für Google nur ein kurzlebiges OIDC/WIF-Access-Token", () => {
    expect(storeWorkflow).toContain("id-token: write");
    expect(storeWorkflow).toContain(
      `google-github-actions/auth@${googleAuthSha} # v3`
    );
    expect(storeWorkflow).toContain("create_credentials_file: false");
    expect(storeWorkflow).toContain("token_format: access_token");
    expect(storeWorkflow).toContain("access_token_lifetime: 900s");
    expect(storeWorkflow).toContain(
      "access_token_scopes: https://www.googleapis.com/auth/chromewebstore"
    );
    expect(storeWorkflow).not.toContain("credentials_json");
  });

  it("prüft Release-Artefakte vor AMO- und Chrome-Uploads", () => {
    expect(
      storeWorkflow.match(/sha256sum -c SHA256SUMS\.txt/gu)?.length
    ).toBeGreaterThanOrEqual(3);
    expect(chromeScript).toContain("lastAsyncUploadState");
    expect(chromeScript).toContain('"SUCCEEDED"');
    expect(chromeScript).toContain(":cancelSubmission");
    expect(chromeScript).toContain(":setPublishedDeployPercentage");
  });

  it("erzeugt Store-Metadaten als Teil des GitHub-Releases", () => {
    expect(releaseWorkflow).toContain(
      'scripts/store-release-notes.mjs --release-version "$VERSION"'
    );
    expect(releaseWorkflow).toContain("amo-release-notes.json");
    expect(releaseWorkflow).toContain("chrome-dashboard.html");
    expect(releaseWorkflow).toContain("SHA256SUMS.txt");
  });
});
