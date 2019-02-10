import { ICoordinate } from './coordinate';

// TYPES

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

export interface IWaterCell extends ICell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly mineCount: number;
}

export interface IMineCell extends ICell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly isDetonated: boolean;
}

// CREATORS

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

export const createWaterCell = (
  coordinate: ICoordinate,
  isVisible: boolean,
  isFlagged: boolean,
  mineCount: number,
): IWaterCell => ({
  ...createCell(coordinate, isVisible, isFlagged, false),
  mineCount,
});

export const createMineCell = (
  coordinate: ICoordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isDetonated: boolean,
): IMineCell => ({
  ...createCell(coordinate, isVisible, isFlagged, true),
  isDetonated,
});

export const createVisibleCell = (from: ICell): IWaterCell | IMineCell => {
  if (from.isVisible) {
    throw new Error(`tried to make visible an already visible cell, ${from}`);
  }
  return from.isMine
    ? createMineCell(from.coordinate, true, false, false)
    : createWaterCell(from.coordinate, true, false, (from as IWaterCell).mineCount);
};

export const createFlaggedCell = (from: ICell): IWaterCell | IMineCell => {
  if (from.isFlagged) {
    throw new Error(`tried to flag an already flagged cell, ${from}`);
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(from.coordinate, false, true, (from as IWaterCell).mineCount);
};

export const createUnflaggedCell = (from: ICell): IWaterCell | IMineCell => {
  if (!from.isFlagged) {
    throw new Error(`tried to unflag an already unflagged cell', ${from}`);
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(from.coordinate, false, false, (from as IWaterCell).mineCount);
};

/** Create a new detonated instance of the mine cell. */
export const createDetonatedMineCell = (from: IMineCell): IMineCell => {
  if (from.isDetonated) {
    throw new Error(`tried to detonate an already detonated cell, ${from}`);
  }
  return createMineCell(from.coordinate, true, false, true);
};
