import * as _ from 'lodash';
import { Cell, WaterCell, createVisibleCell } from './cell';

import {
  Coordinate,
  createCoordinate,
  isValidCoordinateWithinGrid
} from './coordinate';

import { DIRECTIONS } from './directions';

/** Get cell in matrix. */
export const getCell = (cells: Cell[][], coor: Coordinate): Cell | null => {
  if (!isValidCoordinateWithinGrid(coor, cells.length, cells[0].length)) {
    console.warn('tried to get cell at invalid coordinate');
    return null;
  }
  return cells[coor.y][coor.x];
};

/** Set cell in matrix. */
export const setCell = (
  cells: Cell[][],
  coor: Coordinate,
  newCell: Cell
): Cell[][] => {
  if (!isValidCoordinateWithinGrid(coor, cells.length, cells[0].length)) {
    console.warn('tried to set cell at invalid coordinate');
    return cells;
  }
  const newCells = cells.map((row, y) =>
    row.map((cell, x) => {
      if (y === coor.y && x === coor.x) {
        return newCell;
      }
      return { ...cell };
    })
  );
  return newCells;
};

/** Make cell visible. */
export const revealCell = (cells: Cell[][], cell: Cell): Cell[][] => {
  if (cell.isVisible) {
    console.warn('tried to make already visible cell visible');
    return cells;
  }
  const newCells = setCell(cells, cell.coordinate, createVisibleCell(cell));
  return newCells;
};

/** Make adjacent cells with a zero mine count visible at the given coordinate. Recursive. */
export const revealEmptyAdjacentCells = (
  cells: Cell[][],
  coordinate: Coordinate
): Cell[][] => {
  const cellsToReveal = <Coordinate[]>[];
  DIRECTIONS.forEach(dir => {
    const xCor = coordinate.x + dir.x;
    const yCor = coordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const dirCor = createCoordinate(xCor, yCor);

    const adjacentCell = getCell(cells, dirCor);
    if (!adjacentCell) {
      return;
    }
    if (!adjacentCell.isVisible) {
      cellsToReveal.push(dirCor);
    }
    if (
      !adjacentCell.isMine &&
      (<WaterCell>adjacentCell).mineCount === 0 &&
      !adjacentCell.isVisible
    ) {
      revealEmptyAdjacentCells(cells, adjacentCell.coordinate);
    }
  });

  const newCells = cells.map(row =>
    row.map(cell => {
      if (_.isMatch(cellsToReveal, cell.coordinate)) {
        return createVisibleCell(cell);
      }
      return cell;
    })
  );
  return newCells;
};

/** Make all cells visible. */
export const revealAllCells = (cells: Cell[][]): Cell[][] => {
  const newCells = cells.map(row =>
    row.map(cell => {
      if (!cell.isVisible) {
        return createVisibleCell(cell);
      } else {
        return cell;
      }
    })
  );
  return newCells;
};

export const countFlaggedCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isFlagged)).length;

export const countVisibleCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isVisible)).length;
