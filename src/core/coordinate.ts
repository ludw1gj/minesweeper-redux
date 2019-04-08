import { IllegalParameterError } from "./errors";
import { RAND_NUM_GEN } from "./random";
import { arePositiveIntegers } from "./util";

/** A coordinate of a grid. */
export interface ICoordinate {
  readonly x: number;
  readonly y: number;
}

export class Coordinate {
  public static create(x: number, y: number): ICoordinate {
    if (!arePositiveIntegers(x, y)) {
      throw new IllegalParameterError(`x and y must be positive whole numbers, x: ${x} y: ${y}`);
    }
    return { x, y };
  }

  /** Create a random co-ordinate within the given height and width. */
  public static generateRandom(height: number, width: number): ICoordinate {
    return Coordinate.create(
      Math.floor(RAND_NUM_GEN.generate() * width),
      Math.floor(RAND_NUM_GEN.generate() * height),
    );
  }

  /** Find the distance (the amount of steps) between two coordinates. */
  public static findDistance(coorA: ICoordinate, coorB: ICoordinate): number {
    const dx = Math.abs(coorB.x - coorA.x);
    const dy = Math.abs(coorB.y - coorA.y);

    const min = Math.min(dx, dy);
    const max = Math.max(dx, dy);

    const diagonalSteps = min;
    const straightSteps = max - min;
    return Math.sqrt(2) * diagonalSteps + straightSteps;
  }

  /** Check if coordinate is valid in a grid of the given width and height. */
  public static isValid(coor: ICoordinate, height: number, width: number): boolean {
    return coor.y >= 0 && coor.x >= 0 && coor.y < height && coor.x < width;
  }

  /** Check if given coordinates are equal. */
  public static areEqual(coorA: ICoordinate, coorB: ICoordinate): boolean {
    return coorA.y === coorB.y && coorA.x === coorB.x;
  }

  /** Check if given array contains given coordinate. */
  public static isContainedIn(coorArr: ICoordinate[], coor: ICoordinate): boolean {
    return coorArr.find(val => Coordinate.areEqual(val, coor)) !== undefined;
  }

  private constructor() {}
}
