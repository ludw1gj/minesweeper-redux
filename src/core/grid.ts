import { Cell, CellStatus, createWaterCell, makeRevealedCell } from "./cell";
import { Coordinate, coordinatesAreEqual, createCoordinate, isValidCoordinate } from "./coordinate";
import { DIRECTIONS } from "./directions";
import { IllegalParameterError } from "./errors";
import { arePositiveIntegers, create2DArray } from "./util";

/** A grid made up of cells. */
export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<ReadonlyArray<Cell>>;
}

/** Create an initial grid of water cells. */
export const createInitialGrid = (height: number, width: number): Grid => {
  if (!arePositiveIntegers(height, width)) {
    throw new IllegalParameterError(
      `height and width must be positive whole numbers, height: ${height}, width: ${width}`,
    );
  }
  return {
    width,
    height,
    cells: create2DArray(height, width).map((row, y) =>
      row.map((_, x) => createWaterCell(createCoordinate(x, y), CellStatus.Hidden, 0)),
    ),
  };
};

/**
 * Set cell in grid. If cell has a mine count of 0, the adjacent
 * cells will be made revealed. Returns new grid instance.
 */
export const makeGridWithCell = (from: Grid, newCell: Cell): Grid => {
  if (!isValidCoordinate(newCell.coordinate, from.height, from.width)) {
    throw new IllegalParameterError(
      `tried to set cell at invalid coordinate, grid max x: 
      ${from.width}, grid max y: ${from.height}, coordinate given: x: ${newCell.coordinate.x}, y: ${
        newCell.coordinate.y
      }`,
    );
  }

  const gridWithCellReplaced = {
    ...from,
    cells: from.cells.map(row =>
      row.map(cell => (coordinatesAreEqual(cell.coordinate, newCell.coordinate) ? newCell : cell)),
    ),
  };

  if (!newCell.isMine && newCell.mineCount === 0) {
    const adjacentCells = findAdjacentCells(gridWithCellReplaced, newCell.coordinate);
    return {
      ...gridWithCellReplaced,
      cells: gridWithCellReplaced.cells.map(row =>
        row.map(cell => (adjacentCells.includes(cell) ? makeRevealedCell(cell) : cell)),
      ),
    };
  }
  return gridWithCellReplaced;
};

/** Find adjacent cells of a zero mine count cell at the given coordinate. */
const findAdjacentCells = (grid: Grid, coordinate: Coordinate): ReadonlyArray<Cell> => {
  const cells: Cell[] = [];

  const findNonVisibleAdjacentCells = (coor: Coordinate): void => {
    DIRECTIONS.forEach(dir => {
      const xCoor = coor.x + dir.x;
      const yCoor = coor.y + dir.y;
      if (xCoor < 0 || yCoor < 0) {
        return;
      }
      const dirCoor = createCoordinate(xCoor, yCoor);
      if (!isValidCoordinate(dirCoor, grid.height, grid.width)) {
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

/** Get cell from grid. */
export const getCellFromGrid = (grid: Grid, coor: Coordinate) => {
  if (!isValidCoordinate(coor, grid.height, grid.width)) {
    throw new IllegalParameterError(
      `tried to get cell at invalid coordinate, grid max x: ${grid.width}, grid max y: 
      ${grid.height}, coordinate given: x: ${coor.x}, y: ${coor.y}`,
    );
  }
  return grid.cells[coor.y][coor.x];
};
