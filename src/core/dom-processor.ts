import { isRiskAllowed, type Rule, type RuleProfile } from "./rule";
import {
  accessibleAttributeNames,
  shouldProcessAccessibleAttribute,
  shouldProcessTextNode,
  isProtectedTextSubtree
} from "./text-safety";
import type { CustomReplacement } from "../settings/defaults";
import {
  isSubtitleContainer,
  isSubtitleContent,
  matchesSubtitleMarker,
  subtitleClassifierAttributeNames
} from "./subtitles";
import { transformTextWithSummary } from "./transform-text";
import {
  collectInlineProtection,
  findInlineBoundary,
  type InlineProtectionRange
} from "./inline-protection";
import {
  aggregateReplacementSummaries,
  type ReplacementSummaryEntry
} from "./replacement-summary";

export interface DomProcessorOptions {
  readonly rules: readonly Rule[];
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
  readonly protectedTerms?: readonly string[];
  readonly customReplacements?: readonly CustomReplacement[];
  readonly processAccessibleAttributes?: boolean;
  readonly processQuotedText?: boolean;
  readonly processSubtitles?: boolean;
  readonly onReplacementCountChange?: (
    count: number,
    replacements: readonly ReplacementSummaryEntry[]
  ) => void;
}

export interface StopOptions {
  readonly restore?: boolean;
}

const leadingContextLimit = 120;
const maximumSubtitleTransformCacheEntries = 256;
const blockBoundaryTags = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DIV",
  "DL",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "SECTION",
  "TABLE",
  "TD",
  "TH",
  "TR",
  "UL"
]);

interface ChangeRecord {
  readonly original: string;
  readonly transformed: string;
  readonly replacements: number;
  readonly summaries: readonly ReplacementSummaryEntry[];
}

interface RewriteState {
  count: number;
  windowStartedAt: number;
  backoffUntil: number;
}

interface TraversalState {
  readonly root: Node;
  readonly walker: TreeWalker | undefined;
  readonly skipSubtitles: boolean;
  rootProcessed: boolean;
}

const trailingParticiplePattern =
  /(?<![\p{L}\p{M}])(?:Mitarbeitende|Teilnehmende|Nutzende|Studierende|Forschende|Lehrende|Lesende|Zuhörende|Arbeitnehmende|Arbeitgebende|Dozierende|Fördergebende|Theatermachende)\s*$/iu;
const leadingParticiplePattern =
  /^(?:Mitarbeitende|Teilnehmende|Nutzende|Studierende|Forschende|Lehrende|Lesende|Zuhörende|Arbeitnehmende|Arbeitgebende|Dozierende|Fördergebende|Theatermachende)(?![\p{L}\p{M}])/iu;
const followingInlineNounPattern = /^\s*[\p{Lu}][\p{Ll}\p{M}-]+/u;
const possibleInlineNounPrefixPattern = /^\s*[\p{Lu}][\p{Ll}\p{M}-]*$/u;
const maximumPreviousInlineNodes = 64;
const inlineQuoteMarkerPattern = /["„“”‚‘«»‹›]/u;

const regularWorkBudgetMs = 4;
// Frische Textmutationen dürfen bei langen Traversierungen nicht verhungern.
// Pro Arbeitsscheibe bleibt ihre Vorzugsbehandlung ausdrücklich begrenzt.
const maximumPriorityTextMutationsPerSlice = 8;
// Sehr kleine Startdokumente bleiben unmittelbar verfügbar. Große DOMs
// werden nach einer begrenzten Vorprüfung kooperativ abgearbeitet.
const maximumImmediateInitialNodes = 64;
const maximumImmediateInitialTextChars = 2_048;
// Dynamische Videountertitel erhalten nur kurze Arbeitsscheiben pro Frame.
const subtitleWorkBudgetMs = 2;
const maximumSubtitleStepsPerFrame = 12;
const shadowDiscoveryIntervalMs = 1_500;
const shadowDiscoveryBatchSize = 256;
const shadowDiscoveryBudgetMs = 2;
const shadowDiscoveryYieldMs = 64;
const frameworkRewriteWindowMs = 1_000;
const frameworkRewriteThreshold = 5;
const frameworkRewriteCooldownMs = 250;

// Änderungen an diesen Attributen betreffen die Schutzentscheidung für
// sämtliche untergeordneten Texte, auch bei deaktivierter Attributkorrektur.
const protectionAttributeNames = new Set([
  "contenteditable",
  "aria-hidden",
  "role",
  "data-sprachverstand-ignore"
]);
const subtitleClassificationAttributeSet =
  new Set<string>(subtitleClassifierAttributeNames);

export class DomProcessor {
  private observer: MutationObserver | undefined;
  private observerOptions: MutationObserverInit | undefined;
  private observedShadowRoots = new WeakSet<ShadowRoot>();
  private shadowDiscoveryWalker: TreeWalker | undefined;
  private shadowDiscoveryDocumentRoot: Element | undefined;
  private shadowDiscoveryHandle: number | undefined;
  private readonly pendingNodes = new Set<Node>();
  private readonly contextDirtyNodes = new Set<Text>();
  private inlineProtectionCache = new WeakMap<Text, readonly InlineProtectionRange[]>();
  private readonly pendingSubtitleTextNodes = new Set<Text>();
  private readonly pendingSubtitleRoots = new Set<Node>();
  private activeSubtitleTraversal:
    | { readonly root: Node; readonly walker: TreeWalker }
    | undefined;
  private readonly pendingAttributes = new Map<Element, Set<string>>();
  private readonly textChanges = new Map<Text, ChangeRecord>();
  private readonly attributeChanges = new Map<
    Element,
    Map<string, ChangeRecord>
  >();
  private flushHandle: number | undefined;
  private flushDueAt: number | undefined;
  private activeTraversal: TraversalState | undefined;
  private textRewriteStates = new WeakMap<Text, RewriteState>();
  private subtitleFlushHandle: number | undefined;
  private subtitleFlushUsesAnimationFrame = false;
  private readonly subtitleTransformCache = new Map<
    string,
    ReturnType<typeof transformTextWithSummary>
  >();
  private countNotificationScheduled = false;
  private running = false;
  private observedDesignModeOn = false;
  private replacementCount = 0;
  private readonly beforeInputHandler = (): void => {
    // Ein reiner Wechsel von designMode löst keine DOM-Mutation aus.
    // Vor der tatsächlichen Eingabe eigene Änderungen zurücknehmen.
    if (this.running && this.document.designMode?.toLowerCase() === "on") {
      this.observedDesignModeOn = true;
      this.restoreAll();
    }
  };

  public constructor(
    private readonly document: Document,
    private options: DomProcessorOptions
  ) {}

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.observedDesignModeOn = this.document.designMode?.toLowerCase() === "on";
    this.document.addEventListener("beforeinput", this.beforeInputHandler, true);
    this.observedShadowRoots = new WeakSet<ShadowRoot>();
    this.shadowDiscoveryWalker = undefined;
    this.shadowDiscoveryDocumentRoot = undefined;
    this.textRewriteStates = new WeakMap<Text, RewriteState>();
    this.inlineProtectionCache = new WeakMap<Text, readonly InlineProtectionRange[]>();

    const MutationObserverConstructor =
      this.document.defaultView?.MutationObserver ?? MutationObserver;
    this.observer = new MutationObserverConstructor((records) => {
      this.handleMutationRecords(records);
    });

    const observerOptions: MutationObserverInit = {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter:
        this.options.processAccessibleAttributes !== false
          ? [...accessibleAttributeNames, ...protectionAttributeNames, ...subtitleClassifierAttributeNames]
          : [...protectionAttributeNames, ...subtitleClassifierAttributeNames]
    };
    this.observerOptions = observerOptions;
    this.observeMutationTarget(this.document.documentElement);

    const root = this.document.body ?? this.document.documentElement;
    if (root) {
      if (this.isSmallInitialTree(root)) {
        this.processRoot(root);
      } else {
        // Die vollständige Initialisierung darf nicht den Hauptthread
        // während eines einzigen start()-Aufrufs blockieren.
        this.queue(root);
      }
    }

    // attachShadow() erzeugt kein Light-DOM-MutationRecord.
    // Eine begrenzte Suche erkennt auch später erzeugte offene Wurzeln.
    this.scheduleShadowDiscovery(shadowDiscoveryIntervalMs);
    this.scheduleCountNotification();
  }

  public stop(options: StopOptions = {}): void {
    this.running = false;
    this.observedDesignModeOn = false;
    this.document.removeEventListener("beforeinput", this.beforeInputHandler, true);
    this.observer?.disconnect();
    this.observer = undefined;
    this.observerOptions = undefined;
    this.cancelShadowDiscovery();
    this.cancelRegularFlush();
    this.activeTraversal = undefined;
    this.pendingNodes.clear();
    this.contextDirtyNodes.clear();
    this.pendingSubtitleTextNodes.clear();
    this.pendingSubtitleRoots.clear();
    this.activeSubtitleTraversal = undefined;
    this.pendingAttributes.clear();
    this.cancelSubtitleFlush();
    this.subtitleTransformCache.clear();
    this.observedShadowRoots = new WeakSet<ShadowRoot>();
    this.shadowDiscoveryWalker = undefined;
    this.shadowDiscoveryDocumentRoot = undefined;
    this.textRewriteStates = new WeakMap<Text, RewriteState>();
    this.inlineProtectionCache = new WeakMap<Text, readonly InlineProtectionRange[]>();

    if (options.restore) {
      this.restoreAll();
    } else {
      this.clearTracking();
    }
  }

  public updateOptions(options: DomProcessorOptions): void {
    const wasRunning = this.running;

    if (wasRunning) {
      this.stop({ restore: true });
    }

    this.options = options;
    this.subtitleTransformCache.clear();

    if (wasRunning) {
      this.start();
    }
  }

  public getReplacementCount(): number {
    return this.replacementCount;
  }

  public getReplacementSummary(): ReplacementSummaryEntry[] {
    const summaries: ReplacementSummaryEntry[] = [];

    for (const change of this.textChanges.values()) {
      summaries.push(...change.summaries);
    }

    for (const changes of this.attributeChanges.values()) {
      for (const change of changes.values()) {
        summaries.push(...change.summaries);
      }
    }

    return aggregateReplacementSummaries(summaries);
  }

  public restoreAll(): void {
    for (const [node, change] of this.textChanges) {
      if (node.isConnected && node.data === change.transformed) {
        this.replaceTextKeepingRanges(node, change.original);
      }
    }

    for (const [element, changes] of this.attributeChanges) {
      if (!element.isConnected) {
        continue;
      }

      for (const [attributeName, change] of changes) {
        if (element.getAttribute(attributeName) === change.transformed) {
          element.setAttribute(attributeName, change.original);
        }
      }
    }

    this.clearTracking();
  }

  public flush(): void {
    this.syncDesignModeTransition();
    this.cancelRegularFlush();
    this.flushRegularNodesSynchronously();
    this.cancelSubtitleFlush();
    this.flushSubtitleNodes();
  }

  private flushRegularNodesSynchronously(): void {
    if (!this.running) {
      return;
    }

    const roots = [
      ...(this.activeTraversal ? [this.activeTraversal.root] : []),
      ...this.pendingNodes
    ];
    const attributes = [...this.pendingAttributes.entries()];
    this.activeTraversal = undefined;
    this.pendingNodes.clear();
    this.pendingAttributes.clear();

    for (const node of this.coalesceRoots(roots)) {
      this.processRoot(node);
    }

    for (const [element, attributeNames] of attributes) {
      for (const attributeName of attributeNames) {
        this.processAccessibleAttribute(element, attributeName);
      }
    }
  }

  private flushSubtitleNodes(budgeted = false): void {
    if (!this.running) {
      return;
    }

    // flush() bleibt ein expliziter synchroner Test-/Steuerungsaufruf.
    // Automatische Frame-Callbacks erhalten dagegen eine harte Mengengrenze.
    const deadline = budgeted ? this.now() + subtitleWorkBudgetMs : Infinity;
    let steps = 0;
    while (
      this.running &&
      (!budgeted ||
        (steps < maximumSubtitleStepsPerFrame &&
          (steps === 0 || this.now() < deadline)))
    ) {
      const node = this.pendingSubtitleTextNodes.values().next().value;
      if (node) {
        this.pendingSubtitleTextNodes.delete(node);
        steps += 1;
        if (node.isConnected && isSubtitleContent(node)) {
          this.processTextNode(node, true);
        }
        continue;
      }

      if (!this.activeSubtitleTraversal) {
        const root = this.pendingSubtitleRoots.values().next().value;
        if (!root) {
          break;
        }
        this.pendingSubtitleRoots.delete(root);
        steps += 1;
        if (!this.isProcessableRoot(root)) {
          continue;
        }
        const filter = this.document.defaultView?.NodeFilter ?? NodeFilter;
        this.activeSubtitleTraversal = {
          root,
          walker: this.document.createTreeWalker(root, filter.SHOW_TEXT)
        };
        continue;
      }

      const traversal = this.activeSubtitleTraversal;
      if (!this.isProcessableRoot(traversal.root)) {
        this.activeSubtitleTraversal = undefined;
        steps += 1;
        continue;
      }
      const next = traversal.walker.nextNode() as Text | null;
      steps += 1;
      if (!next) {
        this.activeSubtitleTraversal = undefined;
      } else if (next.isConnected && isSubtitleContent(next)) {
        this.processTextNode(next, true);
      }
    }

    if (
      budgeted &&
      (this.pendingSubtitleTextNodes.size > 0 ||
        this.pendingSubtitleRoots.size > 0 ||
        this.activeSubtitleTraversal)
    ) {
      this.scheduleSubtitleFlush();
    }
  }

  public processRoot(root: Node): void {
    if (!this.running || !this.isProcessableRoot(root)) {
      return;
    }

    const skipSubtitles = this.options.processSubtitles !== true;
    if (skipSubtitles && isSubtitleContent(root)) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      this.processTextNode(root as Text, skipSubtitles ? false : undefined);
      return;
    }

    if (root instanceof Element) {
      this.processElement(root, true);
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT,
      skipSubtitles
        ? {
            acceptNode: (node) =>
              node instanceof Element && isSubtitleContainer(node)
                ? nodeFilter.FILTER_REJECT
                : nodeFilter.FILTER_ACCEPT
          }
        : null
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        this.processTextNode(
          currentNode as Text,
          skipSubtitles ? false : undefined
        );
      } else if (currentNode instanceof Element) {
        this.processElement(currentNode, true);
      }

      currentNode = walker.nextNode();
    }
  }

  private isSmallInitialTree(root: Node): boolean {
    const filter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const mask = filter.SHOW_ELEMENT | filter.SHOW_TEXT;
    const walkers: TreeWalker[] = [this.document.createTreeWalker(root, mask)];
    if (root instanceof Element && root.shadowRoot) {
      walkers.push(this.document.createTreeWalker(root.shadowRoot, mask));
    }

    let inspectedNodes = 0;
    let textChars = 0;
    while (walkers.length > 0) {
      const node = walkers[walkers.length - 1]?.nextNode();
      if (!node) {
        walkers.pop();
        continue;
      }
      inspectedNodes += 1;
      if (inspectedNodes > maximumImmediateInitialNodes) {
        return false;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        textChars += (node as Text).data.length;
        if (textChars > maximumImmediateInitialTextChars) {
          return false;
        }
      }
      // Auch offene ShadowRoots zählen zum synchronen Gesamtbudget.
      if (node instanceof Element && node.shadowRoot) {
        walkers.push(this.document.createTreeWalker(node.shadowRoot, mask));
      }
    }
    return true;
  }

  private queue(node: Node): void {
    if (!this.running) {
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const tracked = this.textChanges.get(textNode);
      if (
        tracked &&
        textNode.data === tracked.transformed &&
        !this.contextDirtyNodes.has(textNode)
      ) {
        return;
      }
    }

    if (isSubtitleContent(node)) {
      if (this.options.processSubtitles === true) {
        this.queueSubtitleTextNodes(node);
      }
      return;
    }

    // Im Observer-Callback nur O(1)-Arbeit pro Knoten: keine paarweisen
    // contains()-Prüfungen. Eltern/Kind-Überlappungen werden beim Entnehmen
    // anhand der tatsächlichen DOM-Vorfahren zusammengefasst.
    this.pendingNodes.add(node);
    const delay =
      node.nodeType === Node.TEXT_NODE
        ? this.getBackoffRemaining(node as Text)
        : 0;
    this.scheduleFlush(delay);
  }

  private queueSubtitleTextNodes(root: Node): void {
    // Im MutationObserver keinen vollständigen Caption-Unterbaum durchlaufen.
    // Die Textsuche wird erst im budgetierten Frame-Callback fortgesetzt.
    if (root.nodeType === Node.TEXT_NODE) {
      this.pendingSubtitleTextNodes.add(root as Text);
    } else {
      this.pendingSubtitleRoots.add(root);
    }
    this.scheduleSubtitleFlush();
  }

  private queueAttribute(element: Element, attributeName: string): void {
    if (!this.running) {
      return;
    }

    const tracked = this.attributeChanges.get(element)?.get(attributeName);
    if (tracked && element.getAttribute(attributeName) === tracked.transformed) {
      return;
    }

    const attributeNames =
      this.pendingAttributes.get(element) ?? new Set<string>();
    attributeNames.add(attributeName);
    this.pendingAttributes.set(element, attributeNames);
    this.scheduleFlush();
  }

  private scheduleFlush(delayMs = 0): void {
    if (!this.running) {
      return;
    }

    const dueAt = this.now() + Math.max(0, delayMs);
    if (
      this.flushHandle !== undefined &&
      this.flushDueAt !== undefined &&
      this.flushDueAt <= dueAt
    ) {
      return;
    }

    this.cancelRegularFlush();
    const view = this.document.defaultView;
    const callback = () => {
      this.flushHandle = undefined;
      this.flushDueAt = undefined;
      this.flushRegularNodesBudgeted();
    };
    this.flushDueAt = dueAt;
    this.flushHandle = view
      ? view.setTimeout(callback, Math.max(0, delayMs))
      : window.setTimeout(callback, Math.max(0, delayMs));
  }

  private cancelRegularFlush(): void {
    if (this.flushHandle === undefined) {
      return;
    }

    const view = this.document.defaultView;
    if (view) {
      view.clearTimeout(this.flushHandle);
    } else {
      window.clearTimeout(this.flushHandle);
    }
    this.flushHandle = undefined;
    this.flushDueAt = undefined;
  }

  private flushRegularNodesBudgeted(): void {
    if (!this.running) {
      return;
    }

    const deadline = this.now() + regularWorkBudgetMs;
    let nextDelay: number | undefined;
    let priorityTextMutations = 0;

    while (this.now() < deadline) {
      if (this.activeTraversal &&
          priorityTextMutations < maximumPriorityTextMutationsPerSlice) {
        // Ein fortgesetzter Initialscan kann sehr lange laufen. Echte neue
        // Textknoten trotzdem kurzfristig bedienen und anschließend den
        // unterbrochenen TreeWalker regulär fortsetzen.
        const text = this.takeNextReadyMutationTextNode();
        if (text) {
          this.processTextNode(text, false);
          priorityTextMutations += 1;
          continue;
        }
      }
      if (this.activeTraversal) {
        if (this.processTraversalStep(this.activeTraversal)) {
          this.activeTraversal = undefined;
        }
        continue;
      }

      const ready = this.takeNextReadyNode();
      if (ready.node) {
        const traversal = this.createTraversal(ready.node);
        if (traversal) {
          this.activeTraversal = traversal;
        }
        continue;
      }
      nextDelay = ready.delayMs;

      const attribute = this.takeNextPendingAttribute();
      if (attribute) {
        this.processAccessibleAttribute(attribute.element, attribute.attributeName);
        continue;
      }

      break;
    }

    if (this.hasRegularWork()) {
      this.scheduleFlush(nextDelay ?? 0);
    }
  }

  private createTraversal(root: Node): TraversalState | undefined {
    if (!this.isProcessableRoot(root)) {
      return undefined;
    }

    const skipSubtitles = this.options.processSubtitles !== true;
    if (skipSubtitles && isSubtitleContent(root)) {
      return undefined;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      return {
        root,
        walker: undefined,
        skipSubtitles,
        rootProcessed: false
      };
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT,
      skipSubtitles
        ? {
            acceptNode: (node) =>
              node instanceof Element && isSubtitleContainer(node)
                ? nodeFilter.FILTER_REJECT
                : nodeFilter.FILTER_ACCEPT
          }
        : null
    );

    return { root, walker, skipSubtitles, rootProcessed: false };
  }

  private processTraversalStep(state: TraversalState): boolean {
    if (!this.isProcessableRoot(state.root)) {
      return true;
    }

    if (!state.rootProcessed) {
      state.rootProcessed = true;
      if (state.root.nodeType === Node.TEXT_NODE) {
        this.processTextNode(
          state.root as Text,
          state.skipSubtitles ? false : undefined
        );
        return true;
      }
      if (state.root instanceof Element) {
        this.processElement(state.root, false);
      }
      if (!state.walker) {
        return true;
      }
    }

    const currentNode = state.walker?.nextNode();
    if (!currentNode) {
      return true;
    }

    if (currentNode.nodeType === Node.TEXT_NODE) {
      this.processTextNode(
        currentNode as Text,
        state.skipSubtitles ? false : undefined
      );
    } else if (currentNode instanceof Element) {
      this.processElement(currentNode, false);
    }
    return false;
  }

  private takeNextReadyMutationTextNode(): Text | undefined {
    for (const node of this.pendingNodes) {
      if (node.nodeType !== Node.TEXT_NODE) {
        continue;
      }
      if (!this.isProcessableRoot(node)) {
        this.pendingNodes.delete(node);
        continue;
      }
      const text = node as Text;
      if (this.getBackoffRemaining(text) > 0) {
        continue;
      }
      // Ein ebenfalls vorgemerkter Elternknoten ist kein Ausschlussgrund:
      // Der laufende TreeWalker kann diesen Text bereits passiert haben.
      // Eine spätere Elternverarbeitung erkennt die gespeicherte Änderung.
      this.pendingNodes.delete(node);
      return text;
    }
    return undefined;
  }

  private takeNextReadyNode(): {
    readonly node?: Node;
    readonly delayMs?: number;
  } {
    const now = this.now();
    let minimumDelay: number | undefined;

    for (const node of this.pendingNodes) {
      if (!this.isProcessableRoot(node)) {
        this.pendingNodes.delete(node);
        continue;
      }

      if (this.hasPendingAncestor(node, this.pendingNodes)) {
        this.pendingNodes.delete(node);
        continue;
      }

      const delay =
        node.nodeType === Node.TEXT_NODE
          ? this.getBackoffRemaining(node as Text, now)
          : 0;
      if (delay <= 0) {
        this.pendingNodes.delete(node);
        return { node };
      }
      minimumDelay = Math.min(minimumDelay ?? delay, delay);
    }

    return minimumDelay === undefined ? {} : { delayMs: minimumDelay };
  }

  private takeNextPendingAttribute():
    | { readonly element: Element; readonly attributeName: string }
    | undefined {
    for (const [element, names] of this.pendingAttributes) {
      const iterator = names.values();
      const attributeName = iterator.next().value as string | undefined;
      if (!attributeName) {
        this.pendingAttributes.delete(element);
        continue;
      }
      names.delete(attributeName);
      if (names.size === 0) {
        this.pendingAttributes.delete(element);
      }
      return { element, attributeName };
    }
    return undefined;
  }

  private hasRegularWork(): boolean {
    return Boolean(
      this.activeTraversal ||
        this.pendingNodes.size > 0 ||
        this.pendingAttributes.size > 0
    );
  }

  private scheduleSubtitleFlush(): void {
    if (this.subtitleFlushHandle !== undefined) {
      return;
    }

    const view = this.document.defaultView;
    if (view && typeof view.requestAnimationFrame === "function") {
      this.subtitleFlushUsesAnimationFrame = true;
      this.subtitleFlushHandle = view.requestAnimationFrame(() => {
        this.subtitleFlushHandle = undefined;
        this.subtitleFlushUsesAnimationFrame = false;
        this.flushSubtitleNodes(true);
      });
      return;
    }

    this.subtitleFlushUsesAnimationFrame = false;
    this.subtitleFlushHandle = view?.setTimeout(() => {
      this.subtitleFlushHandle = undefined;
      this.flushSubtitleNodes(true);
    }, 16) ?? window.setTimeout(() => {
      this.subtitleFlushHandle = undefined;
      this.flushSubtitleNodes(true);
    }, 16);
  }

  private cancelSubtitleFlush(): void {
    if (this.subtitleFlushHandle === undefined) {
      return;
    }

    const view = this.document.defaultView;
    if (this.subtitleFlushUsesAnimationFrame) {
      view?.cancelAnimationFrame(this.subtitleFlushHandle);
    } else {
      view?.clearTimeout(this.subtitleFlushHandle);
    }

    this.subtitleFlushHandle = undefined;
    this.subtitleFlushUsesAnimationFrame = false;
  }

  private handleMutationRecords(records: readonly MutationRecord[]): void {
    // Im Observer-Batch ist der finale DOM-Zustand bereits sichtbar.
    // Gemeinsame Inline-Bereiche nur einmal statt pro Mutation traversieren.
    const invalidatedInlineRoots = new Set<Node>();
    for (const record of records) {
      if (record.type === "characterData") {
        const node = record.target as Text;
        const tracked = this.textChanges.get(node);
        if (tracked && node.data === tracked.transformed) {
          continue;
        }
        if (tracked) {
          this.noteExternalTextRewrite(node);
        }
        this.queue(node);
        this.invalidateFollowingContext(node);
        this.invalidatePrecedingParticipleContext(node);
        this.invalidateInlineProtectionAround(node, invalidatedInlineRoots);
        continue;
      }

      if (record.type === "attributes") {
        if (record.target instanceof Element && record.attributeName) {
          if (subtitleClassificationAttributeSet.has(record.attributeName)) {
            const previous = this.attributeChanges
              .get(record.target)?.get(record.attributeName);
            if (
              previous &&
              record.target.getAttribute(record.attributeName) === previous.transformed
            ) {
              continue;
            }
            const relevant = isSubtitleContent(record.target) ||
              matchesSubtitleMarker(record.attributeName, record.oldValue);
            if (relevant) {
              if (
                this.options.processSubtitles !== true &&
                isSubtitleContent(record.target)
              ) {
                // Bei erstmaligem Captionstatus eigene Altänderungen restaurieren.
                this.forgetRoot(record.target);
              } else {
                this.queue(record.target);
              }
              this.invalidateInlineProtectionAround(record.target, invalidatedInlineRoots);
              continue;
            }
            if (record.attributeName !== "aria-label") {
              continue;
            }
          }
          if (protectionAttributeNames.has(record.attributeName)) {
            // Schutzstatuswechsel betreffen ganze Unterbäume.
            this.queue(record.target);
            this.invalidatePrecedingParticipleContext(record.target);
            this.invalidateInlineProtectionAround(record.target, invalidatedInlineRoots);
            continue;
          }
          const tracked = this.attributeChanges
            .get(record.target)
            ?.get(record.attributeName);
          if (
            tracked &&
            record.target.getAttribute(record.attributeName) === tracked.transformed
          ) {
            continue;
          }
          this.queueAttribute(record.target, record.attributeName);
        }
        continue;
      }

      // Das Ersetzen genau eines unzitierten Textknotens ändert weder
      // die Quote-Paarung noch explizite Schutzbegriffe. Der neue Knoten
      // wird bereits einzeln eingereiht; ein voller Inline-Rescan entfällt.
      const simpleTextSwap = this.isSimpleInlineTextSwap(record);
      for (const removedNode of record.removedNodes) {
        // Ein innerhalb des Dokuments verschobener Knoten bleibt verfolgt.
        // Andernfalls gingen sein Original und sein Korrekturzähler verloren.
        if (removedNode.isConnected && removedNode.getRootNode({ composed: true }) === this.document) {
          continue;
        }
        this.forgetRoot(removedNode);
      }
      for (const addedNode of record.addedNodes) {
        this.queue(addedNode);
      }
      if (record.target.isConnected) {
        this.invalidatePrecedingParticipleContext(record.target, record.previousSibling);
        // Bei DOM-Insertionen und Entfernen des linken Präfixes
        // kann die nächste Inline-Node ihren grammatischen Kasus ändern.
        this.invalidateFollowingContext(record.target, record.nextSibling);
        if (!simpleTextSwap) {
          this.invalidateInlineProtectionAround(record.target, invalidatedInlineRoots);
        }
      }
    }
  }

  private processElement(element: Element, processShadowNow: boolean): void {
    if (this.options.processAccessibleAttributes !== false) {
      this.processAccessibleAttributes(element);
    }

    const shadowRoot = element.shadowRoot;
    if (!shadowRoot) {
      return;
    }

    this.observeShadowRoot(shadowRoot);
    if (processShadowNow) {
      this.processRoot(shadowRoot);
    } else {
      this.queue(shadowRoot);
    }
  }

  // Die kontinuierliche Discovery ist asynchron und durch Zeit-/Mengengrenzen
  // begrenzt. Sie ersetzt ausdrücklich keinen Event-Hook in der Page-World.
  private scheduleShadowDiscovery(delayMs: number): void {
    if (!this.running || this.shadowDiscoveryHandle !== undefined) {
      return;
    }
    const callback = (): void => {
      this.shadowDiscoveryHandle = undefined;
      this.discoverLateShadowRoots();
    };
    const view = this.document.defaultView;
    this.shadowDiscoveryHandle = view
      ? view.setTimeout(callback, delayMs)
      : window.setTimeout(callback, delayMs);
  }

  private cancelShadowDiscovery(): void {
    if (this.shadowDiscoveryHandle === undefined) {
      return;
    }
    const view = this.document.defaultView;
    if (view) {
      view.clearTimeout(this.shadowDiscoveryHandle);
    } else {
      window.clearTimeout(this.shadowDiscoveryHandle);
    }
    this.shadowDiscoveryHandle = undefined;
  }

  private syncDesignModeTransition(): void {
    if (!this.running) {
      return;
    }
    const isOn = this.document.designMode?.toLowerCase() === "on";
    if (isOn === this.observedDesignModeOn) {
      return;
    }

    this.observedDesignModeOn = isOn;
    if (isOn) {
      // Vor dem Bearbeiten keine eigene Korrektur im Dokument belassen.
      // beforeinput bleibt der sofortige Schutz bei Benutzereingaben.
      this.restoreAll();
    } else {
      // Beim Wechsel auf "off" fehlt ein DOM- oder Eingabeereignis.
      // Einmalig den Dokumentinhalt zur zeitbudgetierten Prüfung einreihen.
      const root = this.document.body ?? this.document.documentElement;
      if (root) {
        this.queue(root);
      }
    }
  }

  private discoverLateShadowRoots(): void {
    if (!this.running) {
      return;
    }