import {
  Cell,
  CellStatus,
  createMineCell,
  createWaterCell,
  makeDetonatedCell,
  makeFlaggedCell,
  makeHiddenCell,
  makeRevealedCell,
} from "./cell";
import {
  calcDistanceOfTwoCoordinates,
  Coordinate,
  coordinatesAreEqual,
  createCoordinate,
  genRandomCoordinate,
  hasCoordinate,
} from "./coordinate";
import { DifficultyLevel } from "./difficulty";
import { DIRECTIONS } from "./directions";
import { IllegalParameterError, IllegalStateError } from "./errors";
import { createGrid, Grid, setCellInGrid } from "./grid";

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
export const createBoard = (
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
    grid: grid ? grid : createGrid(difficulty.height, difficulty.width),
    numFlagged: numFlagged ? numFlagged : 0,
  };
};

/** Fill the grid with mine and water grid. A seed coordinate is need as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export const fillBoard = (board: MinesweeperBoard, seedCoor: Coordinate): MinesweeperBoard => {
  const mineCoors = genRandMineCoordinates(
    seedCoor,
    board.difficulty.height,
    board.difficulty.width,
    board.difficulty.numMines,
  );

  const createCellAtCoordinate = (x: number, y: number): Cell => {
    const coordinate = createCoordinate(x, y);
    if (hasCoordinate(mineCoors, coordinate)) {
      return createMineCell(coordinate, CellStatus.Hidden);
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate);
    return createWaterCell(coordinate, CellStatus.Hidden, mineCount);
  };

  const newGrid = {
    ...board.grid,
    cells: board.grid.cells.map((row, y) => row.map((_, x) => createCellAtCoordinate(x, y))),
  };
  const cell = newGrid.cells[seedCoor.y][seedCoor.x];
  if (cell.isMine) {
    throw new IllegalStateError("cell should not be a mine cell");
  }
  return { ...board, grid: setCellInGrid(newGrid, makeRevealedCell(cell)) };
};

/** Make the cell at the given coordinate revealed. */
export const revealCellInBoard = (board: MinesweeperBoard, cell: Cell): MinesweeperBoard => ({
  ...board,
  grid: setCellInGrid(board.grid, makeRevealedCell(cell)),
});

/** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
export const setWinStateInBoard = (board: MinesweeperBoard): MinesweeperBoard => {
  const grid = {
    ...board.grid,
    cells: board.grid.cells.map(row =>
      row.map(cell => (cell.status === CellStatus.Revealed ? cell : makeRevealedCell(cell))),
    ),
  };
  return { ...board, grid };
};

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all grid. Returns new minesweeper board instance.
 */
export const setLoseStateInBoard = (
  board: MinesweeperBoard,
  loosingCell: Cell,
): MinesweeperBoard => {
  const revealUnrevealedCell = (cell: Cell): Cell =>
    cell.status === CellStatus.Revealed ? cell : makeRevealedCell(cell);

  const savedGridState = {
    ...board.grid,
    cells: board.grid.cells.map(row => row.map(cell => cell)),
  };
  const grid = {
    ...board.grid,
    cells: board.grid.cells.map(row =>
      row.map(cell =>
        coordinatesAreEqual(cell.coordinate, loosingCell.coordinate)
          ? makeDetonatedCell(loosingCell)
          : revealUnrevealedCell(cell),
      ),
    ),
  };
  return { ...board, savedGridState, grid };
};

/** Load the previous saved state of the grid. Returns new minesweeper board instance. */
export const loadSavedGridStateInBoard = (board: MinesweeperBoard): MinesweeperBoard => {
  if (!board.savedGridState) {
    throw new IllegalStateError("tried to load uninitialized previous state");
  }
  const grid = {
    ...board.grid,
    cells: board.savedGridState.cells.map(row => row.map(cell => cell)),
  };
  return { ...board, grid };
};

/** Toggle the flag status of a cell at the given coordinate. Returns new minesweeper board
 * instance.
 */
export const toggleCellFlagInBoard = (
  board: MinesweeperBoard,
  atCoor: Coordinate,
): MinesweeperBoard => {
  const cellToToggle = board.grid.cells[atCoor.y][atCoor.x];
  if (cellToToggle.status !== CellStatus.Hidden && cellToToggle.status !== CellStatus.Flagged) {
    throw new IllegalParameterError("cell status should not be REVEALED");
  }

  const toggleFlagOfCell = (cell: Cell): Cell =>
    cell.status === CellStatus.Flagged ? makeHiddenCell(cell) : makeFlaggedCell(cell);

  const grid = {
    ...board.grid,
    cells: board.grid.cells.map(row =>
      row.map(cell =>
        coordinatesAreEqual(cell.coordinate, atCoor) ? toggleFlagOfCell(cell) : cell,
      ),
    ),
  };
  const numFlagged =
    cellToToggle.status === CellStatus.Flagged ? board.numFlagged - 1 : board.numFlagged + 1;

  return { ...board, grid, numFlagged };
};

/** Check if the game has been won. */
export const isWinningBoard = (board: MinesweeperBoard): boolean => {
  const numWaterCellsVisible = board.grid.cells
    .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
    .reduce((n, acc) => n + acc);
  return numWaterCellsVisible === board.numCells - board.difficulty.numMines;
};

/** Count remaining flags. */
export const countRemainingFlags = (board: MinesweeperBoard): number => {
  const flagged = board.grid.cells
    .map(row => row.filter(cell => cell.status === CellStatus.Flagged).length)
    .reduce((n, acc) => n + acc);
  return board.difficulty.numMines - flagged;
};

/** Generate a string representation of the grid. */
export const stringFromBoard = (board: MinesweeperBoard, showAllCells: boolean): string => {
  const generateLine = () => "---".repeat(board.grid.width) + "\n";

  const generateCellStr = (cell: Cell): string => {
    if (showAllCells) {
      return cell.isMine ? "💣" : `${cell.mineCount}`;
    }
    switch (cell.status) {
      case CellStatus.Hidden:
        return "#";
      case CellStatus.Flagged:
        return "🚩";
      case CellStatus.Revealed:
        if (cell.isMine) {
          return "💣";
        }
        return cell.mineCount > 0 ? `${cell.mineCount}` : "🌊";
      case CellStatus.Detonated:
        return "💥";
    }
  };

  const drawRow = (row: ReadonlyArray<Cell>) => {
    const rowStr = row.map((cell, index) => {
      const cellStr = generateCellStr(cell);
      return index === 0 ? `${cellStr}` : `, ${cellStr}`;
    });
    return "|" + rowStr.join("") + "|\n";
  };

  const boardStr = board.grid.cells.map(row => drawRow(row)).join("");
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
