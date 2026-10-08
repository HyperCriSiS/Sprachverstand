// Erfasst ausschließlich beobachtete DOM-Zustandsänderungen.
// Auch bei Änderungen nur im Erweiterungslauf ist die Verursachung nicht bewiesen.
export function changedProtectedSelectors(before = {}, after = {}) {
  const selectors = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...selectors]
    .sort()
    .filter((selector) => JSON.stringify(before[selector]) !== JSON.stringify(after[selector]));
}

export function compareProtectedRuns(baseline, extension) {
  const protectedBaselineChanged = changedProtectedSelectors(
    baseline.protectedBefore,
    baseline.protectedAfter
  );
  const protectedExtensionChanged = changedProtectedSelectors(
    extension.protectedBefore,
    extension.protectedAfter
  );
  const baselineSet = new Set(protectedBaselineChanged);
  const protectedOnlyExtensionChanged = protectedExtensionChanged.filter(
    (selector) => !baselineSet.has(selector)
  );
  return {
    protectedBaselineChanged,
    protectedExtensionChanged,
    protectedOnlyExtensionChanged
  };
}
