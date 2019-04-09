import { Cell, CellStatus, ICell } from "./cell";
import { Coordinate, ICoordinate } from "./coordinate";
import { DIRECTIONS } from "./directions";
import { IllegalParameterError } from "./errors";
import { arePositiveIntegers, create2DArray } from "./util";

/** A grid made up of cells. */
export interface IGrid {
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<ReadonlyArray<ICell>>;
}

export class Grid {
  private constructor() {}

  /** Create an initial grid of water cells. */
  public static create(height: number, width: number): IGrid {
    if (!arePositiveIntegers(height, width)) {
      throw new IllegalParameterError(
        `height and width must be positive whole numbers, height: ${height}, width: ${width}`,
      );
    }
    return {
      width,
      height,
      cells: create2DArray(height, width).map((row, y) =>
        row.map((_, x) => Cell.create(Coordinate.create(x, y), CellStatus.Hidden, 0)),
      ),
    };
  }

  /** Get cell from grid. */
  public static getCell(grid: IGrid, coor: ICoordinate): ICell {
    if (!Coordinate.isValid(coor, grid.height, grid.width)) {
      throw new IllegalParameterError(
        `tried to get cell at invalid coordinate, grid max x: ${grid.width}, grid max y: 
      ${grid.height}, coordinate given: x: ${coor.x}, y: ${coor.y}`,
      );
    }
    return grid.cells[coor.y][coor.x];
  }

  /**
   * Set cell in grid. If cell has a mine count of 0, the adjacent
   * cells will be made revealed. Returns new grid instance.
   */
  public static setCell(grid: IGrid, newCell: ICell): IGrid {
    if (!Coordinate.isValid(newCell.coordinate, grid.height, grid.width)) {
      throw new IllegalParameterError(
        `tried to set cell at invalid coordinate, grid max x: 
      ${grid.width}, grid max y: ${grid.height}, coordinate given: x: ${newCell.coordinate.x}, y: ${
          newCell.coordinate.y
        }`,
      );
    }

    const newGrid = Grid.setCells(
      grid,
      grid.cells.map(row =>
        row.map(cell =>
          Coordinate.areEqual(cell.coordinate, newCell.coordinate) ? newCell : cell,
        ),
      ),
    );

    if (Cell.isEmpty(newCell)) {
      const adjacentCells = Grid.findAdjacentCells(newGrid, newCell.coordinate);
      return Grid.setCells(
        newGrid,
        newGrid.cells.map(row =>
          row.map(cell =>
            adjacentCells.includes(cell) ? Cell.changeStatus(cell, CellStatus.Revealed) : cell,
          ),
        ),
      );
    }
    return newGrid;
  }

  /** Set cells property in grid. */
  public static setCells(grid: IGrid, cells: ReadonlyArray<ReadonlyArray<ICell>>): IGrid {
    return {
      ...grid,
      cells,
    };
  }

  /** Find adjacent cells of a zero mine count cell at the given coordinate. */
  private static findAdjacentCells(grid: IGrid, coor: ICoordinate): ReadonlyArray<Cell> {
    const cells: Cell[] = [];

    const findNonVisibleAdjacentCells = (coordinate: ICoordinate): void => {
      DIRECTIONS.forEach(dir => {
        try {
          const dirCoor = Coordinate.changeBy(coordinate, dir.x, dir.y);
          if (!Coordinate.isValid(dirCoor, grid.height, grid.width)) {
            return;
          }

          const adjacentCell = Grid.getCell(grid, dirCoor);
          if (adjacentCell.status === CellStatus.Hidden && !cells.includes(adjacentCell)) {
            cells.push(adjacentCell);
            if (!adjacentCell.isMine && adjacentCell.mineCount === 0) {
              findNonVisibleAdjacentCells(adjacentCell.coordinate);
            }
          }
        } catch {
          return;
        }
      });
    };

    findNonVisibleAdjacentCells(coor);
    return cells;
  }
}
