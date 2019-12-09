/** Create an initial grid of water cells. */
import { cellIsEmpty, createCell } from "./cell"
import { coordinatesAreEqual, createCoordinate, isValidCoordinate } from "./coordinate"
import { CellStatus, ICell, ICoordinate, IGrid } from "./core-types"
import { DIRECTIONS } from "./directions"
import { IllegalParameterError } from "./errors"
import { arePositiveIntegers, create2DArray } from "./util"

export function createGrid(height: number, width: number): IGrid {
  if (!arePositiveIntegers(height, width)) {
    throw new IllegalParameterError(
      `height and width must be positive whole numbers, height: ${height}, width: ${width}`,
    )
  }
  return create2DArray(height, width).map((row, y) =>
    row.map((_, x) => createCell(createCoordinate(x, y), CellStatus.Hidden, 0)),
  )
}

/** Get cell from grid. */
export function getCellFromGrid(grid: IGrid, coor: ICoordinate): ICell {
  return grid[coor.y][coor.x]
}

/** Set cell in grid. If cell has a mine count of 0, the adjacent cells will be made revealed. */
export function setCellInGrid(grid: IGrid, newCell: ICell, width: number, height: number): IGrid {
  const newGrid = grid.map(row => row
    .map(cell => coordinatesAreEqual(cell.coordinate, newCell.coordinate) ? newCell : cell),
  )

  if (cellIsEmpty(newCell)) {
    const adjacentCells = findAdjacentCells(newGrid, newCell.coordinate, width, height)
    return newGrid.map(row => row.map(cell =>
      adjacentCells.includes(cell) ? { ...cell, status: CellStatus.Revealed } : cell),
    )
  }
  return newGrid
}

/** Find adjacent cells of a 0 mine count cell at the given coordinate. */
function findAdjacentCells(grid: IGrid, coor: ICoordinate, width: number, height: number): ReadonlyArray<ICell> {
  const cells: ICell[] = []

  const findNonVisibleAdjacentCells = (coordinate: ICoordinate): void => {
    DIRECTIONS.forEach(dir => {
      try {
        const dirCoor = { x: coordinate.x + dir.x, y: coordinate.y + dir.y }
        if (!isValidCoordinate(dirCoor, height, width)) {
          return
        }

        const adjacentCell = getCellFromGrid(grid, dirCoor)
        if (adjacentCell.status === CellStatus.Hidden && !cells.includes(adjacentCell)) {
          cells.push(adjacentCell)
          if (!adjacentCell.isMine && adjacentCell.mineCount === 0) {
            findNonVisibleAdjacentCells(adjacentCell.coordinate)
          }
        }
      } catch {
        return
      }
    })
  }

  findNonVisibleAdjacentCells(coor)
  return cells
}
