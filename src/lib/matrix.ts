import {
  Coordinate,
  isValidCoordinateWithinGrid,
  createCoordinate
} from './coordinate';
import { Cell, createWaterCell } from './cell';
import { create2DArray } from './util';

export interface Matrix<Cell> {
  readonly height: number;
  readonly width: number;
  readonly numCells: number;
  readonly numMines: number;
  cells: Cell[][];
  previousCellsState: Cell[][] | null;
}

export const createMatrix = <Cell>(
  height: number,
  width: number,
  numMines: number,
  cells?: Cell[][]
): Matrix<Cell> => {
  const numCells = height * width;
  const _cells = cells
    ? cells
    : create2DArray(height, width).map((row, y) =>
        row.map((_, x) =>
          createWaterCell(createCoordinate(y, x), false, false, 0)
        )
      );
  // TODO: add check for num mines
  return {
    height,
    width,
    numCells,
    numMines,
    cells: <Cell[][]>_cells,
    previousCellsState: null
  };
};

/** Calculate the distance (the amount of steps) between two coordinates. */
export const calcDistanceOfTwoCoordinates = (
  corA: Coordinate,
  corB: Coordinate
): number => {
  const dx = Math.abs(corB.x - corA.x);
  const dy = Math.abs(corB.y - corA.y);

  const min = Math.min(dx, dy);
  const max = Math.max(dx, dy);

  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
};

/** Get cell in matrix. */
export const getCell = <T>(matrix: Matrix<T>, coor: Coordinate): T | null => {
  if (!isValidCoordinateWithinGrid(coor, matrix.height, matrix.width)) {
    console.warn('tried to get cell at invalid coordinate');
    return null;
  }
  return matrix.cells[coor.y][coor.x];
};

/** Set cell in matrix. */
export const setCell = (
  matrix: Matrix<Cell>,
  coor: Coordinate,
  newCell: Cell
): Matrix<Cell> => {
  if (!isValidCoordinateWithinGrid(coor, matrix.height, matrix.width)) {
    console.warn('tried to set cell at invalid coordinate');
    return matrix;
  }
  const cells = matrix.cells.map((row, yIndex) => {
    return row.map((cell, xIndex) => {
      if (yIndex === coor.y && xIndex === coor.x) {
        return newCell;
      }
      return { ...cell };
    });
  });

  return { ...matrix, cells };
};

/** Save the current state of the matrix's cells. */
export const saveState = (matrix: Matrix<Cell>): Matrix<Cell> => {
  const previousCellsState = matrix.cells.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...matrix, previousCellsState };
};

/** Load the previous saved state of the matrix's cells. */
export const loadPreviousSavedState = (matrix: Matrix<Cell>): Matrix<Cell> => {
  if (!matrix.previousCellsState) {
    console.warn('tried to load previous state of null');
    return matrix;
  }
  const cells = matrix.previousCellsState.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return {
    ...matrix,
    cells
  };
};
