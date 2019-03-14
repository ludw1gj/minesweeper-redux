import { IllegalParameterError } from '../util/errors';
import { Cell, createVisibleCell, createWaterCell } from './cell';
import { Coordinate, coordinatesAreEqual, createCoordinate, isValidCoordinate } from './coordinate';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers, create2DArray } from './util';

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
      row.map((_, x) => createWaterCell(createCoordinate(x, y), false, false, 0)),
    ),
  };
};

/** Get cell instance from grid at the given coordinate. */
export const getCell = (grid: Grid, coor: Coordinate): Cell => {
  if (!isValidCoordinate(coor, grid.height, grid.width)) {
    throw new IllegalParameterError(
      `tried to get cell at invalid coordinate, grid max y: ${grid.height - 1}, grid max x: 
      ${grid.width - 1}, coordinate given: y: ${coor.y}. x: ${coor.x}`,
    );
  }
  return grid.cells[coor.y][coor.x];
};

/**
 * Set cell in grid. If cell has a mine count of 0, the adjacent
 * cells will be made visible. Returns new grid instance.
 */
export const setCell = (grid: Grid, newCell: Cell): Grid => {
  if (!isValidCoordinate(newCell.coordinate, grid.height, grid.width)) {
    throw new IllegalParameterError(
      `tried to set cell at invalid coordinate, grid max x: 
      ${grid.width}, grid max y: ${grid.height}, coordinate given: x: ${newCell.coordinate.x}, y: ${
        newCell.coordinate.y
      }`,
    );
  }

  const _grid = {
    ...grid,
    cells: grid.cells.map(row =>
      row.map(cell => (coordinatesAreEqual(cell.coordinate, newCell.coordinate) ? newCell : cell)),
    ),
  };

  if (!newCell.isMine && newCell.mineCount === 0) {
    const adjacentCells = findAdjacentCells(_grid, newCell.coordinate);
    return {
      ..._grid,
      cells: _grid.cells.map(row =>
        row.map(cell => (adjacentCells.includes(cell) ? createVisibleCell(cell) : cell)),
      ),
    };
  } else {
    return _grid;
  }
};

/** Make whole grid visible. Returns new grid instance. */
export const setCellsVisible = (grid: Grid): Grid => ({
  ...grid,
  cells: grid.cells.map(row => row.map(cell => (!cell.isVisible ? createVisibleCell(cell) : cell))),
});

/** Find adjacent cells of a zero mine count cell at the given coordinate. */
export const findAdjacentCells = (grid: Grid, coordinate: Coordinate): ReadonlyArray<Cell> => {
  const findNonVisibleAdjacentCells = (_grid: Grid, _coordinate: Coordinate, _cells: Cell[]): void => {
    DIRECTIONS.forEach(dir => {
      const xCoor = _coordinate.x + dir.x;
      const yCoor = _coordinate.y + dir.y;
      if (xCoor < 0 || yCoor < 0) {
        return;
      }
      const dirCoor = createCoordinate(xCoor, yCoor);
      if (!isValidCoordinate(dirCoor, _grid.height, _grid.width)) {
        return;
      }

      const adjacentCell = getCell(_grid, dirCoor);
      if (!adjacentCell.isVisible && !_cells.includes(adjacentCell)) {
        _cells.push(adjacentCell);
        if (!adjacentCell.isMine && adjacentCell.mineCount === 0) {
          findNonVisibleAdjacentCells(_grid, adjacentCell.coordinate, _cells);
        }
      }
    });
  };
  const cells = [] as Cell[];
  findNonVisibleAdjacentCells(grid, coordinate, cells);
  return cells;
};

/** Count amount of flagged cells. */
export const countFlaggedCells = (grid: Grid): number =>
  grid.cells.map(row => row.filter(cell => cell.isFlagged).length).reduce((n, acc) => n + acc);
