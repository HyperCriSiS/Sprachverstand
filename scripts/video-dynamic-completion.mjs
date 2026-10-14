// The fixture rewrites 48 of its 480 slots on each tick. Check the newest
// expected value after the existing drain period, outside the timed window.
export function videoDynamicCompletion(texts, mutationTicks, mode) {
  if (!Array.isArray(texts) || !Number.isSafeInteger(mutationTicks) ||
      mutationTicks < 0 || !["baseline", "extension"].includes(mode)) {
    throw new Error("Invalid dynamic video fixture observation.");
  }
  const incorrectIndices = [];
  const latestTick = mutationTicks - 1;
  for (let index = 0; index < 480; index += 1) {
    const slot = Math.floor(index / 48);
    const tick = latestTick - ((latestTick % 10 - slot + 10) % 10);
    const expected = tick < 0 ? "Neutraler Inhalt " + index :
      (mode === "extension" ? "Nutzer " : "Nutzer:innen ") + tick + " / " + index % 48;
    if (texts[index] !== expected) incorrectIndices.push(index);
  }
  return {total: texts.length, expected: 480, correct: 480 - incorrectIndices.length,
    incorrectIndices};
}
