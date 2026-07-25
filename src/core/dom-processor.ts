import type { Rule, RuleProfile } from "./rule";
import { shouldProcessTextNode } from "./text-safety";
import { transformText } from "./transform-text";

export interface DomProcessorOptions {
  readonly rules: readonly Rule[];
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
  readonly onReplacements?: (amount: number) => void;
}

export class DomProcessor {
  private observer: MutationObserver | undefined;
  private readonly pendingNodes = new Set<Node>();
  private flushScheduled = false;
  private running = false;

  public constructor(
    private readonly document: Document,
    private options: DomProcessorOptions
  ) {}

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    const root = this.document.body ?? this.document.documentElement;
    if (root) {
      this.processRoot(root);
    }

    const MutationObserverConstructor =
      this.document.defaultView?.MutationObserver ?? MutationObserver;

    this.observer = new MutationObserverConstructor((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          this.queue(record.target);
          continue;
        }

        for (const addedNode of record.addedNodes) {
          this.queue(addedNode);
        }
      }
    });

    this.observer.observe(this.document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  public stop(): void {
    this.running = false;
    this.observer?.disconnect();
    this.observer = undefined;
    this.pendingNodes.clear();
    this.flushScheduled = false;
  }

  public updateOptions(options: DomProcessorOptions): void {
    this.options = options;

    if (this.running) {
      const root = this.document.body ?? this.document.documentElement;
      if (root) {
        this.queue(root);
      }
    }
  }

  public flush(): void {
    if (!this.running) {
      return;
    }

    this.flushScheduled = false;
    const nodes = [...this.pendingNodes];
    this.pendingNodes.clear();

    for (const node of nodes) {
      this.processRoot(node);
    }
  }

  public processRoot(root: Node): void {
    if (!this.running) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      this.processTextNode(root as Text);
      return;
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      this.processTextNode(currentNode as Text);
      currentNode = walker.nextNode();
    }
  }

  private queue(node: Node): void {
    if (!this.running) {
      return;
    }

    this.pendingNodes.add(node);

    if (this.flushScheduled) {
      return;
    }

    this.flushScheduled = true;
    queueMicrotask(() => this.flush());
  }

  private processTextNode(node: Text): void {
    if (!shouldProcessTextNode(node)) {
      return;
    }

    const transformOptions = this.options.disabledRuleIds
      ? {
          profile: this.options.profile,
          disabledRuleIds: this.options.disabledRuleIds
        }
      : { profile: this.options.profile };

    const result = transformText(
      node.data,
      this.options.rules,
      transformOptions
    );

    if (result.replacements === 0 || result.text === node.data) {
      return;
    }

    node.data = result.text;
    this.options.onReplacements?.(result.replacements);
  }
}
