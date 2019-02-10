import { isMatch } from 'lodash';

import { Cell, createVisibleCell, WaterCell } from './cell';
import { Coordinate, createCoordinate, isValidCoordinateWithinGrid } from './coordinate';
import { DIRECTIONS } from './directions';

// TYPES

export type Grid = Cell[][];

// ACTIONS

/** Get cell in matrix. */
export const getCell = (grid: Grid, coor: Coordinate): Cell => {
  if (!isValidCoordinateWithinGrid(coor, grid.length, grid[0].length)) {
    throw new Error(
      `tried to get cell at invalid coordinate, grid max y: ${grid.length}, grid max x: ${
        grid[0].length
      }, coordinate given: ${coor}`
    );
  }
  return grid[coor.y][coor.x];
};

// ACTION CREATORS

/** Make cell visible. */
export const makeCellVisible = (grid: Grid, cell: Cell): Grid => {
  if (cell.isVisible) {
    throw new Error(`tried to make already visible cell visible, ${cell}`);
  }
  const newGrid = setCell(grid, cell.coordinate, createVisibleCell(cell));
  return newGrid;
};

/** Make whole grid visible. */
export const makeGridVisible = (grid: Grid): Grid => {
  const newGrid = grid.map(row =>
    row.map(cell => {
      if (!cell.isVisible) {
        return createVisibleCell(cell);
      } else {
        return cell;
      }
    })
  );
  return newGrid;
};

/** Make adjacent grid with a zero mine count visible at the given coordinate. Recursive. */
export const makeEmptyAdjacentCellsVisible = (grid: Grid, coordinate: Coordinate): Grid => {
  const gridToReveal = <Coordinate[]>[];
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
      gridToReveal.push(dirCor);
    }
    if (
      !adjacentCell.isMine &&
      (<WaterCell>adjacentCell).mineCount === 0 &&
      !adjacentCell.isVisible
    ) {
      makeEmptyAdjacentCellsVisible(grid, adjacentCell.coordinate);
    }
  });

  const newGrid = grid.map(row =>
    row.map(cell => {
      if (isMatch(gridToReveal, cell.coordinate)) {
        return createVisibleCell(cell);
      }
      return cell;
    })
  );
  return newGrid;
};

/** Set cell in matrix. */
export const setCell = (grid: Grid, coor: Coordinate, newCell: Cell): Grid => {
  if (!isValidCoordinateWithinGrid(coor, grid.length, grid[0].length)) {
    throw new Error(
      `tried to set cell at invalid coordinate, grid max y: ${grid.length}, grid max x: ${
        grid[0].length
      }, coordinate given: ${coor}`
    );
  }
  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      if (y === coor.y && x === coor.x) {
        return newCell;
      }
      return { ...cell };
    })
  );
  return newGrid;
};
