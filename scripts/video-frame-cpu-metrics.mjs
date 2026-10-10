// Zeitfenster aus Browser-Framecallbacks, Long Tasks und V8-CPU-Samples abgleichen.
// CPU-Samples belegen Aktivität, nicht automatisch die kausale Ursache eines Frame-Ausfalls.
const round = (value) => Number(value.toFixed(2));
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export function frameLuecken(frameTimes, startIndex = 16, minimumGapMs = 80) {
  if (!Array.isArray(frameTimes)) return [];
  const result = [];
  for (let index = Math.max(1, startIndex); index < frameTimes.length; index++) {
    const startMs = Number(frameTimes[index - 1]);
    const endMs = Number(frameTimes[index]);
    if (Number.isFinite(startMs) && Number.isFinite(endMs) &&
        endMs - startMs >= minimumGapMs) {
      result.push({ startMs, endMs, dauerMs: round(endMs - startMs), index });
    }
  }
  return result.sort((a, b) => b.dauerMs - a.dauerMs);
}

export function analysiereVideoCpu(profile, offsetMs, frameTimes, longTasks = []) {
  if (!profile || !Array.isArray(profile.nodes) ||
      !Array.isArray(profile.samples) || !Array.isArray(profile.timeDeltas) ||
      profile.samples.length !== profile.timeDeltas.length ||
      !isFiniteNumber(profile.startTime) || !isFiniteNumber(offsetMs)) {
    throw new Error("CPU-Profil oder Zeitachsenabgleich ist unvollständig.");
  }
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const samples = [];
  let zeitUs = profile.startTime;
  const gesamt = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const deltaUs = profile.timeDeltas[i];
    if (!isFiniteNumber(deltaUs) || deltaUs < 0) {
      throw new Error("CPU-Profil enthält ungültige Sample-Zeitdeltas.");
    }
    zeitUs += deltaUs;
    const node = nodes.get(profile.samples[i]);
    const functionName = node?.callFrame?.functionName || "(anonym)";
    const url = node?.callFrame?.url || "(ohne URL)";
    const typ = url.startsWith("chrome-extension://") ? "erweiterung" :
      url.startsWith("http://127.0.0.1:") ? "fixture" : "laufzeit";
    const sample = { zeitMs: zeitUs / 1000 + offsetMs, cpuMs: deltaUs / 1000,
      funktion: functionName, quelle: url, typ };
    samples.push(sample);
    const name = typ + " | " + functionName;
    gesamt.set(name, (gesamt.get(name) ?? 0) + sample.cpuMs);
  }
  const minFrame = frameTimes?.[0];
  const maxFrame = frameTimes?.[frameTimes.length - 1];
  const sampleÜberlappung = samples.some((x) => x.zeitMs >= minFrame &&
    x.zeitMs <= maxFrame);
  const achsePlausibel = samples.length > 0 && sampleÜberlappung;
  const gaps = frameLuecken(frameTimes);
  const spitzen = gaps.slice(0, 30).map((gap) => {
    const innerhalb = achsePlausibel ? samples.filter((x) =>
      x.zeitMs >= gap.startMs && x.zeitMs <= gap.endMs) : [];
    const typMs = {};
    const funktionen = new Map();
    for (const sample of innerhalb) {
      typMs[sample.typ] = (typMs[sample.typ] ?? 0) + sample.cpuMs;
      const key = sample.typ + " | " + sample.funktion;
      funktionen.set(key, (funktionen.get(key) ?? 0) + sample.cpuMs);
    }
    const überlappendeTasks = longTasks.filter((task) =>
      task.startMs < gap.endMs &&
      task.startMs + task.dauerMs > gap.startMs);
    return {
      ...gap,
      longTasks: überlappendeTasks,
      sampledCpuMs: Object.fromEntries(
        Object.entries(typMs).map(([name, value]) => [name, round(value)])
      ),
      topFunktionen: [...funktionen.entries()]
        .sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([name, ms]) => ({ name, ms: round(ms) }))
    };
  });
  return {
    sampleCount: samples.length,
    zeitraumMs: samples.length ?
      [round(samples[0].zeitMs), round(samples[samples.length - 1].zeitMs)] : [],
    frameZeitraumMs: [minFrame, maxFrame],
    achsePlausibel,
    lueckenAb80Ms: gaps.length,
    lueckenAb120Ms: gaps.filter((x) => x.dauerMs > 120).length,
    groessteLueckeMs: gaps[0]?.dauerMs ?? 0,
    spitzen,
    topGesamt: [...gesamt.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([name, ms]) => ({ name, ms: round(ms) }))
  };
}
