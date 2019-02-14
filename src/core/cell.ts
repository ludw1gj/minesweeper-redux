import { IllegalParameterError } from '../util/errors';
import { Coordinate } from './coordinate';

// TYPES

/** An abstract cell for water and mine cells. */
interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate;
  /** Whether the cell is visible on the board. */
  readonly isVisible: boolean;
  /** Whether the cell is flagged on the board. */
  readonly isFlagged: boolean;
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

export type Cell = WaterCell | MineCell;

// CREATORS

/** Create a water cell. */
export const createWaterCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  mineCount: number,
): WaterCell => ({
  coordinate,
  isVisible,
  isFlagged,
  mineCount,
  isMine: false,
});

/** Create a mine cell. */
export const createMineCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isDetonated: boolean,
): MineCell => ({
  coordinate,
  isVisible,
  isFlagged,
  isDetonated,
  isMine: true,
});

/** Create a new visible instance of a cell. */
export const createVisibleCell = (from: Cell): Cell => {
  if (from.isVisible) {
    throw new IllegalParameterError(
      `tried to make visible an already visible cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, true, false, false)
    : createWaterCell(from.coordinate, true, false, from.mineCount);
};

/** Create a new flagged instance of a cell. */
export const createFlaggedCell = (from: Cell): Cell => {
  if (from.isFlagged) {
    throw new IllegalParameterError(
      `tried to flag an already flagged cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(from.coordinate, false, true, from.mineCount);
};

/** Create a new unflagged instance of a cell. */
export const createUnflaggedCell = (from: Cell): Cell => {
  if (!from.isFlagged) {
    throw new IllegalParameterError(
      `tried to unflag an already unflagged cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, false, false)
    : createWaterCell(from.coordinate, false, false, from.mineCount);
};

/** Create a new detonated instance of a mine cell. */
export const createDetonatedMineCell = (from: MineCell): MineCell => {
  if (from.isDetonated) {
    throw new IllegalParameterError(
      `tried to detonate an already detonated cell, ${JSON.stringify(from)}`,
    );
  }
  return createMineCell(from.coordinate, true, false, true);
};
