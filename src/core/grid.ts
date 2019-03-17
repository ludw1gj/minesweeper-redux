import { IllegalParameterError } from '../util/errors';
import { Cell, WaterCell } from './cell';
import { Coordinate } from './coordinate';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers } from './util';

export interface GridCellsOptions {
  cell: Cell;
  y: number;
  x: number;
}

/** A grid made up of cells. */
export class Grid {
  /** Create a 2D array. */
  private static create2DArray = <T>(rows: number, columns: number): T[][] =>
    Array(rows)
      .fill(undefined)
      .map(() => Array(columns).fill(undefined));

  public readonly width: number;
  public readonly height: number;
  public readonly cells: Cell[][];

  constructor(width: number, height: number, cells?: Cell[][]) {
    if (!arePositiveIntegers(height, width)) {
      throw new IllegalParameterError(
        `height and width must be positive whole numbers, height: ${height}, width: ${width}`,
      );
    }
    this.height = height;
    this.width = width;
    this.cells = cells
      ? cells
      : Grid.create2DArray(height, width).map((row, y) =>
          row.map((_, x) => new WaterCell(new Coordinate(x, y), false, false, 0)),
        );
  }

  /**
   * Set cell in grid. If cell has a mine count of 0, the adjacent
   * cells will be made visible. Returns new grid instance.
   */
  public createWithCell = (newCell: Cell): Grid => {
    if (!newCell.coordinate.isValid(this.height, this.width)) {
      throw new IllegalParameterError(
        `tried to set cell at invalid coordinate, grid max x: 
      ${this.width}, grid max y: ${this.height}, coordinate given: x: ${newCell.coordinate.x}, y: ${
          newCell.coordinate.y
        }`,
      );
    }

    const newCells = this.cells.map(row =>
      row.map(cell => (cell.coordinate.isEqual(newCell.coordinate) ? newCell : cell)),
    );
    const newGrid = new Grid(this.width, this.height, newCells);

    if (!newCell.isMine && newCell.mineCount === 0) {
      const adjacentCells = this.findAdjacentCells(newGrid, newCell.coordinate);
      return this.manipulateCells(({ cell }) =>
        adjacentCells.includes(cell) ? cell.createVisible() : cell,
      );
    } else {
      return newGrid;
    }
  };

  public manipulateCells = (lambda: (options: GridCellsOptions) => Cell): Grid =>
    new Grid(
      this.width,
      this.height,
      this.cells.map((row, y) => row.map((cell, x) => lambda({ cell, x, y }))),
    );

  /** Find adjacent cells of a zero mine count cell at the given coordinate. */
  private findAdjacentCells = (grid: Grid, coordinate: Coordinate): ReadonlyArray<Cell> => {
    const cells: Cell[] = [];

    const findNonVisibleAdjacentCells = (_coordinate: Coordinate): void => {
      DIRECTIONS.forEach(dir => {
        const xCoor = _coordinate.x + dir.x;
        const yCoor = _coordinate.y + dir.y;
        if (xCoor < 0 || yCoor < 0) {
          return;
        }
        const dirCoor = new Coordinate(xCoor, yCoor);
        if (!dirCoor.isValid(grid.height, grid.width)) {
          return;
        }

        const adjacentCell = grid.cells[dirCoor.y][dirCoor.x];
        if (!adjacentCell.isVisible && !cells.includes(adjacentCell)) {
          cells.push(adjacentCell);
          if (!adjacentCell.isMine && adjacentCell.mineCount === 0) {
            findNonVisibleAdjacentCells(adjacentCell.coordinate);
          }
        }
      });
    };

    findNonVisibleAdjacentCells(coordinate);
    return cells;
  };
}
