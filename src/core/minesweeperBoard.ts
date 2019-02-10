import { some } from 'lodash';

import {
  createDetonatedMineCell,
  createFlaggedCell,
  createMineCell,
  createUnflaggedCell,
  createWaterCell,
  ICell,
  IMineCell,
  IWaterCell,
} from './cell';
import {
  countSurroundingMines,
  createCoordinate,
  genMineCoordinates,
  ICoordinate,
} from './coordinate';
import {
  getCell,
  Grid,
  makeCellVisible,
  makeEmptyAdjacentCellsVisible,
  makeGridVisible,
  setCell,
} from './grid';
import { create2DArray } from './util';

// TYPES

export interface IMinesweeperBoard {
  readonly height: number;
  readonly width: number;
  readonly numCells: number;
  readonly grid: Grid;
  readonly previousGridState?: Grid;

  readonly numMines: number;
  readonly numFlagged: number;
}

// CREATORS

export const createMinesweeperBoard = (
  height: number,
  width: number,
  numMines: number,
  grid?: Grid,
): IMinesweeperBoard => {
  const numCells = height * width;
  const msGrid = grid
    ? grid
    : create2DArray(height, width).map((row, y) =>
        row.map((_, x) => createWaterCell(createCoordinate(x, y), false, false, 0)),
      );

  return {
    height,
    width,
    numCells,
    grid: msGrid,
    numMines,
    numFlagged: countFlaggedGrid(msGrid),
  };
};

// ACTION CREATORS

/** Fill the grid with mine grid and water grid. A seed coordinate is need as the first cell
 * clicked should be a mine cell.
 */
export const fillBoard = (
  board: IMinesweeperBoard,
  seedCoordinate: ICoordinate,
): IMinesweeperBoard => {
  const mineCoors = genMineCoordinates(seedCoordinate, board.height, board.width, board.numMines);

  const createCellAtCoor = (x: number, y: number): IWaterCell | IMineCell => {
    const coordinate = createCoordinate(x, y);
    if (some(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const grid = board.grid.map((row, y) => row.map((_, x) => createCellAtCoor(x, y)));
  return { ...board, grid };
};

/** Make the cell visible. If cell is a mine cell, returns true otherwise returns false. */
export const makeCellVisibleAtCoordinate = (
  board: IMinesweeperBoard,
  coordinate: ICoordinate,
): { board: IMinesweeperBoard; isMine: boolean } => {
  const cell = getCell(board.grid, coordinate);
  if (cell.isVisible) {
    throw new Error(`cell at coordinate given is already visible, coordinate: ${coordinate}`);
  }

  if (cell.isMine) {
    return { board, isMine: true };
  }

  const newGrid = makeCellVisible(board.grid, cell);
  if ((cell as IWaterCell).mineCount === 0) {
    const newBoard = {
      ...board,
      grid: makeEmptyAdjacentCellsVisible(newGrid, coordinate),
    };

    return { board: newBoard, isMine: false };
  } else {
    const newBoard = { ...board, grid: newGrid };
    return { board: newBoard, isMine: false };
  }
};

/** Convert the board to a win state. Reveals all grid. */
export const genWinState = (board: IMinesweeperBoard): IMinesweeperBoard => ({
  ...board,
  grid: makeGridVisible(board.grid),
});

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid.
 */
export const genLoseState = (
  board: IMinesweeperBoard,
  atCoordinate: ICoordinate,
): IMinesweeperBoard => {
  const cell = getCell(board.grid, atCoordinate);
  if (!cell.isMine) {
    throw new Error(`incorrect cell type. ICoordinate must be of IMineCell, ${atCoordinate}`);
  }

  const newBoard = saveState(board);
  const newGrid = setCell(board.grid, cell.coordinate, createDetonatedMineCell(cell as IMineCell));
  return { ...newBoard, grid: makeGridVisible(newGrid) };
};

/** Save the current state of the grid. */
export const saveState = (board: IMinesweeperBoard): IMinesweeperBoard => {
  const previousGridState = board.grid.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, previousGridState };
};

/** Load the previous saved state of the grid. */
export const loadPreviousSavedState = (board: IMinesweeperBoard): IMinesweeperBoard => {
  if (!board.previousGridState) {
    throw new Error('tried to load uninitialized previous state');
  }

  const grid = board.previousGridState.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });
  return { ...board, grid };
};

export const toggleCellFlagStatus = (
  board: IMinesweeperBoard,
  coordinate: ICoordinate,
): IMinesweeperBoard => {
  const cell = getCell(board.grid, coordinate);
  if (cell.isVisible) {
    return board;
  }

  if (cell.isFlagged) {
    const newGrid = setCell(board.grid, coordinate, createUnflaggedCell(cell));
    return { ...board, grid: newGrid, numFlagged: board.numFlagged - 1 };
  } else {
    const newGrid = setCell(board.grid, coordinate, createFlaggedCell(cell));
    return { ...board, grid: newGrid, numFlagged: board.numFlagged + 1 };
  }
};

// ACTIONS

/** Check if the game has been won. */
export const checkWinningBoard = (board: IMinesweeperBoard): boolean => {
  const waterGridAmt = board.height * board.width - board.numMines;
  const visible = countVisibleGrid(board.grid);
  const flagged = countFlaggedGrid(board.grid);

  const onlyOneFlagRemaining = visible === waterGridAmt && flagged === board.numMines - 1;
  const allMinesFlaggedAndAllWaterGridVisible =
    visible === waterGridAmt && flagged === board.numMines;

  if (onlyOneFlagRemaining || allMinesFlaggedAndAllWaterGridVisible) {
    return true;
  }
  return false;
};

export const countRemainingFlags = (board: IMinesweeperBoard): number =>
  board.numMines - board.numFlagged;

/** Output a string representation of the grid. */
export const boardToString = (board: IMinesweeperBoard): string => {
  const generateLine = () => '---'.repeat(board.grid.length) + '\n';

  const drawRow = (row: ICell[]) => {
    const rowStr = row.map((cell, index) => {
      if (index === 0) {
        return cell.isMine ? 'X' : `${(cell as IWaterCell).mineCount}`;
      } else {
        return cell.isMine ? ', X' : `, ${(cell as IWaterCell).mineCount}`;
      }
    });
    return '|' + rowStr.join('') + '|\n';
  };

  const boardStr = board.grid.map(row => drawRow(row)).join('');
  return generateLine() + boardStr + generateLine();
};

// PRIVATE

const countFlaggedGrid = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isFlagged)).length;

const countVisibleGrid = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isVisible)).length;
