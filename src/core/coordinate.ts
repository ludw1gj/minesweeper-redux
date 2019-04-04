import { IllegalParameterError } from "./errors";
import { RAND_NUM_GEN } from "./random";
import { arePositiveIntegers } from "./util";

/** A coordinate of a grid. */
export interface Coordinate {
  readonly x: number;
  readonly y: number;
}

/** Create a coordinate. */
export const createCoordinate = (x: number, y: number) => {
  if (!arePositiveIntegers(x, y)) {
    throw new IllegalParameterError(`x and y must be positive whole numbers, x: ${x} y: ${y}`);
  }
  return { x, y };
};

/** Create a random co-ordinate within the given height and width. */
export const genRandomCoordinate = (height: number, width: number): Coordinate => {
  return createCoordinate(
    Math.floor(RAND_NUM_GEN.generate() * width),
    Math.floor(RAND_NUM_GEN.generate() * height),
  );
};

/** Calculate the distance (the amount of steps) between two coordinates. */
export const calcDistanceOfTwoCoordinates = (corA: Coordinate, corB: Coordinate): number => {
  const dx = Math.abs(corB.x - corA.x);
  const dy = Math.abs(corB.y - corA.y);

  const min = Math.min(dx, dy);
  const max = Math.max(dx, dy);

  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
};

/** Check if coordinate is valid in a grid of the given width and height. */
export const isValidCoordinate = (coor: Coordinate, height: number, width: number): boolean =>
  coor.y >= 0 && coor.x >= 0 && coor.y < height && coor.x < width;

/** Check if given coordinates are equal. */
export const coordinatesAreEqual = (coorA: Coordinate, coorB: Coordinate): boolean =>
  coorA.y === coorB.y && coorA.x === coorB.x;

/** Check if given array contains given coordinate. */
export const hasCoordinate = (coorArr: Coordinate[], coor: Coordinate): boolean =>
  coorArr.find(val => coordinatesAreEqual(val, coor)) !== undefined;
