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

/** A minesweeper game board. */
export interface IMinesweeperBoard {
  /** The height of the grid. */
  readonly height: number;
  /** The width of the grid. */
  readonly width: number;
  /** The number of cells on the grid. */
  readonly numCells: number;
  /** The game grid. */
  readonly grid: Grid;
  /** The previously saved grid state. */
  readonly previousGridState?: Grid;

  /** The number of mines on the grid. */
  readonly numMines: number;
  /** The number of flagged cells. */
  readonly numFlagged: number;
}

// CREATORS

/** Create a minesweeper board. Pass in a grid to resume of previous game. */
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
    numFlagged: countFlaggedCells(msGrid),
  };
};

// ACTION CREATORS

/** Fill the grid with mine and water grid. A seed coordinate is need as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
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

/** Make the cell at the given coordinate visible. If cell has a mine count of 0, the adjacent
 * cells will be made visible. If cell is a mine cell, return true otherwise returns false. Returns
 * new minesweeper board instance.
 */
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

/** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
export const genWinState = (board: IMinesweeperBoard): IMinesweeperBoard => ({
  ...board,
  grid: makeGridVisible(board.grid),
});

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid. Returns new minesweeper board instance.
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

/** Load the previous saved state of the grid. Returns new minesweeper board instance. */
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

/** Toggle the flag status of a cell at the given coordinate. Returns new minesweeper board
 * instance.
 */
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
  const visible = countVisibleCells(board.grid);
  const flagged = countFlaggedCells(board.grid);

  const onlyOneFlagRemaining = visible === waterGridAmt && flagged === board.numMines - 1;
  const allMinesFlaggedAndAllWaterGridVisible =
    visible === waterGridAmt && flagged === board.numMines;

  if (onlyOneFlagRemaining || allMinesFlaggedAndAllWaterGridVisible) {
    return true;
  }
  return false;
};

/** Count remaining flags. */
export const countRemainingFlags = (board: IMinesweeperBoard): number =>
  board.numMines - board.numFlagged;

/** Generate a string representation of the grid. */
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

/** Count amount of flagged cells. */
const countFlaggedCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isFlagged)).length;

/** Count amount of visible cells. */
const countVisibleCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isVisible)).length;
