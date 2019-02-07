import { some } from 'lodash';

import { genMineCoordinates, countSurroundingMines, Coordinate, createCoordinate } from './coordinate';
import {
  createWaterCell,
  createMineCell,
  createDetonatedMineCell,
  createUnflaggedCell,
  createFlaggedCell,
  Cell,
  MineCell,
  WaterCell,
  setCell,
  makeCellsVisible,
  makeEmptyAdjacentCellsVisible,
  getCell,
  makeCellVisible,
} from './cells';

// TYPES

export interface MinesweeperBoard {
  readonly height: number;
  readonly width: number;
  readonly numCells: number;
  readonly cells: Cell[][];
  readonly previousCellsState: Cell[][] | null;

  readonly numMines: number;
  readonly numFlagged: number;
}

// CREATORS

export const createMinesweeperBoard = (
  height: number,
  width: number,
  numMines: number,
  cells?: Cell[][]
): MinesweeperBoard => {
  const numCells = height * width;
  const _cells = cells
    ? cells
    : create2DArray(height, width).map((row, y) =>
        row.map((_, x) => createWaterCell(createCoordinate(x, y), false, false, 0))
      );

  return {
    height,
    width,
    numCells,
    cells: _cells,
    previousCellsState: null,
    numMines,
    numFlagged: countFlaggedCells(_cells),
  };
};

// ACTION CREATORS

/** Fill the matrix with mine cells and water cells. A seed coordinate is need as the first cell
 * clicked should be a mine cell. */
export const fillBoard = (board: MinesweeperBoard, seedCoordinate: Coordinate): MinesweeperBoard => {
  const mineCoors = genMineCoordinates(seedCoordinate, board.height, board.width, board.numMines);
  const createCell = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (some(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const cells = board.cells.map((row, y) => row.map((_, x) => createCell(x, y)));
  return { ...board, cells };
};

/** Make the cell visible. If cell is a mine cell, returns true otherwise returns false. */
export const makeCellVisibleAtCoordinate = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): { board: MinesweeperBoard | null; isMine: boolean } => {
  const cell = getCell(board.cells, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return { board: null, isMine: false };
  }
  if (cell.isVisible) {
    console.warn('cell at coordinate given is already visible');
    return { board: null, isMine: false };
  }
  if (!cell.isMine) {
    const newCells = makeCellVisible(board.cells, cell);
    if ((<WaterCell>cell).mineCount === 0) {
      const _cells = makeEmptyAdjacentCellsVisible(newCells, coordinate);
      const _board = { ...board, cells: _cells };
      return { board: _board, isMine: false };
    }
    const _board = { ...board, cells: newCells };
    return { board: _board, isMine: false };
  } else {
    return { board, isMine: true };
  }
};

/** Convert the board to a win state. Reveals all cells. */
export const genWinState = (board: MinesweeperBoard): MinesweeperBoard => {
  return { ...board, cells: makeCellsVisible(board.cells) };
};

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export const genLoseState = (board: MinesweeperBoard, atCoordinate: Coordinate): MinesweeperBoard | null => {
  const cell = getCell(board.cells, atCoordinate);
  if (!cell || !cell.isMine) {
    console.warn('incorrect cell type. Coordinate must be of MineCell');
    return null;
  }
  const newBoard = saveState(board);
  const newCells = setCell(board.cells, cell.coordinate, createDetonatedMineCell(<MineCell>cell));
  return { ...newBoard, cells: makeCellsVisible(newCells) };
};

/** Save the current state of the matrix's cells. */
export const saveState = (board: MinesweeperBoard): MinesweeperBoard => {
  const previousCellsState = board.cells.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, previousCellsState };
};

/** Load the previous saved state of the matrix's cells. */
export const loadPreviousSavedState = (board: MinesweeperBoard): MinesweeperBoard => {
  if (!board.previousCellsState) {
    console.warn('tried to load previous state of null');
    return board;
  }
  const cells = board.previousCellsState.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, cells };
};

export const toggleCellFlagStatus = (board: MinesweeperBoard, coordinate: Coordinate): MinesweeperBoard => {
  const cell = getCell(board.cells, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return board;
  }
  if (cell.isVisible) {
    return board;
  }
  if (cell.isFlagged) {
    const newCells = setCell(board.cells, coordinate, createUnflaggedCell(cell));
    return { ...board, cells: newCells, numFlagged: board.numFlagged - 1 };
  } else {
    const newCells = setCell(board.cells, coordinate, createFlaggedCell(cell));
    return { ...board, cells: newCells, numFlagged: board.numFlagged + 1 };
  }
};

// ACTIONS

/** Check if the game has been won. */
export const checkWinningBoard = (board: MinesweeperBoard): boolean => {
  const waterCellsAmt = board.height * board.width - board.numMines;
  const visible = countVisibleCells(board.cells);
  const flagged = countFlaggedCells(board.cells);

  const onlyOneFlagRemaining = visible === waterCellsAmt && flagged === board.numMines - 1;
  const allMinesFlaggedAndAllWaterCellsVisible = visible === waterCellsAmt && flagged === board.numMines;
  if (onlyOneFlagRemaining || allMinesFlaggedAndAllWaterCellsVisible) {
    return true;
  }
  return false;
};

export const countFlaggedCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isFlagged)).length;

export const countVisibleCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isVisible)).length;

export const countRemainingFlags = (board: MinesweeperBoard): number => board.numMines - board.numFlagged;

/** Output a string representation of the matrix. */
export const boardToString = (cells: Cell[][]): string => {
  const generateLine = () => '---'.repeat(cells.length) + '\n';

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

  const boardStr = cells.map(row => drawRow(row)).join('');
  return generateLine() + boardStr + generateLine();
};

/** Create a 2D array. */
const create2DArray = <T>(rows: number, columns: number): T[][] =>
  Array(rows)
    .fill(undefined)
    .map(() => Array(columns).fill(undefined));
