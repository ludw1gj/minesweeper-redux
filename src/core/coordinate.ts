import { IllegalParameterError } from '../util/errors';
import { RAND_NUM_GEN } from '../util/random';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers } from './util';

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

/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell of
 * adjacent mines amount of zero, and therefore must not be a mine cell.
 */
export const genRandMineCoordinates = (
  seedCoor: Coordinate,
  height: number,
  width: number,
  numMines: number,
): Coordinate[] => {
  const getRandomMineCoor = () => {
    let randCoor = genRandomCoordinate(height, width);
    while (calcDistanceOfTwoCoordinates(seedCoor, randCoor) < 2) {
      randCoor = genRandomCoordinate(height, width);
    }
    return randCoor;
  };

  const arr = [] as Coordinate[];
  while (arr.length !== numMines) {
    const randCoor = getRandomMineCoor();
    const count = arr.filter(coor => coor.x === randCoor.x && coor.y === randCoor.y).length;
    if (count === 0) {
      arr.push(randCoor);
    }
  }
  return arr;
};

/** Check if coordinate is valid in a grid of the given width and height. */
export const isValidCoordinate = (coor: Coordinate, height: number, width: number): boolean =>
  coor.y >= 0 && coor.x >= 0 && coor.y < height && coor.x < width;

/** Count the amount of adjacent mines. */
export const countSurroundingMines = (
  mineCoors: Coordinate[],
  atCoordinate: Coordinate,
): number => {
  let counter = 0;
  DIRECTIONS.forEach(dir => {
    const xCor = atCoordinate.x + dir.x;
    const yCor = atCoordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const directionCor = createCoordinate(xCor, yCor);
    if (hasCoordinate(mineCoors, directionCor)) {
      counter++;
    }
  });
  return counter;
};

/** Calculate the distance (the amount of steps) between two coordinates. */
const calcDistanceOfTwoCoordinates = (corA: Coordinate, corB: Coordinate): number => {
  const dx = Math.abs(corB.x - corA.x);
  const dy = Math.abs(corB.y - corA.y);

  const min = Math.min(dx, dy);
  const max = Math.max(dx, dy);

  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
};

/** Checks if given array contains given coordinate. */
export const hasCoordinate = (coorArr: Coordinate[], coor: Coordinate): boolean =>
  coorArr.find(val => val.x === coor.x && val.y === coor.y) !== undefined;
