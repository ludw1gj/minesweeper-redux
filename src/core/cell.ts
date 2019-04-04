import { Coordinate } from './coordinate';
import { IllegalParameterError } from './errors';

/** The status of a cell. */
export enum CellStatus {
  Hidden = 'hidden',
  Flagged = 'flagged',
  Revealed = 'revealed',
  Detonated = 'detonated',
}

/** A cell of a minesweeper game. */
export interface Cell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate;
  /** The status of the cell. */
  readonly status: CellStatus;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  readonly mineCount: number;
}

/** Create a water cell. */
export const createWaterCell = (
  coordinate: Coordinate,
  status: CellStatus,
  mineCount: number,
): Cell => ({
  coordinate,
  status,
  isMine: false,
  mineCount,
});

/** Create a mine cell. */
export const createMineCell = (coordinate: Coordinate, status: CellStatus): Cell => ({
  coordinate,
  status,
  isMine: true,
  mineCount: -1,
});

/** Create a new hidden instance of a cell. */
export const makeHiddenCell = (from: Cell): Cell => {
  if (from.status === CellStatus.Hidden) {
    throw new IllegalParameterError(
      `tried to make hidden an already hidden cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.Hidden)
    : createWaterCell(from.coordinate, CellStatus.Hidden, from.mineCount);
};

/** Create a new flagged instance of a cell. */
export const makeFlaggedCell = (from: Cell): Cell => {
  if (from.status === CellStatus.Flagged) {
    throw new IllegalParameterError(
      `tried to make flagged an already flagged cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.Flagged)
    : createWaterCell(from.coordinate, CellStatus.Flagged, from.mineCount);
};

/** Create a new revealed instance of a cell. */
export const makeRevealedCell = (from: Cell): Cell => {
  if (from.status === CellStatus.Revealed) {
    throw new IllegalParameterError(
      `tried to make revealed an already revealed cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.Revealed)
    : createWaterCell(from.coordinate, CellStatus.Revealed, from.mineCount);
};

/** Create a new detonated instance of a cell. */
export const makeDetonatedCell = (from: Cell): Cell => {
  if (from.status === CellStatus.Detonated) {
    throw new IllegalParameterError(
      `tried to detonate an already detonated cell, ${JSON.stringify(from)}`,
    );
  }
  return createMineCell(from.coordinate, CellStatus.Detonated);
};
