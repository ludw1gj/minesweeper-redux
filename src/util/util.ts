import { boardToString } from '../core/board'
import { IllegalParameterError } from '../core/errors'
import { Difficulty, Coordinate, GameStatus, CellStatus, IMinesweeper } from '../core/types'
import { arePositiveIntegers } from '../core/util'

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
    throw new IllegalParameterError(
      `height, width, and numMines must be positive whole numbers, height: ${height}, width: 
      ${width}, numMines: ${numMines}`
    )
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
    throw new IllegalParameterError(`x and y must be positive whole numbers, x: ${x} y: ${y}`)
  }
  return { x, y }
}

/** Get game state that is loadable. */
export const getLoadableGameState = (game: IMinesweeper): IMinesweeper => ({
  ...game,
  timerCallback: undefined,
  timerStopper: undefined,
})

/** Create a string representation of the board. */
export const getStringifiedBoard = (game: IMinesweeper, showAllCells: boolean): string =>
  boardToString(game.grid, showAllCells)

/** Check if the game is running. */
export const isGameRunning = (game: IMinesweeper): boolean => game.status === GameStatus.Running

/** Check if the game has been lost . */
export const isGameLost = (game: IMinesweeper): boolean => game.status === GameStatus.Loss

/** Check if the game has been either won or lost . */
export const isGameEnded = (game: IMinesweeper): boolean =>
  game.status === GameStatus.Loss || game.status === GameStatus.Win

/** Count amount of revealed and detonated cells. */
export const countVisibleCells = (game: IMinesweeper): number =>
  game.grid
    .map(
      (row) =>
        row.filter(
          (cell) => cell.status === CellStatus.Revealed || cell.status === CellStatus.Detonated
        ).length
    )
    .reduce((n, acc) => n + acc)
