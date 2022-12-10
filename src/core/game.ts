import {
  countRemainingFlags,
  initiateBoard,
  isWinBoard,
  setLoseState,
  revealAllCells,
} from './board'
import { IllegalStateError } from './errors'
import { setCellInGrid } from './grid'
import { createRandomNumberGenerator } from './random'
import {
  Difficulty,
  TimerCallback,
  IMinesweeper,
  GameStatus,
  Coordinate,
  CellStatus,
  Cell,
  TimerStopper,
} from './types'
import { create2DArray } from './util'

/** Create a minesweeper game. */
export function startGame(
  randSeed: number,
  difficulty: Difficulty,
  timerCallback?: TimerCallback,
): IMinesweeper {
  const randomNumberGenerator = createRandomNumberGenerator(randSeed)
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    grid: create2DArray(difficulty.height, difficulty.width).map((row, y) =>
      row.map((_, x) => ({
        coordinate: { x, y },
        status: CellStatus.Hidden,
        mineCount: 0,
        isMine: false,
      })),
    ),
    numFlagged: 0,
    status: GameStatus.Ready,
    remainingFlags: difficulty.numMines,
    elapsedTime: 0,
    randSeed,
    randomNumberGenerator,
    timerCallback,
  }
}

/** Load a game state. */
export function loadGame(game: IMinesweeper, timerCallback?: TimerCallback): IMinesweeper {
  const state = {
    ...game,
    timerCallback,
    timerStopper: undefined,
  }

  if (game.status === GameStatus.Running) {
    const timerStopper = startTimer(timerCallback)
    return { ...state, timerStopper }
  }
  return state
}

/** Make cell revealed at the given coordinate. */
export function revealCell(game: IMinesweeper, coordinate: Coordinate): IMinesweeper {
  if (game.status === GameStatus.Ready) {
    // Note: timer starts here and when game status changes from Running it will stop.
    return {
      ...game,
      grid: initiateBoard(game.grid, game.difficulty, coordinate, game.randomNumberGenerator),
      status: GameStatus.Running,
      timerStopper: startTimer(game.timerCallback),
    }
  }
  if (game.status !== GameStatus.Running) {
    return game
  }

  const cell = game.grid[coordinate.y][coordinate.x]
  if (cell.status === CellStatus.Revealed) {
    return game
  }

  if (cell.isMine) {
    if (game.timerStopper) {
      game.timerStopper()
    }
    return {
      ...game,
      grid: setLoseState(game.grid, coordinate),
      savedGridState: game.grid,
      status: GameStatus.Loss,
      remainingFlags: 0,
    }
  }

  const grid = setCellInGrid(game.grid, { ...cell, status: CellStatus.Revealed }, coordinate)
  if (isWinBoard(grid)) {
    if (game.timerStopper) {
      game.timerStopper()
    }
    return {
      ...game,
      grid: revealAllCells(game.grid),
      status: GameStatus.Win,
      remainingFlags: 0,
    }
  }
  return { ...game, grid, remainingFlags: countRemainingFlags(grid) }
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlag(game: IMinesweeper, coordinate: Coordinate): IMinesweeper {
  if (game.status !== GameStatus.Running) {
    return game
  }
  const cell = game.grid[coordinate.y][coordinate.x]
  if (cell.status !== CellStatus.Hidden && cell.status !== CellStatus.Flagged) {
    return game
  }

  const toggleCellFlagStatus = (c: Cell): Cell =>
    c.status === CellStatus.Flagged
      ? { ...c, status: CellStatus.Hidden }
      : { ...c, status: CellStatus.Flagged }
  const grid = game.grid.map((row, y) =>
    row.map((cell, x) =>
      y === coordinate.y && x === coordinate.x ? toggleCellFlagStatus(cell) : cell,
    ),
  )
  return {
    ...game,
    grid,
    numFlagged: cell.status === CellStatus.Flagged ? game.numFlagged - 1 : game.numFlagged + 1,
    remainingFlags: countRemainingFlags(grid),
  }
}

/** Increment elapsed time by 1. */
export function tickTimer(game: IMinesweeper): IMinesweeper {
  // NOTE: Ready is allowed as timerCallback could run before state is updated with Running.
  if (game.status !== GameStatus.Ready && game.status !== GameStatus.Running) {
    throw new IllegalStateError(
      `tried to tick timer when game status is not ${GameStatus.Ready} or 
      ${GameStatus.Running}. Current status: ${game.status}`,
    )
  }
  return {
    ...game,
    elapsedTime: game.elapsedTime + 1,
  }
}

/** Load the previous state before the game had been lost. */
export function undoLoosingMove(game: IMinesweeper): IMinesweeper {
  if (game.status !== GameStatus.Loss) {
    throw new IllegalStateError(
      `incorrect state of GameStatus: ${game.status}, GameStatus must be ${GameStatus.Loss}`,
    )
  }
  if (!game.savedGridState) {
    throw new IllegalStateError('tried to load uninitialized previous state')
  }

  const grid = game.savedGridState.map(row => row.map(cell => cell))
  const remainingFlags = countRemainingFlags(grid)
  const timerStopper = startTimer(game.timerCallback)

  return {
    ...game,
    timerStopper,
    grid,
    status: GameStatus.Running,
    remainingFlags,
  }
}

/** Start the game timer. */
function startTimer(callback?: TimerCallback): TimerStopper | undefined {
  if (!callback) {
    return undefined
  }
  const timer = setInterval(() => {
    callback()
  }, 1000)
  const timerStopper = (): void => {
    clearInterval(timer)
  }
  return timerStopper
}
