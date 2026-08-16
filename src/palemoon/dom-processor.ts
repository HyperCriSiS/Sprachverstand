import {
  DomProcessor,
  type DomProcessorOptions,
  type StopOptions
} from "../core/dom-processor";

const incrementalInitialScanElementThreshold = 1_500;
const initialScanTimeBudgetMs = 4;

type DomProcessorInternals = {
  processAccessibleAttributes(element: Element): void;
};

export class PaleMoonDomProcessor extends DomProcessor {
  private initialScanIntercepted = false;
  private initialScanActive = false;
  private initialScanHandle: number | undefined;
  private initialScanWalker: TreeWalker | undefined;
  private initialScanRoot: Node | undefined;
  private initialScanRootAttributesPending = false;

  public constructor(
    private readonly paleMoonDocument: Document,
    options: DomProcessorOptions
  ) {
    super(paleMoonDocument, options);
  }

  public processRoot(root: Node): void {
    if (!this.initialScanIntercepted && this.shouldProcessIncrementally(root)) {
      this.initialScanIntercepted = true;
      this.startIncrementalInitialScan(root);
      return;
    }

    super.processRoot(root);
  }

  public stop(options: StopOptions = {}): void {
    this.cancelIncrementalInitialScan();
    super.stop(options);
  }

  private shouldProcessIncrementally(root: Node): boolean {
    return (
      root instanceof Element &&
      root.getElementsByTagName("*").length >=
        incrementalInitialScanElementThreshold
    );
  }

  private startIncrementalInitialScan(root: Node): void {
    this.cancelIncrementalInitialScan();
    this.initialScanActive = true;
    this.initialScanRoot = root;
    this.initialScanRootAttributesPending = root instanceof Element;

    const nodeFilter =
      this.paleMoonDocument.defaultView?.NodeFilter ?? NodeFilter;
    this.initialScanWalker = this.paleMoonDocument.createTreeWalker(
      root,
      nodeFilter.SHOW_TEXT | nodeFilter.SHOW_ELEMENT
    );

    this.scheduleInitialScanChunk();
  }

  private scheduleInitialScanChunk(): void {
    if (!this.initialScanActive || this.initialScanHandle !== undefined) {
      return;
    }

    const view = this.paleMoonDocument.defaultView;
    const callback = () => {
      this.initialScanHandle = undefined;
      this.runInitialScanChunk();
    };

    this.initialScanHandle = view
      ? view.setTimeout(callback, 0)
      : window.setTimeout(callback, 0);
  }

  private runInitialScanChunk(): void {
    if (!this.initialScanActive) {
      return;
    }

    const walker = this.initialScanWalker;
    const root = this.initialScanRoot;
    if (!walker || !root) {
      this.cancelIncrementalInitialScan();
      return;
    }

    const view = this.paleMoonDocument.defaultView;
    const now = () => view?.performance?.now?.() ?? Date.now();
    const deadline = now() + initialScanTimeBudgetMs;

    if (this.initialScanRootAttributesPending && root instanceof Element) {
      this.processElementAttributes(root);
      this.initialScanRootAttributesPending = false;
    }

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        super.processRoot(currentNode);
      } else if (currentNode instanceof Element) {
        this.processElementAttributes(currentNode);
      }

      if (now() >= deadline) {
        this.scheduleInitialScanChunk();
        return;
      }

      currentNode = walker.nextNode();
    }

    this.initialScanActive = false;
    this.initialScanWalker = undefined;
    this.initialScanRoot = undefined;
    this.initialScanRootAttributesPending = false;
  }

  private processElementAttributes(element: Element): void {
    const internals = this as unknown as DomProcessorInternals;
    internals.processAccessibleAttributes(element);
  }

  private cancelIncrementalInitialScan(): void {
    if (this.initialScanHandle !== undefined) {
      const view = this.paleMoonDocument.defaultView;
      if (view) {
        view.clearTimeout(this.initialScanHandle);
      } else {
        window.clearTimeout(this.initialScanHandle);
      }
    }

    this.initialScanHandle = undefined;
    this.initialScanActive = false;
    this.initialScanWalker = undefined;
    this.initialScanRoot = undefined;
    this.initialScanRootAttributesPending = false;
  }
}
