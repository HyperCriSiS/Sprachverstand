import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Ein echter 60-FPS-Videostream statt verdoppelter 30-FPS-Frames.
// Die Erzeugung erfolgt vor der Messung und zählt nicht zur Wiedergabezeit.
export function createVerified60FpsWebm(run = spawnSync) {
  const args = [
    "-hide_banner", "-loglevel", "error", "-nostdin",
    "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=60",
    "-t", "12", "-an", "-c:v", "libvpx",
    "-deadline", "realtime", "-cpu-used", "8", "-b:v", "500k",
    "-f", "webm", "pipe:1"
  ];
  const encoded = run("ffmpeg", args, {
    encoding: null,
    maxBuffer: 8 * 1024 * 1024,
    timeout: 30_000
  });
  if (encoded.error || encoded.status !== 0 ||
      !Buffer.isBuffer(encoded.stdout) ||
      encoded.stdout.length < 1_500 ||
      encoded.stdout.subarray(0, 4).toString("hex") !== "1a45dfa3") {
    throw new Error("Lokale 60-FPS-WebM-Erzeugung fehlgeschlagen: " +
      String(encoded.error?.message ?? encoded.stderr ?? encoded.status));
  }

  // Nicht nur den Quellparameter prüfen, sondern den kodierten Stream.
  // FFprobe kann die Eingabepipe nach den Headern vorzeitig schließen (EPIPE).
  // Eine kurzlebige lokale Datei macht die Erkennung unabhängig davon.
  const directory = mkdtempSync(path.join(tmpdir(), "sprachverstand-60fps-"));
  let probe;
  try {
    const filename = path.join(directory, "testvideo.webm");
    writeFileSync(filename, encoded.stdout);
    probe = run("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=avg_frame_rate", "-of",
      "default=noprint_wrappers=1:nokey=1", "-i", filename
    ], { encoding: "utf8", timeout: 10_000 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  const rawRate = String(probe.stdout ?? "").trim();
  const match = /^(\d+)\/(\d+)$/u.exec(rawRate);
  const frameRate = match && Number(match[2]) !== 0
    ? Number(match[1]) / Number(match[2]) : 0;
  if (probe.error || probe.status !== 0 || frameRate !== 60) {
    throw new Error("Verifizierung des Videostreams fehlgeschlagen: " +
      String(probe.error?.message ?? rawRate));
  }
  return encoded.stdout;
}