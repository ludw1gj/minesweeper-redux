import {
  Cell,
  createDetonatedMineCell,
  createFlaggedCell,
  createMineCell,
  createUnflaggedCell,
  createWaterCell,
} from './cell';
import {
  Coordinate,
  countSurroundingMines,
  createCoordinate,
  genRandMineCoordinates,
  hasCoordinate,
} from './coordinate';
import { DifficultyLevel } from './difficulty';
import { IllegalStateError, UserError } from './errors';
import {
  createInitialGrid,
  getCell,
  Grid,
  setCell,
  setCellsVisible,
  setCellVisible,
  setEmptyAdjacentCellsVisible,
} from './grid';

// TYPES

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

// CREATORS

/** Create a minesweeper board. Pass in a grid to resume of previous game. */
export const createMinesweeperBoard = (difficulty: DifficultyLevel): MinesweeperBoard => {
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    numFlagged: 0,
    grid: createInitialGrid(difficulty.height, difficulty.width),
  };
};

// SETTERS

/** Fill the grid with mine and water grid. A seed coordinate is need as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export const setFilledBoard = (
  board: MinesweeperBoard,
  seedCoordinate: Coordinate,
): MinesweeperBoard => {
  const mineCoors = genRandMineCoordinates(
    seedCoordinate,
    board.difficulty.height,
    board.difficulty.width,
    board.difficulty.numMines,
  );

  const createCellAtCoordinate = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (hasCoordinate(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const grid = board.grid.map((row, y) => row.map((_, x) => createCellAtCoordinate(x, y)));
  return { ...board, grid };
};

/** Make the cell at the given coordinate visible. If cell has a mine count of 0, the adjacent
 * cells will be made visible. If cell is a mine cell, return true otherwise returns false. Returns
 * new minesweeper board instance.
 */
export const setCellVisibleAtCoordinate = (
  board: MinesweeperBoard,
  coordinate: Coordinate,
): { board: MinesweeperBoard; isMine: boolean } => {
  const cell = getCell(board.grid, coordinate);
  if (cell.isVisible) {
    throw new UserError(
      `cell at coordinate given is already visible, coordinate: ${JSON.stringify(coordinate)}`,
    );
  }
  if (cell.isMine) {
    return { board, isMine: true };
  }

  const _grid = setCellVisible(board.grid, cell);
  if (cell.mineCount === 0) {
    const _board = {
      ...board,
      grid: setEmptyAdjacentCellsVisible(_grid, coordinate, []),
    };
    return { board: _board, isMine: false };
  } else {
    const _board = { ...board, grid: _grid };
    return { board: _board, isMine: false };
  }
};

/** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
export const setWinState = (board: MinesweeperBoard): MinesweeperBoard => ({
  ...board,
  grid: setCellsVisible(board.grid),
});

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid. Returns new minesweeper board instance.
 */
export const setLoseState = (
  board: MinesweeperBoard,
  atCoordinate: Coordinate,
): MinesweeperBoard => {
  const cell = getCell(board.grid, atCoordinate);
  if (!cell.isMine) {
    throw new UserError(
      `incorrect cell type. Coordinate must be a mine cell, ${JSON.stringify(atCoordinate)}`,
    );
  }

  const _board = setSavedGridState(board);
  const _grid = setCell(board.grid, cell.coordinate, createDetonatedMineCell(cell));
  return { ..._board, grid: setCellsVisible(_grid) };
};

/** Save the current state of the grid. */
export const setSavedGridState = (board: MinesweeperBoard): MinesweeperBoard => {
  const previousGridState = board.grid.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, savedGridState: previousGridState };
};

/** Load the previous saved state of the grid. Returns new minesweeper board instance. */
export const setGridFromSavedGridState = (board: MinesweeperBoard): MinesweeperBoard => {
  if (!board.savedGridState) {
    throw new IllegalStateError('tried to load uninitialized previous state');
  }

  const grid = board.savedGridState.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });
  return { ...board, grid };
};

/** Toggle the flag status of a cell at the given coordinate. Returns new minesweeper board
 * instance.
 */
export const setToggledCellFlagStatus = (
  board: MinesweeperBoard,
  coordinate: Coordinate,
): MinesweeperBoard => {
  const cell = getCell(board.grid, coordinate);
  if (cell.isVisible) {
    throw new UserError('tried to flag a visible cell');
  }

  if (cell.isFlagged) {
    const _grid = setCell(board.grid, coordinate, createUnflaggedCell(cell));
    return { ...board, grid: _grid, numFlagged: board.numFlagged - 1 };
  } else {
    const _grid = setCell(board.grid, coordinate, createFlaggedCell(cell));
    return { ...board, grid: _grid, numFlagged: board.numFlagged + 1 };
  }
};

// ACTIONS

/** Check if the game has been won. */
export const isWinningBoard = (board: MinesweeperBoard): boolean => {
  const numWaterCellsVisible = board.grid
    .map(row => row.filter(cell => !cell.isMine && cell.isVisible).length)
    .reduce((n, acc) => n + acc);

  if (numWaterCellsVisible === board.numCells - board.difficulty.numMines) {
    return true;
  }
  return false;
};

/** Count remaining flags. */
export const countRemainingFlags = (board: MinesweeperBoard): number =>
  board.difficulty.numMines - board.numFlagged;

/** Generate a string representation of the grid. */
export const boardToString = (board: MinesweeperBoard, showAllCells: boolean): string => {
  const generateLine = () => '---'.repeat(board.grid.length) + '\n';

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

  const boardStr = board.grid.map(row => drawRow(row)).join('');
  return generateLine() + boardStr + generateLine();
};
