import { Cell, CellStatus, Coordinate } from "./core-types"
import { IllegalParameterError } from "./errors"

/** Create a cell. If mineCount is not given, cell is a mine and mineCount will be -1. */
export function createCell(coordinate: Coordinate, status: CellStatus, mineCount?: number): Cell {
  if (mineCount && mineCount < 0) {
    throw new IllegalParameterError("tried to instantiate a cell with mineCount is less than 0.")
  }
  if (mineCount && status === CellStatus.Detonated) {
    throw new IllegalParameterError(
      "tried to instantiate a cell with mineCount and status of detonated.",
    )
  }
  return {
    coordinate,
    status,
    isMine: mineCount === undefined,
    mineCount: mineCount !== undefined ? mineCount : -1,
  }
}

/** Change cell's status. */
export function changeCellStatus(cell: Cell, newStatus: CellStatus): Cell {
  if (cell.status === newStatus) {
    throw new IllegalParameterError(
      `tried to make ${newStatus} an already ${newStatus} cell, ${JSON.stringify(cell)}`,
    )
  }
  return cell.isMine
    ? createCell(cell.coordinate, newStatus)
    : createCell(cell.coordinate, newStatus, cell.mineCount)
}

/** Check if cell is an empty cell. */
export function cellIsEmpty(cell: Cell): boolean {
  return !cell.isMine && cell.mineCount === 0
}
