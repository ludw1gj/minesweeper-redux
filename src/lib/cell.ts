import { Coordinate } from './coordinate';

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

const createCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isMine: boolean
): Cell => ({
  coordinate,
  isVisible,
  isFlagged,
  isMine
});

export const createWaterCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  mineCount: number
): WaterCell => ({
  ...createCell(coordinate, isVisible, isFlagged, false),
  mineCount
});

export const createMineCell = (
  coordinate: Coordinate,
  isVisible: boolean,
  isFlagged: boolean,
  isDetonated: boolean
): MineCell => ({
  ...createCell(coordinate, isVisible, isFlagged, true),
  isDetonated
});

export const createVisibleCell = (from: Cell): WaterCell | MineCell => {
  if (from.isVisible) {
    console.warn('tried to make visible an already visible cell');
  }
  return from.isMine
    ? createMineCell(from.coordinate, true, false, false)
    : createWaterCell(
        from.coordinate,
        true,
        false,
        (<WaterCell>from).mineCount
      );
};

export const createFlaggedCell = (from: Cell): WaterCell | MineCell => {
  if (from.isFlagged) {
    console.warn('tried to flag an already flagged cell');
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(
        from.coordinate,
        false,
        true,
        (<WaterCell>from).mineCount
      );
};

export const createUnflaggedCell = (from: Cell): WaterCell | MineCell => {
  if (!from.isFlagged) {
    console.warn('tried to unflag an already unflagged cell');
  }
  return from.isMine
    ? createMineCell(from.coordinate, false, true, false)
    : createWaterCell(
        from.coordinate,
        false,
        false,
        (<WaterCell>from).mineCount
      );
};

/** Create a new detonated instance of the mine cell. */
export const createDetonatedMineCell = (from: MineCell): MineCell => {
  if (from.isDetonated) {
    console.warn('tried to detonate an already detonated cell');
  }
  return createMineCell(from.coordinate, true, false, true);
};
