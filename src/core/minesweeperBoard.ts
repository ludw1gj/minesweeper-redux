import { IllegalParameterError, IllegalStateError } from '../util/errors';
import {
  Cell,
  CellStatus,
  createMineCell,
  createWaterCell,
  makeDetonatedMineCell,
  makeFlaggedCell,
  makeHiddenCell,
  makeRevealedCell,
  MineCell,
  WaterCell,
} from './cell';
import {
  calcDistanceOfTwoCoordinates,
  Coordinate,
  coordinatesAreEqual,
  createCoordinate,
  genRandomCoordinate,
  hasCoordinate,
} from './coordinate';
import { DifficultyLevel } from './difficulty';
import { DIRECTIONS } from './directions';
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
      return createMineCell(coordinate, CellStatus.Hidden, false);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, CellStatus.Hidden, mineCount);
  };

  const newGrid = {
    ...from.grid,
    cells: from.grid.cells.map((row, y) => row.map((_, x) => _createCellAtCoordinate(x, y))),
  };
  const cell = newGrid.cells[seedCoor.y][seedCoor.x];
  if (cell.isMine) {
    throw new IllegalStateError('cell should not be a mine cell');
  }
  return { ...from, grid: makeGridWithCell(newGrid, makeRevealedCell(cell)) };
};

/** Make the cell at the given coordinate revealed. */
export const makeBoardWithCellRevealed = (
  from: MinesweeperBoard,
  cell: WaterCell,
): MinesweeperBoard => ({ ...from, grid: makeGridWithCell(from.grid, makeRevealedCell(cell)) });

/** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
export const makeBoardWithWinState = (from: MinesweeperBoard): MinesweeperBoard => {
  const grid = {
    ...from.grid,
    cells: from.grid.cells.map(row =>
      row.map(cell => (cell.status === CellStatus.Revealed ? cell : makeRevealedCell(cell))),
    ),
  };
  return { ...from, grid };
};

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid. Returns new minesweeper board instance.
 */
export const makeBoardWithLoseState = (
  from: MinesweeperBoard,
  mineCell: MineCell,
): MinesweeperBoard => {
  const _makeVisibleCell = (cell: Cell): Cell =>
    cell.status === CellStatus.Revealed ? cell : makeRevealedCell(cell);

  const savedGridState = { ...from.grid, cells: from.grid.cells.map(row => row.map(cell => cell)) };
  const grid = {
    ...from.grid,
    cells: from.grid.cells.map(row =>
      row.map(cell =>
        coordinatesAreEqual(cell.coordinate, mineCell.coordinate)
          ? makeDetonatedMineCell(mineCell)
          : _makeVisibleCell(cell),
      ),
    ),
  };
  return { ...from, savedGridState, grid };
};

/** Load the previous saved state of the grid. Returns new minesweeper board instance. */
export const restoreBoardFromSavedGridState = (from: MinesweeperBoard): MinesweeperBoard => {
  if (!from.savedGridState) {
    throw new IllegalStateError('tried to load uninitialized previous state');
  }
  const grid = {
    ...from.grid,
    cells: from.savedGridState.cells.map(row => row.map(cell => cell)),
  };
  return { ...from, grid };
};

/** Toggle the flag status of a cell at the given coordinate. Returns new minesweeper board
 * instance.
 */
export const makeBoardWithToggledFlag = (
  from: MinesweeperBoard,
  atCoor: Coordinate,
): MinesweeperBoard => {
  const cellToFlag = from.grid.cells[atCoor.y][atCoor.x];
  if (cellToFlag.status === CellStatus.Revealed) {
    throw new IllegalParameterError('cell status should not be REVEALED');
  }

  const _toggleFlag = (cell: Cell): Cell =>
    cell.status === CellStatus.Flagged ? makeHiddenCell(cell) : makeFlaggedCell(cell);

  const grid = {
    ...from.grid,
    cells: from.grid.cells.map(row =>
      row.map(cell => (coordinatesAreEqual(cell.coordinate, atCoor) ? _toggleFlag(cell) : cell)),
    ),
  };
  const numFlagged =
    cellToFlag.status === CellStatus.Flagged ? from.numFlagged - 1 : from.numFlagged + 1;

  return { ...from, grid, numFlagged };
};

/** Check if the game has been won. */
export const isWinningBoard = (board: MinesweeperBoard): boolean => {
  const numWaterCellsVisible = board.grid.cells
    .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
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
    if (cell.status === CellStatus.Flagged) {
      return indexZero ? '🚩' : ', 🚩';
    }
    return indexZero ? '#' : ', #';
  };

  const drawRow = (row: ReadonlyArray<Cell>) => {
    const rowStr = row.map((cell, index) => {
      if (index === 0) {
        if (!showAllCells && cell.status === CellStatus.Hidden) {
          return generateNonVisibleCellStr(cell, true);
        }
        return cell.isMine ? '💣' : `${cell.mineCount}`;
      } else {
        if (!showAllCells && cell.status === CellStatus.Hidden) {
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

/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell of
 * adjacent mines amount of zero, and therefore must not be a mine cell.
 */
const genRandMineCoordinates = (
  seedCoor: Coordinate,
  height: number,
  width: number,
  numMines: number,
): Coordinate[] => {
  const getRandomMineCoor = (): Coordinate => {
    const randCoor = genRandomCoordinate(height, width);
    if (calcDistanceOfTwoCoordinates(seedCoor, randCoor) < 2) {
      return getRandomMineCoor();
    } else {
      return randCoor;
    }
  };

  const arr: Coordinate[] = [];
  while (arr.length !== numMines) {
    const randCoor = getRandomMineCoor();
    const count = arr.filter(coor => coordinatesAreEqual(coor, randCoor)).length;
    if (count === 0) {
      arr.push(randCoor);
    }
  }
  return arr;
};

/** Count the amount of adjacent mines. */
const countSurroundingMines = (mineCoors: Coordinate[], atCoordinate: Coordinate): number => {
  const minesAmt = DIRECTIONS.filter(dir => {
    const xCor = atCoordinate.x + dir.x;
    const yCor = atCoordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return false;
    }
    const directionCor = createCoordinate(xCor, yCor);
    return hasCoordinate(mineCoors, directionCor);
  }).length;
  return minesAmt;
};
