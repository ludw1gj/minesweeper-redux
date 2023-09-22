import { CELL_DETONATED, CELL_FLAGGED_MAP, CELL_HIDDEN_MAP, CELL_REVEALED_MAP } from './constants'
import { createRandomNumberGenerator } from './random'
import { Grid, Coordinate, Cell, Difficulty } from './types'

/** The change to a coordinate to adjacent cells. */
const adjacentCellIndexDeltas: ReadonlyArray<Coordinate> = [-1, 0, 1]
  .flatMap((y) => [-1, 0, 1].map((x) => ({ x, y })))
  .filter(({ x, y }) => {
    return !(x === 0 && y === 0)
  })

/** Create an initial grid of water cells. */
export function createInitialGrid(height: number, width: number): Grid {
  return Array(height)
    .fill(Array(width).fill(undefined))
    .map((row) =>
      row.map(() => ({
        status: 'hidden',
        mineCount: 0,
      }))
    )
}

/** Update cell status to Revealed in grid. If cell has a mine count of 0, the adjacent cells will be made revealed. */
export function revealCellInGrid(grid: Grid, atCoordinate: Coordinate): Grid {
  const newGrid: Grid = grid.map((row, y) =>
    row.map((cell, x) =>
      y === atCoordinate.y && x === atCoordinate.x ? CELL_REVEALED_MAP.get(cell.mineCount)! : cell
    )
  )
  const cell = newGrid[atCoordinate.y][atCoordinate.x]
  if (cell.mineCount !== 0) {
    return newGrid
  }
  const adjacentCells = findAdjacentCells(newGrid, atCoordinate)
  return newGrid.map((row, y) =>
    row.map((cell, x) =>
      cell.status !== 'revealed' && adjacentCells.has(`${y}y-${x}x`)
        ? CELL_REVEALED_MAP.get(cell.mineCount)!
        : cell
    )
  )
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlagInGrid(grid: Grid, coordinate: Coordinate): Grid {
  const cell = grid[coordinate.y][coordinate.x]
  if (cell.status !== 'hidden' && cell.status !== 'flagged') {
    return grid
  }

  return grid.map((row, y) =>
    row.map((cell, x) =>
      y === coordinate.y && x === coordinate.x
        ? cell.status === 'flagged'
          ? CELL_HIDDEN_MAP.get(cell.mineCount)!
          : CELL_FLAGGED_MAP.get(cell.mineCount)!
        : cell
    )
  )
}

/** Convert the grid to a win state. Reveals all cells. */
export function revealAllCells(grid: Grid): Grid {
  return grid.map((row) =>
    row.map((cell) => (cell.status !== 'revealed' ? CELL_REVEALED_MAP.get(cell.mineCount)! : cell))
  )
}

/** Fill the grid with mine and water cells. A seed coordinate is needed as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper grid instance.
 */
export function initiateGrid(
  grid: Grid,
  difficulty: Difficulty,
  firstCoordinate: Coordinate,
  randSeed: number
): Grid {
  const mineCoordinates = generateRandonMineCoordinates(
    firstCoordinate,
    difficulty.height,
    difficulty.width,
    difficulty.numMines,
    randSeed
  )

  const createCellAtCoordinate = (coordinate: Coordinate): Cell =>
    mineCoordinates.some((mineCoordinate) => areCoordinatesEqual(mineCoordinate, coordinate))
      ? { status: 'hidden', mineCount: -1 }
      : {
          status: 'hidden',
          mineCount: countAdjacentMines(mineCoordinates, coordinate),
        }

  const newGrid = grid.map((row, y) => row.map((_, x) => createCellAtCoordinate({ x, y })))
  const cell = newGrid[firstCoordinate.y][firstCoordinate.x]
  if (cell.mineCount === -1) {
    console.warn('cell should not be a mine cell', cell, firstCoordinate)
  }
  return revealCellInGrid(newGrid, firstCoordinate)
}

/**
 * Convert the grid to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export function setLoseState(grid: Grid, detonationCoordinate: Coordinate): Grid {
  return grid.map((row, y) =>
    row.map((cell, x) =>
      y === detonationCoordinate.y && x === detonationCoordinate.x
        ? CELL_DETONATED
        : cell.status === 'revealed'
        ? cell
        : CELL_REVEALED_MAP.get(cell.mineCount)!
    )
  )
}

/** Check if the game has been won. */
export function isWinGrid(grid: Grid): boolean {
  const { revealedWaterCells, mines, totalCells } = grid
    .flatMap((row) => row)
    .reduce(
      (totalCount, cell) => ({
        revealedWaterCells:
          cell.status === 'revealed' && cell.mineCount !== -1
            ? totalCount.revealedWaterCells + 1
            : totalCount.revealedWaterCells,
        mines: cell.mineCount === -1 ? totalCount.mines + 1 : totalCount.mines,
        totalCells: totalCount.totalCells + 1,
      }),
      {
        revealedWaterCells: 0,
        mines: 0,
        totalCells: 0,
      }
    )
  return revealedWaterCells === totalCells - mines
}

/** Count amount flagged. */
export function countFlagged(grid: Grid): { numFlagged: number; remainingFlags: number } {
  const { flagged, mines } = grid
    .flatMap((row) => row)
    .reduce(
      (flagCount, cell) => ({
        flagged: cell.status === 'flagged' ? flagCount.flagged + 1 : flagCount.flagged,
        mines: cell.mineCount === -1 ? flagCount.mines + 1 : flagCount.mines,
      }),
      { flagged: 0, mines: 0 }
    )
  return { numFlagged: flagged, remainingFlags: mines - flagged }
}

/** Count the amount of adjacent mines. */
function countAdjacentMines(mineCoordinates: Coordinate[], atCoordinate: Coordinate): number {
  return adjacentCellIndexDeltas.filter(({ x, y }) => {
    const coordinate = { x: atCoordinate.x + x, y: atCoordinate.y + y }
    return (
      coordinate.x >= 0 &&
      coordinate.y >= 0 &&
      mineCoordinates.some((mineCoordinate) => areCoordinatesEqual(mineCoordinate, coordinate))
    )
  }).length
}

/** Check if given coordinates are equal. */
function areCoordinatesEqual(coordinateA: Coordinate, coordinateB: Coordinate): boolean {
  return coordinateA.y === coordinateB.y && coordinateA.x === coordinateB.x
}

/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell
 * with an adjacent mines count of 0, and therefore must not be a mine cell.
 */
function generateRandonMineCoordinates(
  seedCoordinate: Coordinate,
  height: number,
  width: number,
  numMines: number,
  randSeed: number
): Coordinate[] {
  const randomNumberGenerator = createRandomNumberGenerator(randSeed)
  const getRandomMineCoor = (): Coordinate => {
    const randCoor = {
      x: Math.floor(randomNumberGenerator() * width),
      y: Math.floor(randomNumberGenerator() * height),
    }
    if (findCoordinateDistance(seedCoordinate, randCoor) < 2) {
      return getRandomMineCoor()
    }
    return randCoor
  }

  const randomCoordinates: Coordinate[] = []
  while (randomCoordinates.length !== numMines) {
    const randCoor = getRandomMineCoor()
    const count = randomCoordinates.filter((coor) => areCoordinatesEqual(coor, randCoor)).length
    if (count === 0) {
      randomCoordinates.push(randCoor)
    }
  }
  return randomCoordinates
}

/** Find the distance (the amount of steps) between two coordinates. */
function findCoordinateDistance(coordinateA: Coordinate, coordinateB: Coordinate): number {
  const distanceX = Math.abs(coordinateB.x - coordinateA.x)
  const distanceY = Math.abs(coordinateB.y - coordinateA.y)
  const min = Math.min(distanceX, distanceY)
  const max = Math.max(distanceX, distanceY)
  const diagonalSteps = min
  const straightSteps = max - min
  return Math.sqrt(2) * diagonalSteps + straightSteps
}

/** Find adjacent cells of a 0 mine count cell at the given coordinate. */
function findAdjacentCells(grid: Grid, coordinate: Coordinate): ReadonlyMap<string, Cell> {
  const height = grid.length
  const width = grid[0].length

  const adjCells = new Map<string, Cell>()
  const adjCoordinateQueue: Coordinate[] = [coordinate]
  while (adjCoordinateQueue.length > 0) {
    const currCoordinate = adjCoordinateQueue.shift()!

    const coordinateKey = `${currCoordinate.y}y-${currCoordinate.x}x`
    const checked = adjCells.has(coordinateKey)
    if (checked) {
      continue
    }

    const cell = grid[currCoordinate.y][currCoordinate.x]
    adjCells.set(coordinateKey, cell)

    if (cell.mineCount !== 0) {
      continue
    }

    for (let i = 0; i < adjacentCellIndexDeltas.length; i++) {
      const delta = adjacentCellIndexDeltas[i]
      const adjCoordinate = {
        y: currCoordinate.y + delta.y,
        x: currCoordinate.x + delta.x,
      }
      if (
        adjCoordinate.y >= height ||
        adjCoordinate.y < 0 ||
        adjCoordinate.x >= width ||
        adjCoordinate.x < 0
      ) {
        continue
      }
      adjCoordinateQueue.push(adjCoordinate)
    }
  }

  return adjCells
}
