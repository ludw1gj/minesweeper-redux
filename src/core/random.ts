import { IllegalParameterError, IllegalStateError } from './errors';

/** Generates a random number from a seed number. */
export class RandomNumberGenerator {
  /** The seed number. */
  private seed: number | undefined;

  constructor(seed?: number) {
    if (seed === 0) {
      throw new IllegalParameterError('seed cannot be 0');
    }
    if (seed) {
      this.seed = seed;
    }
  }

  /** Set the seed. */
  public setSeed(seed: number) {
    this.seed = seed;
  }

  /** Generate a random number. */
  public generate = (max?: number, min?: number): number => {
    if (!this.seed) {
      throw new IllegalStateError('seed number must be initialized, use set');
    }

    const maxNum = max || 1;
    const minNum = min || 0;

    this.seed = (this.seed * 9301 + 49297) % 233280;
    const rnd = this.seed / 233280;

    return minNum + rnd * (maxNum - minNum);
  };
}

/** A RandomNumberGenerator instance. Seed needs to be set before using generate method. */
export const RAND_NUM_GEN = new RandomNumberGenerator();
