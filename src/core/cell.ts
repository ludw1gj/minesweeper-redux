import { ICoordinate } from './coordinate';
import { UserError } from './errors';

// TYPES

/** An abstract cell for water and mine cells. */
export interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: ICoordinate;
  /** Whether the cell is visible on the board. */
  readonly isVisible: boolean;
  /** Whether the cell is flagged on the board. */
  readonly isFlagged: boolean;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
}

/** A water cell. */
export interface IWaterCell extends ICell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly mineCount: number;
}

/** A mine cell. */
export interface IMineCell extends ICell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly isDetonated: boolean;
}

// CREATORS

/** Create a basic cell. */
const createCell = (
  coordinate: ICoordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isMine: boolean,
): ICell => ({
  coordinate,
  isMine,
  isFlagged,
  isVisible,
});

/** Create a water cell. */
export const createWaterCell = (
  coordinate: ICoordinate,
  isVisible: boolean,
  isFlagged: boolean,
  mineCount: number,
): IWaterCell => ({
  ...createCell(coordinate, isVisible, isFlagged, false),
  mineCount,
});

/** Create a mine cell. */
export const createMineCell = (
  coordinate: ICoordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isDetonated: boolean,
): IMineCell => ({
  ...createCell(coordinate, isVisible, isFlagged, true),
  isDetonated,
});

/** Create a new visible instance of a cell. */
export const createVisibleCell = (from: ICell): IWaterCell | IMineCell => {
  if (from.isVisible) {
    throw new UserError(`tried to make visible an already visible cell, ${JSON.stringify(from)}`);
  }
  return from.isMine
    ? createMineCell(from.coordinate, true, false, false)
    : createWaterCell(from.coordinate, true, false, (from as IWaterCell).mineCount);
};

/** Create a new flagged instance of a cell. */
export const createFlaggedCell = (from: ICell): IWaterCell | IMineCell => {
  if (from.isFlagged) {
    throw new UserError(`tried to flag an already flagged cell, ${JSON.stringify(from)}`);
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(from.coordinate, false, true, (from as IWaterCell).mineCount);
};

/** Create a new unflagged instance of a cell. */
export const createUnflaggedCell = (from: ICell): IWaterCell | IMineCell => {
  if (!from.isFlagged) {
    throw new UserError(`tried to unflag an already unflagged cell', ${JSON.stringify(from)}`);
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, false, false)
    : createWaterCell(from.coordinate, false, false, (from as IWaterCell).mineCount);
};

/** Create a new detonated instance of a mine cell. */
export const createDetonatedMineCell = (from: IMineCell): IMineCell => {
  if (from.isDetonated) {
    throw new UserError(`tried to detonate an already detonated cell, ${JSON.stringify(from)}`);
  }
  return createMineCell(from.coordinate, true, false, true);
};
