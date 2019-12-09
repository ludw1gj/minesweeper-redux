// TODO: make flat

/** A coordinate of a grid. */
export interface Coordinate {
  readonly x: number
  readonly y: number
}

/** The status of a cell. */
export enum CellStatus {
  Hidden = "hidden",
  Flagged = "flagged",
  Revealed = "revealed",
  Detonated = "detonated",
}

/** A cell of a minesweeper game. */
export interface Cell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate
  /** The status of the cell. */
  readonly status: CellStatus
  /** Whether the cell is a mine. */
  readonly isMine: boolean
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  readonly mineCount: number
}

/** The minesweeper game's difficulty level. */
export interface Difficulty {
  height: number
  width: number
  numMines: number
}

/** A grid made up of cells. */
export type IGrid = ReadonlyArray<ReadonlyArray<Cell>>

export interface Minesweeper {
  /** The current status of the game. */
  readonly status: GameStatus
  /** The remaining flags. */
  readonly remainingFlags: number
  /** The amount of time in ms since the game began.  */
  readonly elapsedTime: number
  /** The number to seed RandomNumberGenerator */
  readonly randSeed: number
  /** Function that is called once every second. */
  readonly timerCallback?: TimerCallback
  /** Stops the timer. The property is set when timer has been started. */
  readonly timerStopper?: TimerStopper

  /** The difficulty of the game. */
  readonly difficulty: Difficulty
  /** The number of cells on the grid. */
  readonly numCells: number
  /** The number of flagged cells. */
  readonly numFlagged: number
  /** The game grid. */
  readonly grid: IGrid
  /** The previously saved grid state. */
  readonly savedGridState?: IGrid
}

/** The current status of the game. */
export enum GameStatus {
  /** Game is waiting to start. */
  Waiting = "waiting",
  /** Game is ready. */
  Ready = "ready",
  /** Game is running. */
  Running = "running",
  /** Game has been lost. */
  Loss = "loss",
  /** Game has been won. */
  Win = "win",
}

/** A callback for the game timer. */
export type TimerCallback = () => void

/** Stops a timer. It is the function returned when timer is started. */
export type TimerStopper = () => void