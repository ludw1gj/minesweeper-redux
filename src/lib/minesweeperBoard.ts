import { some } from 'lodash';

import {
  genMineCoordinates,
  countSurroundingMines,
  Coordinate,
  createCoordinate,
} from './coordinate';
import {
  createWaterCell,
  createMineCell,
  createDetonatedMineCell,
  createUnflaggedCell,
  createFlaggedCell,
  Cell,
  MineCell,
  WaterCell,
} from './cell';
import {
  getCell,
  makeCellVisible,
  makeEmptyAdjacentCellsVisible,
  setCell,
  makeGridVisible,
  Grid,
} from './grid';

// TYPES

export interface MinesweeperBoard {
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
  grid?: Grid
): MinesweeperBoard => {
  const numCells = height * width;
  const _grid = grid
    ? grid
    : create2DArray(height, width).map((row, y) =>
        row.map((_, x) => createWaterCell(createCoordinate(x, y), false, false, 0))
      );

  return {
    height,
    width,
    numCells,
    grid: _grid,
    numMines,
    numFlagged: countFlaggedGrid(_grid),
  };
};

// ACTION CREATORS

/** Fill the matrix with mine grid and water grid. A seed coordinate is need as the first cell
 * clicked should be a mine cell. */
export const fillBoard = (
  board: MinesweeperBoard,
  seedCoordinate: Coordinate
): MinesweeperBoard => {
  const mineCoors = genMineCoordinates(seedCoordinate, board.height, board.width, board.numMines);

  const createCell = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (some(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const grid = board.grid.map((row, y) => row.map((_, x) => createCell(x, y)));
  return { ...board, grid };
};

/** Make the cell visible. If cell is a mine cell, returns true otherwise returns false. */
export const makeCellVisibleAtCoordinate = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): { board: MinesweeperBoard; isMine: boolean } => {
  const cell = getCell(board.grid, coordinate);
  if (cell.isVisible) {
    throw new Error(`cell at coordinate given is already visible, coordinate: ${coordinate}`);
  }

  if (cell.isMine) {
    return { board, isMine: true };
  }

  const newGrid = makeCellVisible(board.grid, cell);
  if ((<WaterCell>cell).mineCount === 0) {
    const _grid = makeEmptyAdjacentCellsVisible(newGrid, coordinate);
    const _board = { ...board, grid: _grid };

    return { board: _board, isMine: false };
  } else {
    const _board = { ...board, grid: newGrid };
    return { board: _board, isMine: false };
  }
};

/** Convert the board to a win state. Reveals all grid. */
export const genWinState = (board: MinesweeperBoard): MinesweeperBoard => ({
  ...board,
  grid: makeGridVisible(board.grid),
});

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid.
 */
export const genLoseState = (
  board: MinesweeperBoard,
  atCoordinate: Coordinate
): MinesweeperBoard => {
  const cell = getCell(board.grid, atCoordinate);
  if (!cell.isMine) {
    throw new Error(`incorrect cell type. Coordinate must be of MineCell, ${atCoordinate}`);
  }

  const newBoard = saveState(board);
  const newGrid = setCell(board.grid, cell.coordinate, createDetonatedMineCell(<MineCell>cell));
  return { ...newBoard, grid: makeGridVisible(newGrid) };
};

/** Save the current state of the matrix's grid. */
export const saveState = (board: MinesweeperBoard): MinesweeperBoard => {
  const previousGridState = board.grid.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, previousGridState };
};

/** Load the previous saved state of the matrix's grid. */
export const loadPreviousSavedState = (board: MinesweeperBoard): MinesweeperBoard => {
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
  board: MinesweeperBoard,
  coordinate: Coordinate
): MinesweeperBoard => {
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
export const checkWinningBoard = (board: MinesweeperBoard): boolean => {
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

export const countRemainingFlags = (board: MinesweeperBoard): number =>
  board.numMines - board.numFlagged;

/** Output a string representation of the matrix. */
export const boardToString = (board: MinesweeperBoard): string => {
  const generateLine = () => '---'.repeat(board.grid.length) + '\n';

  const drawRow = (row: Cell[]) => {
    const rowStr = row.map((cell, index) => {
      if (index === 0) {
        return cell.isMine ? 'X' : `${(<WaterCell>cell).mineCount}`;
      } else {
        return cell.isMine ? ', X' : `, ${(<WaterCell>cell).mineCount}`;
      }
    });
    return '|' + rowStr.join('') + '|\n';
  };

  const boardStr = board.grid.map(row => drawRow(row)).join('');
  return generateLine() + boardStr + generateLine();
};

// PRIVATE

/** Create a 2D array. */
const create2DArray = <T>(rows: number, columns: number): T[][] =>
  Array(rows)
    .fill(undefined)
    .map(() => Array(columns).fill(undefined));

const countFlaggedGrid = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isFlagged)).length;

const countVisibleGrid = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isVisible)).length;
