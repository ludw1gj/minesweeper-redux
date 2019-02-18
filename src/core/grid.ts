import { IllegalParameterError } from '../util/errors';
import { Cell, createVisibleCell, createWaterCell } from './cell';
import { Coordinate, createCoordinate, isValidCoordinate } from './coordinate';
import { DIRECTIONS } from './directions';
import { arePositiveIntegers, create2DArray } from './util';

/** A grid made up of cells. */
export type Grid = Cell[][];

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
export const setCell = (grid: Grid, newCell: Cell): Grid => {
  if (!isValidCoordinate(newCell.coordinate, grid.length, grid[0].length)) {
    throw new IllegalParameterError(
      `tried to set cell at invalid coordinate, grid max x: 
      ${grid[0].length}, grid max y: ${grid.length}, coordinate given: x: ${
        newCell.coordinate.x
      }, y: ${newCell.coordinate.y} `,
    );
  }

  const _grid = grid.map((row, y) =>
    row.map((cell, x) => {
      if (y === newCell.coordinate.y && x === newCell.coordinate.x) {
        return newCell;
      }
      return cell;
    }),
  );

  if (!newCell.isMine && newCell.mineCount === 0) {
    return setEmptyAdjacentCellsVisible(_grid, newCell.coordinate);
  }
  return _grid;
};

/** Make whole grid visible. Returns new grid instance. */
export const setCellsVisible = (grid: Grid): Grid =>
  grid.map(row =>
    row.map(cell => {
      if (!cell.isVisible) {
        return createVisibleCell(cell);
      } else {
        return cell;
      }
    }),
  );

/** Make adjacent cells with a zero mine count visible at the given coordinate. Recursive. Returns
 * new grid instance.
 */
export const setEmptyAdjacentCellsVisible = (grid: Grid, coordinate: Coordinate): Grid => {
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
    if (!adjacentCell.isVisible) {
      grid[dirCoor.y][dirCoor.x] = createVisibleCell(adjacentCell);
    }
    if (!adjacentCell.isMine && adjacentCell.mineCount === 0 && !adjacentCell.isVisible) {
      setEmptyAdjacentCellsVisible(grid, adjacentCell.coordinate);
    }
  });
  return grid.map(row => row.map(cell => cell));
};

/** Count amount of flagged cells. */
export const countFlaggedCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isFlagged).length).reduce((n, acc) => n + acc);

/** Count amount of visible cells. */
export const countVisibleCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isVisible).length).reduce((n, acc) => n + acc);
