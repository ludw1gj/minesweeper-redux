import { fillGrid, isGameWon, setGameLoseState, setGameWinState } from "./board"
import { createCell } from "./cell"
import { coordinatesAreEqual, createCoordinate } from "./coordinate"
import {
  CellStatus,
  GameStatus,
  Cell,
  Coordinate,
  Difficulty,
  Minesweeper,
  TimerCallback,
  TimerStopper,
} from "./core-types"
import { IllegalStateError } from "./errors"
import { countRemainingFlags, setCellInGrid } from "./grid"
import { RAND_NUM_GEN } from "./random"
import { create2DArray } from "./util"

export class Minesweeper {
  private constructor() {
  }

  /** Create a minesweeper game. */
  public static startGame(
    randSeed: number,
    difficulty: Difficulty,
    timerCallback?: TimerCallback,
  ): Minesweeper {
    RAND_NUM_GEN.setSeed(randSeed)

    return {
      status: GameStatus.Ready,
      remainingFlags: difficulty.numMines,
      elapsedTime: 0,
      randSeed,
      timerCallback,
      difficulty,
      numCells: difficulty.height * difficulty.width,
      grid: create2DArray(difficulty.height, difficulty.width)
        .map((row, y) => row
          .map((_, x) => createCell(createCoordinate(x, y), CellStatus.Hidden, 0)),
        ),
      numFlagged: 0,
    }
  }

  /** Load a game state. */
  public static loadGame(game: Minesweeper, timerCallback?: TimerCallback): Minesweeper {
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
  public static revealCell(game: Minesweeper, coordinate: Coordinate): Minesweeper {
    if (game.status === GameStatus.Ready) {
      // Note: timer starts here and when game status changes from Running it will stop.
      return fillGrid(game, coordinate)
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
      return setGameLoseState(game, cell)
    }

    const cellRevealed = { ...cell, status: CellStatus.Revealed }
    const currGrid = setCellInGrid(game.grid, cellRevealed, game.difficulty.width, game.difficulty.height)
    const currGameState = {
      ...game,
      gird: currGrid,
      remainingFlags: countRemainingFlags(currGrid, game.difficulty.numMines)
    }

    if (isGameWon(currGameState)) {
      if (game.timerStopper) {
        game.timerStopper()
      }
      return setGameWinState(game)
    }
    return currGameState
  }

  /** Toggle the flag value of cell at the given coordinate. */
  public static toggleFlag(game: Minesweeper, coordinate: Coordinate): Minesweeper {
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

    const grid = game.grid.map(row =>
      row.map(c => (coordinatesAreEqual(c.coordinate, coordinate) ? toggleCellFlagStatus(c) : c)),
    )
    const numFlagged =
      cell.status === CellStatus.Flagged ? game.numFlagged - 1 : game.numFlagged + 1
    return { ...game, grid, numFlagged, remainingFlags: countRemainingFlags(grid, game.difficulty.numMines) }
  }

  /** Increment elapsed time by 1. */
  public static tickTimer(game: Minesweeper): Minesweeper {
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
  public static undoLoosingMove(game: Minesweeper): Minesweeper {
    if (game.status !== GameStatus.Loss) {
      throw new IllegalStateError(
        `incorrect state of GameStatus: ${game.status}, GameStatus must be ${GameStatus.Loss}`,
      )
    }
    if (!game.savedGridState) {
      throw new IllegalStateError("tried to load uninitialized previous state")
    }

    const grid = game.savedGridState.map(row => row.map(cell => cell))
    const remainingFlags = countRemainingFlags(grid, game.difficulty.numMines)
    const timerStopper = Minesweeper.startTimer(game.timerCallback)

    return {
      ...game,
      timerStopper,
      grid,
      remainingFlags,
      status: GameStatus.Running,
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
