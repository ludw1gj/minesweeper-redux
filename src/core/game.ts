import { Cell, CellStatus, changeCellStatus } from "./cell";
import { Coordinate, coordinatesAreEqual } from "./coordinate";
import { IDifficulty } from "./difficulty";
import { IllegalStateError } from "./errors";
import { getCellFromGrid } from "./grid";
import {
  countRemainingFlags,
  createBoard,
  fillBoard,
  IBoard,
  isWinningBoard,
  setCellInBoard,
  setLoseStateInBoard,
  setWinStateInBoard,
} from "./minesweeperBoard";
import { RAND_NUM_GEN } from "./random";

/** Contains the necessary values for a minesweeper game. */
export interface GameState {
  /** The board which holds values concerning the game grid. */
  readonly board: IBoard;
  /** The current status of the game. */
  readonly status: GameStatus;
  /** The remaining flags. */
  readonly remainingFlags: number;
  /** The amount of time in ms since the game began.  */
  readonly elapsedTime: number;
  /** The number to seed RandomNumberGenerator */
  readonly randSeed: number;
  /** Function that is called once every second. */
  readonly timerCallback?: TimerCallback;
  /** Stops the timer. The property is set when timer has been started. */
  readonly timerStopper?: TimerStopper;
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
export type TimerCallback = () => void;

/** Stops a timer. It is the function returned when timer is started. */
export type TimerStopper = () => void;

/** Create a minesweeper game. */
export const startGame = (
  randSeed: number,
  difficulty: IDifficulty,
  timerCallback?: TimerCallback,
): GameState => {
  RAND_NUM_GEN.setSeed(randSeed);

  return {
    board: createBoard(difficulty),
    status: GameStatus.Ready,
    remainingFlags: difficulty.numMines,
    elapsedTime: 0,
    randSeed,
    timerCallback,
  };
};

/** Load a game state. */
export const loadGame = (game: GameState, timerCallback?: TimerCallback) => {
  const state = {
    ...game,
    timerCallback,
    timerStopper: undefined,
  };

  if (game.status === GameStatus.Running) {
    const timerStopper = startTimer(timerCallback);
    return { ...state, timerStopper };
  }
  return state;
};

/** Make cell revealed at the given coordinate. */
export const revealCell = (game: GameState, coordinate: Coordinate): GameState => {
  if (game.status === GameStatus.Ready) {
    // Note: timer starts here and when game status changes from Running it will stop.
    return {
      ...game,
      board: fillBoard(game.board, coordinate),
      status: GameStatus.Running,
      timerStopper: startTimer(game.timerCallback),
    };
  }
  if (game.status !== GameStatus.Running) {
    return game;
  }

  const cell = getCellFromGrid(game.board.grid, coordinate);
  if (cell.status === CellStatus.Revealed) {
    return game;
  }

  if (cell.isMine) {
    if (game.timerStopper) {
      game.timerStopper();
    }
    return {
      ...game,
      board: setLoseStateInBoard(game.board, cell),
      status: GameStatus.Loss,
      remainingFlags: 0,
    };
  }

  const board = setCellInBoard(game.board, changeCellStatus(cell, CellStatus.Revealed));
  if (isWinningBoard(board)) {
    if (game.timerStopper) {
      game.timerStopper();
    }
    return {
      ...game,
      board: setWinStateInBoard(game.board),
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }
  return { ...game, board, remainingFlags: countRemainingFlags(board) };
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (game: GameState, coordinate: Coordinate): GameState => {
  if (game.status !== GameStatus.Running) {
    return game;
  }
  const cell = getCellFromGrid(game.board.grid, coordinate);
  if (cell.status !== CellStatus.Hidden && cell.status !== CellStatus.Flagged) {
    return game;
  }

  const toggleCellFlagStatus = (c: Cell): Cell =>
    c.status === CellStatus.Flagged
      ? changeCellStatus(c, CellStatus.Hidden)
      : changeCellStatus(c, CellStatus.Flagged);

  const grid = {
    ...game.board.grid,
    cells: game.board.grid.cells.map(row =>
      row.map(c => (coordinatesAreEqual(c.coordinate, coordinate) ? toggleCellFlagStatus(c) : c)),
    ),
  };
  const numFlagged =
    cell.status === CellStatus.Flagged ? game.board.numFlagged - 1 : game.board.numFlagged + 1;
  const board = { ...game.board, grid, numFlagged };

  return { ...game, board, remainingFlags: countRemainingFlags(board) };
};

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (game: GameState): GameState => {
  if (game.status !== GameStatus.Loss) {
    throw new IllegalStateError(
      `incorrect state of GameStatus: ${game.status}, GameStatus must be ${GameStatus.Loss}`,
    );
  }
  if (!game.board.savedGridState) {
    throw new IllegalStateError("tried to load uninitialized previous state");
  }

  const grid = {
    ...game.board.grid,
    cells: game.board.savedGridState.cells.map(row => row.map(cell => cell)),
  };
  const board = { ...game.board, grid };
  const remainingFlags = countRemainingFlags(board);
  const timerStopper = startTimer(game.timerCallback);

  return {
    ...game,
    timerStopper,
    board,
    status: GameStatus.Running,
    remainingFlags,
  };
};

/** Increment elapsed time by 1. */
export const tickTimer = (game: GameState) => {
  // NOTE: Ready is allowed as timerCallback could run before state is updated with Running.
  if (game.status !== GameStatus.Ready && game.status !== GameStatus.Running) {
    throw new IllegalStateError(
      `tried to tick timer when game status is not ${GameStatus.Ready} or 
      ${GameStatus.Running}. Current status: ${game.status}`,
    );
  }
  return {
    ...game,
    elapsedTime: game.elapsedTime + 1,
  };
};

/** Start the game timer. */
const startTimer = (callback?: TimerCallback): TimerStopper | undefined => {
  if (!callback) {
    return undefined;
  }
  const timer = setInterval(() => {
    callback();
  }, 1000);
  const timerStopper = () => {
    clearInterval(timer);
  };
  return timerStopper;
};
