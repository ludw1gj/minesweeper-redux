import { areCoordinatesEqual } from './coordinate'
import { DIRECTIONS } from './directions'
import { Grid, CellStatus, Coordinate, Cell } from './types'
import { create2DArray } from './util'

// todo: this can be used
/** Create an initial grid of water cells. */
export function createInitialGrid(height: number, width: number): Grid {
  return {
    width,
    height,
    cells: create2DArray(height, width).map((row, y) =>
      row.map((_, x) => ({
        coordinate: { x, y },
        status: CellStatus.Hidden,
        mineCount: 0,
        isMine: false,
      })),
    ),
  }
}

/** Find adjacent cells of a 0 mine count cell at the given coordinate. */
export function findAdjacentCells(grid: Grid, coordinate: Coordinate): ReadonlyArray<Cell> {
  const cells: Cell[] = []

  const findNonVisibleAdjacentCells = (coordinate: Coordinate): void => {
    DIRECTIONS.forEach(dir => {
      const adjacentCoordinate = { x: coordinate.x + dir.x, y: coordinate.y + dir.y }
      if (
        adjacentCoordinate.y < 0 ||
        adjacentCoordinate.x < 0 ||
        adjacentCoordinate.y >= grid.height ||
        adjacentCoordinate.x >= grid.width
      ) {
        return
      }

      const adjacentCell = grid.cells[adjacentCoordinate.y][adjacentCoordinate.x]
      if (adjacentCell.status !== CellStatus.Hidden || cells.includes(adjacentCell)) {
        return
      }
      cells.push(adjacentCell)
      if (!adjacentCell.isMine && adjacentCell.mineCount === 0) {
        findNonVisibleAdjacentCells(adjacentCell.coordinate)
      }
    })
  }

  findNonVisibleAdjacentCells(coordinate)
  return cells
}

/** Set cell in grid. If cell has a mine count of 0, the adjacent cells will be made revealed. */
export function setCellInGrid(grid: Grid, newCell: Cell): Grid {
  const newGrid = {
    ...grid,
    cells: grid.cells.map(row =>
      row.map(cell => (areCoordinatesEqual(cell.coordinate, newCell.coordinate) ? newCell : cell)),
    ),
  }

  const isEmptyCell = !newCell.isMine && newCell.mineCount === 0
  if (!isEmptyCell) {
    return newGrid
  }
  const adjacentCells = findAdjacentCells(newGrid, newCell.coordinate)
  return {
    ...newGrid,
    cells: newGrid.cells.map(row =>
      row.map(cell =>
        adjacentCells.includes(cell) ? { ...cell, status: CellStatus.Revealed } : cell,
      ),
    ),
  }
}
