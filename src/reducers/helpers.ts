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
import { IllegalStateError } from '../core/errors';
import { RAND_NUM_GEN } from '../core/random';
import { GameState, GameStatus } from './gameReducer';

/** A callback for the game timer. */
export type TimerCallback = () => void;

/** Create a minesweeper game. */
export const startGameHelper = (action: IStartGameAction): GameState => {
  // TODO: add check for action.gameState
  RAND_NUM_GEN.setSeed(action.randSeed);

  const board = action.gameState
    ? createMinesweeperBoard(action.difficulty, action.gameState.board.grid)
    : createMinesweeperBoard(action.difficulty);
  const elapsedTime = action.gameState ? action.gameState.elapsedTime : 0;
  const status = action.gameState ? action.gameState.status : GameStatus.Waiting;

  return {
    board,
    status,
    elapsedTime,
    remainingFlags: countRemainingFlags(board),
    timer: 0,
  };
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
  if (gameState.status !== GameStatus.Running) {
    throw new IllegalStateError('tried to reveal cell when game state is not Running');
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

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlagHelper = (gameState: GameState, action: IToggleFlagAction): GameState => {
  if (gameState.status !== GameStatus.Running) {
    throw new IllegalStateError('tried to toggle flag of cell when game status is not Running');
  }

  const board = setToggledCellFlagStatus(gameState.board, action.coordinate);
  if (checkWinningBoard(board)) {
    const newBoard = setWinState(gameState.board);
    return {
      ...gameState,
      board: newBoard,
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }
  return { ...gameState, board, remainingFlags: countRemainingFlags(board) };
};

/** Load the previous state before the game has lost. */
export const undoLoosingMoveHelper = (
  gameState: GameState,
  action: IUndoLoosingMoveAction,
): GameState => {
  if (gameState.status !== GameStatus.Loss) {
    throw new IllegalStateError('incorrect state of GameStatus, GameStatus must be Loss');
  }
  const board = setGridFromSavedGridState(gameState.board);
  const remainingFlags = countRemainingFlags(board);

  startTimer(action.timerCallback);
  return { ...gameState, board, status: GameStatus.Running, remainingFlags };
};

export const tickTimerHelper = (gameState: GameState) => {
  // NOTE: GameStatus.Waiting is allowed as timerCallback runs before getting an updated state.
  if (gameState.status !== GameStatus.Waiting && gameState.status !== GameStatus.Running) {
    throw new IllegalStateError(
      `tried to tick timer when game status is not waiting or running. Current status: ${
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
const startTimer = (callback: TimerCallback): number => {
  const timer = setInterval(() => {
    callback();
  }, 1000);
  return timer;
};

const stopTimer = (timer: number) => {
  clearInterval(timer);
};
