/** Weighted variety from the first drop; giants must still be earned by merging. */
export function dropWeights(highestTier: number): readonly number[] {
  if (highestTier >= 8) return [15, 23, 25, 19, 12, 6];
  if (highestTier >= 6) return [22, 28, 25, 17, 8];
  if (highestTier >= 4) return [35, 30, 23, 12];
  return [50, 32, 18];
}

export class DropQueue {
  current: number;
  next: number;
  afterNext: number;
  private last = -1;
  private streak = 0;

  constructor(private random: () => number = Math.random) {
    this.current = this.roll(0);
    this.next = this.roll(0);
    this.afterNext = this.roll(0);
  }

  /** Only a successful drop consumes the queue; progress never rerolls a preview. */
  advance(highestTier: number): void {
    this.current = this.next;
    this.next = this.afterNext;
    this.afterNext = this.roll(highestTier);
  }

  /** Keeper swap preserves the materialized third drop and consumes no randomness. */
  swap(): boolean {
    if (this.current === this.next) return false;
    [this.current, this.next] = [this.next, this.current];
    return true;
  }

  private roll(highestTier: number): number {
    const weights = dropWeights(highestTier).map((weight, tier) =>
      this.streak >= 3 && tier === this.last ? 0 : weight);
    let ticket = this.random() * weights.reduce((sum, weight) => sum + weight, 0);
    let picked = weights.length - 1;
    for (let tier = 0; tier < weights.length; tier++) {
      ticket -= weights[tier];
      if (ticket < 0) { picked = tier; break; }
    }
    this.streak = picked === this.last ? this.streak + 1 : 1;
    this.last = picked;
    return picked;
  }
}
