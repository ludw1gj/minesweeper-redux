import { Coordinate } from "./coordinate";
import { IllegalParameterError } from "./errors";

/** The status of a cell. */
export enum CellStatus {
  Hidden = "hidden",
  Flagged = "flagged",
  Revealed = "revealed",
  Detonated = "detonated",
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

/** Change cell's status. */
export const changeCellStatus = (from: Cell, newStatus: CellStatus) => {
  if (from.status === newStatus) {
    throw new IllegalParameterError(
      `tried to make ${newStatus} an already ${newStatus} cell, ${JSON.stringify(from)}`,
    );
  }
  return from.isMine
    ? createMineCell(from.coordinate, newStatus)
    : createWaterCell(from.coordinate, newStatus, from.mineCount);
};
