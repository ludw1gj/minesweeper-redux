import {
  createInitialGrid,
  initiateGrid,
  isWinGrid,
  revealAllCells,
  revealCellInGrid,
  setLoseState,
  toggleFlagInGrid,
} from './grid'
import {
  Difficulty,
  TimerCallback,
  Minesweeper,
  GameStatus,
  Coordinate,
  CellStatus,
  TimerStopper,
} from './types'

/** Create a minesweeper game. */
export function startGame(
  randSeed: number,
  difficulty: Difficulty,
  timerCallback?: TimerCallback
): Minesweeper {
  return {
    difficulty,
    numCells: difficulty.height * difficulty.width,
    grid: createInitialGrid(difficulty.height, difficulty.width),
    status: GameStatus.Ready,
    remainingFlags: difficulty.numMines,
    randSeed,
    timerCallback,
    numFlagged: 0,
    elapsedTime: 0,
  }
}

/** Load a game state. */
export function loadGame(game: Minesweeper, timerCallback?: TimerCallback): Minesweeper {
  return {
    ...game,
    timerCallback,
    timerStopper: game.status === GameStatus.Running ? startTimer(timerCallback) : undefined,
  }
}

/** Make cell revealed at the given coordinate. */
export function revealCell(game: Minesweeper, coordinate: Coordinate): Minesweeper {
  if (game.status === GameStatus.Ready) {
    // Note: timer starts here and when game status changes from Running it will stop.
    return {
      ...game,
      grid: initiateGrid(game.grid, game.difficulty, coordinate, game.randSeed!),
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

  if (cell.mineCount === -1) {
    if (game.timerStopper) {
      game.timerStopper()
    }
    return {
      ...game,
      grid: setLoseState(game.grid, coordinate),
      savedGridState: game.grid,
      status: GameStatus.Loss,
    }
  }

  const grid = revealCellInGrid(game.grid, coordinate)
  if (isWinGrid(grid)) {
    if (game.timerStopper) {
      game.timerStopper()
    }
    return {
      ...game,
      grid: revealAllCells(game.grid),
      status: GameStatus.Win,
    }
  }
  return { ...game, grid }
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlag(game: Minesweeper, coordinate: Coordinate): Minesweeper {
  const cell = game.grid[coordinate.y][coordinate.x]
  if (game.status !== GameStatus.Running || cell.status === CellStatus.Revealed) {
    return game
  }
  return {
    ...game,
    grid: toggleFlagInGrid(game.grid, coordinate),
  }
}

/** Increment elapsed time by 1. */
export function tickTimer(game: Minesweeper): Minesweeper {
  return {
    ...game,
    elapsedTime: game.elapsedTime + 1,
  }
}

/** Load the previous state before the game had been lost. */
export function undoLoosingMove(game: Minesweeper): Minesweeper {
  if (game.status !== GameStatus.Loss || !game.savedGridState) {
    console.warn(
      `incorrect state of GameStatus: ${game.status}, GameStatus must be ${GameStatus.Loss}`
    )
    return game
  }
  return {
    ...game,
    timerStopper: startTimer(game.timerCallback),
    grid: game.savedGridState.map((row) => row.map((cell) => cell)),
    status: GameStatus.Running,
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
