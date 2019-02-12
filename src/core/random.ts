import { IllegalParameterError, IllegalStateError } from './errors';

export class RandomNumberGenerator {
  private seed: number | undefined;

  constructor(seed?: number) {
    if (seed === 0) {
      throw new IllegalParameterError('seed cannot be 0');
    }
    if (seed) {
      this.seed = seed;
    }
  }

  public setSeed(seed: number) {
    this.seed = seed;
  }

  public generate = (max?: number, min?: number): number => {
    if (!this.seed) {
      throw new IllegalStateError('seed number must be initialized, use set');
    }

    const _max = max || 1;
    const _min = min || 0;

    this.seed = (this.seed * 9301 + 49297) % 233280;
    const rnd = this.seed / 233280;

    return _min + rnd * (_max - _min);
  };
}

export const RAND_NUM_GEN = new RandomNumberGenerator();
