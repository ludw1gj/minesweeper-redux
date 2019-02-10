import { some, uniq } from 'lodash';

import { DIRECTIONS } from './directions';
import { arePositiveIntegers } from './util';

// TYPES

/** A coordinate of a grid. */
export interface ICoordinate {
  readonly x: number;
  readonly y: number;
}

// CREATORS

/** Create a coordinate. */
export const createCoordinate = (x: number, y: number) => {
  if (!arePositiveIntegers(x, y)) {
    throw new Error(`x and y must be positive whole numbers, x: ${x} y: ${y}`);
  }
  return { x, y };
};

// ACTION CREATORS

/** Create a random co-ordinate within the given height and width. */
export const genRandomCoordinate = (height: number, width: number): ICoordinate => {
  return createCoordinate(Math.floor(Math.random() * width), Math.floor(Math.random() * height));
};

// TODO: this returns nothing!
/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell of
 * adjacent mines amount of zero, and therefore must not be a mine cell.
 */
export const genMineCoordinates = (
  seedCoor: ICoordinate,
  height: number,
  width: number,
  numMines: number,
): ICoordinate[] => {
  const getRandomMineCoor = () => {
    let randCor = genRandomCoordinate(height, width);
    while (calcDistanceOfTwoCoordinates(seedCoor, randCor) < 2) {
      randCor = genRandomCoordinate(height, width);
    }
    return randCor;
  };

  let arr = [] as ICoordinate[];
  while (arr.length !== numMines) {
    arr.push(getRandomMineCoor());
    arr = uniq(arr);
  }
  return arr;
};

// ACTIONS

/** Check if coordinate is valid in a grid of the given width and height. */
export const isValidCoordinateWithinGrid = (
  coor: ICoordinate,
  height: number,
  width: number,
): boolean => coor.y >= 0 || coor.x >= 0 || coor.y < height || coor.x < width;

/** Count the amount of adjacent mines. */
export const countSurroundingMines = (
  mineCoors: ICoordinate[],
  atCoordinate: ICoordinate,
): number => {
  let counter = 0;
  DIRECTIONS.forEach(dir => {
    const xCor = atCoordinate.x + dir.x;
    const yCor = atCoordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const directionCor = createCoordinate(xCor, yCor);
    // TODO: check this method works in all cases
    if (some(mineCoors, directionCor)) {
      counter++;
    }
  });
  return counter;
};

/** Calculate the distance (the amount of steps) between two coordinates. */
const calcDistanceOfTwoCoordinates = (corA: ICoordinate, corB: ICoordinate): number => {
  const dx = Math.abs(corB.x - corA.x);
  const dy = Math.abs(corB.y - corA.y);

  const min = Math.min(dx, dy);
  const max = Math.max(dx, dy);

  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
};
