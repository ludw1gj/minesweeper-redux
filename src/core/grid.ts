import { IllegalParameterError } from '../util/errors';
import { Cell, CellStatus, ICell } from './cell';
import { Coordinate, ICoordinate } from './coordinate';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers, create2DArray } from './util';

/** A grid made up of cells. */
export interface IGrid {
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<ReadonlyArray<ICell>>;
}

export class Grid {
  /** Create an initial grid of water cells. */
  public static createInitial = (height: number, width: number): IGrid => {
    if (!arePositiveIntegers(height, width)) {
      throw new IllegalParameterError(
        `height and width must be positive whole numbers, height: ${height}, width: ${width}`,
      );
    }
    return {
      width,
      height,
      cells: create2DArray(height, width).map((row, y) =>
        row.map((_, x) => Cell.createWaterCell(Coordinate.create(x, y), CellStatus.Hidden, 0)),
      ),
    };
  };

  /**
   * Set cell in grid. If cell has a mine count of 0, the adjacent
   * cells will be made revealed. Returns new grid instance.
   */
  public static makeWithCell = (from: IGrid, newCell: ICell): IGrid => {
    if (!Coordinate.validate(newCell.coordinate, from.height, from.width)) {
      throw new IllegalParameterError(
        `tried to set cell at invalid coordinate, grid max x: 
      ${from.width}, grid max y: ${from.height}, coordinate given: x: ${newCell.coordinate.x}, y: ${
          newCell.coordinate.y
        }`,
      );
    }

    const _grid = {
      ...from,
      cells: from.cells.map(row =>
        row.map(cell =>
          Coordinate.areEqual(cell.coordinate, newCell.coordinate) ? newCell : cell,
        ),
      ),
    };

    if (!newCell.isMine && newCell.mineCount === 0) {
      const adjacentCells = Grid.findAdjacentCells(_grid, newCell.coordinate);
      return {
        ..._grid,
        cells: _grid.cells.map(row =>
          row.map(cell => (adjacentCells.includes(cell) ? Cell.makeRevealed(cell) : cell)),
        ),
      };
    }
    return _grid;
  };

  /** Find adjacent cells of a zero mine count cell at the given coordinate. */
  private static findAdjacentCells = (
    grid: IGrid,
    coordinate: ICoordinate,
  ): ReadonlyArray<ICell> => {
    const cells: ICell[] = [];

    const findNonVisibleAdjacentCells = (_coordinate: ICoordinate): void => {
      DIRECTIONS.forEach(dir => {
        const xCoor = _coordinate.x + dir.x;
        const yCoor = _coordinate.y + dir.y;
        if (xCoor < 0 || yCoor < 0) {
          return;
        }
        const dirCoor = Coordinate.create(xCoor, yCoor);
        if (!Coordinate.validate(dirCoor, grid.height, grid.width)) {
          return;
        }

        const adjacentCell = grid.cells[dirCoor.y][dirCoor.x];
        if (adjacentCell.status === CellStatus.Hidden && !cells.includes(adjacentCell)) {
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
