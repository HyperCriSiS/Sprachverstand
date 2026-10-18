/** A Set whose first pending entry can be read without restarting iteration.
 * A fresh iterator on every dequeue repeatedly scans V8's deleted entries.
 * Normal Set iteration, membership and insertion order remain unchanged.
 */
export class PendingSet<T extends object> extends Set<T> {
  private cursor: SetIterator<T> | undefined;
  private current: T | undefined;

  public peek(): T | undefined {
    if (this.current !== undefined) return this.current;
    this.cursor ??= this.values();
    const next = this.cursor.next();
    if (next.done) {
      this.cursor = undefined;
      return undefined;
    }
    this.current = next.value;
    return next.value;
  }

  public override delete(value: T): boolean {
    const deleted = super.delete(value);
    if (value === this.current) this.current = undefined;
    if (this.size === 0) this.cursor = undefined;
    return deleted;
  }

  public override clear(): void {
    super.clear();
    this.current = undefined;
    this.cursor = undefined;
  }
}
