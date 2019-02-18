import { IllegalParameterError, IllegalStateError } from '../util/errors';
import {
  Cell,
  createDetonatedMineCell,
  createFlaggedCell,
  createMineCell,
  createUnflaggedCell,
  createVisibleCell,
  createWaterCell,
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
import { createInitialGrid, getCell, Grid, setCell, setCellsVisible } from './grid';

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
export const createMinesweeperBoard = (difficulty: DifficultyLevel): MinesweeperBoard => {
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    numFlagged: 0,
    grid: createInitialGrid(difficulty.height, difficulty.width),
  };
};

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

  const _createCellAtCoordinate = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (hasCoordinate(mineCoors, coordinate)) {
      return createMineCell(coordinate, false, false, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, false, false, mineCount);
  };

  const grid = board.grid.map((row, y) => row.map((_, x) => _createCellAtCoordinate(x, y)));
  return { ...board, grid };
};

/** Make the cell at the given coordinate visible. If cell has a mine count of 0, the adjacent
 * cells will be made visible.
 */
export const setWaterCellVisibleOnBoard = (
  board: MinesweeperBoard,
  cell: WaterCell,
): MinesweeperBoard => ({ ...board, grid: setCell(board.grid, createVisibleCell(cell)) });

/** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
export const setWinState = (board: MinesweeperBoard): MinesweeperBoard => ({
  ...board,
  grid: setCellsVisible(board.grid),
});

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid. Returns new minesweeper board instance.
 */
export const setLoseState = (board: MinesweeperBoard, mineCell: MineCell): MinesweeperBoard => {
  const _board = setSavedGridState(board);
  const _grid = setCell(board.grid, createDetonatedMineCell(mineCell));
  return { ..._board, grid: setCellsVisible(_grid) };
};

/** Save the current state of the grid. */
export const setSavedGridState = (board: MinesweeperBoard): MinesweeperBoard => {
  const previousGridState = board.grid.map(row => {
    return row.map(cell => {
      return cell;
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
      return cell;
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
    throw new IllegalParameterError('cell should not be visible');
  }

  if (cell.isFlagged) {
    const _grid = setCell(board.grid, createUnflaggedCell(cell));
    return { ...board, grid: _grid, numFlagged: board.numFlagged - 1 };
  } else {
    const _grid = setCell(board.grid, createFlaggedCell(cell));
    return { ...board, grid: _grid, numFlagged: board.numFlagged + 1 };
  }
};

/** Get cell at coordinate. */
export const getCellFromBoard = (board: MinesweeperBoard, coordinate: Coordinate) =>
  getCell(board.grid, coordinate);

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
