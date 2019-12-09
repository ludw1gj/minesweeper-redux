/** A minesweeper game board. */
export interface IBoard {
  /** The difficulty of the game. */
  readonly difficulty: IDifficulty
  /** The number of cells on the grid. */
  readonly numCells: number
  /** The number of flagged cells. */
  readonly numFlagged: number
  /** The game grid. */
  readonly grid: IGrid
  /** The previously saved grid state. */
  readonly savedGridState?: IGrid
}

/** A coordinate of a grid. */
export interface ICoordinate {
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
export interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: ICoordinate
  /** The status of the cell. */
  readonly status: CellStatus
  /** Whether the cell is a mine. */
  readonly isMine: boolean
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  readonly mineCount: number
}

/** The minesweeper game's difficulty level. */
export interface IDifficulty {
  height: number
  width: number
  numMines: number
}

/** A grid made up of cells. */
export interface IGrid {
  readonly width: number
  readonly height: number
  readonly cells: ReadonlyArray<ReadonlyArray<ICell>>
}
