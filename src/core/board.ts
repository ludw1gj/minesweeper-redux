import { Cell, CellStatus, ICell } from "./cell";
import { Coordinate, ICoordinate } from "./coordinate";
import { IDifficulty } from "./difficulty";
import { DIRECTIONS } from "./directions";
import { IllegalParameterError, IllegalStateError } from "./errors";
import { Grid, IGrid } from "./grid";

/** A minesweeper game board. */
export interface IBoard {
  /** The difficulty of the game. */
  readonly difficulty: IDifficulty;
  /** The number of cells on the grid. */
  readonly numCells: number;
  /** The number of flagged cells. */
  readonly numFlagged: number;
  /** The game grid. */
  readonly grid: IGrid;
  /** The previously saved grid state. */
  readonly savedGridState?: IGrid;
}

export class Board {
  private constructor() { }
  
  /** Create a minesweeper board. Pass in a grid to resume of previous game. */
  public static create(difficulty: IDifficulty, grid?: IGrid, numFlagged?: number): IBoard {
    if ((grid && !numFlagged) || (!grid && numFlagged)) {
      throw new IllegalParameterError(`grid and numFlagged must be both set if setting either.`);
    }
    return {
      difficulty,
      numCells: difficulty.height * difficulty.width,
      grid: grid ? grid : Grid.create(difficulty.height, difficulty.width),
      numFlagged: numFlagged ? numFlagged : 0,
    };
  }

  /** Fill the grid with mine and water grid. A seed coordinate is need as the first cell
   * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
   */
  public static fill(board: IBoard, seedCoor: ICoordinate): IBoard {
    const mineCoors = Board.genRandMineCoordinates(
      seedCoor,
      board.difficulty.height,
      board.difficulty.width,
      board.difficulty.numMines,
    );

    const createCellAtCoordinate = (x: number, y: number): ICell => {
      const coordinate = Coordinate.create(x, y);
      if (Coordinate.isContainedIn(mineCoors, coordinate)) {
        return Cell.create(coordinate, CellStatus.Hidden);
      }
      const mineCount = Board.countSurroundingMines(mineCoors, coordinate);
      return Cell.create(coordinate, CellStatus.Hidden, mineCount);
    };

    const newGrid = Grid.setCells(
      board.grid,
      board.grid.cells.map((row, y) => row.map((_, x) => createCellAtCoordinate(x, y))),
    );
    const cell = Grid.getCell(newGrid, seedCoor);
    if (cell.isMine) {
      throw new IllegalStateError("cell should not be a mine cell");
    }
    return { ...board, grid: Grid.setCell(newGrid, Cell.changeStatus(cell, CellStatus.Revealed)) };
  }

  /** Set cell in board. */
  public static setCell(board: IBoard, cell: ICell): IBoard {
    return {
      ...board,
      grid: Grid.setCell(board.grid, cell),
    };
  }

  /** Convert the board to a win state. Reveals all grid. Returns new minesweeper board instance. */
  public static setWinState(board: IBoard): IBoard {
    const grid = Grid.setCells(
      board.grid,
      board.grid.cells.map(row =>
        row.map(cell =>
          cell.status === CellStatus.Revealed ? cell : Cell.changeStatus(cell, CellStatus.Revealed),
        ),
      ),
    );
    return { ...board, grid };
  }

  /**
   * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
   * all grid. Returns new minesweeper board instance.
   */
  public static setLoseState(board: IBoard, loosingCell: ICell): IBoard {
    const revealCell = (cell: ICell): ICell =>
      cell.status === CellStatus.Revealed ? cell : Cell.changeStatus(cell, CellStatus.Revealed);

    const savedGridState = Grid.setCells(
      board.grid,
      board.grid.cells.map(row => row.map(cell => cell)),
    );
    const grid = Grid.setCells(
      board.grid,
      board.grid.cells.map(row =>
        row.map(cell =>
          Coordinate.areEqual(cell.coordinate, loosingCell.coordinate)
            ? Cell.changeStatus(loosingCell, CellStatus.Detonated)
            : revealCell(cell),
        ),
      ),
    );
    return { ...board, savedGridState, grid };
  }

  /** Check if the game has been won. */
  public static isWin(board: IBoard): boolean {
    const numWaterCellsVisible = board.grid.cells
      .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
      .reduce((n, acc) => n + acc);
    return numWaterCellsVisible === board.numCells - board.difficulty.numMines;
  }

  /** Count remaining flags. */
  public static countRemainingFlags(board: IBoard): number {
    const flagged = board.grid.cells
      .map(row => row.filter(cell => cell.status === CellStatus.Flagged).length)
      .reduce((n, acc) => n + acc);
    return board.difficulty.numMines - flagged;
  }

  /** Generate a string representation of the grid. */
  public static toString(board: IBoard, showAllCells: boolean): string {
    const generateLine = (): string => "---".repeat(board.grid.width) + "\n";

    const generateCellStr = (cell: ICell): string => {
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

    const drawRow = (row: readonly ICell[]): string => {
      const rowStr = row.map((cell, index) => {
        const cellStr = generateCellStr(cell);
        return index === 0 ? `${cellStr}` : `, ${cellStr}`;
      });
      return "|" + rowStr.join("") + "|\n";
    };

    const boardStr = board.grid.cells.map(row => drawRow(row)).join("");
    return generateLine() + boardStr + generateLine();
  }

  /** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell of
   * adjacent mines amount of zero, and therefore must not be a mine cell.
   */
  private static genRandMineCoordinates(
    seedCoor: ICoordinate,
    height: number,
    width: number,
    numMines: number,
  ): ICoordinate[] {
    const getRandomMineCoor = (): ICoordinate => {
      const randCoor = Coordinate.generateRandom(height, width);
      if (Coordinate.findDistance(seedCoor, randCoor) < 2) {
        return getRandomMineCoor();
      }
      return randCoor;
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
  }

  /** Count the amount of adjacent mines. */
  private static countSurroundingMines(mineCoors: ICoordinate[], atCoordinate: ICoordinate): number {
    const minesAmt = DIRECTIONS.filter(dir => {
      const xCor = atCoordinate.x + dir.x;
      const yCor = atCoordinate.y + dir.y;
      if (xCor < 0 || yCor < 0) {
        return false;
      }
      const directionCor = Coordinate.create(xCor, yCor);
      return Coordinate.isContainedIn(mineCoors, directionCor);
    }).length;
    return minesAmt;
  }
}
