import produce from 'immer';

import { IllegalParameterError, IllegalStateError } from '../util/errors';
import {
  Cell,
  createMineCell,
  createWaterCell,
  makeDetonatedMineCell,
  makeFlaggedCell,
  makeUnflaggedCell,
  makeVisibleCell,
  MineCell,
  WaterCell,
} from './cell';
import {
  Coordinate,
  countSurroundingMines,
  createCoordinate,
  genRandMineCoordinates,
  hasCoordinate,
} from './coordinate';
import { DifficultyLevel } from './difficulty';
import { createInitialGrid, Grid, makeGridWithCell } from './grid';

/** A minesweeper game board. */
export interface MinesweeperBoard {
  /** The difficulty of the game. */
  readonly difficulty: DifficultyLevel;
  /** The number of cells on the grid. */
  readonly numCells: number;
  /** The number of flagged cells. */
  readonly numFlagged: number;
  /** The game grid. */
  readonly grid: Grid;
  /** The previously saved grid state. */
  readonly savedGridState?: Grid;
}

/** Create a minesweeper board. Pass in a grid to resume of previous game. */
export const createMinesweeperBoard = (
  difficulty: DifficultyLevel,
  grid?: Grid,
  numFlagged?: number,
): MinesweeperBoard => {
  if ((grid && !numFlagged) || (!grid && numFlagged)) {
    throw new IllegalParameterError(`grid and numFlagged must be both set if setting either.`);
  }
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    grid: grid ? grid : createInitialGrid(difficulty.height, difficulty.width),
    numFlagged: numFlagged ? numFlagged : 0,
  };
};

/** Fill the grid with mine and water grid. A seed coordinate is need as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export const makeFilledBoard = (from: MinesweeperBoard, seedCoor: Coordinate): MinesweeperBoard => {
  const mineCoors = genRandMineCoordinates(
    seedCoor,
    from.difficulty.height,
    from.difficulty.width,
    from.difficulty.numMines,
  );

  const _createCellAtCoordinate = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (hasCoordinate(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const newBoard = produce(from, draft => {
    draft.grid.cells = draft.grid.cells.map((row, y) =>
      row.map((_, x) => _createCellAtCoordinate(x, y)),
    );

    const cell = draft.grid.cells[seedCoor.y][seedCoor.x];
    if (cell.isMine) {
      throw new IllegalStateError('cell should not be a mine cell');
    }
    draft.grid = makeGridWithCell(draft.grid, makeVisibleCell(cell));
  });
  return newBoard;
};

/** Make the cell at the given coordinate visible. */
export const makeBoardWithCellVisible = (
  from: MinesweeperBoard,
  cell: WaterCell,
): MinesweeperBoard => ({ ...from, grid: makeGridWithCell(from.grid, makeVisibleCell(cell)) });

/** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
export const makeBoardWithWinState = (from: MinesweeperBoard): MinesweeperBoard => ({
  ...from,
  grid: {
    ...from.grid,
    cells: from.grid.cells.map(row =>
      row.map(cell => (!cell.isVisible ? makeVisibleCell(cell) : cell)),
    ),
  },
});

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid. Returns new minesweeper board instance.
 */
export const makeBoardWithLoseState = (
  from: MinesweeperBoard,
  mineCell: MineCell,
): MinesweeperBoard => {
  const newBoard = produce(from, draft => {
    draft.savedGridState = {
      ...draft.grid,
      cells: draft.grid.cells.map(row => row.map(cell => cell)),
    };
    draft.grid.cells[mineCell.coordinate.y][mineCell.coordinate.x] = makeDetonatedMineCell(
      mineCell,
    );
    draft.grid.cells = draft.grid.cells.map(row =>
      row.map(cell => (!cell.isVisible ? makeVisibleCell(cell) : cell)),
    );
  });
  return newBoard;
};

/** Load the previous saved state of the grid. Returns new minesweeper board instance. */
export const restoreBoardFromSavedGridState = (from: MinesweeperBoard): MinesweeperBoard => {
  const newBoard = produce(from, draft => {
    if (!draft.savedGridState) {
      throw new IllegalStateError('tried to load uninitialized previous state');
    }
    draft.grid.cells = draft.savedGridState.cells.map(row => row.map(cell => cell));
  });
  return newBoard;
};

/** Toggle the flag status of a cell at the given coordinate. Returns new minesweeper board
 * instance.
 */
export const makeBoardWithToggledFlag = (
  from: MinesweeperBoard,
  atCoor: Coordinate,
): MinesweeperBoard => {
  const newBoard = produce(from, draft => {
    const cell = draft.grid.cells[atCoor.y][atCoor.x];
    if (cell.isVisible) {
      throw new IllegalParameterError('cell should not be visible');
    }
    draft.numFlagged = cell.isFlagged ? draft.numFlagged - 1 : draft.numFlagged + 1;
    draft.grid.cells[atCoor.y][atCoor.x] = cell.isFlagged
      ? makeUnflaggedCell(cell)
      : makeFlaggedCell(cell);
  });
  return newBoard;
};

/** Check if the game has been won. */
export const isWinningBoard = (board: MinesweeperBoard): boolean => {
  const numWaterCellsVisible = board.grid.cells
    .map(row => row.filter(cell => !cell.isMine && cell.isVisible).length)
    .reduce((n, acc) => n + acc);
  return numWaterCellsVisible === board.numCells - board.difficulty.numMines;
};

/** Count remaining flags. */
export const countRemainingFlags = (board: MinesweeperBoard): number =>
  board.difficulty.numMines - board.numFlagged;

/** Generate a string representation of the grid. */
export const boardToString = (board: MinesweeperBoard, showAllCells: boolean): string => {
  const generateLine = () => '---'.repeat(board.grid.width) + '\n';

  const generateNonVisibleCellStr = (cell: Cell, indexZero: boolean) => {
    if (cell.isFlagged) {
      return indexZero ? '🚩' : ', 🚩';
    }
    return indexZero ? '#' : ', #';
  };

  const drawRow = (row: ReadonlyArray<Cell>) => {
    const rowStr = row.map((cell, index) => {
      if (index === 0) {
        if (!showAllCells && !cell.isVisible) {
          return generateNonVisibleCellStr(cell, true);
        }
        return cell.isMine ? '💣' : `${cell.mineCount}`;
      } else {
        if (!showAllCells && !cell.isVisible) {
          return generateNonVisibleCellStr(cell, false);
        }
        return cell.isMine ? ', 💣' : `, ${cell.mineCount}`;
      }
    });
    return '|' + rowStr.join('') + '|\n';
  };

  const boardStr = board.grid.cells.map(row => drawRow(row)).join('');
  return generateLine() + boardStr + generateLine();
};
