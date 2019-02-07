import { some, uniq } from 'lodash';

import { DIRECTIONS } from './directions';
import { getCell } from './cells';
import { Cell } from './cells';

class CreateCoordinateError extends Error {}

export class Coordinate {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    if (x % 1 !== 0 || y % 1 !== 0) {
      console.warn(new CreateCoordinateError(`x and/or y is not a whole number, x: ${x} y: ${y}`));
    }
    if (x < 0 || y < 0) {
      console.warn(new CreateCoordinateError(`x and/or y cannot be a negative number, x: ${x} y: ${y}`));
    }
    this.x = x;
    this.y = y;
  }

  /** Create a random co-ordinate within the given height and width. */
  public static generateRandom = (height: number, width: number): Coordinate => {
    return new Coordinate(Math.floor(Math.random() * width), Math.floor(Math.random() * height));
  };

  /** Calculate the distance (the amount of steps) between two coordinates. */
  public static calcDistance = (corA: Coordinate, corB: Coordinate): number => {
    const dx = Math.abs(corB.x - corA.x);
    const dy = Math.abs(corB.y - corA.y);

    const min = Math.min(dx, dy);
    const max = Math.max(dx, dy);

    const diagonalSteps = min;
    const straightSteps = max - min;
    return Math.sqrt(2) * diagonalSteps + straightSteps;
  };

  /** Check if coordinate of a grid of width and height. */
  public isValidWithinGrid = (height: number, width: number): boolean => {
    if (this.y < 0 || this.x < 0 || this.y >= height || this.x >= width) {
      return false;
    }
    return true;
  };
}

// TODO: this returns nothing!
export const genMineCoordinates = (
  seedCoor: Coordinate,
  height: number,
  width: number,
  numMines: number
): Coordinate[] => {
  const getRandomMineCoor = () => {
    let randCor = Coordinate.generateRandom(height, width);
    while (Coordinate.calcDistance(seedCoor, randCor) < 2) {
      randCor = Coordinate.generateRandom(height, width);
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

/** Count the amount of adjacent mines. */
export const countSurroundingMines = (mineCoors: Coordinate[], atCoordinate: Coordinate): number => {
  let counter = 0;
  DIRECTIONS.forEach(dir => {
    const xCor = atCoordinate.x + dir.x;
    const yCor = atCoordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const directionCor = new Coordinate(xCor, yCor);
    // TODO: check this method works in all cases
    if (some(mineCoors, directionCor)) {
      counter++;
    }
  });
  return counter;
};

/** Find if the cell of a given co-ordinate is a mine cell. */
export const isCoordinateMine = (cells: Cell[][], coordinate: Coordinate): boolean => {
  const cell = getCell(cells, coordinate);
  if (!cell) {
    return false;
  }
  return cell.isMine;
};
