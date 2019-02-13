import { Cell, createVisibleCell, createWaterCell, WaterCell } from './cell';
import { Coordinate, createCoordinate, isValidCoordinateWithinGrid } from './coordinate';
import { DIRECTIONS } from './directions';
import { UserError } from './errors';
import { create2DArray } from './util';

// TYPES

/** A grid made up of cells. */
export type Grid = Readonly<Cell[][]>;

// CREATORS

/** Create an initial grid of water cells. */
export const createInitialGrid = (height: number, width: number) =>
  create2DArray(height, width).map((row, y) =>
    row.map((_, x) => createWaterCell(createCoordinate(x, y), false, false, 0)),
  );

// ACTIONS

/** Get cell instance from grid at the given coordinate. */
export const getCell = (grid: Grid, coor: Coordinate): Cell => {
  if (!isValidCoordinateWithinGrid(coor, grid.length, grid[0].length)) {
    throw new UserError(
      `tried to get cell at invalid coordinate, grid max y: ${grid.length}, grid max x: 
      ${grid[0].length}, coordinate given: ${coor}`,
    );
  }
  return grid[coor.y][coor.x];
};

// SETTERS

/** Set cell in grid. Returns new grid instance. */
export const setCell = (grid: Grid, coor: Coordinate, newCell: Cell): Grid => {
  if (!isValidCoordinateWithinGrid(coor, grid.length, grid[0].length)) {
    throw new UserError(
      `tried to set cell at invalid coordinate, grid max y: ${grid.length}, grid max x: 
      ${grid[0].length}, coordinate given: ${coor}`,
    );
  }

  return grid.map((row, y) =>
    row.map((cell, x) => {
      if (y === coor.y && x === coor.x) {
        return newCell;
      }
      return { ...cell };
    }),
  );
};

/** Make cell visible at given coordinate. Returns new grid instance. */
export const setCellVisible = (grid: Grid, cell: Cell): Grid => {
  if (cell.isVisible) {
    throw new UserError(`tried to make already visible cell visible, ${JSON.stringify(cell)}`);
  }
  return setCell(grid, cell.coordinate, createVisibleCell(cell));
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
export const setEmptyAdjacentCellsVisible = (
  grid: Grid,
  coordinate: Coordinate,
  cellCoorsToReveal: Cell[],
): Grid => {
  DIRECTIONS.forEach(dir => {
    const xCor = coordinate.x + dir.x;
    const yCor = coordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const dirCor = createCoordinate(xCor, yCor);

    const adjacentCell = getCell(grid, dirCor);
    if (!adjacentCell) {
      return;
    }
    if (!adjacentCell.isVisible) {
      cellCoorsToReveal.push(adjacentCell);
    }
    if (
      !adjacentCell.isMine &&
      !adjacentCell.isVisible &&
      (adjacentCell as WaterCell).mineCount === 0 &&
      !cellCoorsToReveal.includes(adjacentCell)
    ) {
      setEmptyAdjacentCellsVisible(grid, adjacentCell.coordinate, cellCoorsToReveal);
    }
  });

  return grid.map(row =>
    row.map(cell => {
      if (cellCoorsToReveal.includes(cell)) {
        return createVisibleCell(cell);
      }
      return cell;
    }),
  );
};

/** Count amount of flagged cells. */
export const countFlaggedCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isFlagged).length).reduce((n, acc) => n + acc);

/** Count amount of visible cells. */
export const countVisibleCells = (grid: Grid): number =>
  grid.map(row => row.filter(cell => cell.isVisible).length).reduce((n, acc) => n + acc);
