import type { Rule, RuleProfile } from "./rule";
import {
  accessibleAttributeNames,
  shouldProcessAccessibleAttribute,
  shouldProcessTextNode
} from "./text-safety";
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
  private readonly pendingAttributes = new Map<Element, Set<string>>();
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

        if (record.type === "attributes") {
          if (record.target instanceof Element && record.attributeName) {
            this.queueAttribute(record.target, record.attributeName);
          }
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
      attributes: true,
      attributeFilter: [...accessibleAttributeNames],
      subtree: true
    });
  }

  public stop(): void {
    this.running = false;
    this.observer?.disconnect();
    this.observer = undefined;
    this.pendingNodes.clear();
    this.pendingAttributes.clear();
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
    const attributes = [...this.pendingAttributes.entries()];
    this.pendingNodes.clear();
    this.pendingAttributes.clear();

    for (const node of nodes) {
      this.processRoot(node);
    }

    for (const [element, attributeNames] of attributes) {
      for (const attributeName of attributeNames) {
        this.processAccessibleAttribute(element, attributeName);
      }
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

    if (root instanceof Element) {
      this.processAccessibleAttributes(root);
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        this.processTextNode(currentNode as Text);
      } else if (currentNode instanceof Element) {
        this.processAccessibleAttributes(currentNode);
      }

      currentNode = walker.nextNode();
    }
  }

  private queue(node: Node): void {
    if (!this.running) {
      return;
    }

    this.pendingNodes.add(node);
    this.scheduleFlush();
  }

  private queueAttribute(element: Element, attributeName: string): void {
    if (!this.running) {
      return;
    }

    const attributeNames = this.pendingAttributes.get(element) ?? new Set<string>();
    attributeNames.add(attributeName);
    this.pendingAttributes.set(element, attributeNames);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
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

    const result = this.transformValue(node.data);
    if (result.replacements === 0 || result.text === node.data) {
      return;
    }

    node.data = result.text;
    this.options.onReplacements?.(result.replacements);
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
    const value = element.getAttribute(attributeName);
    if (
      value === null ||
      !shouldProcessAccessibleAttribute(element, attributeName, value)
    ) {
      return;
    }

    const result = this.transformValue(value);
    if (result.replacements === 0 || result.text === value) {
      return;
    }

    element.setAttribute(attributeName, result.text);
    this.options.onReplacements?.(result.replacements);
  }

  private transformValue(input: string) {
    const transformOptions = this.options.disabledRuleIds
      ? {
          profile: this.options.profile,
          disabledRuleIds: this.options.disabledRuleIds
        }
      : { profile: this.options.profile };

    return transformText(input, this.options.rules, transformOptions);
  }
}
