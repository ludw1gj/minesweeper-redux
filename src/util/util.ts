import {
  Difficulty,
  Coordinate,
  GameStatus,
  CellStatus,
  Minesweeper,
  Cell,
  Grid,
} from '../core/types'

/** Default difficulty levels. */
export const difficulties: { [key: string]: Difficulty } = {
  easy: { height: 9, width: 9, numMines: 10 },
  medium: { height: 16, width: 16, numMines: 40 },
  hard: { height: 30, width: 16, numMines: 99 },
}

/** Create a difficulty level for a minesweeper game. */
export const createDifficultyLevel = (
  height: number,
  width: number,
  numMines: number
): Difficulty => {
  if (!arePositiveIntegers(height, width, numMines)) {
    console.warn(
      `height, width, and numMines must be positive whole numbers, height: ${height}, width: ${width}, numMines: ${numMines}. Defaulting to easy config.`
    )
    return difficulties.easy
  }
  return {
    height,
    width,
    numMines,
  }
}

/** Create a coordinate. */
export const createCoordinate = (x: number, y: number): Coordinate => {
  if (!arePositiveIntegers(x, y)) {
    console.warn(`x and y must be positive whole numbers, x: ${x} y: ${y}. Defaulting to 0, 0.`)
    return { x: 0, y: 0 }
  }
  return { x, y }
}

/** Get game state that is loadable. */
export const getLoadableGameState = (game: Minesweeper): Minesweeper => ({
  ...game,
  timerCallback: undefined,
  timerStopper: undefined,
})

/** Create a string representation of the grid. */
export const getStringifiedGrid = (game: Minesweeper, showAllCells: boolean): string =>
  gridToString(game.grid, showAllCells)

/** Check if the game is running. */
export const isGameRunning = (game: Minesweeper): boolean => game.status === GameStatus.Running

/** Check if the game has been lost . */
export const isGameLost = (game: Minesweeper): boolean => game.status === GameStatus.Loss

/** Check if the game has been either won or lost . */
export const isGameEnded = (game: Minesweeper): boolean =>
  game.status === GameStatus.Loss || game.status === GameStatus.Win

/** Count amount of revealed and detonated cells. */
export const countVisibleCells = (game: Minesweeper): number =>
  game.grid
    .map(
      (row) =>
        row.filter(
          (cell) => cell.status === CellStatus.Revealed || cell.status === CellStatus.Detonated
        ).length
    )
    .reduce((n, acc) => n + acc)

/** Check if numbers are non negative whole numbers. */
const arePositiveIntegers = (...n: number[]): boolean =>
  !n.some((num) => !(num >= 0 && num % 1 === 0))

/** Generate a string representation of the grid. */
function gridToString(grid: Grid, showAllCells: boolean): string {
  const generateLine = (): string => '---'.repeat(grid[0].length || 0) + '\n'

  const generateCellStr = (cell: Cell): string => {
    if (showAllCells) {
      return cell.mineCount === -1 ? '💣' : `${cell.mineCount}`
    }
    switch (cell.status) {
      case CellStatus.Hidden:
        return '#'
      case CellStatus.Flagged:
        return '🚩'
      case CellStatus.Revealed:
        if (cell.mineCount === -1) {
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

  const gridStr = grid.map((row) => drawRow(row)).join('')
  return generateLine() + gridStr + generateLine()
}
