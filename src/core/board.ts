import { areCoordinatesEqual, findCoordinateDistance } from './coordinate'
import { IllegalStateError } from './errors'
import { countAdjacentMines, setCellInGrid } from './grid'
import { Coordinate, Cell, CellStatus, Difficulty, Grid, RandomNumberGenerator } from './types'

/** Fill the grid with mine and water cells. A seed coordinate is needed as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export function initiateBoard(
  grid: Grid,
  difficulty: Difficulty,
  firstCoordinate: Coordinate,
  randomNumberGenerator: RandomNumberGenerator,
): Grid {
  const mineCoordinates = generateRandonMineCoordinates(
    firstCoordinate,
    difficulty.height,
    difficulty.width,
    difficulty.numMines,
    randomNumberGenerator,
  )

  const createCellAtCoordinate = (coordinate: Coordinate): Cell =>
    mineCoordinates.some(mineCoordinate => areCoordinatesEqual(mineCoordinate, coordinate))
      ? { coordinate, status: CellStatus.Hidden, isMine: true, mineCount: -1 }
      : {
          coordinate,
          status: CellStatus.Hidden,
          mineCount: countAdjacentMines(mineCoordinates, coordinate),
          isMine: false,
        }

  const newGrid = grid.map((row, y) => row.map((_, x) => createCellAtCoordinate({ x, y })))
  const cell = newGrid[firstCoordinate.y][firstCoordinate.x]
  if (cell.isMine) {
    throw new IllegalStateError('cell should not be a mine cell')
  }
  return setCellInGrid(newGrid, { ...cell, status: CellStatus.Revealed })
}

/** Convert the grid to a win state. Reveals all cells. */
export function revealAllCells(grid: Grid): Grid {
  return grid.map(row =>
    row.map(cell =>
      cell.status === CellStatus.Revealed ? cell : { ...cell, status: CellStatus.Revealed },
    ),
  )
}

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export function setLoseState(grid: Grid, loosingCell: Cell): Grid {
  return grid.map(row =>
    row.map(cell =>
      areCoordinatesEqual(cell.coordinate, loosingCell.coordinate)
        ? { ...cell, status: CellStatus.Detonated }
        : cell.status === CellStatus.Revealed
        ? cell
        : { ...cell, status: CellStatus.Revealed },
    ),
  )
}

/** Check if the game has been won. */
export function isWinBoard(grid: Grid): boolean {
  const { revealedWaterCells, mines, totalCells } = grid
    .flatMap(row => row)
    .reduce(
      (totalCount, cell) => ({
        revealedWaterCells:
          cell.status === CellStatus.Revealed && !cell.isMine
            ? totalCount.revealedWaterCells + 1
            : totalCount.revealedWaterCells,
        mines: cell.isMine ? totalCount.mines + 1 : totalCount.mines,
        totalCells: totalCount.totalCells + 1,
      }),
      {
        revealedWaterCells: 0,
        mines: 0,
        totalCells: 0,
      },
    )
  return revealedWaterCells === totalCells - mines
}

/** Count remaining flags. */
export function countRemainingFlags(grid: Grid): number {
  const { flagged, mines } = grid
    .flatMap(row => row)
    .reduce(
      (flagCount, cell) => ({
        flagged: cell.status === CellStatus.Flagged ? flagCount.flagged + 1 : flagCount.flagged,
        mines: cell.isMine ? flagCount.mines + 1 : flagCount.mines,
      }),
      { flagged: 0, mines: 0 },
    )
  return mines - flagged
}

/** Generate a string representation of the grid. */
export function boardToString(grid: Grid, showAllCells: boolean): string {
  const generateLine = (): string => '---'.repeat(grid[0].length || 0) + '\n'

  const generateCellStr = (cell: Cell): string => {
    if (showAllCells) {
      return cell.isMine ? '💣' : `${cell.mineCount}`
    }
    switch (cell.status) {
      case CellStatus.Hidden:
        return '#'
      case CellStatus.Flagged:
        return '🚩'
      case CellStatus.Revealed:
        if (cell.isMine) {
          return '💣'
        }
        return cell.mineCount > 0 ? `${cell.mineCount}` : '🌊'
      case CellStatus.Detonated:
        return '💥'
    }
  }

  const drawRow = (row: readonly Cell[]): string => {
    const rowStr = row.map((cell, index) => {
      const cellStr = generateCellStr(cell)
      return index === 0 ? `${cellStr}` : `, ${cellStr}`
    })
    return '|' + rowStr.join('') + '|\n'
  }

  const boardStr = grid.map(row => drawRow(row)).join('')
  return generateLine() + boardStr + generateLine()
}

/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell
 * with an adjacent mines count of 0, and therefore must not be a mine cell.
 */
function generateRandonMineCoordinates(
  seedCoordinate: Coordinate,
  height: number,
  width: number,
  numMines: number,
  randomNumberGenerator: RandomNumberGenerator,
): Coordinate[] {
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
    const count = randomCoordinates.filter(coor => areCoordinatesEqual(coor, randCoor)).length
    if (count === 0) {
      randomCoordinates.push(randCoor)
    }
  }
  return randomCoordinates
}
