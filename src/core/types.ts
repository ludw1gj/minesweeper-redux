/** Contains the necessary values for a minesweeper game. */
export interface IMinesweeper {
  /** The difficulty of the game. */
  readonly difficulty: Difficulty
  /** The current status of the game. */
  readonly status: GameStatus
  /** The number of cells on the grid. */
  readonly numCells: number
  /** The game grid. */
  readonly grid: Grid
  /** The previously saved grid state. */
  readonly savedGridState?: Grid
  /** The number of flagged cells. */
  readonly numFlagged: number
  /** The remaining flags. */
  readonly remainingFlags: number
  /** The number to seed RandomNumberGenerator */
  readonly randSeed: number
  /** The amount of time in ms since the game began.  */
  readonly elapsedTime: number
  /** Function that is called once every second. */
  readonly timerCallback?: TimerCallback
  /** Stops the timer. The property is set when timer has been started. */
  readonly timerStopper?: TimerStopper
}

/** The status of a cell. */
export enum CellStatus {
  Hidden = 'hidden',
  Flagged = 'flagged',
  Revealed = 'revealed',
  Detonated = 'detonated',
}

/** A cell of a minesweeper game. */
export interface Cell {
  /** The status of the cell. */
  readonly status: CellStatus
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  readonly mineCount: number
}

/** A coordinate of a grid. */
export interface Coordinate {
  readonly x: number
  readonly y: number
}

/** The minesweeper game's difficulty level. */
export interface Difficulty {
  height: number
  width: number
  numMines: number
}

/** The current status of the game. */
export enum GameStatus {
  /** Game is waiting to start. */
  Waiting = 'waiting',
  /** Game is ready. */
  Ready = 'ready',
  /** Game is running. */
  Running = 'running',
  /** Game has been lost. */
  Loss = 'loss',
  /** Game has been won. */
  Win = 'win',
}

/** A callback for the game timer. */
export type TimerCallback = () => void

/** Stops a timer. It is the function returned when timer is started. */
export type TimerStopper = () => void

/** A grid made up of cells. */
export type Grid = ReadonlyArray<ReadonlyArray<Cell>>

/** Generates a random number from a seed number. */
export type RandomNumberGenerator = (max?: number, min?: number) => number
