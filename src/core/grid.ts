import { createVisibleCell, ICell, IWaterCell } from './cell';
import { createCoordinate, ICoordinate, isValidCoordinateWithinGrid } from './coordinate';
import { DIRECTIONS } from './directions';

// TYPES

/** A grid made up of cells. */
export type Grid = Readonly<ICell[][]>;

// ACTIONS

/** Get cell instance from grid at the given coordinate. */
export const getCell = (grid: Grid, coor: ICoordinate): ICell => {
  if (!isValidCoordinateWithinGrid(coor, grid.length, grid[0].length)) {
    throw new Error(
      `tried to get cell at invalid coordinate, grid max y: ${grid.length}, grid max x: 
      ${grid[0].length}, coordinate given: ${coor}`,
    );
  }
  return grid[coor.y][coor.x];
};

// SETTERS

/** Set cell in grid. Returns new grid instance. */
export const setCell = (grid: Grid, coor: ICoordinate, newCell: ICell): Grid => {
  if (!isValidCoordinateWithinGrid(coor, grid.length, grid[0].length)) {
    throw new Error(
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
export const setCellVisible = (grid: Grid, cell: ICell): Grid => {
  if (cell.isVisible) {
    throw new Error(`tried to make already visible cell visible, ${JSON.stringify(cell)}`);
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

/** Make adjacent grid with a zero mine count visible at the given coordinate. Recursive. Returns
 * new grid instance.
 */
export const setEmptyAdjacentCellsVisible = (
  grid: Grid,
  coordinate: ICoordinate,
  cellCoorsToReveal: ICell[],
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
      (adjacentCell as IWaterCell).mineCount === 0 &&
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
