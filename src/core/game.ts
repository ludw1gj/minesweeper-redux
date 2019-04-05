import { CellStatus } from "./cell";
import { Coordinate } from "./coordinate";
import { DifficultyLevel } from "./difficulty";
import { IllegalStateError } from "./errors";
import { getCellFromGrid } from "./grid";
import {
  countRemainingFlags,
  createBoard,
  fillBoard,
  isWinningBoard,
  loadSavedGridStateInBoard,
  MinesweeperBoard,
  revealCellInBoard,
  setLoseStateInBoard,
  setWinStateInBoard,
  toggleCellFlagInBoard,
} from "./minesweeperBoard";
import { RAND_NUM_GEN } from "./random";

/** Contains the necessary values for a minesweeper game. */
export interface GameState {
  /** The board which holds values concerning the game grid. */
  readonly board: MinesweeperBoard;
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
  difficulty: DifficultyLevel,
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
export const loadGame = (gameState: GameState, timerCallback?: TimerCallback) => {
  const state = {
    ...gameState,
    timerCallback,
    timerStopper: undefined,
  };

  if (gameState.status === GameStatus.Running) {
    const timerStopper = startTimer(timerCallback);
    return { ...state, timerStopper };
  }
  return state;
};

/** Make cell revealed at the given coordinate. */
export const revealCell = (gameState: GameState, coordinate: Coordinate): GameState => {
  if (gameState.status === GameStatus.Waiting) {
    return gameState;
  }
  if (gameState.status === GameStatus.Ready) {
    // Note: timer starts here and when game status changes from Running it will stop.
    return {
      ...gameState,
      board: fillBoard(gameState.board, coordinate),
      status: GameStatus.Running,
      timerStopper: startTimer(gameState.timerCallback),
    };
  }

  const cell = getCellFromGrid(gameState.board.grid, coordinate);
  if (cell.status === CellStatus.Revealed) {
    return gameState;
  }
  if (cell.isMine) {
    if (gameState.timerStopper) {
      gameState.timerStopper();
    }
    return {
      ...gameState,
      board: setLoseStateInBoard(gameState.board, cell),
      status: GameStatus.Loss,
      remainingFlags: 0,
    };
  }

  const board = revealCellInBoard(gameState.board, cell);
  if (isWinningBoard(board)) {
    if (gameState.timerStopper) {
      gameState.timerStopper();
    }
    return {
      ...gameState,
      board: setWinStateInBoard(gameState.board),
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }
  return { ...gameState, board, remainingFlags: countRemainingFlags(board) };
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (gameState: GameState, coordinate: Coordinate): GameState => {
  if (gameState.status !== GameStatus.Running) {
    return gameState;
  }
  const cell = getCellFromGrid(gameState.board.grid, coordinate);
  if (cell.status === CellStatus.Revealed) {
    return gameState;
  }
  const board = toggleCellFlagInBoard(gameState.board, coordinate);
  return { ...gameState, board, remainingFlags: countRemainingFlags(board) };
};

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (gameState: GameState): GameState => {
  if (gameState.status !== GameStatus.Loss) {
    throw new IllegalStateError("incorrect state of GameStatus, GameStatus must be Loss");
  }
  const board = loadSavedGridStateInBoard(gameState.board);
  const remainingFlags = countRemainingFlags(board);
  const timerStopper = startTimer(gameState.timerCallback);

  return {
    ...gameState,
    timerStopper,
    board,
    status: GameStatus.Running,
    remainingFlags,
  };
};

/** Increment elapsed time by 1. */
export const tickTimer = (gameState: GameState) => {
  // NOTE: GameStatus.Ready is allowed as timerCallback could run before state is updated with
  // GameStatus.Running.
  if (gameState.status !== GameStatus.Ready && gameState.status !== GameStatus.Running) {
    throw new IllegalStateError(
      `tried to tick timer when game status is not ready or running. Current status: ${
        gameState.status
      }`,
    );
  }
  return {
    ...gameState,
    elapsedTime: gameState.elapsedTime + 1,
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
