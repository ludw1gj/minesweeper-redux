import { createRandomNumberGenerator } from './random'
import { Grid, CellStatus, Coordinate, Cell, Difficulty } from './types'

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
        status: CellStatus.Hidden,
        mineCount: 0,
      }))
    )
}

/** Update cell status to Revealed in grid. If cell has a mine count of 0, the adjacent cells will be made revealed. */
export function revealCellInGrid(grid: Grid, atCoordinate: Coordinate): Grid {
  const newGrid = grid.map((row, y) =>
    row.map((cell, x) =>
      y === atCoordinate.y && x === atCoordinate.x ? { ...cell, status: CellStatus.Revealed } : cell
    )
  )
  const cell = newGrid[atCoordinate.y][atCoordinate.x]
  if (cell.mineCount !== 0) {
    return newGrid
  }
  const adjacentCells = findAdjacentCells(newGrid, atCoordinate)
  return newGrid.map((row) =>
    row.map((cell) =>
      adjacentCells.includes(cell) ? { ...cell, status: CellStatus.Revealed } : cell
    )
  )
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlagInGrid(grid: Grid, coordinate: Coordinate): Grid {
  const cell = grid[coordinate.y][coordinate.x]
  if (cell.status !== CellStatus.Hidden && cell.status !== CellStatus.Flagged) {
    return grid
  }

  return grid.map((row, y) =>
    row.map((cell, x) =>
      y === coordinate.y && x === coordinate.x
        ? {
            ...cell,
            status: cell.status === CellStatus.Flagged ? CellStatus.Hidden : CellStatus.Flagged,
          }
        : cell
    )
  )
}

/** Convert the grid to a win state. Reveals all cells. */
export function revealAllCells(grid: Grid): Grid {
  return grid.map((row) =>
    row.map((cell) =>
      cell.status !== CellStatus.Revealed ? { ...cell, status: CellStatus.Revealed } : cell
    )
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
      ? { status: CellStatus.Hidden, mineCount: -1 }
      : {
          status: CellStatus.Hidden,
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
        ? { ...cell, status: CellStatus.Detonated }
        : cell.status === CellStatus.Revealed
        ? cell
        : { ...cell, status: CellStatus.Revealed }
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
          cell.status === CellStatus.Revealed && cell.mineCount !== -1
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
        flagged: cell.status === CellStatus.Flagged ? flagCount.flagged + 1 : flagCount.flagged,
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
function findAdjacentCells(grid: Grid, coordinate: Coordinate): ReadonlyArray<Cell> {
  const cells: Cell[] = []

  const findNonVisibleAdjacentCells = (coordinate: Coordinate): void => {
    adjacentCellIndexDeltas.forEach(({ x, y }) => {
      const adjacentCoordinate = {
        x: coordinate.x + x,
        y: coordinate.y + y,
      }
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
