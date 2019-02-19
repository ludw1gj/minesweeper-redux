import { IllegalParameterError } from '../util/errors';
import { Cell, createVisibleCell, createWaterCell } from './cell';
import { Coordinate, createCoordinate, isValidCoordinate } from './coordinate';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers, create2DArray } from './util';

/** A grid made up of cells. */
export type Grid = ReadonlyArray<ReadonlyArray<Cell>>;

/** Create an initial grid of water cells. */
export const createInitialGrid = (height: number, width: number): Grid => {
  if (!arePositiveIntegers(height, width)) {
    throw new IllegalParameterError(
      `height and width must be positive whole numbers, height: ${height}, width: ${width}`,
    );
  }
  return create2DArray(height, width).map((row, y) =>
    row.map((_, x) => createWaterCell(createCoordinate(x, y), false, false, 0)),
  );
};

/** Get cell instance from grid at the given coordinate. */
export const getCell = (grid: Grid, coor: Coordinate): Cell => {
  if (!isValidCoordinate(coor, grid.length, grid[0].length)) {
    throw new IllegalParameterError(
      `tried to get cell at invalid coordinate, grid max y: ${grid.length - 1}, grid max x: 
      ${grid[0].length - 1}, coordinate given: y: ${coor.y}. x: ${coor.x}`,
    );
  }
  return grid[coor.y][coor.x];
};

/** Set cell in grid. Returns new grid instance. */
export const setCell = (grid: Grid, newCell: Cell) => {
  if (!isValidCoordinate(newCell.coordinate, grid.length, grid[0].length)) {
    throw new IllegalParameterError(
      `tried to set cell at invalid coordinate, grid max x: 
      ${grid[0].length}, grid max y: ${grid.length}, coordinate given: x: ${
        newCell.coordinate.x
      }, y: ${newCell.coordinate.y}`,
    );
  }

  const _grid = grid.map(row =>
    row.map(cell => {
      if (
        cell.coordinate.y === newCell.coordinate.y &&
        cell.coordinate.x === newCell.coordinate.x
      ) {
        return newCell;
      }
      return cell;
    }),
  );

  if (!newCell.isMine && newCell.mineCount === 0) {
    const cells = findAdjacentCells(_grid, newCell.coordinate, []);
    return _grid.map(row =>
      row.map(cell => (cells.includes(cell) ? createVisibleCell(cell) : cell)),
    );
  }
  return _grid;
};

/** Make whole grid visible. Returns new grid instance. */
export const setCellsVisible = (grid: Grid): Grid =>
  grid.map(row => row.map(cell => (!cell.isVisible ? createVisibleCell(cell) : cell)));

/** Find adjacent cells of a zero mine count cell at the given coordinate. Recursive. */
export const findAdjacentCells = (
  grid: Grid,
  coordinate: Coordinate,
  cells: ReadonlyArray<Cell>,
): ReadonlyArray<Cell> => {
  DIRECTIONS.forEach(dir => {
    const xCoor = coordinate.x + dir.x;
    const yCoor = coordinate.y + dir.y;
    if (xCoor < 0 || yCoor < 0) {
      return;
    }
    const dirCoor = createCoordinate(xCoor, yCoor);
    if (!isValidCoordinate(dirCoor, grid.length, grid[0].length)) {
      return;
    }

    const adjacentCell = getCell(grid, dirCoor);
    if (!adjacentCell.isVisible && !cells.includes(adjacentCell)) {
      cells = [...cells, adjacentCell];

      if (!adjacentCell.isMine && adjacentCell.mineCount === 0) {
        cells = findAdjacentCells(grid, adjacentCell.coordinate, cells);
      }
    }
  });
  return cells;
};

/** Count amount of flagged cells. */
export const countFlaggedCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isFlagged).length).reduce((n, acc) => n + acc);
