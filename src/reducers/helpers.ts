import {
  checkWinningBoard,
  countRemainingFlags,
  createMinesweeperBoard,
  setCellVisibleAtCoordinate,
  setFilledBoard,
  setGridFromSavedGridState,
  setLoseState,
  setToggledCellFlagStatus,
  setWinState,
} from '../core/minesweeperBoard';

import {
  IRevealCellAction,
  IStartGameAction,
  IToggleFlagAction,
  IUndoLoosingMoveAction,
} from '../actions/actions';
import { GameState, GameStatus } from './gameReducer';

/** A callback for the game timer. */
export type TimerCallback = () => {};

/** Create a minesweeper game. */
export const startGameHelper = (gameState: GameState, action: IStartGameAction): GameState => {
  if (action.grid && !action.elapsedTime) {
    throw new Error('tried to create minesweeper game with grid but no elapsed time');
  }

  const board = !action.grid
    ? createMinesweeperBoard(action.difficulty)
    : createMinesweeperBoard(action.difficulty, action.grid);
  const gameElapsedTime = !action.elapsedTime ? 0 : action.elapsedTime;

  return {
    ...gameState,
    board,
    status: GameStatus.Waiting,
    elapsedTime: gameElapsedTime,
    remainingFlags: countRemainingFlags(board),
  };
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlagHelper = (gameState: GameState, action: IToggleFlagAction): GameState => {
  if (gameState.status !== GameStatus.Running) {
    throw new Error('tried to toggle flag of cell when game status is not Running');
  }

  const board = setToggledCellFlagStatus(gameState.board, action.coordinate);
  const remainingFlags = countRemainingFlags(board);
  if (checkWinningBoard(board)) {
    const newBoard = setWinState(gameState.board);
    return {
      ...gameState,
      board: newBoard,
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }
  return { ...gameState, board, remainingFlags };
};

/** Make cell visible at the given coordinate. */
export const revealCellHelper = (gameState: GameState, action: IRevealCellAction): GameState => {
  if (gameState.status === GameStatus.Waiting) {
    const filledBoard = setFilledBoard(gameState.board, action.coordinate);
    const newBoard = setCellVisibleAtCoordinate(filledBoard, action.coordinate);

    // Note: timer starts here and when game status changes from Running it will stop.
    startTimer(action.timerCallback);
    return { ...gameState, board: newBoard.board, status: GameStatus.Running };
  }

  const { board, isMine } = setCellVisibleAtCoordinate(gameState.board, action.coordinate);
  const remainingFlags = countRemainingFlags(board);

  if (isMine) {
    const newBoard = setLoseState(board, action.coordinate);
    stopTimer(gameState.timer);
    return {
      ...gameState,
      remainingFlags,
      board: newBoard,
      status: GameStatus.Loss,
    };
  }
  if (checkWinningBoard(board)) {
    const newBoard = setWinState(gameState.board);
    return {
      ...gameState,
      board: newBoard,
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }
  return { ...gameState, board, remainingFlags };
};

/** Load the previous state before the game has lost. */
export const undoLoosingMoveHelper = (
  gameState: GameState,
  action: IUndoLoosingMoveAction,
): GameState => {
  if (gameState.status !== GameStatus.Loss) {
    throw new Error('incorrect state of GameStatus, GameStatus must be Loss');
  }
  const board = setGridFromSavedGridState(gameState.board);
  const remainingFlags = countRemainingFlags(board);

  startTimer(action.timerCallback);
  return { ...gameState, board, status: GameStatus.Running, remainingFlags };
};

export const tickTimerHelper = (gameState: GameState) => ({
  ...gameState,
  elapsedTime: gameState.elapsedTime + 1,
});

/** Start the game timer. */
const startTimer = (callback: TimerCallback): number => {
  const timer = setInterval(() => {
    callback();
  }, 1000);
  return timer;
};

const stopTimer = (timer: number) => {
  clearInterval(timer);
};
