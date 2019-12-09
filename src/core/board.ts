import { changeCellStatus, createCell } from "./cell"
import {
  coordinatesAreEqual,
  countAdjacents,
  findDistance,
  generateRandomCoordinate,
  hasCoordinate,
} from "./coordinate"
import { CellStatus, GameStatus, Cell, Coordinate, Difficulty, Minesweeper } from "./core-types"
import { IllegalStateError } from "./errors"
import { setCellInGrid } from "./grid"

/** Fill the grid with mine and water cells. A seed coordinate is needed as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export function fillGrid(game: Minesweeper, seedCoor: Coordinate): Minesweeper {
  const mineCoors = genRandMineCoordinates(seedCoor, game.difficulty)

  const createCellAtCoordinate = (x: number, y: number): Cell => {
    const coordinate = { x, y }
    if (hasCoordinate(mineCoors, coordinate)) {
      return createCell(coordinate, CellStatus.Hidden)
    }
    const mineCount = countAdjacents(mineCoors, coordinate)
    return createCell(coordinate, CellStatus.Hidden, mineCount)
  }

  const newGrid = game.grid
    .map((row, y) => row
      .map((_, x) => createCellAtCoordinate(x, y)))
  const cell = newGrid[seedCoor.y][seedCoor.x]
  if (cell.isMine) {
    throw new IllegalStateError("cell should not be a mine cell")
  }
  const cellRevealed = { ...cell, status: CellStatus.Revealed }
  return { ...game, grid: setCellInGrid(newGrid, cellRevealed, game.difficulty.width, game.difficulty.height) }
}

/** Convert the board to a win state. Reveals all cells. */
export function setGameWinState(game: Minesweeper): Minesweeper {
  const grid = game.grid.map(row => row.map(cell =>
    cell.status === CellStatus.Revealed ? cell : changeCellStatus(cell, CellStatus.Revealed),
  ))
  return { ...game, grid, status: GameStatus.Win, remainingFlags: 0 }
}

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export function setGameLoseState(game: Minesweeper, loosingCell: Cell): Minesweeper {
  const revealCell = (cell: Cell): Cell =>
    cell.status === CellStatus.Revealed ? cell : { ...cell, status: CellStatus.Revealed }
  const detonateCell = (cell: Cell): Cell =>
    cell.status === CellStatus.Detonated ? cell : { ...cell, status: CellStatus.Detonated }

  const savedGridState = game.grid.map(row => row.map(cell => cell))
  const grid = game.grid.map(row => row.map(cell =>
    coordinatesAreEqual(cell.coordinate, loosingCell.coordinate)
      ? detonateCell(loosingCell)
      : revealCell(cell)),
  )
  return { ...game, savedGridState, grid, status: GameStatus.Loss, remainingFlags: 0 }
}

/** Check if the game has been won. */
export function isGameWon(game: Minesweeper): boolean {
  const numWaterCellsVisible = game.grid
    .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
    .reduce((n, acc) => n + acc)
  return numWaterCellsVisible === game.numCells - game.difficulty.numMines
}

/** Generate a string representation of the grid. */
export function gameToString(game: Minesweeper, showAllCells: boolean): string {
  const generateLine = (): string => "---".repeat(game.difficulty.width) + "\n"

  const generateCellStr = (cell: Cell): string => {
    if (showAllCells) {
      return cell.isMine ? "💣" : `${cell.mineCount}`
    }
    switch (cell.status) {
      case CellStatus.Hidden:
        return "#"
      case CellStatus.Flagged:
        return "🚩"
      case CellStatus.Revealed:
        if (cell.isMine) {
          return "💣"
        }
        return cell.mineCount > 0 ? `${cell.mineCount}` : "🌊"
      case CellStatus.Detonated:
        return "💥"
    }
  }

  const drawRow = (row: readonly Cell[]): string => {
    const rowStr = row.map((cell, index) => {
      const cellStr = generateCellStr(cell)
      return index === 0 ? `${cellStr}` : `, ${cellStr}`
    })
    return "|" + rowStr.join("") + "|\n"
  }

  const boardStr = game.grid.map(row => drawRow(row)).join("")
  return generateLine() + boardStr + generateLine()
}

/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell
 * with an adjacent mines count of 0, and therefore must not be a mine cell.
 */
function genRandMineCoordinates(
  seedCoor: Coordinate,
  difficulty: Difficulty
): Coordinate[] {
  const getRandomMineCoor = (): Coordinate => {
    const randCoor = generateRandomCoordinate(difficulty.height, difficulty.width)
    if (findDistance(seedCoor, randCoor) < 2) {
      return getRandomMineCoor()
    }
    return randCoor
  }

  const arr: Coordinate[] = []
  while (arr.length !== difficulty.numMines) {
    const randCoor = getRandomMineCoor()
    const count = arr.filter(coor => coordinatesAreEqual(coor, randCoor)).length
    if (count === 0) {
      arr.push(randCoor)
    }
  }
  return arr
}

