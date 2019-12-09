/** Contains the necessary values for a minesweeper game. */
import {
  countRemainingFlagsInBoard,
  createBoard,
  fillBoard,
  isBoardWon,
  setBoardLoseState,
  setBoardWinState,
} from "./board"
import { coordinatesAreEqual } from "./coordinate"
import {
  CellStatus,
  GameStatus,
  ICell,
  ICoordinate,
  IDifficulty,
  IMinesweeper,
  TimerCallback,
  TimerStopper,
} from "./core-types"
import { IllegalStateError } from "./errors"
import { getCellFromGrid, setCellInGrid } from "./grid"
import { RAND_NUM_GEN } from "./random"

export class Minesweeper {
  private constructor() {
  }

  /** Create a minesweeper game. */
  public static startGame(
    randSeed: number,
    difficulty: IDifficulty,
    timerCallback?: TimerCallback,
  ): IMinesweeper {
    RAND_NUM_GEN.setSeed(randSeed)

    return {
      board: createBoard(difficulty),
      status: GameStatus.Ready,
      remainingFlags: difficulty.numMines,
      elapsedTime: 0,
      randSeed,
      timerCallback,
    }
  }

  /** Load a game state. */
  public static loadGame(game: IMinesweeper, timerCallback?: TimerCallback): IMinesweeper {
    const state = {
      ...game,
      timerCallback,
      timerStopper: undefined,
    }

    if (game.status === GameStatus.Running) {
      const timerStopper = Minesweeper.startTimer(timerCallback)
      return { ...state, timerStopper }
    }
    return state
  }

  /** Make cell revealed at the given coordinate. */
  public static revealCell(game: IMinesweeper, coordinate: ICoordinate): IMinesweeper {
    if (game.status === GameStatus.Ready) {
      // Note: timer starts here and when game status changes from Running it will stop.
      return {
        ...game,
        board: fillBoard(game.board, coordinate),
        status: GameStatus.Running,
        timerStopper: Minesweeper.startTimer(game.timerCallback),
      }
    }
    if (game.status !== GameStatus.Running) {
      return game
    }

    const cell = getCellFromGrid(game.board.grid, coordinate)
    if (cell.status === CellStatus.Revealed) {
      return game
    }

    if (cell.isMine) {
      if (game.timerStopper) {
        game.timerStopper()
      }
      return {
        ...game,
        board: setBoardLoseState(game.board, cell),
        status: GameStatus.Loss,
        remainingFlags: 0,
      }
    }

    const cellRevealed = { ...cell, status: CellStatus.Revealed }
    const board = {
      ...game.board,
      grid: setCellInGrid(game.board.grid, cellRevealed, game.board.difficulty.width, game.board.difficulty.height),
    }

    if (isBoardWon(board)) {
      if (game.timerStopper) {
        game.timerStopper()
      }
      return {
        ...game,
        board: setBoardWinState(game.board),
        status: GameStatus.Win,
        remainingFlags: 0,
      }
    }
    return { ...game, board, remainingFlags: countRemainingFlagsInBoard(board) }
  }

  /** Toggle the flag value of cell at the given coordinate. */
  public static toggleFlag(game: IMinesweeper, coordinate: ICoordinate): IMinesweeper {
    if (game.status !== GameStatus.Running) {
      return game
    }
    const cell = game.board.grid[coordinate.y][coordinate.x]
    if (cell.status !== CellStatus.Hidden && cell.status !== CellStatus.Flagged) {
      return game
    }

    const toggleCellFlagStatus = (c: ICell): ICell =>
      c.status === CellStatus.Flagged
        ? { ...c, status: CellStatus.Hidden }
        : { ...c, status: CellStatus.Flagged }

    const grid = game.board.grid.map(row =>
      row.map(c => (coordinatesAreEqual(c.coordinate, coordinate) ? toggleCellFlagStatus(c) : c)),
    )
    const numFlagged =
      cell.status === CellStatus.Flagged ? game.board.numFlagged - 1 : game.board.numFlagged + 1
    const board = { ...game.board, grid, numFlagged }

    return { ...game, board, remainingFlags: countRemainingFlagsInBoard(board) }
  }

  /** Increment elapsed time by 1. */
  public static tickTimer(game: IMinesweeper): IMinesweeper {
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
  public static undoLoosingMove(game: IMinesweeper): IMinesweeper {
    if (game.status !== GameStatus.Loss) {
      throw new IllegalStateError(
        `incorrect state of GameStatus: ${game.status}, GameStatus must be ${GameStatus.Loss}`,
      )
    }
    if (!game.board.savedGridState) {
      throw new IllegalStateError("tried to load uninitialized previous state")
    }

    const grid = game.board.savedGridState.map(row => row.map(cell => cell))
    const board = { ...game.board, grid }
    const remainingFlags = countRemainingFlagsInBoard(board)
    const timerStopper = Minesweeper.startTimer(game.timerCallback)

    return {
      ...game,
      timerStopper,
      board,
      status: GameStatus.Running,
      remainingFlags,
    }
  }

  /** Start the game timer. */
  private static startTimer(callback?: TimerCallback): TimerStopper | undefined {
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
}
