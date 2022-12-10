import { Cell } from './types'

export function isEmptyCell(cell: Cell): boolean {
  return !cell.isMine && cell.mineCount === 0
}
