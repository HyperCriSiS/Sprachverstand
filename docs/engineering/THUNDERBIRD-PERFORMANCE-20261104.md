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

## Second optimization round

Compared against the first candidate, commit `0a9cd2f`, in fresh sequential
Docker runs on the same Thunderbird 153.6.0 image, with networking disabled.
Each series again contains one cold and five warm message opens. The first
round's wall-clock numbers are not reused as this round's baseline.

| HTML fixture | Previous cold | New cold | Previous warm median | New warm median | Warm after-paint, previous → new |
| --- | ---: | ---: | ---: | ---: | ---: |
| 100 repeated paragraphs | 242 | 228 | 130 | 125 | 92 → 80 |
| 500 repeated paragraphs | 448 | 414 | 331 | 269 | 277 → 224 |
| 500 individually numbered paragraphs | 395 | 367 | 303 | 270 | 258 → 228 |

The additional reduction is approximately 11–19% on the two long HTML fixtures.
The 4% change on the shorter fixture is too small to treat as a reliable benefit
from these samples. Every HTML sample corrected every expected paragraph.
Raw reports: `artifacts/tb-round2-{before100,pipeline100,before500,pipeline500,before-unique,after-unique}/results-baseline.json`.

Only the Thunderbird message view opts into 128 outstanding short transforms
instead of 32. This keeps the existing two background batch slots supplied;
each batch remains limited to 32 entries / 65,536 input characters. Browser
defaults, one-millisecond DOM slices and the maximum work steps are unchanged.
Text is neither persisted nor cached between messages. Regression tests cover
both concurrency limits, late responses after stopping, restart and restoration.

Rejected experiments: a MessageChannel DOM task queue, larger DOM slices and
immediate dispatch of partial batches. They did not show a consistent additional
benefit and are absent from the final implementation.

### Existing plaintext display defect discovered by the probe

The new `--format plain --unique` native probe fails on both `0a9cd2f` and the
second candidate: zero of 100 paragraphs are corrected. Thunderbird renders
this fixture as `div.moz-text-plain > pre.moz-quote-pre`. The shared text-safety
policy excludes `PRE` as code. These failed samples are not timing results.
The harness now checks the expected count against the source fixture and saves
failed reports with a bounded synthetic DOM excerpt for diagnosis.

Follow-up: handle Thunderbird's native plaintext wrapper without weakening code,
editable-content or technical-text protection in HTML messages or browsers.
This existing functional defect is separate from the concurrency optimization;
it is not repaired or hidden by it. Compose plaintext processing is a separate
path and is not implicated by this display test.

## Third optimization round: ordinary text first

Profiling: the Gecko profiler (`MOZ_PROFILER_STARTUP`, dumped through
Marionette) in the same Docker image. On the all-marked 500-paragraph fixture
the background rule engine needs roughly 0.25 ms and the message document
roughly 0.3 ms of CPU per paragraph; both run in parallel. Neither side has a
single dominant hotspot: the engine cost is spread over several rules and
lexicon lookups, the document cost over traversal checks and `replaceData`.

Real mails consist mostly of ordinary prose that the candidate filter rejects.
Before this round, each such text node still walked its ancestors twice
(protection and caption checks) before the cheap string test ran. The
DomProcessor now applies the string test first when no tracked original must be
restored, skips the inline sibling walk when no leading-context edit exists, and
skips the accessible-attribute lookups for elements without any attribute and
without an own tracked change. All three shortcuts return exactly where the
previous order returned; they are shared with the browser builds.

New fixture option: `--marked-every 10` (every tenth paragraph has markers, the
others are ordinary prose). Commit `b9f187f` against the candidate, alternating
runs, one cold and five warm opens each:

| Fixture | `b9f187f` warm medians | Candidate warm medians |
| --- | --- | --- |
| 500 paragraphs, every 10th marked | 165, 165, 150, 159, 148 | 137, 123, 134, 129, 123 |
| 100 paragraphs, every 10th marked | 92, 107, 87 | 84, 103, 97 |
| 500 numbered paragraphs, all marked | 286, 270 | 268, 287, 275 |
| 100 repeated paragraphs, all marked | 127 | 131 |

On the long mixed mail the median of medians drops from 159 to 129 ms (about
19%); content-script CPU per open drops from roughly 75 to 55 ms. Short mixed
mails and all-marked mails show no difference beyond run-to-run noise, as
expected: the shortcuts only skip work for non-candidate text. These runs used
an additional diagnostic trace (message timing and task counts); it adds equal
overhead to both builds and is not part of the repository harness.
