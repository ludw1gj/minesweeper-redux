import { IllegalParameterError, IllegalStateError } from '../util/errors';
import { Cell, MineCell, WaterCell } from './cell';
import { Coordinate } from './coordinate';
import { DifficultyLevel } from './difficulty';
import { DIRECTIONS } from './directions';
import { Grid, GridCellsOptions } from './grid';

/** A minesweeper game this. */
export class MinesweeperBoard {
  /** Count amount of flagged cells. */
  private static countFlaggedCells = (grid: Grid): number =>
    grid.cells.map(row => row.filter(cell => cell.isFlagged).length).reduce((n, acc) => n + acc);

  /** The difficulty of the game. */
  public readonly difficulty: DifficultyLevel;
  /** The number of cells on the grid. */
  public readonly numCells: number;
  /** The game grid. */
  public readonly grid: Grid;
  /** The number of flagged cells. */
  public readonly numFlagged: number;
  /** The previously saved grid state. */
  public readonly savedGridState?: Grid;

  /** Create a minesweeper this. Pass in a grid to resume of previous game. */
  public constructor(difficulty: DifficultyLevel, grid?: Grid, savedGridState?: Grid) {
    this.difficulty = difficulty;
    this.numCells = difficulty.height * difficulty.width;
    this.grid = grid ? grid : new Grid(difficulty.height, difficulty.width);
    this.numFlagged = grid ? MinesweeperBoard.countFlaggedCells(grid) : 0;
    this.savedGridState = savedGridState;
  }

  /**
   * Fill the grid with mine and water grid. A seed coordinate is need as the first cell
   * clicked should be a water cell with a mine count of 0. Returns new minesweeper this instance.
   */
  public createFilled = (seedCoor: Coordinate): MinesweeperBoard => {
    const mineCoors = this.genRandMineCoordinates(seedCoor);

    const _createCellAtCoordinate = ({ x, y }: GridCellsOptions): Cell => {
      const coordinate = new Coordinate(x, y);
      if (coordinate.isIncluded(mineCoors)) {
        return new MineCell(coordinate, false, false, false);
      } else {
        const mineCount = this.countSurroundingMines(mineCoors, coordinate);
        return new WaterCell(coordinate, false, false, mineCount);
      }
    };

    const newGrid = this.grid.manipulateCells(_createCellAtCoordinate);
    const cell = newGrid.cells[seedCoor.y][seedCoor.x];
    if (cell.isMine) {
      throw new IllegalStateError('cell should not be a mine cell');
    }
    return new MinesweeperBoard(this.difficulty, newGrid.createWithCell(cell.createVisible()));
  };

  /** Make the cell at the given coordinate visible. */
  public createWithCellVisible = (cell: WaterCell): MinesweeperBoard =>
    new MinesweeperBoard(this.difficulty, this.grid.createWithCell(cell.createVisible()));

  /** Convert the this to a win state. Reveals all grid. Returns new minesweeper this instance. */
  public createWithWinState = (): MinesweeperBoard =>
    new MinesweeperBoard(
      this.difficulty,
      this.grid.manipulateCells(({ cell }) => (!cell.isVisible ? cell.createVisible() : cell)),
    );

  /**
   * Convert the this to a lose state. Saves the current state, detonates the mine, and reveals
   * all grid. Returns new minesweeper this instance.
   */
  public createWithLoseState = (mineCell: MineCell): MinesweeperBoard => {
    const _makeVisibleCell = (cell: Cell): Cell => (!cell.isVisible ? cell.createVisible() : cell);

    const savedGridState = this.grid.manipulateCells(({ cell }) => cell);
    const grid = this.grid.manipulateCells(({ cell }) =>
      cell.coordinate.isEqual(mineCell.coordinate)
        ? mineCell.createDetonated()
        : _makeVisibleCell(cell),
    );
    return new MinesweeperBoard(this.difficulty, grid, savedGridState);
  };

  /** Load the previous saved state of the grid. Returns new minesweeper this instance. */
  public restoreFromSavedGridState = (): MinesweeperBoard => {
    if (!this.savedGridState) {
      throw new IllegalStateError('tried to load uninitialized previous state');
    }
    const grid = new Grid(
      this.grid.height,
      this.grid.height,
      this.savedGridState.cells.map(row => row.map(cell => cell)),
    );
    return new MinesweeperBoard(this.difficulty, grid);
  };

  /** Toggle the flag status of a cell at the given coordinate. Returns new minesweeper this
   * instance.
   */
  public createWithToggledFlag = (atCoor: Coordinate): MinesweeperBoard => {
    const cellToFlag = this.grid.cells[atCoor.y][atCoor.x];
    if (cellToFlag.isVisible) {
      throw new IllegalParameterError('cell should not be visible');
    }

    const _toggleFlag = (cell: Cell): Cell =>
      cell.isFlagged ? cell.createUnflagged() : cell.createFlagged();

    const grid = this.grid.manipulateCells(({ cell }) =>
      cell.coordinate.isEqual(atCoor) ? _toggleFlag(cell) : cell,
    );
    return new MinesweeperBoard(this.difficulty, grid, this.savedGridState);
  };

  /** Check if the game has been won. */
  public isWin = (): boolean => {
    const numWaterCellsVisible = this.grid.cells
      .map(row => row.filter(cell => !cell.isMine && cell.isVisible).length)
      .reduce((n, acc) => n + acc);
    return numWaterCellsVisible === this.numCells - this.difficulty.numMines;
  };

  /** Count remaining flags. */
  public countRemainingFlags = (): number => this.difficulty.numMines - this.numFlagged;

  /** Generate a string representation of the grid. */
  public boardToString = (showAllCells: boolean): string => {
    const generateLine = () => '---'.repeat(this.grid.width) + '\n';

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

    const boardStr = this.grid.cells.map(row => drawRow(row)).join('');
    return generateLine() + boardStr + generateLine();
  };

  /** Count the amount of adjacent mines. */
  public countSurroundingMines = (mineCoors: Coordinate[], atCoordinate: Coordinate): number => {
    const minesAmt = DIRECTIONS.filter(dir => {
      const xCor = atCoordinate.x + dir.x;
      const yCor = atCoordinate.y + dir.y;
      if (xCor < 0 || yCor < 0) {
        return false;
      }
      const directionCor = new Coordinate(xCor, yCor);
      return directionCor.isIncluded(mineCoors);
    }).length;
    return minesAmt;
  };

  /** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell of
   * adjacent mines amount of zero, and therefore must not be a mine cell.
   */
  private genRandMineCoordinates = (seedCoor: Coordinate): Coordinate[] => {
    const getRandomMineCoor = (): Coordinate => {
      const randCoor = Coordinate.genRandom(this.difficulty.height, this.difficulty.width);
      if (seedCoor.calcDistance(randCoor) < 2) {
        return getRandomMineCoor();
      } else {
        return randCoor;
      }
    };

    const arr: Coordinate[] = [];
    while (arr.length !== this.difficulty.numMines) {
      const randCoor = getRandomMineCoor();
      const count = arr.filter(coor => coor.isEqual(randCoor)).length;
      if (count === 0) {
        arr.push(randCoor);
      }
    }
    return arr;
  };
}
