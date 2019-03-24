import { IllegalParameterError, IllegalStateError } from '../util/errors';
import { Cell, CellStatus, ICell, IMineCell, IWaterCell } from './cell';
import { Coordinate, ICoordinate } from './coordinate';
import { IDifficultyLevel } from './difficulty';
import { DIRECTIONS } from './directions';
import { Grid, IGrid } from './grid';

/** A minesweeper game board. */
export interface IMinesweeperBoard {
  /** The difficulty of the game. */
  readonly difficulty: IDifficultyLevel;
  /** The number of cells on the grid. */
  readonly numCells: number;
  /** The number of flagged cells. */
  readonly numFlagged: number;
  /** The game grid. */
  readonly grid: IGrid;
  /** The previously saved grid state. */
  readonly savedGridState?: IGrid;
}

export class MinesweeperBoard {
  /** Create a minesweeper board. Pass in a grid to resume of previous game. */
  public static create = (
    difficulty: IDifficultyLevel,
    grid?: IGrid,
    numFlagged?: number,
  ): IMinesweeperBoard => {
    if ((grid && !numFlagged) || (!grid && numFlagged)) {
      throw new IllegalParameterError(`grid and numFlagged must be both set if setting either.`);
    }
    return {
      difficulty,
      numCells: difficulty.height * difficulty.width,
      grid: grid ? grid : Grid.createInitial(difficulty.height, difficulty.width),
      numFlagged: numFlagged ? numFlagged : 0,
    };
  };

  /** Fill the grid with mine and water grid. A seed coordinate is need as the first cell
   * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
   */
  public static makeFilled = (
    from: IMinesweeperBoard,
    seedCoor: ICoordinate,
  ): IMinesweeperBoard => {
    const mineCoors = MinesweeperBoard.genRandMineCoordinates(
      seedCoor,
      from.difficulty.height,
      from.difficulty.width,
      from.difficulty.numMines,
    );

    const _createCellAtCoordinate = (x: number, y: number): ICell => {
      const coordinate = Coordinate.create(x, y);
      if (Coordinate.arrayContains(mineCoors, coordinate)) {
        return Cell.createMineCell(coordinate, CellStatus.Hidden, false);
      }
      const mineCount = MinesweeperBoard.countSurroundingMines(mineCoors, coordinate);
      return Cell.createWaterCell(coordinate, CellStatus.Hidden, mineCount);
    };

    const newGrid = {
      ...from.grid,
      cells: from.grid.cells.map((row, y) => row.map((_, x) => _createCellAtCoordinate(x, y))),
    };
    const cell = newGrid.cells[seedCoor.y][seedCoor.x];
    if (cell.isMine) {
      throw new IllegalStateError('cell should not be a mine cell');
    }
    return { ...from, grid: Grid.makeWithCell(newGrid, Cell.makeRevealed(cell)) };
  };

  /** Make the cell at the given coordinate revealed. */
  public static makeWithCellRevealed = (
    from: IMinesweeperBoard,
    cell: IWaterCell,
  ): IMinesweeperBoard => ({
    ...from,
    grid: Grid.makeWithCell(from.grid, Cell.makeRevealed(cell)),
  });

  /** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
  public static makeWithWinState = (from: IMinesweeperBoard): IMinesweeperBoard => {
    const grid = {
      ...from.grid,
      cells: from.grid.cells.map(row =>
        row.map(cell => (cell.status === CellStatus.Revealed ? cell : Cell.makeRevealed(cell))),
      ),
    };
    return { ...from, grid };
  };

  /**
   * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
   * all grid. Returns new minesweeper board instance.
   */
  public static makeWithLoseState = (
    from: IMinesweeperBoard,
    mineCell: IMineCell,
  ): IMinesweeperBoard => {
    const _makeVisibleCell = (cell: ICell): ICell =>
      cell.status === CellStatus.Revealed ? cell : Cell.makeRevealed(cell);

    const savedGridState = {
      ...from.grid,
      cells: from.grid.cells.map(row => row.map(cell => cell)),
    };
    const grid = {
      ...from.grid,
      cells: from.grid.cells.map(row =>
        row.map(cell =>
          Coordinate.areEqual(cell.coordinate, mineCell.coordinate)
            ? Cell.makeDetonatedMineCell(mineCell)
            : _makeVisibleCell(cell),
        ),
      ),
    };
    return { ...from, savedGridState, grid };
  };

  /** Load the previous saved state of the grid. Returns new minesweeper board instance. */
  public static restoreFromSavedGridState = (from: IMinesweeperBoard): IMinesweeperBoard => {
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
  public static makeWithToggledFlag = (
    from: IMinesweeperBoard,
    atCoor: ICoordinate,
  ): IMinesweeperBoard => {
    const cellToFlag = from.grid.cells[atCoor.y][atCoor.x];
    if (cellToFlag.status === CellStatus.Revealed) {
      throw new IllegalParameterError('cell status should not be REVEALED');
    }

    const _toggleFlag = (cell: ICell): ICell =>
      cell.status === CellStatus.Flagged ? Cell.makeHidden(cell) : Cell.makeFlagged(cell);

    const grid = {
      ...from.grid,
      cells: from.grid.cells.map(row =>
        row.map(cell => (Coordinate.areEqual(cell.coordinate, atCoor) ? _toggleFlag(cell) : cell)),
      ),
    };
    const numFlagged =
      cellToFlag.status === CellStatus.Flagged ? from.numFlagged - 1 : from.numFlagged + 1;

    return { ...from, grid, numFlagged };
  };

  /** Check if the game has been won. */
  public static isWinningBoard = (board: IMinesweeperBoard): boolean => {
    const numWaterCellsVisible = board.grid.cells
      .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
      .reduce((n, acc) => n + acc);
    return numWaterCellsVisible === board.numCells - board.difficulty.numMines;
  };

  /** Count remaining flags. */
  public static countRemainingFlags = (board: IMinesweeperBoard): number =>
    board.difficulty.numMines - board.numFlagged;

  /** Generate a string representation of the grid. */
  public static boardToString = (board: IMinesweeperBoard, showAllCells: boolean): string => {
    const generateLine = () => '---'.repeat(board.grid.width) + '\n';

    const generateNonVisibleCellStr = (cell: ICell, indexZero: boolean) => {
      if (cell.status === CellStatus.Flagged) {
        return indexZero ? '🚩' : ', 🚩';
      }
      return indexZero ? '#' : ', #';
    };

    const drawRow = (row: ReadonlyArray<ICell>) => {
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

  /** Count the amount of adjacent mines. */
  public static countSurroundingMines = (
    mineCoors: ICoordinate[],
    atCoordinate: ICoordinate,
  ): number => {
    const minesAmt = DIRECTIONS.filter(dir => {
      const xCor = atCoordinate.x + dir.x;
      const yCor = atCoordinate.y + dir.y;
      if (xCor < 0 || yCor < 0) {
        return false;
      }
      const directionCor = Coordinate.create(xCor, yCor);
      return Coordinate.arrayContains(mineCoors, directionCor);
    }).length;
    return minesAmt;
  };

  /** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell of
   * adjacent mines amount of zero, and therefore must not be a mine cell.
   */
  private static genRandMineCoordinates = (
    seedCoor: ICoordinate,
    height: number,
    width: number,
    numMines: number,
  ): ICoordinate[] => {
    const getRandomMineCoor = (): ICoordinate => {
      const randCoor = Coordinate.genRandom(height, width);
      if (Coordinate.calcDistance(seedCoor, randCoor) < 2) {
        return getRandomMineCoor();
      } else {
        return randCoor;
      }
    };

    const arr: ICoordinate[] = [];
    while (arr.length !== numMines) {
      const randCoor = getRandomMineCoor();
      const count = arr.filter(coor => Coordinate.areEqual(coor, randCoor)).length;
      if (count === 0) {
        arr.push(randCoor);
      }
    }
    return arr;
  };
}
