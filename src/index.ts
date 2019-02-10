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

export interface IMinesweeper {
  readonly board: IMinesweeperBoard;
  readonly status: GameStatus;
  readonly remainingFlags: number;
  readonly elapsedTime: number;
  readonly timer: number;
}

export enum GameStatus {
  /** Game is waiting to start. */
  Waiting,
  Running,
  Loss,
  Win,
}

export let State: IMinesweeper;

const getState = (): IMinesweeper => {
  return State;
};

const updateState = (newState: Partial<IMinesweeper>): void => {
  // Note: in spread collision the right-most (last) object's value wins out.
  State = { ...State, ...newState };
};

export const createCustomDifficulty = createDifficultyLevel;

export const difficulties: { [key: string]: IDifficultyLevel } = {
  easy: createDifficultyLevel(9, 9, 10),
  medium: createDifficultyLevel(16, 16, 40),
  hard: createDifficultyLevel(30, 16, 99),
};

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

/** Create a string representation of the board. */
export const printBoard = (): string => boardToString(getState().board);

export const isGameRunning = (): boolean => getState().status === GameStatus.Running;

export const isGameLost = (): boolean => getState().status === GameStatus.Loss;

export const isGameEnded = (): boolean =>
  getState().status === GameStatus.Loss || getState().status === GameStatus.Win;

export type TimerCallback = (gameTime: number) => {};

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
