# Native Thunderbird performance probe

Developer-only Docker/Marionette test. Uses a fresh profile without mail accounts
and opens six synthetic HTML `.eml` files in the real Thunderbird application.
The first file is the cold sample; compare medians of the remaining five.
Installed Thunderbird version is printed on each run (Debian ESR package).

From the repository root:

```powershell
npm run build:thunderbird
python scripts/thunderbird-perf/prepare.py --paragraphs 100
docker build -t sprachverstand-thunderbird-qa scripts/thunderbird-perf
docker run --rm --name sprachverstand-tb-perf --shm-size=1g --mount "type=bind,source=F:/Documents/GitHub/Sprachverstand/artifacts/thunderbird-perf-run,target=/qa" sprachverstand-thunderbird-qa sh -c 'Xvfb :1 -ac -screen 0 1280x1024x24 & export DISPLAY=:1; python -u probe.py'
```

Adjust the absolute mount path to your checkout. Output is `results-baseline.json`
unless `-e VARIANT=name` is provided. Use separate prepared output directories for
each build. `--source` selects a previously built baseline; it must be an ordinary,
uninstrumented build directory. `--paragraphs` supports 1–500. Use `--unique`
for individually numbered paragraphs and `--format plain` for a MIME plaintext
fixture. Failed samples are also saved; they are not valid timing results.

The diagnostic copy adds a localhost-only test permission and instrumentation.
It must never be uploaded as a product package. `dist/thunderbird` is not modified.
Only synthetic fixture measurements are posted to a local server in the container.
The production extension has no added host permission or diagnostic reporting.

Metrics: script injection, first-contentful-paint, first complete correction,
and requestAnimationFrame callbacks before completion. Completion is detected by
a MutationObserver; it is an upper bound, not an exact screen presentation time.
All fixture paragraphs must be corrected or the run fails. A fixed four-second
observation window permits completion; incomplete measurements are not successes.
These tests measure startup/render timing, not SMTP delivery or Windows UI timing.
