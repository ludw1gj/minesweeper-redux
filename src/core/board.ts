/** Create a minesweeper board. Pass in a grid to resume a previous game. */
import { changeCellStatus, createCell } from "./cell"
import {
  coordinatesAreEqual,
  createCoordinate,
  findDistance,
  generateRandomCoordinate,
  hasCoordinate,
} from "./coordinate"
import { CellStatus, IBoard, ICell, ICoordinate, IDifficulty, IGrid } from "./core-types"
import { DIRECTIONS } from "./directions"
import { IllegalParameterError, IllegalStateError } from "./errors"
import { createGrid, setCellInGrid } from "./grid"

export function createBoard(difficulty: IDifficulty, grid?: IGrid, numFlagged?: number): IBoard {
  if ((grid && !numFlagged) || (!grid && numFlagged)) {
    throw new IllegalParameterError(`grid and numFlagged must be both set if setting either.`)
  }
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    grid: grid ? grid : createGrid(difficulty.height, difficulty.width),
    numFlagged: numFlagged ? numFlagged : 0,
  }
}

/** Fill the grid with mine and water cells. A seed coordinate is needed as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper board instance.
 */
export function fillBoard(board: IBoard, seedCoor: ICoordinate): IBoard {
  const mineCoors = genRandMineCoordinates(
    seedCoor,
    board.difficulty.height,
    board.difficulty.width,
    board.difficulty.numMines,
  )

  const createCellAtCoordinate = (x: number, y: number): ICell => {
    const coordinate = { x, y }
    if (hasCoordinate(mineCoors, coordinate)) {
      return createCell(coordinate, CellStatus.Hidden)
    }
    const mineCount = countSurroundingMines(mineCoors, coordinate)
    return createCell(coordinate, CellStatus.Hidden, mineCount)
  }

  const newGrid = board.grid
    .map((row, y) => row
      .map((_, x) => createCellAtCoordinate(x, y)))
  const cell = newGrid[seedCoor.y][seedCoor.x]
  if (cell.isMine) {
    throw new IllegalStateError("cell should not be a mine cell")
  }
  const cellRevealed = { ...cell, status: CellStatus.Revealed }
  return { ...board, grid: setCellInGrid(newGrid, cellRevealed, board.difficulty.width, board.difficulty.height) }
}

/** Convert the board to a win state. Reveals all cells. */
export function setBoardWinState(board: IBoard): IBoard {
  const grid = board.grid.map(row => row.map(cell =>
    cell.status === CellStatus.Revealed ? cell : changeCellStatus(cell, CellStatus.Revealed),
  ))
  return { ...board, grid }
}

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export function setBoardLoseState(board: IBoard, loosingCell: ICell): IBoard {
  const revealCell = (cell: ICell): ICell =>
    cell.status === CellStatus.Revealed ? cell : { ...cell, status: CellStatus.Revealed }
  const detonateCell = (cell: ICell): ICell =>
    cell.status === CellStatus.Detonated ? cell : { ...cell, status: CellStatus.Detonated }

  const savedGridState = {
    ...board.grid,
    grid: board.grid.map(row => row.map(cell => cell)),
  }
  const grid = {
    ...board.grid,
    grid: board.grid.map(row => row.map(cell =>
        coordinatesAreEqual(cell.coordinate, loosingCell.coordinate)
          ? detonateCell(loosingCell)
          : revealCell(cell),
      ),
    ),
  }
  return { ...board, savedGridState, grid }
}

/** Check if the game has been won. */
export function isBoardWon(board: IBoard): boolean {
  const numWaterCellsVisible = board.grid
    .map(row => row.filter(cell => !cell.isMine && cell.status === CellStatus.Revealed).length)
    .reduce((n, acc) => n + acc)
  return numWaterCellsVisible === board.numCells - board.difficulty.numMines
}

/** Count remaining flags. */
export function countRemainingFlagsInBoard(board: IBoard): number {
  const flagged = board.grid
    .map(row => row.filter(cell => cell.status === CellStatus.Flagged).length)
    .reduce((n, acc) => n + acc)
  return board.difficulty.numMines - flagged
}

/** Generate a string representation of the grid. */
export function gridToString(grid: IGrid, showAllCells: boolean): string {
  const generateLine = (): string => "---".repeat(grid[0].length) + "\n"

  const generateCellStr = (cell: ICell): string => {
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

  const drawRow = (row: readonly ICell[]): string => {
    const rowStr = row.map((cell, index) => {
      const cellStr = generateCellStr(cell)
      return index === 0 ? `${cellStr}` : `, ${cellStr}`
    })
    return "|" + rowStr.join("") + "|\n"
  }

  const boardStr = grid.map(row => drawRow(row)).join("")
  return generateLine() + boardStr + generateLine()
}

/** Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell
 * with an adjacent mines count of 0, and therefore must not be a mine cell.
 */
function genRandMineCoordinates(
  seedCoor: ICoordinate,
  height: number,
  width: number,
  numMines: number,
): ICoordinate[] {
  const getRandomMineCoor = (): ICoordinate => {
    const randCoor = generateRandomCoordinate(height, width)
    if (findDistance(seedCoor, randCoor) < 2) {
      return getRandomMineCoor()
    }
    return randCoor
  }

  const arr: ICoordinate[] = []
  while (arr.length !== numMines) {
    const randCoor = getRandomMineCoor()
    const count = arr.filter(coor => coordinatesAreEqual(coor, randCoor)).length
    if (count === 0) {
      arr.push(randCoor)
    }
  }
  return arr
}

/** Count the amount of adjacent mines. */
function countSurroundingMines(
  mineCoors: ICoordinate[],
  atCoordinate: ICoordinate,
): number {
  const minesAmt = DIRECTIONS.filter(dir => {
    const xCor = atCoordinate.x + dir.x
    const yCor = atCoordinate.y + dir.y
    if (xCor < 0 || yCor < 0) {
      return false
    }
    const directionCor = createCoordinate(xCor, yCor)
    return hasCoordinate(mineCoors, directionCor)
  }).length
  return minesAmt
}
