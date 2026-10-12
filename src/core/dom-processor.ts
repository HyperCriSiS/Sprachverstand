import { isRiskAllowed, type Rule, type RuleProfile } from "./rule";
import {
  accessibleAttributeNames,
  shouldProcessAccessibleAttribute,
  shouldProcessTextNode as textNodeIsProcessable,
  isProtectedTextSubtree,
  isProbablyTechnicalText,
  hasTextNodeProtection as textNodeIsProtected
} from "./text-safety";
import type { CustomReplacement } from "../settings/defaults";
import {
  isSubtitleContainer,
  isSubtitleContent as nodeIsSubtitleContent,
  matchesSubtitleMarker,
  subtitleClassifierAttributeNames
} from "./subtitles";
import { transformTextWithSummary, type TransformOptions, type DetailedTransformResult } from "./transform-text";
import {
  collectInlineProtection,
  iterateInlineProtection,
  findInlineBoundary,
  type InlineProtectionRange
} from "./inline-protection";
import {
  replacementSummaryKey,
  compareReplacementSummaries,
  type ReplacementSummaryEntry
} from "./replacement-summary";

export interface DomProcessorOptions {
  readonly isTransformCandidate?: (input: string) => boolean;
  readonly transformText?: (input: string, options: TransformOptions, subtitle?: boolean) => Promise<DetailedTransformResult>;
  readonly transformLargeText?: (input: string, options: TransformOptions) => Promise<DetailedTransformResult>;
  readonly rules: readonly Rule[];
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
  readonly protectedTerms?: readonly string[];
  readonly customReplacements?: readonly CustomReplacement[];
  readonly processAccessibleAttributes?: boolean;
  readonly processQuotedText?: boolean;
  readonly processSubtitles?: boolean;
  readonly replacementNotificationIntervalMs?: number;
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

interface BudgetedRestoration {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly nodes: {node: Text; original: string; expected: string}[];
  readonly attributes: {element: Element; name: string; original: string; expected: string}[];
  handle?: number;
}

interface TextEditPlan {
  readonly original: string;
  readonly initial: string;
  expected: string;
  readonly result: DetailedTransformResult;
  edits: {offset: number; nextOffset: number; previous: string; next: string}[];
  index: number;
  readonly restoring: boolean;
  readonly subtitle: boolean;
  preparing?: {
    readonly before: Iterator<RegExpExecArray>;
    readonly after: Iterator<RegExpExecArray>;
    beforeCursor: number;
    afterCursor: number;
  };
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
// Time may be coarse or jump past a deadline before the first work unit.
// Bound units as well as elapsed time, while guaranteeing forward progress.
const maximumRegularStepsPerSlice = 128;
const maximumImmediateInlineProtectionNodes = 2_048;
const minimumPartitionedInlineChildren = 128;
const minimumBudgetedTextEdits = 128;
const maximumImmediateTextEditPreparationChars = 65_536;
const maximumTextEditsPerPartition = 128;
const maximumTextEditPartitionChars = 8_192;
const maximumTextPreparationSteps = 256;
const largeTextTransformThreshold = 8_192;
const maximumConcurrentLargeTransforms = 2;
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
  private budgetedRestoration: BudgetedRestoration | undefined;
  private observer: MutationObserver | undefined;
  private observerOptions: MutationObserverInit | undefined;
  private observedShadowRoots = new WeakSet<ShadowRoot>();
  private shadowDiscoveryWalker: TreeWalker | undefined;
  private shadowDiscoveryDocumentRoot: Element | undefined;
  private shadowDiscoveryHandle: number | undefined;
  private readonly pendingNodes = new Set<Node>();
  private readonly pendingAddedNodeLists = new Set<{root: Node; nodes: NodeList; index: number}>();
  private addedNodeTurn = true;
  private readonly contextDirtyNodes = new Set<Text>();
  private inlineProtectionCache = new WeakMap<Text, readonly InlineProtectionRange[]>();
  private readonly inlineProtectionVersions = new WeakMap<Node, object>();
  private preparedInlineProtection = new WeakMap<Node, {
    ancestry: readonly (readonly [Node, object | undefined])[];
    ranges: Map<Text, readonly InlineProtectionRange[]>;
  }>();
  private readonly pendingInlineProtection = new Map<Node, {
    iterator: ReturnType<typeof iterateInlineProtection>;
    results: Map<Text, readonly InlineProtectionRange[]>;
    ancestry: readonly (readonly [Node, object | undefined])[];
    deferredNodes: Set<Text>;
  }>();
  private leadingContextCache = new WeakMap<Text, {value: string | undefined}>();
  private partitionTemporaryNodes = new WeakSet<Node>();
  private readonly pendingSubtitleTextNodes = new Set<Text>();
  private readonly pendingSubtitleRoots = new Set<Node>();
  private activeSubtitleTraversal:
    | { readonly root: Node; readonly walker: TreeWalker }
    | undefined;
  private readonly pendingAttributes = new Map<Element, Set<string>>();
  private readonly textChanges = new Map<Text, ChangeRecord>();
  private readonly pendingTextTransforms = new Map<Text, {original: string; expected: string}>();
  private readonly queuedLargeTransforms = new Map<Text, () => Promise<void>>();
  private readonly queuedSmallTransforms = new Map<Text, () => Promise<void>>();
  private readonly queuedSubtitleTransforms = new Map<Text, () => Promise<void>>();
  private activeLargeTransforms = 0;
  private activeSmallTransforms = 0;
  private asyncGeneration = 0;
  private readonly pendingTransformResults = new Map<object, () => void>();
  private readonly pendingSubtitleTransformResults = new Map<object, () => void>();
  private readonly pendingAttributeTransforms = new Map<Element, Map<string, {value: string}>>();
  private readonly transformRetryHandles = new Set<number>();
  private activeTextEditSlice: ReadonlySet<Text> | undefined;
  private readonly pendingTextEdits = new Map<Text, TextEditPlan>();
  private readonly summaryCounts = new Map<string, ReplacementSummaryEntry>();
  private readonly attributeChanges = new Map<
    Element,
    Map<string, ChangeRecord>
  >();
  private flushHandle: number | undefined;
  private flushTaskSequence = 0;
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
  private countNotificationHandle: number | undefined;
  private running = false;
  private textSafetyScope: {
    partitions: Map<Element, Text>;
    protection: WeakMap<Element, boolean>;
    subtitles: WeakMap<Element, boolean>;
  } | undefined;
  private observedDesignModeOn = false;
  private replacementCount = 0;
  private readonly beforeInputHandler = (): void => {
    // Ein reiner Wechsel von designMode löst keine DOM-Mutation aus.
    // Vor der tatsächlichen Eingabe eigene Änderungen zurücknehmen.
    if ((this.running || this.budgetedRestoration) && this.document.designMode?.toLowerCase() === "on") {
      this.observedDesignModeOn = true;
      this.restoreAll();
    }
  };

  private readonly clock: Performance;

  public constructor(
    private readonly document: Document,
    private options: DomProcessorOptions
  ) {
    this.clock = document.defaultView?.performance ?? performance;
  }

  private withTextSafetyScope(work: () => void): void {
    const nested = Boolean(this.textSafetyScope);
    const scope = this.textSafetyScope ??= {
      partitions: new Map(), protection: new WeakMap(), subtitles: new WeakMap()
    };
    try {work();} finally {
      if (!nested) {
        for (const [boundary, suffix] of scope.partitions) {
          if (suffix.parentNode === boundary && suffix.data === "") suffix.remove();
        }
        this.textSafetyScope = undefined;
      }
    }
  }

  private shouldProcessTextNode(node: Text): boolean {
    return textNodeIsProcessable(node, this.textSafetyScope?.protection);
  }

  private hasTextNodeProtection(node: Text): boolean {
    return textNodeIsProtected(node, this.textSafetyScope?.protection);
  }

  private isSubtitleContent(node: Node): boolean {
    return nodeIsSubtitleContent(node, this.textSafetyScope?.subtitles);
  }

  private setAttributeValue(element: Element, name: string, value: string): void {
    // Own accessible writes can change caption classification, and custom
    // element reactions can synchronously change protection elsewhere.
    if (this.textSafetyScope) {
      this.textSafetyScope.protection = new WeakMap();
      this.textSafetyScope.subtitles = new WeakMap();
    }
    element.setAttribute(name, value);
  }

  private cancelAsyncWork(): void {
    this.pendingAddedNodeLists.clear();
    this.addedNodeTurn = true;
    this.pendingInlineProtection.clear();
    this.preparedInlineProtection = new WeakMap();
    this.inlineProtectionCache = new WeakMap();
    this.asyncGeneration += 1;
    this.activeSmallTransforms = 0;
    this.activeLargeTransforms = 0;
    const view = this.document.defaultView;
    for (const handle of this.transformRetryHandles) {
      if (view) view.clearTimeout(handle); else window.clearTimeout(handle);
    }
    this.transformRetryHandles.clear();
    this.queuedSmallTransforms.clear();
    this.queuedSubtitleTransforms.clear();
    this.pendingTransformResults.clear();
    this.pendingSubtitleTransformResults.clear();
    this.pendingAttributeTransforms.clear();
  }

  private retryTransform(work: () => void): void {
    const view = this.document.defaultView;
    let handle = 0;
    const callback = (): void => {
      this.transformRetryHandles.delete(handle);
      if (this.running) work();
    };
    handle = view ? view.setTimeout(callback, 1_000) : window.setTimeout(callback, 1_000);
    this.transformRetryHandles.add(handle);
  }

  private queueTransformResult(token: object, work: () => void, subtitle = false): void {
    if (!this.running) return;
    if (subtitle) {
      this.pendingSubtitleTransformResults.set(token, work);
      this.scheduleSubtitleFlush();
    } else {
      this.pendingTransformResults.set(token, work);
      this.scheduleFlush();
    }
  }

  private processTransformResult(results: Map<object, () => void>): boolean {
    const first = results.entries().next().value;
    if (!first) return false;
    const [token, work] = first;
    results.delete(token); work(); return true;
  }

  public start(): void {
    if (this.budgetedRestoration) this.runBudgetedRestoration(this.budgetedRestoration, true);
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
    this.leadingContextCache = new WeakMap<Text, {value: string | undefined}>();
    this.partitionTemporaryNodes = new WeakSet<Node>();

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
    if (this.budgetedRestoration) this.runBudgetedRestoration(this.budgetedRestoration, true);
    this.running = false;
    this.cancelAsyncWork();
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
    this.partitionTemporaryNodes = new WeakSet<Node>();

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

  public stopBudgeted(): Promise<void> {
    return this.beginBudgetedRestoration(false);
  }

  private beginBudgetedRestoration(keepRunning: boolean): Promise<void> {
    if (this.budgetedRestoration) {
      const restoration = this.budgetedRestoration;
      if (!keepRunning && this.running) {
        for (const [node, pending] of this.pendingTextEdits) restoration.nodes.push(
          {node, original: pending.original, expected: pending.expected});
        this.budgetedRestoration = undefined;
        this.stop({restore: false});
        this.budgetedRestoration = restoration;
        this.document.addEventListener("beforeinput", this.beforeInputHandler, true);
      }
      return restoration.promise;
    }
    const originals = new Map<Text, {original: string; expected: string}>();
    for (const [node, change] of this.textChanges) originals.set(node,
      {original: change.original, expected: change.transformed});
    for (const [node, pending] of this.pendingTextTransforms) originals.set(node, pending);
    for (const [node, pending] of this.pendingTextEdits) originals.set(node,
      {original: pending.original, expected: pending.expected});
    const nodes = [...originals].map(([node, change]) => ({node, ...change}));
    const attributes = [...this.attributeChanges].flatMap(([element, changes]) =>
      [...changes].map(([name, change]) => ({element, name,
        original: change.original, expected: change.transformed})));
    if (keepRunning) {
      this.cancelRegularFlush();
      this.cancelSubtitleFlush();
      this.clearTracking();
    } else this.stop({restore: false});
    let resolve!: () => void;
    const promise = new Promise<void>(yes => {resolve = yes;});
    const restoration: BudgetedRestoration = {promise, resolve, nodes, attributes};
    this.budgetedRestoration = restoration;
    this.document.addEventListener("beforeinput", this.beforeInputHandler, true);
    this.runBudgetedRestoration(restoration);
    return promise;
  }

  private runBudgetedRestoration(restoration: BudgetedRestoration, synchronous = false): void {
    if (this.budgetedRestoration !== restoration) return;
    const view = this.document.defaultView ?? window;
    if (restoration.handle !== undefined) {
      view.clearTimeout(restoration.handle);
      delete restoration.handle;
    }
    const deadline = synchronous ? Infinity : this.now() + regularWorkBudgetMs;
    const validated = new Set<Text>();
    let editTurn = true;
    let steps = 0;
    while (synchronous || (steps < maximumRegularStepsPerSlice &&
      (this.now() < deadline || steps === 0))) {
      steps++;
      if (this.pendingTextEdits.size > 0 && (editTurn ||
          (restoration.nodes.length === 0 && restoration.attributes.length === 0))) {
        this.processPendingTextEdit(validated);
        editTurn = false;
        continue;
      }
      editTurn = true;
      const entry = restoration.nodes.pop();
      if (entry) {
        if (entry.node.data === entry.expected && !this.deferTextEdits(entry.node,
          entry.original, {text: entry.original, replacements: 0, summaries: []}, true)) {
          this.replaceTextKeepingRanges(entry.node, entry.original);
        }
        continue;
      }
      const attribute = restoration.attributes.pop();
      if (attribute) {
        if (attribute.element.getAttribute(attribute.name) === attribute.expected) {
          this.setAttributeValue(attribute.element, attribute.name, attribute.original);
        }
        continue;
      }
      break;
    }
    this.updateExpectedTextEdits(validated);
    if (this.pendingTextEdits.size > 0 || restoration.nodes.length > 0 ||
        restoration.attributes.length > 0) {
      restoration.handle = view.setTimeout(() => this.runBudgetedRestoration(restoration), 0);
    } else {
      this.budgetedRestoration = undefined;
      if (this.running) {
        this.scheduleFlush();
        if (this.pendingSubtitleTextNodes.size > 0 || this.pendingSubtitleRoots.size > 0)
          this.scheduleSubtitleFlush();
      } else this.document.removeEventListener("beforeinput", this.beforeInputHandler, true);
      restoration.resolve();
    }
  }

  public getReplacementCount(): number {
    return this.replacementCount;
  }

  public getReplacementSummary(): ReplacementSummaryEntry[] {
    return [...this.summaryCounts.values()].map(entry => ({...entry}))
      .sort(compareReplacementSummaries);
  }

  public restoreAll(): void {
    this.cancelAsyncWork();
    if (this.budgetedRestoration) this.runBudgetedRestoration(this.budgetedRestoration, true);
    for (const [node, pending] of this.pendingTextTransforms) {
      if (node.data === pending.expected) this.replaceTextKeepingRanges(node, pending.original);
    }
    this.pendingTextTransforms.clear();
    this.queuedLargeTransforms.clear();
    for (const [node, pending] of this.pendingTextEdits) {
      if (node.data === pending.expected) this.replaceTextKeepingRanges(node, pending.original);
    }
    this.pendingTextEdits.clear();
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
          this.setAttributeValue(element, attributeName, change.original);
        }
      }
    }

    this.clearTracking();
  }

  public flush(): void {
    this.syncDesignModeTransition();
    if (this.budgetedRestoration) this.runBudgetedRestoration(this.budgetedRestoration, true);
    this.cancelRegularFlush();
    this.flushRegularNodesSynchronously();
    this.cancelSubtitleFlush();
    this.flushSubtitleNodes();
  }

  private flushRegularNodesSynchronously(): void {
    if (!this.running) {
      return;
    }
    while (this.processAddedNodeStep()) { /* Explicit synchronous flush. */ }
    while (this.processInlineProtectionStep()) { /* Explicit synchronous flush. */ }
    while (this.processTransformResult(this.pendingTransformResults)) { /* Explicit flush. */ }
    const awaiting = this.options.transformText ? [] : [...this.pendingTextTransforms.entries()];
    if (!this.options.transformText) {
      this.pendingTextTransforms.clear();
      this.queuedLargeTransforms.clear();
    }
    for (const [node, pending] of awaiting) {
      if (node.data === pending.expected) this.replaceTextKeepingRanges(node, pending.original);
    }
    const validatedEdits = new Set<Text>();
    this.activeTextEditSlice = validatedEdits;
    while (this.pendingTextEdits.size > 0) this.processPendingTextEdit(validatedEdits);
    this.activeTextEditSlice = undefined;

    const roots = [
      ...awaiting.map(([node]) => node),
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
    this.withTextSafetyScope(() => this.flushSubtitleNodesScoped(budgeted));
  }

  private flushSubtitleNodesScoped(budgeted: boolean): void {
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
      if (this.processTransformResult(this.pendingSubtitleTransformResults)) {
        steps += 1;
        continue;
      }
      const node = this.pendingSubtitleTextNodes.values().next().value;
      if (node) {
        this.pendingSubtitleTextNodes.delete(node);
        steps += 1;
        if (node.isConnected && this.isSubtitleContent(node)) {
          this.processTextNode(node, true, budgeted);
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
      } else if (next.isConnected && this.isSubtitleContent(next)) {
        this.processTextNode(next, true, budgeted);
      }
    }

    if (
      budgeted &&
      (this.pendingSubtitleTextNodes.size > 0 ||
        this.pendingSubtitleTransformResults.size > 0 ||
        this.pendingSubtitleRoots.size > 0 ||
        this.activeSubtitleTraversal)
    ) {
      this.scheduleSubtitleFlush();
    }
  }

  public processRoot(root: Node): void {
    this.withTextSafetyScope(() => this.processRootScoped(root));
  }

  private processRootScoped(root: Node): void {
    if (!this.running || !this.isProcessableRoot(root)) {
      return;
    }

    const skipSubtitles = this.options.processSubtitles !== true;
    if (skipSubtitles && this.isSubtitleContent(root)) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      this.processTextNode(root as Text);
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
          undefined
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

    // A plain neutral leaf has no text, attribute or current shadow work.
    // Keep tracked/in-flight text eligible so moves and partial edits retain
    // their restoration and invalidation behavior. Later mutations are observed.
    if (node instanceof Element && !node.hasAttributes() && !node.shadowRoot) {
      const child = node.firstChild;
      if (child?.nodeType === Node.TEXT_NODE && child === node.lastChild) {
        const text = child as Text;
        if (!this.isTransformCandidate(text.data) && !this.textChanges.has(text) &&
            !this.pendingTextTransforms.has(text) && !this.pendingTextEdits.has(text)) return;
      }
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
      if (!tracked && !this.pendingTextTransforms.has(textNode) &&
          !this.pendingTextEdits.has(textNode) && !this.isTransformCandidate(textNode.data)) {
        return;
      }
    }

    if (this.isSubtitleContent(node)) {
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
    if (!this.running || this.budgetedRestoration) {
      return;
    }

    // Immediate work has the earliest deadline regardless of the current
    // clock. A mutation burst can queue many nodes into the same task.
    const dueAt = delayMs > 0 ? this.now() + delayMs : 0;
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
    const scheduler = (view as (Window & {scheduler?: {
      postTask: (work: () => void, options: {priority: "background"}) => Promise<unknown>;
    }}) | null)?.scheduler;
    if (this.options.transformText && delayMs <= 0 && scheduler?.postTask) {
      // Background-priority tasks let rendering/input run first, without the
      // minimum delay imposed on repeatedly nested timers. Delayed backoff
      // and browsers without the API keep the timer path below.
      const sequence = ++this.flushTaskSequence;
      this.flushHandle = -1;
      void scheduler.postTask(() => {
        if (this.flushHandle === -1 && this.flushTaskSequence === sequence) callback();
      }, {priority: "background"});
      return;
    }
    this.flushHandle = view
      ? view.setTimeout(callback, Math.max(0, delayMs))
      : window.setTimeout(callback, Math.max(0, delayMs));
  }

  private cancelRegularFlush(): void {
    this.flushTaskSequence += 1;
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
    this.withTextSafetyScope(() => this.flushRegularNodesSlice());
  }

  private flushRegularNodesSlice(): void {
    if (!this.running) {
      return;
    }

    const deadline = this.now() + (this.options.transformText ? 1 : regularWorkBudgetMs);
    let nextDelay: number | undefined;
    let editTurn = true;
    let addedTurn = this.addedNodeTurn;
    let nodeWorkDeferred = false;
    const validatedEdits = new Set<Text>();
    this.activeTextEditSlice = validatedEdits;
    let steps = 0;
    while (steps < maximumRegularStepsPerSlice &&
      (this.now() < deadline || steps === 0)) {
      steps++;
      if (this.processTransformResult(this.pendingTransformResults)) continue;
      if (this.processInlineProtectionStep()) continue;
      if (this.pendingTextEdits.size > 0 && (editTurn ||
          nodeWorkDeferred || (!this.activeTraversal && this.pendingNodes.size === 0))) {
        this.processPendingTextEdit(validatedEdits);
        editTurn = false;
        continue;
      }
      editTurn = true;
      if (this.pendingAddedNodeLists.size > 0 && (addedTurn ||
          (!this.activeTraversal && this.pendingNodes.size === 0))) {
        this.processAddedNodeStep();
        addedTurn = false;
        continue;
      }
      addedTurn = true;
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
      nodeWorkDeferred = true;

      const attribute = this.takeNextPendingAttribute();
      if (attribute) {
        this.processAccessibleAttribute(attribute.element, attribute.attributeName);
        continue;
      }

      if (this.pendingTextEdits.size === 0) {
        if (this.processAddedNodeStep()) continue;
        break;
      }
    }

    this.updateExpectedTextEdits(validatedEdits);
    this.activeTextEditSlice = undefined;
    this.addedNodeTurn = addedTurn;
    if (this.hasRegularWork()) {
      this.scheduleFlush(this.pendingTextEdits.size > 0 || this.pendingAddedNodeLists.size > 0
        ? 0 : nextDelay ?? 0);
    }
  }

  private processAddedNodeStep(): boolean {
    const batch = this.pendingAddedNodeLists.values().next().value;
    if (!batch) return false;
    if (!this.isProcessableRoot(batch.root) || batch.index >= batch.nodes.length) {
      this.pendingAddedNodeLists.delete(batch);
      return true;
    }
    const node = batch.nodes[batch.index++]!;
    if (node.isConnected && node.getRootNode({composed: true}) === this.document) this.queue(node);
    if (batch.index >= batch.nodes.length) this.pendingAddedNodeLists.delete(batch);
    return true;
  }

  private updateExpectedTextEdits(validatedEdits: ReadonlySet<Text>): void {
    for (const node of validatedEdits) {
      const pending = this.pendingTextEdits.get(node);
      if (!pending || pending.preparing) continue;
      const firstApplied = pending.edits[pending.index + 1];
      if (firstApplied) pending.expected = pending.initial.slice(0, firstApplied.offset) +
        pending.result.text.slice(firstApplied.nextOffset);
    }
  }

  private createTraversal(root: Node): TraversalState | undefined {
    if (!this.isProcessableRoot(root)) {
      return undefined;
    }

    const skipSubtitles = this.options.processSubtitles !== true;
    if (skipSubtitles && this.isSubtitleContent(root)) {
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
          undefined,
          true
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
        undefined,
        true
      );
    } else if (currentNode instanceof Element) {
      this.processElement(currentNode, false);
    }
    return false;
  }

  private takeNextReadyNode(): {
    readonly node?: Node;
    readonly delayMs?: number;
  } {
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
          ? this.getBackoffRemaining(node as Text)
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
        this.pendingAddedNodeLists.size > 0 ||
        this.pendingInlineProtection.size > 0 ||
        this.pendingTransformResults.size > 0 ||
        this.pendingTextEdits.size > 0 ||
        this.pendingNodes.size > 0 ||
        this.pendingAttributes.size > 0
    );
  }

  private scheduleSubtitleFlush(): void {
    if (!this.running || this.budgetedRestoration || this.subtitleFlushHandle !== undefined) {
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
    this.withTextSafetyScope(() => this.handleMutationRecordsScoped(records));
  }

  private isOnlyTemporaryPartitionMutation(record: MutationRecord): boolean {
    const added = record.addedNodes;
    const removed = record.removedNodes;
    if (added.length + removed.length === 0) return false;
    // Normal child replacements usually fail on the first node. Avoid
    // copying both NodeLists and creating iterators for every record.
    for (let index = 0; index < added.length; index++) {
      if (!this.isTemporaryPartitionNode(added[index]!)) return false;
    }
    for (let index = 0; index < removed.length; index++) {
      if (!this.isTemporaryPartitionNode(removed[index]!)) return false;
    }
    return true;
  }

  private handleMutationRecordsScoped(records: readonly MutationRecord[]): void {
    // Im Observer-Batch ist der finale DOM-Zustand bereits sichtbar.
    // Gemeinsame Inline-Bereiche nur einmal statt pro Mutation traversieren.
    const invalidatedInlineRoots = new Set<Node>();
    const knownOwnWrites = new Map<Text, object>();
    const followingRequests: {node: Node; next?: Node | null}[] = [];
    for (const record of records) {
      if (this.isTemporaryPartitionNode(record.target)) continue;
      if (record.type === "childList" &&
          this.isOnlyTemporaryPartitionMutation(record)) continue;
      if (record.type === "characterData") {
        const node = record.target as Text;
        const pending = this.pendingTextEdits.get(node);
        const tracked = this.textChanges.get(node);
        const knownOwn = knownOwnWrites.get(node);
        if (knownOwn && (knownOwn === pending || knownOwn === tracked)) continue;
        const value = node.data;
        if (pending && value === pending.expected) {
          knownOwnWrites.set(node, pending);
          continue;
        }
        if (tracked && value === tracked.transformed) {
          knownOwnWrites.set(node, tracked);
          continue;
        }
        if (tracked) {
          this.noteExternalTextRewrite(node);
        }
        this.queue(node);
        followingRequests.push({node});
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
            const relevant = this.isSubtitleContent(record.target) ||
              matchesSubtitleMarker(record.attributeName, record.oldValue);
            if (relevant) {
              if (
                this.options.processSubtitles !== true &&
                this.isSubtitleContent(record.target)
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
      const simpleTextSwap = this.requiresInlineProtection() && this.isSimpleInlineTextSwap(record);
      if (simpleTextSwap) {
        this.transferInlineProtectionForSimpleSwap(record, invalidatedInlineRoots);
      }
      const removedNodes = record.removedNodes;
      for (let index = 0; index < removedNodes.length; index++) {
        const removedNode = removedNodes[index]!;
        // Ein innerhalb des Dokuments verschobener Knoten bleibt verfolgt.
        // Andernfalls gingen sein Original und sein Korrekturzähler verloren.
        if (removedNode.isConnected && removedNode.getRootNode({ composed: true }) === this.document) {
          continue;
        }
        this.forgetRoot(removedNode);
      }
      const addedNodes = record.addedNodes;
      if (addedNodes.length > maximumRegularStepsPerSlice) {
        if (this.isSubtitleContent(record.target)) {
          this.queue(record.target);
        } else {
          this.pendingAddedNodeLists.add({root: record.target, nodes: addedNodes, index: 0});
          this.scheduleFlush();
        }
      } else {
        for (let index = 0; index < addedNodes.length; index++) {
          const addedNode = addedNodes[index]!;
          this.queue(addedNode);
        }
      }
      if (record.target.isConnected) {
        this.invalidatePrecedingParticipleContext(record.target, record.previousSibling);
        // Bei DOM-Insertionen und Entfernen des linken Präfixes
        // kann die nächste Inline-Node ihren grammatischen Kasus ändern.
        followingRequests.push({node: record.target, next: record.nextSibling});
        if (!simpleTextSwap) {
          this.invalidateInlineProtectionAround(record.target, invalidatedInlineRoots);
        }
      }
    }
    // All restore/forget operations have now finished. The final readable
    // neighbor state is stable within this batch; overlapping windows need
    // only one protection/candidate check per Text node.
    const followingCache = new Map<Text, {length: number; canContinue: boolean}>();
    const mergeableStarts = new Set(followingRequests.filter(request =>
      request.next == null && (request.node.nodeType === Node.TEXT_NODE ||
        (request.node instanceof Element && !blockBoundaryTags.has(request.node.tagName) &&
          request.node.firstChild === request.node.lastChild &&
          request.node.firstChild?.nodeType === Node.TEXT_NODE))));
    const remainingStarts = new Set([...mergeableStarts].map(request => request.node));
    for (const request of followingRequests) {
      if (mergeableStarts.has(request) && !remainingStarts.delete(request.node)) continue;
      this.invalidateFollowingContext(request.node, request.next, followingCache, remainingStarts);
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
      void this.beginBudgetedRestoration(true);
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

    // Den ohnehin laufenden Discovery-Timer auch für den ereignislosen
    // Dokument-Editormodus nutzen, ohne zusätzliche Polling-Timer.
    this.syncDesignModeTransition();
    const root = this.document.documentElement;
    if (!root) {
      this.shadowDiscoveryWalker = undefined;
      this.shadowDiscoveryDocumentRoot = undefined;
      this.scheduleShadowDiscovery(shadowDiscoveryIntervalMs);
      return;
    }

    // Der TreeWalker wird über einzelne Eventloop-Durchläufe fortgesetzt.
    // Entfernt die Seite seine aktuelle Position, beginnen wir neu.
    if (
      !this.shadowDiscoveryWalker ||
      this.shadowDiscoveryDocumentRoot !== root ||
      !this.shadowDiscoveryWalker.currentNode.isConnected
    ) {
      const filter = this.document.defaultView?.NodeFilter ?? NodeFilter;
      this.shadowDiscoveryWalker = this.document.createTreeWalker(
        root,
        filter.SHOW_ELEMENT
      );
      this.shadowDiscoveryDocumentRoot = root;
    }

    const deadline = this.now() + shadowDiscoveryBudgetMs;
    let inspected = 0;
    while (
      this.running &&
      inspected < shadowDiscoveryBatchSize &&
      (this.now() < deadline || inspected === 0)
    ) {
      const element = this.shadowDiscoveryWalker.nextNode() as Element | null;
      if (!element) {
        this.shadowDiscoveryWalker = undefined;
        this.shadowDiscoveryDocumentRoot = undefined;
        this.scheduleShadowDiscovery(shadowDiscoveryIntervalMs);
        return;
      }

      inspected += 1;
      const shadowRoot = element.shadowRoot;
      if (shadowRoot && !this.observedShadowRoots.has(shadowRoot)) {
        this.observeShadowRoot(shadowRoot);
        this.queue(shadowRoot);
      }
    }
    // Auch auf riesigen Seiten nur kurze Scheiben, statt einen ganzen
    // DOM-Durchlauf im MutationObserver oder am Stück auszuführen.
    this.scheduleShadowDiscovery(shadowDiscoveryYieldMs);
  }
  private observeShadowRoot(root: ShadowRoot): void {
    if (this.observedShadowRoots.has(root)) {
      return;
    }
    this.observedShadowRoots.add(root);
    this.observeMutationTarget(root);
  }

  private observeMutationTarget(target: Node): void {
    if (!this.observer || !this.observerOptions) {
      return;
    }
    this.observer.observe(target, this.observerOptions);
  }

  private noteExternalTextRewrite(node: Text): void {
    const now = this.now();
    const previous = this.textRewriteStates.get(node);
    const state =
      previous && now - previous.windowStartedAt <= frameworkRewriteWindowMs
        ? previous
        : { count: 0, windowStartedAt: now, backoffUntil: 0 };

    state.count += 1;
    if (state.count >= frameworkRewriteThreshold) {
      state.backoffUntil = now + frameworkRewriteCooldownMs;
      state.count = 0;
      state.windowStartedAt = now;
    }
    this.textRewriteStates.set(node, state);
  }

  private getBackoffRemaining(node: Text, now?: number): number {
    const state = this.textRewriteStates.get(node);
    return state?.backoffUntil ? Math.max(0, state.backoffUntil - (now ?? this.now())) : 0;
  }

  private hasPendingAncestor(node: Node, pending: ReadonlySet<Node>): boolean {
    let ancestor = node.parentNode;
    while (ancestor) {
      if (pending.has(ancestor)) {
        return true;
      }
      ancestor = ancestor.parentNode;
    }
    return false;
  }

  private coalesceRoots(nodes: readonly Node[]): Node[] {
    // Jede Node genau einmal berücksichtigen. Die Prüfung läuft nur über
    // DOM-Vorfahren, nicht über sämtliche bereits gesehenen Geschwister.
    const pending = new Set(nodes.filter((node) => this.isProcessableRoot(node)));
    return [...pending].filter((node) => !this.hasPendingAncestor(node, pending));
  }
  private isProcessableRoot(root: Node): boolean {
    if (root instanceof ShadowRoot) {
      return root.host.isConnected;
    }
    return root.isConnected;
  }

  private now(): number {
    return this.clock.now();
  }

  private shouldProtectFollowingParticiple(node: Text, original: string): boolean {
    // Ein links ohne Wortgrenze anliegender Text ist ein Teil desselben Wortes.
    if (
      leadingParticiplePattern.test(original) &&
      /\p{L}$/u.test(this.collectLeadingContext(node, true) ?? "")
    ) {
      return true;
    }
    if (!trailingParticiplePattern.test(original)) {
      return false;
    }

    let current: Node | null = node;
    let following = "";
    while (current?.parentNode && following.length < leadingContextLimit) {
      let sibling = current.nextSibling;
      while (sibling) {
        // Nur lesbare Inline-Texte dürfen den Schutz beeinflussen.
        const context = this.collectSafeContextSibling(sibling, true);
        if (context === undefined) {
          return false;
        }
        following += context;
        // Bei direkt anhängenden Buchstaben die Teilwortkorrektur vermeiden.
        // Beispiel: "Mitarbeitende" + <em>n</em>.
        if (/\p{L}$/u.test(original) && /^\p{L}/u.test(following)) {
          return true;
        }
        if (followingInlineNounPattern.test(following)) {
          return true;
        }
        // Auch "E" + "ltern" über getrennte Inline-Elemente erkennen.
        if (following.trim() && !possibleInlineNounPrefixPattern.test(following)) {
          return false;
        }
        if (following.length >= leadingContextLimit) {
          return false;
        }
        sibling = sibling.nextSibling;
      }
      const parent: Node = current.parentNode;
      if (parent instanceof Element && blockBoundaryTags.has(parent.tagName)) {
        break;
      }
      current = parent;
    }
    return false;
  }

  // Nur den direkt vor der Mutation angrenzenden Inline-Kontext prüfen.
  // So werden alte Entscheidungen neu bewertet, ohne große DOM-Scans.
  private invalidatePrecedingParticipleContext(
    node: Node,
    immediatePrevious?: Node | null
  ): void {
    let visited = 0;
    const inspect = (candidate: Node): boolean => {
      visited += 1;
      if (visited > maximumPreviousInlineNodes) {
        return false;
      }
      if (
        candidate instanceof Element &&
        (blockBoundaryTags.has(candidate.tagName) ||
          isProtectedTextSubtree(candidate))
      ) {
        return false;
      }
      if (candidate.nodeType === Node.TEXT_NODE) {
        const text = candidate as Text;
        const original = this.originalTextValue(text);
        // A nonempty preceding word without a participle ending stops the
        // search whether protected or processable. Avoid classifying it.
        if (text.data.trim() !== "" && original.trim() !== "" &&
            !trailingParticiplePattern.test(original)) return false;
        if (!this.shouldProcessTextNode(text)) {
          return text.data.trim() === "";
        }
        if (trailingParticiplePattern.test(original)) {
          this.contextDirtyNodes.add(text);
          this.queue(text);
        }
        return original.trim() === "";
      }
      for (let index = candidate.childNodes.length - 1; index >= 0; index -= 1) {
        const child = candidate.childNodes[index];
        if (child && !inspect(child)) {
          return false;
        }
      }
      return true;
    };

    let current: Node | null = node;
    let previous: Node | null =
      immediatePrevious === undefined ? current.previousSibling : immediatePrevious;
    while (current?.parentNode && visited < maximumPreviousInlineNodes) {
      while (previous) {
        if (!inspect(previous)) {
          return;
        }
        previous = previous.previousSibling;
      }
      const parent: Node = current.parentNode;
      if (parent instanceof Element && blockBoundaryTags.has(parent.tagName)) {
        return;
      }
      current = parent;
      previous = current.previousSibling;
    }
  }

  private invalidateFollowingContext(
    node: Node,
    immediateNext?: Node | null,
    cache?: Map<Text, {length: number; canContinue: boolean}>,
    remainingStarts?: Set<Node>
  ): void {
    let scanned = 0;

    const processText = (text: Text): boolean => {
      const cached = cache?.get(text);
      if (cached) {
        scanned += cached.length;
        if (cached.canContinue && remainingStarts?.delete(text)) scanned = 0;
        return cached.canContinue && scanned < leadingContextLimit;
      }
      if (!this.shouldProcessTextNode(text)) {
        const whitespace = text.data.trim() === "";
        const length = whitespace ? text.length : 0;
        cache?.set(text, {length, canContinue: whitespace});
        scanned += length;
        return whitespace && scanned < leadingContextLimit;
      }
      const original = this.originalTextValue(text);
      if (this.needsLeadingContext(original)) {
        const previousContext = this.leadingContextCache.get(text);
        const tracked = this.textChanges.get(text);
        const unchangedWhitespaceContext = previousContext && tracked &&
          text.data === tracked.transformed &&
          this.leadingContextRequiresTrailingWhitespace(original) &&
          this.collectLeadingContext(text, false, true) === previousContext.value;
        if (!unchangedWhitespaceContext) {
          this.contextDirtyNodes.add(text);
          this.queue(text);
        }
      }
      scanned += original.length;
      cache?.set(text, {length: original.length, canContinue: true});
      // A later mutation starts its own window AFTER this node. Absorb that
      // window here, extending the union instead of walking the overlap again.
      if (remainingStarts?.delete(text)) scanned = 0;
      return scanned < leadingContextLimit;
    };

    const processSibling = (sibling: Node): boolean => {
      if (sibling instanceof Element && blockBoundaryTags.has(sibling.tagName)) {
        return false;
      }
      if (sibling.nodeType === Node.TEXT_NODE) {
        return processText(sibling as Text);
      }
      // The common dynamic span has exactly one Text child. Its protection
      // is checked by processText; constructing a walker adds no information.
      if (sibling.firstChild === sibling.lastChild &&
          sibling.firstChild?.nodeType === Node.TEXT_NODE) {
        const continues = processText(sibling.firstChild as Text);
        if (cache?.get(sibling.firstChild as Text)?.canContinue && remainingStarts?.delete(sibling)) {
          scanned = 0;
          return true;
        }
        return continues;
      }
      const walker = this.document.createTreeWalker(
        sibling,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
      );
      let current = walker.nextNode();
      while (current) {
        if (
          current instanceof Element &&
          blockBoundaryTags.has(current.tagName)
        ) {
          return false;
        }
        if (current.nodeType === Node.TEXT_NODE && !processText(current as Text)) {
          return false;
        }
        current = walker.nextNode();
      }
      return true;
    };

    let current: Node | null = node;
    let next: Node | null = immediateNext ?? current.nextSibling;
    while (current?.parentNode && scanned < leadingContextLimit) {
      while (next) {
        if (!processSibling(next)) {
          return;
        }
        next = next.nextSibling;
      }
      const parent: Node = current.parentNode;
      if (parent instanceof Element && blockBoundaryTags.has(parent.tagName)) {
        return;
      }
      current = parent;
      next = current.nextSibling;
    }
  }


  private requiresInlineProtection(): boolean {
    return this.options.processQuotedText === false ||
      (this.options.protectedTerms?.length ?? 0) > 0;
  }

  private originalTextValue(node: Text): string {
    const pending = this.pendingTextEdits.get(node);
    if (pending && this.activeTextEditSlice?.has(node)) return pending.original;
    const value = node.data;
    if (pending && value === pending.expected) return pending.original;
    const transform = this.pendingTextTransforms.get(node);
    if (transform && value === transform.expected) return transform.original;
    const tracked = this.textChanges.get(node);
    return tracked && value === tracked.transformed ? tracked.original : value;
  }

  private isSimpleInlineTextSwap(record: MutationRecord): boolean {
    if ((this.options.protectedTerms?.length ?? 0) > 0 ||
        record.type !== "childList" ||
        record.removedNodes.length !== 1 ||
        record.addedNodes.length !== 1) {
      return false;
    }
    const removed = record.removedNodes.item(0);
    const added = record.addedNodes.item(0);
    if (removed?.nodeType !== Node.TEXT_NODE ||
        added?.nodeType !== Node.TEXT_NODE) {
      return false;
    }
    const previous = this.originalTextValue(removed as Text);
    const next = (added as Text).data;
    return !inlineQuoteMarkerPattern.test(previous) &&
      !inlineQuoteMarkerPattern.test(next) &&
      isProbablyTechnicalText(previous) === isProbablyTechnicalText(next);
  }

  private transferInlineProtectionForSimpleSwap(
    record: MutationRecord,
    invalidatedRoots: Set<Node>
  ): void {
    if (!this.requiresInlineProtection()) return;
    const removed = record.removedNodes.item(0) as Text;
    const added = record.addedNodes.item(0) as Text;
    const previous = this.originalTextValue(removed);
    const root = findInlineBoundary(added, blockBoundaryTags);
    const prepared = this.getPreparedInlineProtection(root);
    const cached = this.inlineProtectionCache.get(removed) ?? prepared?.get(removed);
    // Equal lengths also preserve the oversized-run safety boundary. With
    // no local quotes or personal terms, protection is either empty or full.
    // Any other change still gets the complete context calculation.
    if (!cached || previous.length !== added.length ||
        invalidatedRoots.has(findInlineBoundary(added, blockBoundaryTags)) ||
        (cached.length > 0 && !(cached.length === 1 &&
          cached[0]!.start === 0 && cached[0]!.end === previous.length))) {
      if (prepared) {
        this.invalidateInlineProtectionAround(added, invalidatedRoots);
      }
      return;
    }
    this.inlineProtectionCache.set(added, cached);
    if (prepared) {prepared.delete(removed); prepared.set(added, cached);}
  }

  private invalidateInlineProtectionAround(
    node: Node,
    invalidatedRoots?: Set<Node>
  ): void {
    if (!this.requiresInlineProtection()) {
      return;
    }

    const root = node instanceof Element && blockBoundaryTags.has(node.tagName)
      ? node : findInlineBoundary(node, blockBoundaryTags);
    if (invalidatedRoots?.has(root)) {
      return;
    }
    // Im nächsten Observer-Batch dieselbe Wurzel erneut invalidieren dürfen.
    invalidatedRoots?.add(root);
    this.pendingInlineProtection.delete(root);
    this.preparedInlineProtection.delete(root);
    this.inlineProtectionVersions.set(root, {});
    const invalidate = (text: Text): void => {
      this.inlineProtectionCache.delete(text);
      const tracked = this.textChanges.get(text);
      const pending = this.pendingTextEdits.get(text);
      const pendingTransform = this.pendingTextTransforms.get(text);
      const value = text.data;
      if ((tracked && value === tracked.transformed) ||
          (pending && value === pending.expected) ||
          (pendingTransform && value === pendingTransform.expected)) {
        this.contextDirtyNodes.add(text);
      }
    };

    const trackedEntries = this.textChanges.size + this.pendingTextEdits.size +
      this.pendingTextTransforms.size;
    if (trackedEntries <= 64) {
      // Cached ranges can include many neutral neighbors. Clearing the weak
      // cache is safe; only the bounded set of tracked originals/replies needs
      // dirty flags. Other boundaries lazily recompute protection when needed.
      this.inlineProtectionCache = new WeakMap();
      const visited = new Set<Text>();
      for (const changes of [this.textChanges, this.pendingTextEdits, this.pendingTextTransforms]) {
        for (const text of changes.keys()) {
          if (visited.has(text)) continue;
          visited.add(text);
          // Match TreeWalker containment: don't enter a nested shadow tree.
          if (root.contains(text)) invalidate(text);
        }
      }
      this.queue(root);
      return;
    }

    const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    if (root.nodeType === Node.TEXT_NODE) {
      invalidate(root as Text);
    }
    let current = walker.nextNode();
    while (current) {
      invalidate(current as Text);
      current = walker.nextNode();
    }
    this.queue(root);
  }

  private getInlineProtectionRanges(
    node: Text,
    original: string
  ): readonly InlineProtectionRange[] {
    if (!this.requiresInlineProtection()) {
      return [];
    }
    const cached = this.inlineProtectionCache.get(node);
    if (cached) {
      return cached;
    }

    const root = findInlineBoundary(node, blockBoundaryTags);
    const prepared = this.getPreparedInlineProtection(root)?.get(node);
    if (prepared) return prepared;
    const ranges = collectInlineProtection(
      root,
      blockBoundaryTags,
      (text) => text === node
        ? original
        : this.originalTextValue(text),
      this.options.protectedTerms ?? [],
      this.options.processQuotedText === false
    );
    for (const [text, protectedRanges] of ranges) {
      this.inlineProtectionCache.set(text, protectedRanges);
    }
    return ranges.get(node) ?? [];
  }

  private deferInlineProtection(node: Text): boolean {
    const root = findInlineBoundary(node, blockBoundaryTags);
    const pending = this.pendingInlineProtection.get(root);
    if (pending) {pending.deferredNodes.add(node); return true;}
    if (this.getPreparedInlineProtection(root)?.has(node)) return false;
    if (this.inlineProtectionCache.has(node)) return false;
    // A capped structural preflight keeps ordinary paragraphs on the
    // synchronous path, without computing a complete large protection map.
    const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let inspected = 0;
    while (inspected < maximumImmediateInlineProtectionNodes && walker.nextNode()) inspected++;
    if (inspected < maximumImmediateInlineProtectionNodes) return false;
    this.pendingInlineProtection.set(root, {iterator: iterateInlineProtection(root, blockBoundaryTags,
      text => this.originalTextValue(text), this.options.protectedTerms ?? [],
      this.options.processQuotedText === false), results: new Map(),
      ancestry: this.inlineProtectionAncestry(root), deferredNodes: new Set([node])});
    this.scheduleFlush();
    return true;
  }

  private processInlineProtectionStep(): boolean {
    const first = this.pendingInlineProtection.entries().next().value;
    if (!first) return false;
    const [root, preparation] = first;
    if (!this.isProcessableRoot(root)) {
      this.pendingInlineProtection.delete(root);
      return true;
    }
    if (!this.validInlineProtectionAncestry(preparation.ancestry)) {
      this.pendingInlineProtection.delete(root);
      this.queue(root);
      return true;
    }
    for (let index = 0; index < 16; index++) {
      const step = preparation.iterator.next();
      if (step.done) {
        this.pendingInlineProtection.delete(root);
        this.preparedInlineProtection.set(root, {ancestry: preparation.ancestry, ranges: preparation.results});
        if (preparation.deferredNodes.size > maximumImmediateInitialNodes) this.queue(root);
        else for (const node of preparation.deferredNodes) this.queue(node);
        break;
      } else if (step.value) {
        preparation.results.set(step.value[0], step.value[1]);
      }
    }
    return true;
  }

  private inlineProtectionAncestry(root: Node): (readonly [Node, object | undefined])[] {
    const ancestry: (readonly [Node, object | undefined])[] = [];
    let current: Node | null = root;
    while (current) {
      ancestry.push([current, this.inlineProtectionVersions.get(current)]);
      current = current.parentNode ?? (current instanceof ShadowRoot ? current.host : null);
    }
    return ancestry;
  }

  private validInlineProtectionAncestry(ancestry: readonly (readonly [Node, object | undefined])[]): boolean {
    for (const [node, version] of ancestry) {
      if (this.inlineProtectionVersions.get(node) !== version) return false;
    }
    return true;
  }

  private getPreparedInlineProtection(root: Node): Map<Text, readonly InlineProtectionRange[]> | undefined {
    const prepared = this.preparedInlineProtection.get(root);
    if (!prepared) return undefined;
    if (this.validInlineProtectionAncestry(prepared.ancestry)) return prepared.ranges;
    this.preparedInlineProtection.delete(root);
    return undefined;
  }

  private transformWithInlineProtection(
    input: string,
    ranges: readonly InlineProtectionRange[],
    leadingContext?: string,
    protectParticiple = false
  ): ReturnType<typeof transformTextWithSummary> {
    let cursor = 0;
    let text = "";
    let replacements = 0;
    const summaries: ReplacementSummaryEntry[] = [];
    const transformSegment = (end: number): void => {
      if (end <= cursor) {
        return;
      }
      const result = this.transformValue(
        input.slice(cursor, end),
        cursor === 0 ? leadingContext : undefined,
        protectParticiple
      );
      text += result.text;
      replacements += result.replacements;
      summaries.push(...result.summaries);
    };

    for (const range of ranges) {
      transformSegment(range.start);
      text += input.slice(range.start, range.end);
      cursor = range.end;
    }
    transformSegment(input.length);
    return { text, replacements, summaries };
  }


  // Ersetzungsbereiche möglichst klein halten, damit DOM-Ranges in
  // unveränderten Präfixen, Suffixen und Wortzwischenräumen bestehen bleiben.
  private replaceTextSegment(
    node: Text,
    offset: number,
    previous: string,
    next: string
  ): void {
    if (previous === next) {
      return;
    }
    let prefix = 0;
    while (
      prefix < previous.length &&
      prefix < next.length &&
      previous[prefix] === next[prefix]
    ) {
      prefix += 1;
    }
    let previousEnd = previous.length;
    let nextEnd = next.length;
    while (
      previousEnd > prefix &&
      nextEnd > prefix &&
      previous[previousEnd - 1] === next[nextEnd - 1]
    ) {
      previousEnd -= 1;
      nextEnd -= 1;
    }
    this.applyLocalTextEdit(
      node,
      offset + prefix,
      previousEnd - prefix,
      next.slice(prefix, nextEnd)
    );
  }

  private applyLocalTextEdit(
    node: Text,
    offset: number,
    count: number,
    value: string
  ): void {
    const parent = node.parentNode;
    if (offset > 0 && node.isConnected && parent instanceof Element &&
        parent.childNodes.length === 1) {
      const boundary = findInlineBoundary(node, blockBoundaryTags);
      const partitions = this.textSafetyScope?.partitions;
      const existing = boundary instanceof Element ? partitions?.get(boundary) : undefined;
      if (boundary instanceof Element &&
          (existing?.parentNode === boundary ||
            boundary.children.item(minimumPartitionedInlineChildren - 1) !== null)) {
        // One temporary final Text per inline boundary invalidates Chromium's
        // eager partial shaping path for the entire synchronous work slice.
        // Every Range stays on its original Text; hundreds of childList
        // records are avoided when many inline nodes change together.
        // childElementCount walks every sibling in Blink. Only the threshold
        // matters here; an existing partition already established eligibility.
        if (partitions) {
          if (!existing || existing.parentNode !== boundary) {
            const suffix = node.ownerDocument.createTextNode("");
            this.partitionTemporaryNodes.add(suffix);
            boundary.appendChild(suffix);
            partitions.set(boundary, suffix);
          }
          node.replaceData(offset, count, value);
          return;
        }
        const suffix = node.ownerDocument.createTextNode("");
        this.partitionTemporaryNodes.add(suffix);
        boundary.appendChild(suffix);
        try {
          node.replaceData(offset, count, value);
        } finally {
          suffix.remove();
        }
        return;
      }
    }
    node.replaceData(offset, count, value);
  }

  private isTemporaryPartitionNode(node: Node): boolean {
    if (!this.partitionTemporaryNodes.has(node)) return false;
    if (node.isConnected) {
      // Page observers may reuse a removed temporary Text node. It then
      // belongs to the page again and must be tracked and restored normally.
      this.partitionTemporaryNodes.delete(node);
      return false;
    }
    return true;
  }

  private replaceTextKeepingRanges(node: Text, next: string): void {
    const previous = node.data;
    if (previous === next) {
      return;
    }

    // Eine einzelne Änderung innerhalb eines Tokens benötigt kein erneutes
    // Zerlegen des kompletten Textes in Wörter. Das lokale replaceData()
    // bewahrt unveränderte Präfix-/Suffixbereiche mitsamt ihren DOM-Ranges.
    // Bei Leerraumänderungen oder mehreren Wortänderungen bleibt der
    // bisherige tokenweise Rückwärts-Algorithmus maßgeblich.
    let prefix = 0;
    while (
      prefix < previous.length &&
      prefix < next.length &&
      previous[prefix] === next[prefix]
    ) {
      prefix += 1;
    }
    let previousEnd = previous.length;
    let nextEnd = next.length;
    while (
      previousEnd > prefix &&
      nextEnd > prefix &&
      previous[previousEnd - 1] === next[nextEnd - 1]
    ) {
      previousEnd -= 1;
      nextEnd -= 1;
    }
    if (
      !/\s/u.test(previous.slice(prefix, previousEnd)) &&
      !/\s/u.test(next.slice(prefix, nextEnd))
    ) {
      this.applyLocalTextEdit(node, prefix, previousEnd - prefix,
        next.slice(prefix, nextEnd));
      return;
    }

    const tokensOf = (value: string) =>
      [...value.matchAll(/\S+/gu)].map((match) => ({
        index: match.index,
        text: match[0]
      }));
    const previousTokens = tokensOf(previous);
    const nextTokens = tokensOf(next);

    if (previousTokens.length > 1 &&
        previousTokens.length === nextTokens.length) {
      // Nur bei identischen Trennstücken sind die Tokenpositionen eindeutig.
      let previousCursor = 0;
      let nextCursor = 0;
      let separatorsUnchanged = true;
      for (let index = 0; index < previousTokens.length; index += 1) {
        const before = previousTokens[index]!;
        const after = nextTokens[index]!;
        if (
          previous.slice(previousCursor, before.index) !==
          next.slice(nextCursor, after.index)
        ) {
          separatorsUnchanged = false;
          break;
        }
        previousCursor = before.index + before.text.length;
        nextCursor = after.index + after.text.length;
      }
      if (
        separatorsUnchanged &&
        previous.slice(previousCursor) === next.slice(nextCursor)
      ) {
        // Rückwärts ersetzen: ältere Offsets bleiben bis zu ihrem Edit gültig.
        for (let index = previousTokens.length - 1; index >= 0; index -= 1) {
          const before = previousTokens[index]!;
          const after = nextTokens[index]!;
          this.replaceTextSegment(node, before.index, before.text, after.text);
        }
        return;
      }
    }
    this.replaceTextSegment(node, 0, previous, next);
  }

  private processTextNode(node: Text, subtitleOverride?: boolean, budgeted = false): void {
    // Preserve dirty flags and tracked originals until the complete context
    // is ready. Partially populated caches must never authorize a correction.
    if (budgeted && this.requiresInlineProtection() && this.shouldProcessTextNode(node) &&
        !this.isSubtitleContent(node) && this.isTransformCandidate(this.originalTextValue(node)) &&
        this.deferInlineProtection(node)) return;
    const contextDirty = this.contextDirtyNodes.delete(node);
    const pendingTransform = this.pendingTextTransforms.get(node);
    if (pendingTransform) {
      if (node.data === pendingTransform.expected && !contextDirty) return;
      this.pendingTextTransforms.delete(node);
      this.queuedLargeTransforms.delete(node);
      this.queuedSmallTransforms.delete(node);
      this.queuedSubtitleTransforms.delete(node);
      if (node.data === pendingTransform.expected &&
          this.restoreText(node, pendingTransform.original, budgeted)) return;
    }
    const pending = this.pendingTextEdits.get(node);
    if (pending) {
      if (node.data === pending.expected && (pending.restoring || !contextDirty)) return;
      this.pendingTextEdits.delete(node);
      if (node.data === pending.expected && this.restoreText(node, pending.original, budgeted)) return;
    }
    const tracked = this.textChanges.get(node);
    let originalFromContext: string | undefined;
    if (tracked) {
      if (node.data === tracked.transformed) {
        if (
          !this.shouldProcessTextNode(node) ||
          (this.options.processSubtitles !== true && this.isSubtitleContent(node))
        ) {
          // Vor einem Editorwechsel nur eigene Änderungen restaurieren.
          this.forgetTrackedText(node);
          return;
        }
        if (!contextDirty) {
          return;
        }
        // Kontextabhängige Regeln werden immer am gespeicherten Original
        // ausgewertet. Bereits flektierte Ausgaben sind keine Eingabe.
        originalFromContext = tracked.original;
        this.removeTextChange(node, tracked);
      } else {
        this.removeTextChange(node, tracked);
      }
    }

    if (!this.shouldProcessTextNode(node)) {
      return;
    }

    const subtitle = subtitleOverride ?? this.isSubtitleContent(node);
    if (subtitle && this.options.processSubtitles !== true) {
      return;
    }

    const original = originalFromContext ?? node.data;
    if (!this.isTransformCandidate(original)) {
      if (originalFromContext !== undefined) this.restoreText(node, original, budgeted);
      return;
    }
    const protectedRanges = subtitle
      ? []
      : this.getInlineProtectionRanges(node, original);
    if (protectedRanges.length === 1 && protectedRanges[0]!.start === 0 &&
        protectedRanges[0]!.end >= original.length) {
      if (originalFromContext !== undefined) this.replaceTextKeepingRanges(node, original);
      return;
    }
    const needsLeadingContext = !subtitle && this.needsLeadingContext(original);
    const leadingContext = needsLeadingContext
      ? this.collectLeadingContext(node, false,
          this.leadingContextRequiresTrailingWhitespace(original))
      : undefined;
    if (needsLeadingContext) this.leadingContextCache.set(node, {value: leadingContext});
    else this.leadingContextCache.delete(node);
    const protectParticiple = !subtitle &&
      this.shouldProtectFollowingParticiple(node, original);
    const cachedSubtitle = subtitle ? this.subtitleTransformCache.get(original) : undefined;
    if (cachedSubtitle) {
      this.finishTextTransform(node, original, originalFromContext !== undefined, cachedSubtitle, budgeted);
      return;
    }
    if (this.options.transformText || (budgeted && (subtitle || !this.requiresInlineProtection()) &&
        original.length >= largeTextTransformThreshold && this.options.transformLargeText)) {
      this.deferTextTransform(node, original, leadingContext, protectParticiple,
        originalFromContext !== undefined, subtitle, protectedRanges);
      return;
    }
    const result = subtitle
      ? this.transformSubtitleValue(original)
      : protectedRanges.length > 0
        ? this.transformWithInlineProtection(
            original,
            protectedRanges,
            leadingContext,
            protectParticiple
          )
        : this.transformValue(original, leadingContext, protectParticiple);
    this.finishTextTransform(node, original, originalFromContext !== undefined, result, budgeted);
  }

  private finishTextTransform(node: Text, original: string, restoreUnchanged: boolean,
    result: DetailedTransformResult, budgeted: boolean): void {
    if (result.replacements === 0 || result.text === original) {
      if (restoreUnchanged) this.restoreText(node, original, budgeted);
      return;
    }

    if (budgeted && this.deferTextEdits(node, original, result)) return;
    this.recordTextResult(node, original, result);
    this.replaceTextKeepingRanges(node, result.text);
  }

  private isTransformCandidate(input: string): boolean {
    return Boolean(this.options.customReplacements?.length) ||
      !this.options.isTransformCandidate || this.options.isTransformCandidate(input);
  }

  private deferTextTransform(node: Text, original: string, leadingContext: string | undefined,
    protectParticiple: boolean, restoreUnchanged: boolean, subtitle: boolean,
    protectedRanges: readonly {start: number; end: number}[] = []): void {
    const asynchronousTransform = this.options.transformText;
    const transform = asynchronousTransform ?? this.options.transformLargeText!;
    const options = {...this.createTransformOptions(leadingContext, protectParticiple),
      ...(protectedRanges.length ? {protectedRanges} : {})};
    const pending = {original, expected: node.data};
    this.pendingTextTransforms.set(node, pending);
    const apply = (resultOf: () => DetailedTransformResult): void => {
      if (!this.running || this.pendingTextTransforms.get(node) !== pending) return;
      this.pendingTextTransforms.delete(node);
      this.queuedLargeTransforms.delete(node);
      this.queuedSmallTransforms.delete(node);
      this.queuedSubtitleTransforms.delete(node);
      if (!node.isConnected || node.data !== pending.expected ||
          this.hasTextNodeProtection(node) || this.contextDirtyNodes.has(node) ||
          this.isSubtitleContent(node) !== subtitle ||
          (this.options.processSubtitles !== true && this.isSubtitleContent(node))) {
        if (node.data === pending.expected) this.restoreText(node, original, true);
        if (node.isConnected) this.queue(node);
        return;
      }
      const result = resultOf();
      // Only a still-valid response from this processor/options generation may
      // populate the caption cache. Bound async entries by input and output size.
      if (subtitle && original.length < largeTextTransformThreshold && result.text.length < largeTextTransformThreshold) {
        this.rememberSubtitleTransform(original, result);
      }
      this.finishTextTransform(node, original, restoreUnchanged, result, true);
    };
    const complete = (resultOf: () => DetailedTransformResult): void => {
      if (this.options.transformText) this.queueTransformResult(pending, () => apply(resultOf), subtitle);
      else apply(resultOf);
    };
    const queue = this.options.transformText && original.length < largeTextTransformThreshold
      ? subtitle ? this.queuedSubtitleTransforms : this.queuedSmallTransforms : this.queuedLargeTransforms;
    queue.set(node, () => {
      if (!this.running || this.pendingTextTransforms.get(node) !== pending) return Promise.resolve();
      if (!node.isConnected || node.data !== pending.expected) {
        complete(() => ({text: original, replacements: 0, summaries: []}));
        return Promise.resolve();
      }
      return Promise.resolve().then(() => asynchronousTransform
        ? asynchronousTransform(original, options, subtitle) : transform(original, options)).then(
        result => complete(() => result),
        () => {
          if (!this.options.transformText) {
            complete(() => original.length <= maximumImmediateTextEditPreparationChars
              ? transformTextWithSummary(original, this.options.rules, options)
              : {text: original, replacements: 0, summaries: []});
          } else {
            this.queueTransformResult(pending, () => {
              if (this.pendingTextTransforms.get(node) !== pending) return;
              this.pendingTextTransforms.delete(node);
              if (node.data === pending.expected) this.restoreText(node, original, true);
              this.retryTransform(() => {if (node.isConnected) this.queue(node);});
            }, subtitle);
          }
        }
      );
    });
    this.dispatchLargeTransforms();
    this.dispatchSmallTransforms();
  }

  private dispatchSmallTransforms(): void {
    while (this.running && this.activeSmallTransforms < 32) {
      const queue = this.queuedSubtitleTransforms.size ? this.queuedSubtitleTransforms : this.queuedSmallTransforms;
      const first = queue.entries().next().value;
      if (!first) return;
      const [node, run] = first;
      queue.delete(node);
      this.activeSmallTransforms += 1;
      const generation = this.asyncGeneration;
      void Promise.resolve().then(run).finally(() => {
        if (this.asyncGeneration !== generation) return;
        this.activeSmallTransforms -= 1;
        this.dispatchSmallTransforms();
      });
    }
  }

  private dispatchLargeTransforms(): void {
    while (this.running && this.activeLargeTransforms < maximumConcurrentLargeTransforms) {
      const first = this.queuedLargeTransforms.entries().next().value;
      if (!first) return;
      const [node, run] = first;
      this.queuedLargeTransforms.delete(node);
      this.activeLargeTransforms += 1;
      const generation = this.asyncGeneration;
      void Promise.resolve().then(run).finally(() => {
        if (this.asyncGeneration !== generation) return;
        this.activeLargeTransforms -= 1;
        this.dispatchLargeTransforms();
      });
    }
  }

  private recordTextResult(node: Text, original: string,
    result: ReturnType<typeof transformTextWithSummary>): void {
    this.textChanges.set(node, {
      original,
      transformed: result.text,
      replacements: result.replacements,
      summaries: result.summaries
    });
    this.adjustReplacementSummary(result.summaries, 1);
    this.adjustReplacementCount(result.replacements);
  }

  private deferTextEdits(node: Text, original: string,
    result: ReturnType<typeof transformTextWithSummary>, restoring = false): boolean {
    const expected = node.data;
    if (expected === result.text) return false;
    if (Math.max(expected.length, result.text.length) > maximumImmediateTextEditPreparationChars) {
      this.pendingTextEdits.set(node, {original, initial: expected, expected, result,
        edits: [], index: -1, restoring, subtitle: this.isSubtitleContent(node), preparing: {
          before: expected.matchAll(/\S+/gu), after: result.text.matchAll(/\S+/gu),
          beforeCursor: 0, afterCursor: 0
        }});
      this.scheduleFlush();
      return true;
    }
    if (expected.length < minimumBudgetedTextEdits * 2) return false;
    const before = [...expected.matchAll(/\S+/gu)];
    if (before.length < minimumBudgetedTextEdits) return false;
    const after = [...result.text.matchAll(/\S+/gu)];
    if (before.length !== after.length ||
        expected.replace(/\S+/gu, "") !== result.text.replace(/\S+/gu, "")) return false;
    const edits = before.flatMap((token, index) => token[0] === after[index]![0]
      ? [] : [{offset: token.index, nextOffset: after[index]!.index,
        previous: token[0], next: after[index]![0]}]);
    if (edits.length < minimumBudgetedTextEdits) return false;
    this.pendingTextEdits.set(node, {original, initial: expected, expected, result, edits,
      index: edits.length - 1, restoring, subtitle: this.isSubtitleContent(node)});
    this.scheduleFlush();
    return true;
  }

  private restoreText(node: Text, original: string, budgeted: boolean): boolean {
    if (budgeted && this.running && this.deferTextEdits(node, original,
      {text: original, replacements: 0, summaries: []}, true)) return true;
    this.replaceTextKeepingRanges(node, original);
    return false;
  }

  private prepareTextEditStep(pending: TextEditPlan): void {
    const preparation = pending.preparing!;
    const before = preparation.before.next(), after = preparation.after.next();
    const aligned = before.done === after.done && (before.done
      ? pending.initial.slice(preparation.beforeCursor) === pending.result.text.slice(preparation.afterCursor)
      : pending.initial.slice(preparation.beforeCursor, before.value!.index) ===
          pending.result.text.slice(preparation.afterCursor, after.value!.index));
    if (!aligned) {
      // Keep the existing fallback for transformations that change token boundaries.
      pending.edits = [{offset: 0, nextOffset: 0, previous: pending.initial, next: pending.result.text}];
    } else if (!before.done && !after.done) {
      if (before.value[0] !== after.value[0]) pending.edits.push({offset: before.value.index,
        nextOffset: after.value.index, previous: before.value[0], next: after.value[0]});
      preparation.beforeCursor = before.value.index + before.value[0].length;
      preparation.afterCursor = after.value.index + after.value[0].length;
      return;
    }
    delete pending.preparing;
    pending.index = pending.edits.length - 1;
  }

  private processPendingTextEdit(validated: Set<Text>): void {
    const first = this.pendingTextEdits.entries().next().value;
    if (!first) return;
    const [node, pending] = first;
    if (!validated.has(node) && (node.data !== pending.expected ||
        (!pending.restoring && (!node.isConnected || this.contextDirtyNodes.has(node) ||
          this.hasTextNodeProtection(node) ||
          this.isSubtitleContent(node) !== pending.subtitle ||
          (this.options.processSubtitles !== true && this.isSubtitleContent(node)))))) {
      this.pendingTextEdits.delete(node);
      if (node.data === pending.expected) this.restoreText(node, pending.original, true);
      if (node.isConnected) this.queue(node);
      return;
    }
    validated.add(node);
    if (pending.preparing) {
      // Rotate plans once per small preparation batch. Creating and mutating
      // a Map iterator for every token is costly, particularly in Gecko.
      const deadline = this.now() + 1;
      for (let index = 0; index < maximumTextPreparationSteps && pending.preparing; index += 1) {
        if (index > 0 && index % 32 === 0 && this.now() >= deadline) break;
        this.prepareTextEditStep(pending);
      }
      this.pendingTextEdits.delete(node);
      this.pendingTextEdits.set(node, pending);
      return;
    }
    if (!this.applyPendingTextBatch(node, pending)) {
      const edit = pending.edits[pending.index]!;
      this.replaceTextSegment(node, edit.offset, edit.previous, edit.next);
      pending.index -= 1;
    }
    if (pending.index < 0) {
      this.pendingTextEdits.delete(node);
      if (pending.restoring) {
        if (node.isConnected) this.queue(node);
      } else this.recordTextResult(node, pending.original, pending.result);
    } else {
      // Round-robin among large texts as well as ordinary traversal work.
      this.pendingTextEdits.delete(node);
      this.pendingTextEdits.set(node, pending);
    }
  }

  private applyPendingTextBatch(node: Text, pending: TextEditPlan): boolean {
    const parent = node.parentElement;
    if (!parent || parent.childNodes.length !== 1 || pending.index < 1 ||
        pending.initial.length <= maximumImmediateTextEditPreparationChars) return false;
    const upper = pending.edits[pending.index]!;
    const end = upper.offset + upper.previous.length;
    let lower = pending.index;
    while (lower > 0 && pending.index - lower + 1 < maximumTextEditsPerPartition &&
        end - pending.edits[lower - 1]!.offset <= maximumTextEditPartitionChars) lower -= 1;
    if (lower === pending.index) return false;
    const start = pending.edits[lower]!.offset;
    const suffix = node.splitText(end);
    this.partitionTemporaryNodes.add(suffix);
    const segment = start > 0 ? node.splitText(start) : node;
    if (segment !== node) this.partitionTemporaryNodes.add(segment);
    try {
      while (pending.index >= lower) {
        const edit = pending.edits[pending.index]!;
        segment.replaceData(edit.offset - start, edit.previous.length, edit.next);
        pending.index -= 1;
      }
    } finally {
      // Never expose partition nodes across tasks. normalize() migrates all
      // live Ranges back to the sole original Text node before observers run.
      parent.normalize();
    }
    return true;
  }

  private processAccessibleAttributes(element: Element): void {
    for (const attributeName of accessibleAttributeNames) {
      this.processAccessibleAttribute(element, attributeName);
    }
  }

  private processAccessibleAttribute(
    element: Element,
    attributeName: string
  ): void {
    if (!element.isConnected) {
      return;
    }

    const value = element.getAttribute(attributeName);
    const tracked = this.attributeChanges.get(element)?.get(attributeName);

    // Das Entfernen eines zuvor ersetzten Attributs invalidiert auch
    // dessen Zähler und Übersicht. Vorher blieb der Record verwaist.
    if (value === null) {
      if (tracked) {
        this.removeAttributeChange(element, attributeName, tracked);
      }
      return;
    }
    if (this.isSubtitleContent(element)) {
      return;
    }

    if (tracked) {
      if (value === tracked.transformed) {
        if (!shouldProcessAccessibleAttribute(element, attributeName, value)) {
          // Geschützte Attribute ebenso wie Text originalgetreu freigeben.
          this.setAttributeValue(element, attributeName, tracked.original);
          this.removeAttributeChange(element, attributeName, tracked);
        }
        return;
      }

      this.removeAttributeChange(element, attributeName, tracked);
    }

    if (
      !shouldProcessAccessibleAttribute(element, attributeName, value)
    ) {
      return;
    }

    if (!this.isTransformCandidate(value)) return;
    if (this.options.transformText) {
      const requests = this.pendingAttributeTransforms.get(element) ?? new Map<string, {value: string}>();
      if (requests.get(attributeName)?.value === value) return;
      const token = {value};
      requests.set(attributeName, token);
      this.pendingAttributeTransforms.set(element, requests);
      void Promise.resolve().then(() => this.options.transformText!(value, this.createTransformOptions())).then(
        result => this.queueTransformResult(token, () => {
          if (this.pendingAttributeTransforms.get(element)?.get(attributeName) !== token) return;
          requests.delete(attributeName);
          if (!requests.size) this.pendingAttributeTransforms.delete(element);
          if (element.isConnected && element.getAttribute(attributeName) === value &&
              !this.isSubtitleContent(element) && shouldProcessAccessibleAttribute(element, attributeName, value)) {
            this.finishAttributeTransform(element, attributeName, value, result);
          }
        }),
        () => this.queueTransformResult(token, () => {
          if (this.pendingAttributeTransforms.get(element)?.get(attributeName) !== token) return;
          requests.delete(attributeName);
          if (!requests.size) this.pendingAttributeTransforms.delete(element);
          this.retryTransform(() => {if (element.isConnected) this.processAccessibleAttribute(element, attributeName);});
        })
      );
      return;
    }
    this.finishAttributeTransform(element, attributeName, value, this.transformValue(value));
  }

  private finishAttributeTransform(element: Element, attributeName: string, value: string,
    result: DetailedTransformResult): void {
    if (result.replacements === 0 || result.text === value) {
      return;
    }

    const changes =
      this.attributeChanges.get(element) ?? new Map<string, ChangeRecord>();
    changes.set(attributeName, {
      original: value,
      transformed: result.text,
      replacements: result.replacements,
      summaries: result.summaries
    });
    this.attributeChanges.set(element, changes);
    this.adjustReplacementSummary(result.summaries, 1);
    this.adjustReplacementCount(result.replacements);
    this.setAttributeValue(element, attributeName, result.text);
  }

  private transformValue(
    input: string,
    leadingContext?: string,
    protectParticiple = false
  ) {
    return transformTextWithSummary(input, this.options.rules,
      this.createTransformOptions(leadingContext, protectParticiple));
  }

  private createTransformOptions(leadingContext?: string,
    protectParticiple = false): TransformOptions {
    const disabledRuleIds = protectParticiple
      ? new Set([
          ...(this.options.disabledRuleIds ?? []),
          "salutation.participial-forms"
        ])
      : this.options.disabledRuleIds;
    return {
      profile: this.options.profile,
      ...(disabledRuleIds
        ? { disabledRuleIds }
        : {}),
      ...(this.options.protectedTerms
        ? { protectedTerms: this.options.protectedTerms }
        : {}),
      ...(this.options.customReplacements
        ? { customReplacements: this.options.customReplacements }
        : {}),
      processQuotedText: this.options.processQuotedText !== false,
      ...(leadingContext ? { leadingContext } : {})
    };

  }

  private transformSubtitleValue(input: string) {
    const cached = this.subtitleTransformCache.get(input);
    if (cached) {
      return cached;
    }

    const result = this.transformValue(input);
    this.rememberSubtitleTransform(input, result);
    return result;
  }

  private rememberSubtitleTransform(input: string, result: DetailedTransformResult): void {
    if (
      !this.subtitleTransformCache.has(input) &&
      this.subtitleTransformCache.size >= maximumSubtitleTransformCacheEntries
    ) {
      const oldestKey = this.subtitleTransformCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.subtitleTransformCache.delete(oldestKey);
      }
    }
    this.subtitleTransformCache.set(input, result);
  }

  private needsLeadingContext(input: string): boolean {
    for (const rule of this.options.rules) {
      if (
        !rule.applyWithLeadingContext ||
        !rule.leadingContextCandidate ||
        this.options.disabledRuleIds?.has(rule.id) ||
        !isRiskAllowed(rule.risk, this.options.profile)
      ) {
        continue;
      }

      rule.leadingContextCandidate.lastIndex = 0;
      if (rule.leadingContextCandidate.test(input)) {
        return true;
      }
    }

    return false;
  }

  // Geschützte oder technische Teilbäume sind keine grammatischen Nachbarn.
  private collectSafeContextSibling(sibling: Node, allowShortFragment = false): string | undefined {
    if (sibling instanceof Element && blockBoundaryTags.has(sibling.tagName)) {
      return undefined;
    }

    const chunks: string[] = [];

    const readText = (text: Text): boolean => {
      if (!this.shouldProcessTextNode(text)) {
        if (text.data.trim() === "") {
          // Auch reine Leerräume sind echte Wortgrenzen. Ihr Weglassen
          // würde nicht zusammengehörige Inline-Fragmente verbinden.
          chunks.push(text.data);
          return true;
        }
        const root = text.getRootNode();
        const parent = text.parentElement ??
          (root instanceof ShadowRoot ? root.host : null);
        if (
          !allowShortFragment ||
          !text.isConnected ||
          !parent ||
          isProtectedTextSubtree(parent) ||
          !/^\p{L}$/u.test(text.data.trim())
        ) {
          return false;
        }
      }
      chunks.push(this.originalTextValue(text));
      return true;
    };

    if (sibling.nodeType === Node.TEXT_NODE) {
      return readText(sibling as Text) ? chunks.join("") : undefined;
    }
    if (sibling.firstChild === sibling.lastChild &&
        sibling.firstChild?.nodeType === Node.TEXT_NODE) {
      return readText(sibling.firstChild as Text) ? chunks.join("") : undefined;
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      sibling,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT
    );

    let current = walker.nextNode();
    while (current) {
      if (
        current instanceof Element &&
        blockBoundaryTags.has(current.tagName)
      ) {
        return undefined;
      }
      if (current.nodeType === Node.TEXT_NODE && !readText(current as Text)) {
        return undefined;
      }
      current = walker.nextNode();
    }

    return chunks.join("");
  }

  private collectLeadingContext(
    node: Text,
    allowShortFragment = false,
    requiresTrailingWhitespace = false
  ): string | undefined {
    const chunks: string[] = [];
    let collectedLength = 0;
    let current: Node | null = node;

    while (current?.parentNode) {
      let sibling = current.previousSibling;
      while (sibling) {
        const text = this.collectSafeContextSibling(sibling, allowShortFragment);
        if (text === undefined) {
          const context = chunks.join("").slice(-leadingContextLimit);
          return context || undefined;
        }
        if (text) {
          if (collectedLength === 0 && requiresTrailingWhitespace &&
              !/\s$/u.test(text)) return undefined;
          chunks.unshift(text);
          collectedLength += text.length;
          if (collectedLength >= leadingContextLimit) {
            return chunks.join("").slice(-leadingContextLimit);
          }
        }
        sibling = sibling.previousSibling;
      }

      const parent: Node | null = current.parentNode;
      if (parent instanceof Element && blockBoundaryTags.has(parent.tagName)) {
        break;
      }
      current = parent;
    }

    const context = chunks.join("").slice(-leadingContextLimit);
    return context || undefined;
  }

  private leadingContextRequiresTrailingWhitespace(input: string): boolean {
    let matched = false;
    for (const rule of this.options.rules) {
      if (!rule.applyWithLeadingContext || !rule.leadingContextCandidate ||
          this.options.disabledRuleIds?.has(rule.id) ||
          !isRiskAllowed(rule.risk, this.options.profile)) continue;
      rule.leadingContextCandidate.lastIndex = 0;
      if (!rule.leadingContextCandidate.test(input)) continue;
      if (rule.leadingContextRequiresTrailingWhitespace !== true) return false;
      matched = true;
    }
    return matched;
  }

  // Beim endgültigen Entfernen eines Teilbaums eigene Textänderungen
  // zurücknehmen. So erhalten Frameworks auch beim asynchronen Recyceln
  // derselben Node den ursprünglichen Wert zurück.
  private forgetTrackedText(node: Text): void {
    const pendingTransform = this.pendingTextTransforms.get(node);
    if (pendingTransform) {
      this.pendingTextTransforms.delete(node);
      this.queuedLargeTransforms.delete(node);
      this.queuedSmallTransforms.delete(node);
      this.queuedSubtitleTransforms.delete(node);
      if (node.data === pendingTransform.expected) this.restoreText(node, pendingTransform.original, true);
    }
    const pending = this.pendingTextEdits.get(node);
    if (pending) {
      this.pendingTextEdits.delete(node);
      if (node.data === pending.expected) this.restoreText(node, pending.original, true);
    }
    const change = this.textChanges.get(node);
    if (!change) {
      return;
    }
    if (node.data === change.transformed) {
      this.restoreText(node, change.original, true);
    }
    this.removeTextChange(node, change);
  }

  private forgetTrackedAttributes(element: Element): void {
    const changes = this.attributeChanges.get(element);
    if (!changes) {
      return;
    }
    for (const [name, change] of changes) {
      if (element.getAttribute(name) === change.transformed) {
        this.setAttributeValue(element, name, change.original);
      }
    }
    this.removeAllAttributeChanges(element);
  }

  private forgetRoot(root: Node): void {
    this.pendingInlineProtection.delete(root);
    this.preparedInlineProtection.delete(root);
    if (root.nodeType === Node.TEXT_NODE) {
      this.forgetTrackedText(root as Text);
      return;
    }

    // With only a few tracked entries, restore those directly instead of
    // walking tens of thousands of neutral descendants. Snapshot the keys:
    // restoration can change the tracking maps while we visit them.
    const trackedEntries = this.textChanges.size + this.attributeChanges.size +
      this.pendingTextTransforms.size + this.pendingTextEdits.size;
    if (trackedEntries <= 64) {
      const trackedNodes = new Set<Node>([
        ...this.textChanges.keys(), ...this.attributeChanges.keys(),
        ...this.pendingTextTransforms.keys(), ...this.pendingTextEdits.keys()
      ]);
      for (const node of trackedNodes) {
        if (!this.isTrackedDescendant(root, node)) continue;
        if (node.nodeType === Node.TEXT_NODE) this.forgetTrackedText(node as Text);
        else if (node instanceof Element) this.forgetTrackedAttributes(node);
      }
      return;
    }

    if (root instanceof Element) {
      this.forgetTrackedAttributes(root);
      if (root.shadowRoot) {
        this.forgetRoot(root.shadowRoot);
      }
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        this.forgetTrackedText(currentNode as Text);
      } else if (currentNode instanceof Element) {
        this.forgetTrackedAttributes(currentNode);
        if (currentNode.shadowRoot) {
          this.forgetRoot(currentNode.shadowRoot);
        }
      }
      currentNode = walker.nextNode();
    }
  }

  private isTrackedDescendant(root: Node, node: Node): boolean {
    let candidate = node;
    while (true) {
      if (root.contains(candidate)) return true;
      const tree = candidate.getRootNode();
      if (!(tree instanceof ShadowRoot)) break;
      candidate = tree.host;
    }
    return false;
  }

  private removeTextChange(node: Text, change: ChangeRecord): void {
    this.textChanges.delete(node);
    this.adjustReplacementSummary(change.summaries, -1);
    this.adjustReplacementCount(-change.replacements);
  }

  private removeAttributeChange(
    element: Element,
    attributeName: string,
    change: ChangeRecord
  ): void {
    const changes = this.attributeChanges.get(element);
    if (!changes) {
      return;
    }

    changes.delete(attributeName);
    this.adjustReplacementSummary(change.summaries, -1);
    if (changes.size === 0) {
      this.attributeChanges.delete(element);
    }
    this.adjustReplacementCount(-change.replacements);
  }

  private removeAllAttributeChanges(element: Element): void {
    const changes = this.attributeChanges.get(element);
    if (!changes) {
      return;
    }

    let removedReplacements = 0;
    for (const change of changes.values()) {
      removedReplacements += change.replacements;
      this.adjustReplacementSummary(change.summaries, -1);
    }

    this.attributeChanges.delete(element);
    this.adjustReplacementCount(-removedReplacements);
  }

  private clearTracking(): void {
    this.cancelAsyncWork();
    this.activeTextEditSlice = undefined;
    this.pendingTextTransforms.clear();
    this.queuedLargeTransforms.clear();
    this.pendingTextEdits.clear();
    this.textChanges.clear();
    this.attributeChanges.clear();
    this.summaryCounts.clear();
    this.replacementCount = 0;
    this.scheduleCountNotification();
  }

  private adjustReplacementSummary(
    summaries: readonly ReplacementSummaryEntry[],
    direction: 1 | -1
  ): void {
    for (const entry of summaries) {
      const key = replacementSummaryKey(entry);
      const count = (this.summaryCounts.get(key)?.count ?? 0) + direction * entry.count;
      if (count <= 0) this.summaryCounts.delete(key);
      else this.summaryCounts.set(key, {...entry, count});
    }
  }

  private adjustReplacementCount(delta: number): void {
    if (delta === 0) {
      return;
    }

    this.replacementCount = Math.max(0, this.replacementCount + delta);
    this.scheduleCountNotification();
  }

  private scheduleCountNotification(): void {
    if (this.countNotificationScheduled) {
      if (this.replacementCount !== 0 || this.countNotificationHandle === undefined) return;
      (this.document.defaultView ?? window).clearTimeout(this.countNotificationHandle);
      this.countNotificationHandle = undefined;
      this.countNotificationScheduled = false;
    }

    this.countNotificationScheduled = true;
    const notify = (): void => {
      this.countNotificationHandle = undefined;
      this.countNotificationScheduled = false;
      this.options.onReplacementCountChange?.(
        this.replacementCount,
        this.getReplacementSummary()
      );
    };
    const interval = this.options.replacementNotificationIntervalMs ?? 0;
    if (this.running && this.replacementCount > 0 && interval > 0 && Number.isFinite(interval)) {
      this.countNotificationHandle = (this.document.defaultView ?? window).setTimeout(notify, interval);
    } else queueMicrotask(notify);
  }
}
