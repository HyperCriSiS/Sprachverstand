import { isRiskAllowed, type Rule, type RuleProfile } from "./rule";
import {
  accessibleAttributeNames,
  shouldProcessAccessibleAttribute,
  shouldProcessTextNode
} from "./text-safety";
import type { CustomReplacement } from "../settings/defaults";
import {
  isSubtitleContainer,
  isSubtitleContent
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

const regularWorkBudgetMs = 4;
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

export class DomProcessor {
  private observer: MutationObserver | undefined;
  private observerOptions: MutationObserverInit | undefined;
  private observedShadowRoots = new WeakSet<ShadowRoot>();
  private readonly pendingNodes = new Set<Node>();
  private readonly contextDirtyNodes = new Set<Text>();
  private inlineProtectionCache = new WeakMap<Text, readonly InlineProtectionRange[]>();
  private readonly pendingSubtitleTextNodes = new Set<Text>();
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
  private replacementCount = 0;
  private readonly beforeInputHandler = (): void => {
    // Ein reiner Wechsel von designMode löst keine DOM-Mutation aus.
    // Vor der tatsächlichen Eingabe eigene Änderungen zurücknehmen.
    if (this.running && this.document.designMode?.toLowerCase() === "on") {
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
    this.document.addEventListener("beforeinput", this.beforeInputHandler, true);
    this.observedShadowRoots = new WeakSet<ShadowRoot>();
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
      attributeFilter:
        this.options.processAccessibleAttributes !== false
          ? [...accessibleAttributeNames, ...protectionAttributeNames]
          : [...protectionAttributeNames]
    };
    this.observerOptions = observerOptions;
    this.observeMutationTarget(this.document.documentElement);

    const root = this.document.body ?? this.document.documentElement;
    if (root) {
      this.processRoot(root);
    }

    this.scheduleCountNotification();
  }

  public stop(options: StopOptions = {}): void {
    this.running = false;
    this.document.removeEventListener("beforeinput", this.beforeInputHandler, true);
    this.observer?.disconnect();
    this.observer = undefined;
    this.observerOptions = undefined;
    this.cancelRegularFlush();
    this.activeTraversal = undefined;
    this.pendingNodes.clear();
    this.contextDirtyNodes.clear();
    this.pendingSubtitleTextNodes.clear();
    this.pendingAttributes.clear();
    this.cancelSubtitleFlush();
    this.subtitleTransformCache.clear();
    this.observedShadowRoots = new WeakSet<ShadowRoot>();
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
        node.data = change.original;
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

  private flushSubtitleNodes(): void {
    if (!this.running) {
      return;
    }

    const nodes = [...this.pendingSubtitleTextNodes];
    this.pendingSubtitleTextNodes.clear();

    for (const node of nodes) {
      if (node.isConnected && isSubtitleContent(node)) {
        this.processTextNode(node, true);
      }
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
    if (root.nodeType === Node.TEXT_NODE) {
      this.pendingSubtitleTextNodes.add(root as Text);
      this.scheduleSubtitleFlush();
      return;
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(root, nodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();
    while (currentNode) {
      this.pendingSubtitleTextNodes.add(currentNode as Text);
      currentNode = walker.nextNode();
    }

    if (this.pendingSubtitleTextNodes.size > 0) {
      this.scheduleSubtitleFlush();
    }
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

    while (this.now() < deadline) {
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
        this.flushSubtitleNodes();
      });
      return;
    }

    this.subtitleFlushUsesAnimationFrame = false;
    this.subtitleFlushHandle = view?.setTimeout(() => {
      this.subtitleFlushHandle = undefined;
      this.flushSubtitleNodes();
    }, 16) ?? window.setTimeout(() => {
      this.subtitleFlushHandle = undefined;
      this.flushSubtitleNodes();
    }, 16);
  }

  private cancelSubtitleFlush(): void {    if (this.subtitleFlushHandle === undefined) {
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
        this.invalidateInlineProtectionAround(node);
        continue;
      }

      if (record.type === "attributes") {
        if (record.target instanceof Element && record.attributeName) {
          if (protectionAttributeNames.has(record.attributeName)) {
            // Schutzstatuswechsel betreffen ganze Unterbäume.
            this.queue(record.target);
            this.invalidateInlineProtectionAround(record.target);
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
        // Bei DOM-Insertionen und Entfernen des linken Präfixes
        // kann die nächste Inline-Node ihren grammatischen Kasus ändern.
        this.invalidateFollowingContext(record.target, record.nextSibling);
        this.invalidateInlineProtectionAround(record.target);
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

  private getBackoffRemaining(node: Text, now = this.now()): number {
    const state = this.textRewriteStates.get(node);
    return state ? Math.max(0, state.backoffUntil - now) : 0;
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
    return this.document.defaultView?.performance.now() ?? performance.now();
  }

  private shouldProtectFollowingParticiple(node: Text, original: string): boolean {
    // Kurzfristiger Schutz für splitierte Adjektiv-Nomen-Gruppen: Ohne
    // vollständigen rechten Kontext keine substantivierende Ersetzung.
    if (
      !/(?<![\p{L}\p{M}])(?:Mitarbeitende|Teilnehmende|Nutzende|Studierende|Forschende|Lehrende|Lesende|Zuhörende|Arbeitnehmende|Arbeitgebende|Dozierende|Fördergebende|Theatermachende)\s*$/iu.test(original)
    ) {
      return false;
    }

    let current: Node | null = node;
    while (current?.parentNode) {
      let sibling = current.nextSibling;
      while (sibling) {
        const context = this.collectSafeContextSibling(sibling);
        if (context === undefined) {
          return false;
        }
        if (context.trim()) {
          return /^\s*[\p{Lu}][\p{Ll}\p{M}-]+/u.test(context);
        }
        sibling = sibling.nextSibling;
      }

      const parent: Node | null = current.parentNode;
      if (parent instanceof Element && blockBoundaryTags.has(parent.tagName)) {
        break;
      }
      current = parent;
    }
    return false;
  }

  private invalidateFollowingContext(
    node: Node,
    immediateNext?: Node | null
  ): void {
    let scanned = 0;

    const processText = (text: Text): boolean => {
      if (!shouldProcessTextNode(text)) {
        return text.data.trim() === "";
      }
      const original = this.textChanges.get(text)?.original ?? text.data;
      if (this.needsLeadingContext(original)) {
        this.contextDirtyNodes.add(text);
        this.queue(text);
      }
      scanned += original.length;
      return scanned < leadingContextLimit;
    };

    const processSibling = (sibling: Node): boolean => {
      if (sibling instanceof Element && blockBoundaryTags.has(sibling.tagName)) {
        return false;
      }
      if (sibling.nodeType === Node.TEXT_NODE) {
        return processText(sibling as Text);
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

  private invalidateInlineProtectionAround(node: Node): void {
    if (!this.requiresInlineProtection()) {
      return;
    }

    const root = findInlineBoundary(node, blockBoundaryTags);
    const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const invalidate = (text: Text): void => {
      this.inlineProtectionCache.delete(text);
      const tracked = this.textChanges.get(text);
      if (tracked && text.data === tracked.transformed) {
        this.contextDirtyNodes.add(text);
      }
    };

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
    const ranges = collectInlineProtection(
      root,
      blockBoundaryTags,
      (text) => text === node
        ? original
        : this.textChanges.get(text)?.original ?? text.data,
      this.options.protectedTerms ?? [],
      this.options.processQuotedText === false
    );
    for (const [text, protectedRanges] of ranges) {
      this.inlineProtectionCache.set(text, protectedRanges);
    }
    return ranges.get(node) ?? [];
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

  private processTextNode(node: Text, subtitleOverride?: boolean): void {
    const contextDirty = this.contextDirtyNodes.delete(node);
    const tracked = this.textChanges.get(node);
    let originalFromContext: string | undefined;
    if (tracked) {
      if (node.data === tracked.transformed) {
        if (
          !shouldProcessTextNode(node) ||
          (this.options.processSubtitles !== true && isSubtitleContent(node))
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

    if (!shouldProcessTextNode(node)) {
      return;
    }

    const subtitle = subtitleOverride ?? isSubtitleContent(node);
    if (subtitle && this.options.processSubtitles !== true) {
      return;
    }

    const original = originalFromContext ?? node.data;
    const leadingContext = !subtitle && this.needsLeadingContext(original)
      ? this.collectLeadingContext(node)
      : undefined;
    const protectedRanges = subtitle
      ? []
      : this.getInlineProtectionRanges(node, original);
    const protectParticiple = !subtitle &&
      this.shouldProtectFollowingParticiple(node, original);
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
    if (result.replacements === 0 || result.text === original) {
      if (originalFromContext !== undefined) {
        node.data = original;
      }
      return;
    }

    this.textChanges.set(node, {
      original,
      transformed: result.text,
      replacements: result.replacements,
      summaries: result.summaries
    });
    this.adjustReplacementCount(result.replacements);
    node.data = result.text;
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