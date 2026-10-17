import {existsSync} from "node:fs";
import {readFile, writeFile, appendFile, stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {videoPresentationProgress} from "./video-gap-episodes.mjs";

const sourceHash = "13f69752b5dc9e85842e1eacd71f03f36f83de9d3b6ce8321fd2fc4c09d842cd";
const number = value => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw Error("Invalid video number");
  return value;
};
const count = value => {
  if (!Number.isSafeInteger(value) || value < 0) throw Error("Invalid video count");
  return value;
};
const boolean = value => {
  if (typeof value !== "boolean") throw Error("Invalid video boolean");
  return value;
};
const optionalNumber = value => value == null ? null : number(value);
const optionalBoolean = value => value == null ? null : boolean(value);
const visibility = value => {
  if (value == null) return null;
  if (!["visible", "hidden"].includes(value)) throw Error("Invalid video visibility");
  return value;
};
const bounded = (value, limit) => {
  if (!Array.isArray(value) || value.length > limit) throw Error("Unbounded video observation");
  return value;
};
export function videoBrowserVersion(value) {
  const version = String(value ?? "").split(" ")[0];
  return /^\d+(?:\.\d+){1,3}$/u.test(version) ? version : "unknown";
}
function version(value) {
  if (value !== "unknown" && videoBrowserVersion(value) !== value) throw Error("Invalid video version");
  return value;
}

function sanitizeRole(input, mode) {
  if (input.mode !== mode) throw Error("Unexpected video role");
  const frameSamples = bounded(input.frameSamples, 2048).map(frame => ({
    nowMs:number(frame.nowMs), mediaTime:number(frame.mediaTime), presentedFrames:count(frame.presentedFrames),
    callbackAtMs:optionalNumber(frame.callbackAtMs), presentationTimeMs:optionalNumber(frame.presentationTimeMs),
    expectedDisplayTimeMs:optionalNumber(frame.expectedDisplayTimeMs), processingDurationMs:optionalNumber(frame.processingDurationMs),
    focused:optionalBoolean(frame.focusedAtFrame), visibility:visibility(frame.visibilityAtFrame)
  }));
  if (count(input.frames.callbacks) !== frameSamples.length) throw Error("Video callback count mismatch");
  const support = input.longTaskSupported ?? null;
  if (support !== null && typeof support !== "boolean") throw Error("Invalid video observer support");
  const completion = input.dynamicCompletion;
  return {
    mode, browserVersion:version(input.browserVersion), driverVersion:version(input.driverVersion),
    currentTime:number(input.currentTime), droppedVideoFrames:count(input.droppedVideoFrames), mutationTicks:count(input.mutationTicks),
    completion:{total:count(completion.total), expected:count(completion.expected), correct:count(completion.correct)},
    frames:{callbacks:frameSamples.length, p95GapMs:optionalNumber(input.frames.p95GapMs),
      maximumGapMs:optionalNumber(input.frames.maximumGapMs), gapsOver120Ms:count(input.frames.gapsOver120Ms)},
    focused:boolean(input.focused), visibility:visibility(input.visibilityState), frameSamples,
    presentationProgress:videoPresentationProgress(frameSamples, 30) ?? null,
    longTaskObservation:support === true ? "observed" : support === false ? "unsupported" : "not-enabled",
    longTasks:support === true ? bounded(input.longTasks, 256).map(task => ({startMs:number(task.startMs), durationMs:number(task.durationMs)})) : [],
    visibilityEvents:bounded(input.visibilityEvents ?? [], 256).map(event => ({nowMs:number(event.nowMs),
      state:visibility(event.state), focused:boolean(event.focused)}))
  };
}

export function sanitizeVideoFailure(input) {
  if (input.browser !== "chromium" || input.sourceFps !== 30 || input.sourceHash !== sourceHash ||
      !["baseline-first", "extension-first"].includes(input.pairOrder)) throw Error("Unexpected video source");
  return {schemaVersion:1, browser:"chromium", sourceFps:30, sourceHash, pairOrder:input.pairOrder,
    observation:"synthetic numeric measurements, not a native trace or recording",
    baseline:sanitizeRole(input.baseline, "baseline"), extension:sanitizeRole(input.extension, "extension")};
}

// Fixed paths only: raw browser traces, media, profiles and arbitrary files are never exported.
export async function exportVideoFailures(directory = path.join(process.cwd(), "artifacts/video-playback")) {
  let exported = 0;
  for (const attempt of [1, 2]) {
    const input = path.join(directory, `video-pair-chromium-30-${attempt}.json`);
    if (!existsSync(input)) continue;
    if ((await stat(input)).size > 1024 * 1024) throw Error("Oversized video report");
    const report = sanitizeVideoFailure(JSON.parse(await readFile(input, "utf8")));
    await writeFile(path.join(directory, `sanitized-video-failure-${attempt}.json`), JSON.stringify(report, null, 2), {flag:"wx"});
    exported++;
  }
  return exported;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exported = await exportVideoFailures();
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `present=${exported > 0}\n`);
  console.log(JSON.stringify({sanitizedVideoPairs:exported}));
}
