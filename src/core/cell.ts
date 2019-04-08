import { ICoordinate } from "./coordinate";
import { IllegalParameterError } from "./errors";

/** The status of a cell. */
export enum CellStatus {
  Hidden = "hidden",
  Flagged = "flagged",
  Revealed = "revealed",
  Detonated = "detonated",
}

/** A cell of a minesweeper game. */
export interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: ICoordinate;
  /** The status of the cell. */
  readonly status: CellStatus;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  readonly mineCount: number;
}

export class Cell {
  /** Create a cell. If mineCount is not given, cell is a mine and mineCount will be -1. */
  public static create(coordinate: ICoordinate, status: CellStatus, mineCount?: number): ICell {
    if (mineCount && mineCount < 0) {
      throw new IllegalParameterError("tried to instantiate a cell with mineCount is less than 0.");
    }
    if (mineCount && status === CellStatus.Detonated) {
      throw new IllegalParameterError(
        "tried to instantiate a cell with mineCount and status of detonated.",
      );
    }
    return {
      coordinate,
      status,
      isMine: mineCount === undefined,
      mineCount: mineCount ? mineCount : -1,
    };
  }

  public static changeStatus(cell: ICell, newStatus: CellStatus): ICell {
    if (cell.status === newStatus) {
      throw new IllegalParameterError(
        `tried to make ${newStatus} an already ${newStatus} cell, ${JSON.stringify(cell)}`,
      );
    }
    return cell.isMine
      ? Cell.create(cell.coordinate, newStatus)
      : Cell.create(cell.coordinate, newStatus, cell.mineCount);
  }

  public static isEmpty(cell: ICell): boolean {
    return !cell.isMine && cell.mineCount === 0;
  }

  private constructor() {}
}
