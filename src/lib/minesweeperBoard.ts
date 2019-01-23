import * as _ from 'lodash';

import { create2DArray } from './util';
import {
  createCoordinate,
  genMineCoordinates,
  countSurroundingMines
} from './coordinate';
import {
  createWaterCell,
  createMineCell,
  createDetonatedMineCell,
  createUnflaggedCell,
  createFlaggedCell
} from './cell';

import {
  setCell,
  revealAllCells,
  revealEmptyAdjacentCells,
  getCell,
  revealCell
} from './cells';
import {
  MinesweeperBoard,
  Cell,
  Coordinate,
  MineCell,
  WaterCell
} from './types';

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
        row.map((_, x) =>
          createWaterCell(createCoordinate(y, x), false, false, 0)
        )
      );

  return {
    height,
    width,
    numCells,
    cells: _cells,
    previousCellsState: null,
    numMines,
    numFlagged: countFlaggedCells(_cells)
  };
};

/** Fill the matrix with mine cells and water cells. */
export const initBoard = (
  board: MinesweeperBoard,
  seedCoordinate: Coordinate
): MinesweeperBoard => {
  const mineCoors = genMineCoordinates(
    seedCoordinate,
    board.height,
    board.width,
    board.numMines
  );

  const createCell = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (_.isMatch(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const cells = board.cells.map((row, y) =>
    row.map((_, x) => createCell(x, y))
  );
  return { ...board, cells };
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
export const loadPreviousSavedState = (
  board: MinesweeperBoard
): MinesweeperBoard => {
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

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export const gameLoseState = (
  board: MinesweeperBoard,
  atCoordinate: Coordinate
): MinesweeperBoard | null => {
  const cell = getCell(board.cells, atCoordinate);
  if (!cell || !cell.isMine) {
    console.warn('incorrect cell type. Coordinate must be of MineCell');
    return null;
  }
  const newBoard = saveState(board);
  const newCells = setCell(
    board.cells,
    cell.coordinate,
    createDetonatedMineCell(<MineCell>cell)
  );
  return { ...newBoard, cells: revealAllCells(newCells) };
};

/** Convert the board to a win state. Reveals all cells. */
export const gameWinState = (board: MinesweeperBoard): MinesweeperBoard => {
  return { ...board, cells: revealAllCells(board.cells) };
};

/** Make the cell visible. If cell is a mine cell, returns true otherwise returns false. */
export const makeCellVisible = (
  cells: Cell[][],
  coordinate: Coordinate
): Cell[][] | null => {
  const cell = getCell(cells, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return null;
  }
  if (cell.isVisible) {
    console.warn('cell at coordinate given is already visible');
    return null;
  }
  if (!cell.isMine) {
    const newCells = revealCell(cells, cell);
    if ((<WaterCell>cell).mineCount === 0) {
      return revealEmptyAdjacentCells(newCells, coordinate);
    }
    return newCells;
  } else {
    return cells;
  }
};

export const toggleCellFlagStatus = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): MinesweeperBoard => {
  const cell = getCell(board.cells, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return board;
  }
  if (cell.isVisible) {
    return board;
  }
  if (cell.isFlagged) {
    const newCells = setCell(
      board.cells,
      coordinate,
      createUnflaggedCell(cell)
    );
    return { ...board, cells: newCells, numFlagged: board.numFlagged - 1 };
  } else {
    const newCells = setCell(board.cells, coordinate, createFlaggedCell(cell));
    return { ...board, cells: newCells, numFlagged: board.numFlagged + 1 };
  }
};

export const countFlaggedCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isFlagged)).length;

export const countVisibleCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isVisible)).length;

/** Output a string representation of the matrix. */
export const boardToString = (cells: Cell[][]): string => {
  const generateLine = () => '---'.repeat(cells.length);

  const drawRow = (row: Cell[]) => {
    const rowStr = row.map((cell, index) => {
      if (index === 0) {
        return cell.isMine ? `${(<WaterCell>cell).mineCount}` : 'X';
      } else {
        return cell.isMine ? `, ${(<WaterCell>cell).mineCount}` : ', X';
      }
    });
    return '|' + rowStr.join('') + '|\n';
  };

  const boardStr = cells.map(row => drawRow(row)).join('');
  return generateLine() + boardStr + generateLine();
};
