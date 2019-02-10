import { ICoordinate } from './core/coordinate';
import { createDifficultyLevel, IDifficultyLevel } from './core/difficulty';
import { Grid } from './core/grid';
import {
  boardToString,
  checkWinningBoard,
  countRemainingFlags,
  createMinesweeperBoard,
  fillBoard,
  genLoseState,
  genWinState,
  IMinesweeperBoard,
  loadPreviousSavedState,
  makeCellVisibleAtCoordinate,
  toggleCellFlagStatus,
} from './core/minesweeperBoard';

// TYPES

/** Contains the necessary values for a minesweeper game. */
export interface IMinesweeper {
  /** The board which holds values concerning the game grid. */
  readonly board: IMinesweeperBoard;
  /** The current status of the game. */
  readonly status: GameStatus;
  /** The remaining flags. */
  readonly remainingFlags: number;
  /** The amount of time in ms since the game began.  */
  readonly elapsedTime: number;
  /** The game timer.  */
  readonly timer: number;
}

/** The current status of the game. */
export enum GameStatus {
  /** Game is waiting to start. */
  Waiting,
  /** Game is running. */
  Running,
  /** Game has been lost. */
  Loss,
  /** Game has been won. */
  Win,
}

/** A callback for the game timer. */
export type TimerCallback = (gameTime: number) => {};

// STATE

/** The current state of the game. */
export let State: IMinesweeper;

/** Get the state obj. */
const getState = (): IMinesweeper => {
  return State;
};

/** Update the state. */
const updateState = (newState: Partial<IMinesweeper>): void => {
  // Note: in spread collision the right-most (last) object's value wins out.
  State = { ...State, ...newState };
};

// CONSTS

/** The default game difficulties. */
export const DIFFICULTIES: { [key: string]: IDifficultyLevel } = {
  easy: createDifficultyLevel(9, 9, 10),
  medium: createDifficultyLevel(16, 16, 40),
  hard: createDifficultyLevel(30, 16, 99),
};

// CREATORS

/** Create a difficulty level. */
export const createCustomDifficulty = createDifficultyLevel;

/** Create a minesweeper game. */
export const createMinesweeperGame = (
  difficulty: IDifficultyLevel,
  cells?: Grid,
  elapsedTime?: number,
): void => {
  if (cells && !elapsedTime) {
    throw new Error('tried to create minesweeper game with cells but no elapsed time');
  }

  const board = !cells
    ? createMinesweeperBoard(difficulty.height, difficulty.width, difficulty.numMines)
    : createMinesweeperBoard(difficulty.height, difficulty.width, difficulty.numMines, cells);
  const gameElapsedTime = !elapsedTime ? 0 : elapsedTime;

  updateState({
    board,
    status: GameStatus.Waiting,
    elapsedTime: gameElapsedTime,
    remainingFlags: countRemainingFlags(board),
  });
};

// ACTIONS

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (atCoordinate: ICoordinate): void => {
  const state = getState();
  if (state.status !== GameStatus.Running) {
    throw new Error('tried to toggle flag of cell when game status is not Running');
  }

  const board = toggleCellFlagStatus(state.board, atCoordinate);
  const remainingFlags = countRemainingFlags(board);
  if (checkWinningBoard(board)) {
    const newBoard = genWinState(state.board);

    updateState({
      ...state,
      board: newBoard,
      status: GameStatus.Win,
      remainingFlags: 0,
    });
  } else {
    updateState({ board, remainingFlags });
  }
};

/** Make cell visible at the given coordinate. */
export const revealCell = (coordinate: ICoordinate, timerCallback?: TimerCallback): void => {
  const state = getState();
  if (state.status === GameStatus.Waiting) {
    const filledBoard = fillBoard(state.board, coordinate);

    // Note: timer starts here and when game status changes from Running it will stop.
    startTimer(timerCallback);
    updateState({ board: filledBoard, status: GameStatus.Running });
    return;
  }

  const { board, isMine } = makeCellVisibleAtCoordinate(state.board, coordinate);
  const remainingFlags = countRemainingFlags(board);

  if (isMine) {
    const newBoard = genLoseState(board, coordinate);

    updateState({
      ...state,
      remainingFlags,
      board: newBoard,
      status: GameStatus.Loss,
    });
    return;
  }
  if (checkWinningBoard(board)) {
    const newBoard = genWinState(state.board);
    updateState({
      ...state,
      board: newBoard,
      status: GameStatus.Win,
      remainingFlags: 0,
    });
  } else {
    updateState({ board, remainingFlags });
  }
};

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (timerCallback?: TimerCallback): void => {
  const state = getState();
  if (state.status !== GameStatus.Loss) {
    throw new Error('incorrect state of GameStatus, GameStatus must be Loss');
  }
  const board = loadPreviousSavedState(state.board);
  const remainingFlags = countRemainingFlags(board);
  updateState({ board, status: GameStatus.Running, remainingFlags });
  startTimer(timerCallback);
};

/** Start the game timer. */
const startTimer = (callback?: TimerCallback): void => {
  const tick = () => updateState({ elapsedTime: getState().elapsedTime + 1 });

  const timer = setInterval(() => {
    const state = getState();
    if (state.status !== GameStatus.Running) {
      clearInterval(timer);
      return;
    }
    tick();
    if (callback) {
      callback(state.elapsedTime);
    }
  }, 1000);
  updateState({ timer });
};

// OTHER

/** Create a string representation of the board. */
export const getStringifiedBoard = (): string => boardToString(getState().board);

/** Check if the game is running. */
export const isGameRunning = (): boolean => getState().status === GameStatus.Running;

/** Check if the game has been lost . */
export const isGameLost = (): boolean => getState().status === GameStatus.Loss;

/** Check if the game has been either won or lost . */
export const isGameEnded = (): boolean =>
  getState().status === GameStatus.Loss || getState().status === GameStatus.Win;
