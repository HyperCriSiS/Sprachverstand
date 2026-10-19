# Diagnostic GitHub runner preparation

Current probe: four versus eight workers, using the same 16 URLs in balanced blocks 4–8–8–4 (32 URL pairs per configuration). Node is pinned to 24.21.0, matching the earlier successful capacity probe. Phase summaries, aggregate throughput and resource samples are retained. Qualification requires four complete blocks, no crashed workers/browsers, at least 90% valid pairs per block, no more than 25% detected access pages, and at least 1 GiB available memory in each block. The older one-versus-four results remain attached to run 39180582203; descriptions below of that initial probe are historical.

This branch changes only diagnostic tooling, input URL lists and the existing manually dispatched workflow. Product source remains at `6b135fc8dcfb2942ac96906583616e25874a8e4c`. No PR, merge, release or store action is part of this experiment.

The `real-world.yml` workflow on this branch runs exactly one `ubuntu-24.04` standard runner. It proves extension operation with the existing native smoke test, then compares the same 16 public URLs with one and four browser workers. Each URL uses separate baseline/extension sessions. The deep-scroll adapter is shared with the local investigation: overlapping viewport steps, CSS visibility and clipped-container checks, context evidence, explicit scrolling limits. Protected inputs/code are excluded. The legacy snapshot fields are retained as raw diagnostic data; `deepObservation.final.evidence` is authoritative for this experiment.

Outputs under `artifacts/discovery-probe/` contain per-page reports, incremental worker results, resource samples, logs and `benchmark.md/.json`. They contain public URLs and short context evidence, no browser profiles or credential files. Artifact retention is seven days. A 50-minute workload budget leaves time to upload within the 75-minute job timeout. A job failure is not evidence that the extension itself regressed.

Probe qualification requires all expected unique URL IDs in both phases, no failed worker processes or browser crash indicators, at least 90% valid pairs in each phase, and at least 1 GiB available system memory during the four-worker phase. Website-specific network failures and sequential-then-parallel ordering can affect the speed estimate. This is a capacity experiment, not an isolated extension-performance acceptance test.

`make-batches.mjs` prepares up to 256 deterministic packages from the 2,500-domain list. Default: 128 packages, maximum 50 additional pages per domain. Pass `--state-dir` with local domain checkpoints to preserve visited URLs and discovered queues. Packaging does not dispatch jobs. The actual cloud continuation and automated artifact restore will be enabled only after measuring this single-runner probe and deciding how to transition the still-running local crawl. Current local work must not be silently discarded or executed twice.

Example local preparation:

```sh
node scripts/discovery-diagnostic/make-batches.mjs --domains config/discovery-domains.json --state-dir artifacts/real-world/deep-2500/states --output artifacts/discovery-batches --batches 128
```
