import { some, uniq } from 'lodash';

import { DIRECTIONS } from './directions';

// TYPES

class CreateCoordinateError extends Error {}

export interface Coordinate {
  readonly x: number;
  readonly y: number;
}

// CREATORS

export const createCoordinate = (x: number, y: number) => {
  if (x % 1 !== 0 || y % 1 !== 0) {
    console.warn(new CreateCoordinateError(`x and/or y is not a whole number, x: ${x} y: ${y}`));
  }
  if (x < 0 || y < 0) {
    console.warn(new CreateCoordinateError(`x and/or y cannot be a negative number, x: ${x} y: ${y}`));
  }
  return { x, y };
};

// ACTION CREATORS

/** Create a random co-ordinate within the given height and width. */
export const genRandomCoordinate = (height: number, width: number): Coordinate => {
  return createCoordinate(Math.floor(Math.random() * width), Math.floor(Math.random() * height));
};

// TODO: this returns nothing!
export const genMineCoordinates = (
  seedCoor: Coordinate,
  height: number,
  width: number,
  numMines: number
): Coordinate[] => {
  const getRandomMineCoor = () => {
    let randCor = genRandomCoordinate(height, width);
    while (calcDistanceOfTwoCoordinates(seedCoor, randCor) < 2) {
      randCor = genRandomCoordinate(height, width);
    }
    return randCor;
  };

  let arr = <Coordinate[]>[];
  while (arr.length !== numMines) {
    arr.push(getRandomMineCoor());
    arr = uniq(arr);
  }
  return arr;
};

// ACTIONS

/** Check if coordinate of a grid of width and height. */
export const isValidCoordinateWithinGrid = (coordinate: Coordinate, height: number, width: number): boolean => {
  if (coordinate.y < 0 || coordinate.x < 0 || coordinate.y >= height || coordinate.x >= width) {
    return false;
  }
  return true;
};

/** Count the amount of adjacent mines. */
export const countSurroundingMines = (mineCoors: Coordinate[], atCoordinate: Coordinate): number => {
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
const calcDistanceOfTwoCoordinates = (corA: Coordinate, corB: Coordinate): number => {
  const dx = Math.abs(corB.x - corA.x);
  const dy = Math.abs(corB.y - corA.y);

  const min = Math.min(dx, dy);
  const max = Math.max(dx, dy);

  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
};
