import { IllegalParameterError } from '../util/errors';
import { Coordinate } from './coordinate';

/** The status of a cell. */
export enum CellStatus {
  Hidden = 'HIDDEN',
  Flagged = 'FLAGGED',
  Revealed = 'REVEALED',
}

/** An abstract cell for water and mine cells. */
interface IAbstractCell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate;
  /** The status of the cell. */
  readonly status: CellStatus;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
}

/** A water cell. */
export interface IWaterCell extends IAbstractCell {
  /** Is mine is always false. */
  readonly isMine: false;
  /** The amount of adjacent mines surrounding the cell. */
  readonly mineCount: number;
}

/** A mine cell. */
export interface IMineCell extends IAbstractCell {
  /** Is mine is always true. */
  readonly isMine: true;
  /** The amount of adjacent mines surrounding the cell. */
  readonly isDetonated: boolean;
}

/** A cell of either a Water or Mine type. */
export type ICell = IWaterCell | IMineCell;

/** Create a water cell. */
const createWaterCell = (
  coordinate: Coordinate,
  status: CellStatus,
  mineCount: number,
): IWaterCell => ({
  coordinate,
  status,
  isMine: false,
  mineCount,
});

/** Create a mine cell. */
const createMineCell = (
  coordinate: Coordinate,
  status: CellStatus,
  isDetonated: boolean,
): IMineCell => ({
  coordinate,
  status,
  isMine: true,
  isDetonated,
});

/** Create a new hidden instance of a cell. */
const makeHidden = (from: ICell): ICell => {
  if (from.status === CellStatus.Hidden) {
    throw new IllegalParameterError(
      `tried to make hidden an already hidden cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.Hidden, false)
    : createWaterCell(from.coordinate, CellStatus.Hidden, from.mineCount);
};

/** Create a new flagged instance of a cell. */
const makeFlagged = (from: ICell): ICell => {
  if (from.status === CellStatus.Flagged) {
    throw new IllegalParameterError(
      `tried to make flagged an already flagged cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.Flagged, false)
    : createWaterCell(from.coordinate, CellStatus.Flagged, from.mineCount);
};

/** Create a new revealed instance of a cell. */
const makeRevealed = (from: ICell): ICell => {
  if (from.status === CellStatus.Revealed) {
    throw new IllegalParameterError(
      `tried to make revealed an already revealed cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, CellStatus.Revealed, false)
    : createWaterCell(from.coordinate, CellStatus.Revealed, from.mineCount);
};

/** Create a new detonated instance of a mine cell. */
const makeDetonatedMineCell = (from: IMineCell): IMineCell => {
  if (from.isDetonated) {
    throw new IllegalParameterError(
      `tried to detonate an already detonated cell, ${JSON.stringify(from)}`,
    );
  }
  return createMineCell(from.coordinate, CellStatus.Revealed, true);
};

export default {
  createWaterCell,
  createMineCell,
  makeHidden,
  makeFlagged,
  makeRevealed,
  makeDetonatedMineCell,
};
