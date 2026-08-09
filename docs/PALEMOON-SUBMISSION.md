# Pale Moon submission notes

This document describes the dedicated Pale Moon build and the metadata intended for submission to the official Pale Moon Add-ons Site.

## Distribution

- Distribution model: Hosted add-on on the Pale Moon Add-ons Site
- Category: Tools & Utilities
- Add-on name: Sprachverstand
- Source repository: https://github.com/HyperCriSiS/Sprachverstand
- Suggested slug: `sprachverstand` (subject to availability on the Pale Moon Add-ons Site)
- Update URL: none. Hosted add-ons must use the Pale Moon Add-ons Site update service.

## Compatibility

- Pale Moon application ID: `{8de7fcbb-c55c-4fbe-bfc5-fc555c87dbc4}`
- Minimum version: 34.0.0
- Maximum version: 34.3.2
- Runtime-tested version: 34.3.2

The maximum version is deliberately explicit. Do not replace it with a wildcard for a hosted submission. Raise it only after testing a newer Pale Moon release.

## Submission metadata

- Description: `Macht Webseiten leichter lesbar.`
- 64x64 alpha-transparent PNG: generated as `dist/palemoon/icons/icon64.png` during the Pale Moon build
- The XPI uses the same generated 64x64 icon through `em:iconURL`.

## Final runtime checklist before submission

- Install the generated XPI in a clean Pale Moon 34.3.2 profile.
- Restart Pale Moon and confirm that the toolbar button remains available.
- Confirm that the toolbar icon is rendered at normal toolbar size.
- Confirm that the popup is anchored to the toolbar button instead of opening a separate window.
- Confirm that the popup closes when clicking outside it.
- Confirm that replacements work on a normal static page.
- Confirm that replacements also work after dynamically inserted page content.
- Toggle the extension off and on and verify that the page is restored/reprocessed correctly.
- Test excluded domains.
- Test the rule-group switches and text-processing switches in the popup.
- Open the full options page and save settings.
- Open several tabs and verify that the replacement count follows the active tab.
- Check the Error Console for new Sprachverstand errors.
- Restart the browser and verify that settings persist.

Only submit after this checklist passes on the XPI produced by the final commit.
