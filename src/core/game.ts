import { countRemainingFlags, fillBoard, isWinBoard, setLoseState, revealAllCells } from './board'
import { areCoordinatesEqual } from './coordinate'
import { IllegalStateError } from './errors'
import { setCellInGrid } from './grid'
import { RAND_NUM_GEN } from './random'
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
  RAND_NUM_GEN.setSeed(randSeed)

  return {
    board: {
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
    },
    status: GameStatus.Ready,
    remainingFlags: difficulty.numMines,
    elapsedTime: 0,
    randSeed,
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
      board: fillBoard(game.board, coordinate),
      status: GameStatus.Running,
      timerStopper: startTimer(game.timerCallback),
    }
  }
  if (game.status !== GameStatus.Running) {
    return game
  }

  const cell = game.board.grid.cells[coordinate.y][coordinate.x]
  if (cell.status === CellStatus.Revealed) {
    return game
  }

  if (cell.isMine) {
    if (game.timerStopper) {
      game.timerStopper()
    }
    return {
      ...game,
      board: setLoseState(game.board, cell),
      status: GameStatus.Loss,
      remainingFlags: 0,
    }
  }

  const board = {
    ...game.board,
    grid: setCellInGrid(game.board.grid, { ...cell, status: CellStatus.Revealed }),
  }
  if (isWinBoard(board)) {
    if (game.timerStopper) {
      game.timerStopper()
    }
    return {
      ...game,
      board: revealAllCells(game.board),
      status: GameStatus.Win,
      remainingFlags: 0,
    }
  }
  return { ...game, board, remainingFlags: countRemainingFlags(board) }
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlag(game: IMinesweeper, coordinate: Coordinate): IMinesweeper {
  if (game.status !== GameStatus.Running) {
    return game
  }
  const cell = game.board.grid.cells[coordinate.y][coordinate.x]
  if (cell.status !== CellStatus.Hidden && cell.status !== CellStatus.Flagged) {
    return game
  }

  const toggleCellFlagStatus = (c: Cell): Cell =>
    c.status === CellStatus.Flagged
      ? { ...c, status: CellStatus.Hidden }
      : { ...c, status: CellStatus.Flagged }

  const grid = {
    ...game.board.grid,
    cells: game.board.grid.cells.map(row =>
      row.map(c => (areCoordinatesEqual(c.coordinate, coordinate) ? toggleCellFlagStatus(c) : c)),
    ),
  }
  const numFlagged =
    cell.status === CellStatus.Flagged ? game.board.numFlagged - 1 : game.board.numFlagged + 1
  const board = { ...game.board, grid, numFlagged }

  return { ...game, board, remainingFlags: countRemainingFlags(board) }
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
  if (!game.board.savedGridState) {
    throw new IllegalStateError('tried to load uninitialized previous state')
  }

  const grid = {
    ...game.board.grid,
    cells: game.board.savedGridState.cells.map(row => row.map(cell => cell)),
  }
  const board = { ...game.board, grid }
  const remainingFlags = countRemainingFlags(board)
  const timerStopper = startTimer(game.timerCallback)

  return {
    ...game,
    timerStopper,
    board,
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
