import { isMatch } from 'lodash';

import { Coordinate } from './coordinate';
import { DIRECTIONS } from './directions';

// TYPES

export interface Cell {
  /** The coordinated of the cell in the matrix. */
  readonly coordinate: Coordinate;
  /** Whether the cell is visible on the board. */
  readonly isVisible: boolean;
  /** Whether the cell is flagged on the board. */
  readonly isFlagged: boolean;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
}

export interface WaterCell extends Cell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly mineCount: number;
}

export interface MineCell extends Cell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly isDetonated: boolean;
}

// CREATORS

const createCell = (coordinate: Coordinate, isVisible: boolean, isFlagged: boolean, isMine: boolean): Cell => ({
  coordinate,
  isVisible,
  isFlagged,
  isMine,
});

export const createWaterCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  mineCount: number
): WaterCell => ({
  ...createCell(coordinate, isVisible, isFlagged, false),
  mineCount,
});

export const createMineCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isDetonated: boolean
): MineCell => ({
  ...createCell(coordinate, isVisible, isFlagged, true),
  isDetonated,
});

export const createVisibleCell = (from: Cell): WaterCell | MineCell => {
  if (from.isVisible) {
    console.warn('tried to make visible an already visible cell');
  }
  return from.isMine
    ? createMineCell(from.coordinate, true, false, false)
    : createWaterCell(from.coordinate, true, false, (<WaterCell>from).mineCount);
};

export const createFlaggedCell = (from: Cell): WaterCell | MineCell => {
  if (from.isFlagged) {
    console.warn('tried to flag an already flagged cell');
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(from.coordinate, false, true, (<WaterCell>from).mineCount);
};

export const createUnflaggedCell = (from: Cell): WaterCell | MineCell => {
  if (!from.isFlagged) {
    console.warn('tried to unflag an already unflagged cell');
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(from.coordinate, false, false, (<WaterCell>from).mineCount);
};

/** Create a new detonated instance of the mine cell. */
export const createDetonatedMineCell = (from: MineCell): MineCell => {
  if (from.isDetonated) {
    console.warn('tried to detonate an already detonated cell');
  }
  return createMineCell(from.coordinate, true, false, true);
};

// ACTIONS

/** Make cell visible. */
export const makeCellVisible = (cells: Cell[][], cell: Cell): Cell[][] => {
  if (cell.isVisible) {
    console.warn('tried to make already visible cell visible');
    return cells;
  }
  const newCells = setCell(cells, cell.coordinate, createVisibleCell(cell));
  return newCells;
};

/** Make all cells visible. */
export const makeCellsVisible = (cells: Cell[][]): Cell[][] => {
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

/** Make adjacent cells with a zero mine count visible at the given coordinate. Recursive. */
export const makeEmptyAdjacentCellsVisible = (cells: Cell[][], coordinate: Coordinate): Cell[][] => {
  const cellsToReveal = <Coordinate[]>[];
  DIRECTIONS.forEach(dir => {
    const xCor = coordinate.x + dir.x;
    const yCor = coordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const dirCor = new Coordinate(xCor, yCor);

    const adjacentCell = getCell(cells, dirCor);
    if (!adjacentCell) {
      return;
    }
    if (!adjacentCell.isVisible) {
      cellsToReveal.push(dirCor);
    }
    if (!adjacentCell.isMine && (<WaterCell>adjacentCell).mineCount === 0 && !adjacentCell.isVisible) {
      makeEmptyAdjacentCellsVisible(cells, adjacentCell.coordinate);
    }
  });

  const newCells = cells.map(row =>
    row.map(cell => {
      if (isMatch(cellsToReveal, cell.coordinate)) {
        return createVisibleCell(cell);
      }
      return cell;
    })
  );
  return newCells;
};

/** Get cell in matrix. */
export const getCell = (cells: Cell[][], coor: Coordinate): Cell | null => {
  if (!coor.isValidWithinGrid(cells.length, cells[0].length)) {
    console.warn('tried to get cell at invalid coordinate');
    return null;
  }
  return cells[coor.y][coor.x];
};

/** Set cell in matrix. */
export const setCell = (cells: Cell[][], coor: Coordinate, newCell: Cell): Cell[][] => {
  if (!coor.isValidWithinGrid(cells.length, cells[0].length)) {
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
