/** First-entry access for pending work without rescanning deleted Map slots. */
export class PendingMap<K extends object, V> extends Map<K, V> {
  private cursor: MapIterator<K> | undefined;
  private current: K | undefined;

  public peek(): [K, V] | undefined {
    if (this.current === undefined) {
      this.cursor ??= this.keys();
      const next = this.cursor.next();
      if (next.done) {
        this.cursor = undefined;
        return undefined;
      }
      this.current = next.value;
    }
    // Updating a still-pending key must expose the latest work, not a cached value.
    return [this.current, this.get(this.current)!];
  }

  public override delete(key: K): boolean {
    const deleted = super.delete(key);
    if (key === this.current) this.current = undefined;
    if (this.size === 0) this.cursor = undefined;
    return deleted;
  }

  public override clear(): void {
    super.clear();
    this.current = undefined;
    this.cursor = undefined;
  }
}
