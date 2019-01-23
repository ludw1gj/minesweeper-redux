export interface Cell {
  /** The coordinated of the cell in the matrix. */
  readonly coordinate: Coordinate;
  /** Whether the cell is visible on the board. */
  readonly isVisible: boolean;
  /** Whether the cell is flagged on the board. */
  readonly isFlagged: boolean;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;
}

export interface WaterCell extends Cell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly mineCount: number;
}

export interface MineCell extends Cell {
  /** The amount of adjacent mines surrounding the cell. */
  readonly isDetonated: boolean;
}

export interface Coordinate {
  readonly x: number;
  readonly y: number;
}

export type MinesweeperBoard = Readonly<{
  height: number;
  width: number;
  numCells: number;
  cells: Cell[][];
  previousCellsState: Cell[][] | null;

  numMines: number;
  numFlagged: number;
}>;
