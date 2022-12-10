import { areCoordinatesEqual } from './coordinate'
import { DIRECTIONS } from './directions'
import { Grid, CellStatus, Coordinate, Cell } from './types'
import { create2DArray } from './util'

// todo: this can be used
/** Create an initial grid of water cells. */
export function createInitialGrid(height: number, width: number): Grid {
  return create2DArray(height, width).map((row, y) =>
    row.map((_, x) => ({
      coordinate: { x, y },
      status: CellStatus.Hidden,
      mineCount: 0,
      isMine: false,
    })),
  )
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
        adjacentCoordinate.y >= grid.length ||
        adjacentCoordinate.x >= grid[0].length
      ) {
        return
      }

      const adjacentCell = grid[adjacentCoordinate.y][adjacentCoordinate.x]
      if (adjacentCell.status !== CellStatus.Hidden || cells.includes(adjacentCell)) {
        return
      }
      cells.push(adjacentCell)
      if (adjacentCell.mineCount === 0) {
        findNonVisibleAdjacentCells(adjacentCoordinate)
      }
    })
  }

  findNonVisibleAdjacentCells(coordinate)
  return cells
}

// todo: change to 'change cell status'
/** Set cell in grid. If cell has a mine count of 0, the adjacent cells will be made revealed. */
export function setCellInGrid(grid: Grid, newCell: Cell, atCoordinate: Coordinate): Grid {
  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => (y === atCoordinate.y && x === atCoordinate.x ? newCell : cell)),
  )

  if (newCell.mineCount !== 0) {
    return newGrid
  }
  const adjacentCells = findAdjacentCells(newGrid, atCoordinate)
  return newGrid.map(row =>
    row.map(cell =>
      adjacentCells.includes(cell) ? { ...cell, status: CellStatus.Revealed } : cell,
    ),
  )
}

/** Count the amount of adjacent mines. */
export function countAdjacentMines(
  mineCoordinates: Coordinate[],
  atCoordinate: Coordinate,
): number {
  return DIRECTIONS.filter(dir => {
    const coordinate = { x: atCoordinate.x + dir.x, y: atCoordinate.y + dir.y }
    return (
      coordinate.x >= 0 &&
      coordinate.y >= 0 &&
      mineCoordinates.some(mineCoordinate => areCoordinatesEqual(mineCoordinate, coordinate))
    )
  }).length
}
