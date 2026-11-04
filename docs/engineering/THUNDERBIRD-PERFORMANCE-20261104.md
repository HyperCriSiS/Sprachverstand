# Thunderbird message startup measurements

Baseline: Thunderbird branch commit `28b0471`, version 0.9.1. Native application:
Thunderbird 153.6.0 (Debian package) in Docker Desktop Linux, Xvfb, Marionette.
Fresh profile, no accounts; synthetic UTF-8 HTML `.eml` messages. Six newly opened
message tabs per variant: first cold sample and median of five subsequent opens.
No live/private email data. Docker files and probe: `scripts/thunderbird-perf/`.
Raw diagnostic outputs remain in `artifacts/thunderbird-perf/results-*.json`.

## Results

Times in milliseconds from message document time origin until all fixture
paragraphs have their expected corrected text (MutationObserver upper bound).

| Paragraphs | Baseline cold | Candidate cold | Baseline warm median | Candidate warm median |
| --- | ---: | ---: | ---: | ---: |
| 100 | 457 | 212 | 284 | 123 |
| 500 | 740 | 372 | 536 | 293 |

Warm median completion improves by about 57% (100 paragraphs) and 45% (500).
Median delay after first-contentful-paint: 153 → 77 ms (100), 405 → 249 ms (500).
All six samples in these final comparison series corrected all paragraphs.
One earlier 500-paragraph baseline sample was incomplete after the original
1.5-second observation period; that series is excluded, not counted as a success.
The final baseline uses a four-second observation window, now also the probe default.

## Diagnosis and change

The old message content bundle included the entire rule engine, initialized again
for every opened message. Instrumented warm examples spent roughly 85–125 ms
between script injection and starting the settings reads; the reads themselves
were typically around 10–25 ms. The shared background already loads the rules
for compose support, so initializing them again in every message is redundant.

The candidate uses the established local transform batching protocol and a
validated Thunderbird background handler. DOM metadata/candidate filtering stay
in the document. Message content bundle shrinks from roughly 985 KB to 213 KB.
No added production permissions, persistent text cache or remote processing.
Registration uses `document_end`, with migration from existing idle registrations.

An initial synchronous-engine experiment alone was slower. A bounded synchronous
flush reduced partial-render frames but not enough initialization cost. Neither
experimental synchronous/flush change remains in the candidate.

## Scope

This reduces visible transformation latency but does not guarantee correction
before first paint. A smaller first-paint timestamp is not itself an improvement
in correctness. Actual screen presentation, Windows performance, plaintext mails,
mailbox switching and multiple Thunderbird versions need separate native coverage.
Shared-core regression tests cover protection, custom replacements, restoration
and settings changes through the real transform bridge. No UI hiding is used to
mask uncorrected content. No product release or tag is created by this work.
