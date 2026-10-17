#!/usr/bin/env bash
# Diagnostic-only, official pinned binaries; nothing is bundled in the addon.
set -euo pipefail
CFT_VERSION="${CFT_VERSION:-155.0.8059.39}"
if [[ "${RUNNER_OS:-}" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "::error::This diagnostic browser setup requires Linux x86_64."
  exit 1
fi
if [[ ! "$CFT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "::error::Invalid Chrome for Testing version."
  exit 1
fi
cft_root="${RUNNER_TEMP}/sprachverstand-cft-${CFT_VERSION}"
mkdir -p "$cft_root"
for component in chrome chromedriver; do
  archive="${cft_root}/${component}-linux64.zip"
  curl --fail --location --retry 3 --max-time 180 \
    "https://storage.googleapis.com/chrome-for-testing-public/${CFT_VERSION}/linux64/${component}-linux64.zip" \
    --output "$archive"
  unzip -q -o "$archive" -d "$cft_root"
done
chrome_binary="${cft_root}/chrome-linux64/chrome"
driver_binary="${cft_root}/chromedriver-linux64/chromedriver"
test -x "$chrome_binary"
test -x "$driver_binary"
chrome_version="$("$chrome_binary" --version)"
driver_version="$("$driver_binary" --version)"
if [[ "$chrome_version" != *"$CFT_VERSION"* || "$driver_version" != *"$CFT_VERSION"* ]]; then
  echo "::error::Downloaded browser/driver version does not match the pin."
  exit 1
fi
printf '%s\n%s\n' "$chrome_version" "$driver_version"
printf 'CHROMIUM_BIN=%s\nCHROMEWEBDRIVER=%s\n' "$chrome_binary" "$driver_binary" >> "$GITHUB_ENV"
