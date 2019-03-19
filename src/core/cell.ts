import { IllegalParameterError } from '../util/errors';
import { Coordinate } from './coordinate';

export enum CellStatus {
  HIDDEN = 'HIDDEN',
  FLAGGED = 'FLAGGED',
  REVEALED = 'REVEALED',
}

/** An abstract cell for water and mine cells. */
interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate;
  /** The status of the cell. */
  readonly status: CellStatus;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
}

/** A water cell. */
export interface WaterCell extends ICell {
  /** Is mine is always false. */
  readonly isMine: false;
  /** The amount of adjacent mines surrounding the cell. */
  readonly mineCount: number;
}

/** A mine cell. */
export interface MineCell extends ICell {
  /** Is mine is always true. */
  readonly isMine: true;
  /** The amount of adjacent mines surrounding the cell. */
  readonly isDetonated: boolean;
}

/** A cell of either a Water or Mine type. */
export type Cell = WaterCell | MineCell;

/** Create a water cell. */
export const createWaterCell = (
  coordinate: Coordinate,
  status: CellStatus,
  mineCount: number,
): WaterCell => ({
  coordinate,
  status,
  isMine: false,
  mineCount,
});

/** Create a mine cell. */
export const createMineCell = (
  coordinate: Coordinate,
  status: CellStatus,
  isDetonated: boolean,
): MineCell => ({
  coordinate,
  status,
  isMine: true,
  isDetonated,
});

/** Create a new hidden instance of a cell. */
export const makeHiddenCell = (from: Cell): Cell => {
  if (from.status === CellStatus.HIDDEN) {
    throw new IllegalParameterError(
      `tried to make hidden an already hidden cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.HIDDEN, false)
    : createWaterCell(from.coordinate, CellStatus.HIDDEN, from.mineCount);
};

/** Create a new flagged instance of a cell. */
export const makeFlaggedCell = (from: Cell): Cell => {
  if (from.status === CellStatus.FLAGGED) {
    throw new IllegalParameterError(
      `tried to make flagged an already flagged cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.FLAGGED, false)
    : createWaterCell(from.coordinate, CellStatus.FLAGGED, from.mineCount);
};

/** Create a new revealed instance of a cell. */
export const makeRevealedCell = (from: Cell): Cell => {
  if (from.status === CellStatus.REVEALED) {
    throw new IllegalParameterError(
      `tried to make revealed an already revealed cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.REVEALED, false)
    : createWaterCell(from.coordinate, CellStatus.REVEALED, from.mineCount);
};

/** Create a new detonated instance of a mine cell. */
export const makeDetonatedMineCell = (from: MineCell): MineCell => {
  if (from.isDetonated) {
    throw new IllegalParameterError(
      `tried to detonate an already detonated cell, ${JSON.stringify(from)}`,
    );
  }
  return createMineCell(from.coordinate, CellStatus.REVEALED, true);
};
