import { IllegalParameterError } from '../util/errors';
import { RAND_NUM_GEN } from '../util/random';
import { arePositiveIntegers } from './util';

/** A coordinate of a grid. */
export class Coordinate {
  /** Create a random co-ordinate within the given height and width. */
  public static genRandom = (height: number, width: number): Coordinate => {
    return new Coordinate(
      Math.floor(RAND_NUM_GEN.generate() * width),
      Math.floor(RAND_NUM_GEN.generate() * height),
    );
  };

  public readonly x: number;
  public readonly y: number;

  /** Create a coordinate. */
  constructor(x: number, y: number) {
    if (!arePositiveIntegers(x, y)) {
      throw new IllegalParameterError(`x and y must be positive whole numbers, x: ${x} y: ${y}`);
    }
    this.x = x;
    this.y = y;
  }

  /** Calculate the distance (the amount of steps) between two coordinates. */
  public calcDistance = (coor: Coordinate): number => {
    const dx = Math.abs(coor.x - this.x);
    const dy = Math.abs(coor.y - this.y);

    const min = Math.min(dx, dy);
    const max = Math.max(dx, dy);

    const diagonalSteps = min;
    const straightSteps = max - min;
    return Math.sqrt(2) * diagonalSteps + straightSteps;
  };

  /** Check if coordinate is valid in a grid of the given width and height. */
  public isValid = (height: number, width: number): boolean =>
    this.y >= 0 && this.x >= 0 && this.y < height && this.x < width;

  /** Check if given coordinates are equal. */
  public isEqual = (coor: Coordinate): boolean => this.y === coor.y && this.x === coor.x;

  /** Check if given array contains coordinate. */
  public isIncluded = (coorArr: Coordinate[]): boolean =>
    coorArr.find(coor => this.isEqual(coor)) !== undefined;
}
