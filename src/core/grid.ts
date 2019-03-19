import { IllegalParameterError } from '../util/errors';
import { Cell, CellStatus, createWaterCell, makeRevealedCell } from './cell';
import { Coordinate, coordinatesAreEqual, createCoordinate, isValidCoordinate } from './coordinate';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers, create2DArray } from './util';

/** A grid made up of cells. */
export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: Cell[][];
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
      row.map((_, x) => createWaterCell(createCoordinate(x, y), CellStatus.HIDDEN, 0)),
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

  const _grid = {
    ...from,
    cells: from.cells.map(row =>
      row.map(cell => (coordinatesAreEqual(cell.coordinate, newCell.coordinate) ? newCell : cell)),
    ),
  };

  if (!newCell.isMine && newCell.mineCount === 0) {
    const adjacentCells = findAdjacentCells(_grid, newCell.coordinate);
    return {
      ..._grid,
      cells: _grid.cells.map(row =>
        row.map(cell => (adjacentCells.includes(cell) ? makeRevealedCell(cell) : cell)),
      ),
    };
  }
  return _grid;
};

/** Find adjacent cells of a zero mine count cell at the given coordinate. */
const findAdjacentCells = (grid: Grid, coordinate: Coordinate): ReadonlyArray<Cell> => {
  const cells: Cell[] = [];

  const findNonVisibleAdjacentCells = (_coordinate: Coordinate): void => {
    DIRECTIONS.forEach(dir => {
      const xCoor = _coordinate.x + dir.x;
      const yCoor = _coordinate.y + dir.y;
      if (xCoor < 0 || yCoor < 0) {
        return;
      }
      const dirCoor = createCoordinate(xCoor, yCoor);
      if (!isValidCoordinate(dirCoor, grid.height, grid.width)) {
        return;
      }

      const adjacentCell = grid.cells[dirCoor.y][dirCoor.x];
      if (adjacentCell.status === CellStatus.HIDDEN && !cells.includes(adjacentCell)) {
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
