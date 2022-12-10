import { areCoordinatesEqual, findCoordinateDistance } from './coordinate'
import { DIRECTIONS } from './directions'
import { IllegalStateError } from './errors'
import { setCellInGrid } from './grid'
import { RAND_NUM_GEN } from './random'
import { Difficulty, Board, Coordinate, Cell, CellStatus } from './types'
import { create2DArray } from './util'

/** Create a minesweeper board. Pass in a grid to resume a previous game. */
export function createBoard(difficulty: Difficulty): Board {
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    grid: {
      width: difficulty.width,
      height: difficulty.height,
      cells: create2DArray(difficulty.height, difficulty.width).map((row, y) =>
        row.map((_, x) => ({
          coordinate: { x, y },
          status: CellStatus.Hidden,
          mineCount: 0,
          isMine: false,
        })),
      ),
    },
    numFlagged: 0,
  }
}

/** Fill the grid with mine and water cells. A seed coordinate is needed as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export function fillBoard(board: Board, seedCoor: Coordinate): Board {
  const mineCoordinates = generateRandonMineCoordinates(
    seedCoor,
    board.difficulty.height,
    board.difficulty.width,
    board.difficulty.numMines,
  )

  const createCellAtCoordinate = (coordinate: Coordinate): Cell => {
    return mineCoordinates.some(mineCoordinate => areCoordinatesEqual(mineCoordinate, coordinate))
      ? { coordinate, status: CellStatus.Hidden, isMine: true, mineCount: -1 }
      : {
          coordinate,
          status: CellStatus.Hidden,
          mineCount: countAdjacentMines(mineCoordinates, coordinate),
          isMine: false,
        }
  }

  const newGrid = {
    ...board.grid,
    cells: board.grid.cells.map((row, y) => row.map((_, x) => createCellAtCoordinate({ x, y }))),
  }
  const cell = newGrid.cells[seedCoor.y][seedCoor.x]
  if (cell.isMine) {
    throw new IllegalStateError('cell should not be a mine cell')
  }
  return { ...board, grid: setCellInGrid(newGrid, { ...cell, status: CellStatus.Revealed }) }
}

/** Convert the board to a win state. Reveals all cells. */
export function revealAllCells(board: Board): Board {
  return {
    ...board,
    grid: {
      ...board.grid,
      cells: board.grid.cells.map(row =>
        row.map(cell =>
          cell.status === CellStatus.Revealed ? cell : { ...cell, status: CellStatus.Revealed },
        ),
      ),
    },
  }
}

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export function setLoseState(board: Board, loosingCell: Cell): Board {
  const savedGridState = {
    ...board.grid,
    cells: board.grid.cells.map(row => row.map(cell => cell)),
  }
  const grid = {
    ...board.grid,
    cells: board.grid.cells.map(row =>
      row.map(cell =>
        areCoordinatesEqual(cell.coordinate, loosingCell.coordinate)
          ? { ...cell, status: CellStatus.Detonated }
          : cell.status === CellStatus.Revealed
          ? cell
          : { ...cell, status: CellStatus.Revealed },
      ),
    ),
  }
  return { ...board, savedGridState, grid }
}

/** Check if the game has been won. */
export function isWinBoard(board: Board): boolean {
  const numWaterCellsVisible = board.grid.cells
    .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
    .reduce((n, acc) => n + acc)
  return numWaterCellsVisible === board.numCells - board.difficulty.numMines
}

/** Count remaining flags. */
export function countRemainingFlags(board: Board): number {
  const flagged = board.grid.cells
    .map(row => row.filter(cell => cell.status === CellStatus.Flagged).length)
    .reduce((n, acc) => n + acc)
  return board.difficulty.numMines - flagged
}

/** Generate a string representation of the grid. */
export function boardToString(board: Board, showAllCells: boolean): string {
  const generateLine = (): string => '---'.repeat(board.grid.width) + '\n'

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

  const boardStr = board.grid.cells.map(row => drawRow(row)).join('')
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
): Coordinate[] {
  const getRandomMineCoor = (): Coordinate => {
    const randCoor = {
      x: Math.floor(RAND_NUM_GEN.generate() * width),
      y: Math.floor(RAND_NUM_GEN.generate() * height),
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

/** Count the amount of adjacent mines. */
function countAdjacentMines(mineCoordinates: Coordinate[], atCoordinate: Coordinate): number {
  return DIRECTIONS.filter(dir => {
    const coordinate = { x: atCoordinate.x + dir.x, y: atCoordinate.y + dir.y }
    return coordinate.x < 0 || coordinate.y < 0
      ? false
      : mineCoordinates.some(mineCoordinate => areCoordinatesEqual(mineCoordinate, coordinate))
  }).length
}
