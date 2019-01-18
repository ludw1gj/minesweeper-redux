import {
  Coordinate,
  isValidCoordinateWithinGrid,
  createCoordinate
} from './coordinate';
import { Cell, createWaterCell } from './cell';

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
  const _cells = !cells ? create2DArray<Cell>(height, width) : cells;
  // TODO: add check for num mines
  return {
    height,
    width,
    numCells,
    numMines,
    cells: _cells,
    previousCellsState: null
  };
};

// TODO: remove this func remove create2dArray too
/** Fill the board with dummy cells . */
export const createEmptyCellMatrix = (
  height: number,
  width: number
): Matrix<Cell> => {
  const matrix = createMatrix<Cell>(height, width, 0);

  for (let y = 0; y < matrix.height; y++) {
    for (let x = 0; x < matrix.width; x++) {
      const coordinate = createCoordinate(x, y);
      const dummyCell = createWaterCell(coordinate, false, false, 0);
      setCell(matrix, coordinate, dummyCell);
    }
  }
  return matrix;
};

/** Create a 2D array. */
const create2DArray = <T>(rows: number, columns: number): T[][] => {
  const arr = new Array(rows);
  for (let y = 0; y < rows; y++) {
    const row = new Array(columns);
    arr[y] = row;
  }
  return arr;
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
  // TODO: create whole new matrix
  const cells = matrix.cells.map((row, yIndex) => {
    const newRow = row.map((cell, xIndex) => {
      if (yIndex === coor.y && xIndex === coor.x) {
        return newCell;
      }
      return { ...cell };
    });
    return newRow;
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
