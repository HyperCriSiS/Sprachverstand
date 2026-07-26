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
  readonly protectedTerms?: readonly string[];
  readonly processAccessibleAttributes?: boolean;
  readonly onReplacementCountChange?: (count: number) => void;
}

export interface StopOptions {
  readonly restore?: boolean;
}

interface ChangeRecord {
  readonly original: string;
  readonly transformed: string;
  readonly replacements: number;
}

export class DomProcessor {
  private observer: MutationObserver | undefined;
  private readonly pendingNodes = new Set<Node>();
  private readonly pendingAttributes = new Map<Element, Set<string>>();
  private readonly textChanges = new Map<Text, ChangeRecord>();
  private readonly attributeChanges = new Map<
    Element,
    Map<string, ChangeRecord>
  >();
  private flushScheduled = false;
  private countNotificationScheduled = false;
  private running = false;
  private replacementCount = 0;

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

        for (const removedNode of record.removedNodes) {
          this.forgetRoot(removedNode);
        }

        for (const addedNode of record.addedNodes) {
          this.queue(addedNode);
        }
      }
    });

    const observerOptions: MutationObserverInit = {
      childList: true,
      characterData: true,
      subtree: true
    };

    if (this.options.processAccessibleAttributes !== false) {
      observerOptions.attributes = true;
      observerOptions.attributeFilter = [...accessibleAttributeNames];
    }

    this.observer.observe(this.document.documentElement, observerOptions);

    this.scheduleCountNotification();
  }

  public stop(options: StopOptions = {}): void {
    this.running = false;
    this.observer?.disconnect();
    this.observer = undefined;
    this.pendingNodes.clear();
    this.pendingAttributes.clear();
    this.flushScheduled = false;

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

    if (wasRunning) {
      this.start();
    }
  }

  public getReplacementCount(): number {
    return this.replacementCount;
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

    if (
      root instanceof Element &&
      this.options.processAccessibleAttributes !== false
    ) {
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
      } else if (
        currentNode instanceof Element &&
        this.options.processAccessibleAttributes !== false
      ) {
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

    const attributeNames =
      this.pendingAttributes.get(element) ?? new Set<string>();
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
    const tracked = this.textChanges.get(node);
    if (tracked) {
      if (node.data === tracked.transformed) {
        return;
      }

      this.removeTextChange(node, tracked);
    }

    if (!shouldProcessTextNode(node)) {
      return;
    }

    const original = node.data;
    const result = this.transformValue(original);
    if (result.replacements === 0 || result.text === original) {
      return;
    }

    this.textChanges.set(node, {
      original,
      transformed: result.text,
      replacements: result.replacements
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
    const tracked = this.attributeChanges.get(element)?.get(attributeName);
    const value = element.getAttribute(attributeName);

    if (tracked) {
      if (value === tracked.transformed) {
        return;
      }

      this.removeAttributeChange(element, attributeName, tracked);
    }

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

    const changes =
      this.attributeChanges.get(element) ?? new Map<string, ChangeRecord>();
    changes.set(attributeName, {
      original: value,
      transformed: result.text,
      replacements: result.replacements
    });
    this.attributeChanges.set(element, changes);
    this.adjustReplacementCount(result.replacements);
    element.setAttribute(attributeName, result.text);
  }

  private transformValue(input: string) {
    const transformOptions = {
      profile: this.options.profile,
      ...(this.options.disabledRuleIds
        ? { disabledRuleIds: this.options.disabledRuleIds }
        : {}),
      ...(this.options.protectedTerms
        ? { protectedTerms: this.options.protectedTerms }
        : {})
    };

    return transformText(input, this.options.rules, transformOptions);
  }

  private forgetRoot(root: Node): void {
    if (root.nodeType === Node.TEXT_NODE) {
      const node = root as Text;
      const change = this.textChanges.get(node);
      if (change) {
        this.removeTextChange(node, change);
      }
      return;
    }

    if (root instanceof Element) {
      this.removeAllAttributeChanges(root);
    }

    const nodeFilter = this.document.defaultView?.NodeFilter ?? NodeFilter;
    const walker = this.document.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const textNode = currentNode as Text;
        const change = this.textChanges.get(textNode);
        if (change) {
          this.removeTextChange(textNode, change);
        }
      } else if (currentNode instanceof Element) {
        this.removeAllAttributeChanges(currentNode);
      }

      currentNode = walker.nextNode();
    }
  }

  private removeTextChange(node: Text, change: ChangeRecord): void {
    this.textChanges.delete(node);
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
    }

    this.attributeChanges.delete(element);
    this.adjustReplacementCount(-removedReplacements);
  }

  private clearTracking(): void {
    this.textChanges.clear();
    this.attributeChanges.clear();
    this.replacementCount = 0;
    this.scheduleCountNotification();
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
      return;
    }

    this.countNotificationScheduled = true;
    queueMicrotask(() => {
      this.countNotificationScheduled = false;
      this.options.onReplacementCountChange?.(this.replacementCount);
    });
  }
}
