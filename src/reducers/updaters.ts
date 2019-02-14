import { IllegalStateError, UserError } from '../core/errors';
import { GameState, GameStatus, TimerCallback, TimerStopper } from '../core/gameState';
import {
  countRemainingFlags,
  createMinesweeperBoard,
  isWinningBoard,
  setCellVisibleAtCoordinate,
  setFilledBoard,
  setGridFromSavedGridState,
  setLoseState,
  setToggledCellFlagStatus,
  setWinState,
} from '../core/minesweeperBoard';
import { RAND_NUM_GEN } from '../core/random';

import {
  LoadGameAction,
  RevealCellAction,
  StartGameAction,
  ToggleFlagAction,
} from '../actions/actions';

/** Create a minesweeper game. */
export const startGameUpdater = (action: StartGameAction): GameState => {
  RAND_NUM_GEN.setSeed(action.randSeed);

  return {
    board: createMinesweeperBoard(action.difficulty),
    status: GameStatus.Waiting,
    remainingFlags: action.difficulty.numMines,
    elapsedTime: 0,
    randSeed: action.randSeed,
    timerCallback: action.timerCallback,
  };
};

/** Load a game state. */
export const loadGameUpdater = (action: LoadGameAction) => {
  const state = {
    ...action.gameState,
    timerCallback: action.timerCallback,
    timerStopper: undefined,
  };

  if (action.gameState.status === GameStatus.Running) {
    const timerStopper = startTimer(action.timerCallback);
    return { ...state, timerStopper };
  }
  return state;
};

/** Make cell visible at the given coordinate. */
export const revealCellUpdater = (gameState: GameState, action: RevealCellAction): GameState => {
  if (gameState.status === GameStatus.Waiting) {
    const filledBoard = setFilledBoard(gameState.board, action.coordinate);
    // tslint:disable-next-line: no-shadowed-variable
    const { board } = setCellVisibleAtCoordinate(filledBoard, action.coordinate);

    // Note: timer starts here and when game status changes from Running it will stop.
    const timerStopper = startTimer(gameState.timerCallback);
    return { ...gameState, timerStopper, board, status: GameStatus.Running };
  }
  if (gameState.status !== GameStatus.Running) {
    throw new IllegalStateError('tried to reveal cell when game status is not Running');
  }

  const { board, isMine } = setCellVisibleAtCoordinate(gameState.board, action.coordinate);
  const remainingFlags = countRemainingFlags(board);

  if (isMine) {
    const _board = setLoseState(board, action.coordinate);
    if (gameState.timerStopper) {
      gameState.timerStopper();
    }
    return {
      ...gameState,
      remainingFlags: 0,
      board: _board,
      status: GameStatus.Loss,
    };
  }
  if (isWinningBoard(board)) {
    const _board = setWinState(gameState.board);
    if (gameState.timerStopper) {
      gameState.timerStopper();
    }
    return {
      ...gameState,
      board: _board,
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }
  return { ...gameState, board, remainingFlags };
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlagUpdater = (gameState: GameState, action: ToggleFlagAction): GameState => {
  if (gameState.status !== GameStatus.Running) {
    throw new IllegalStateError('tried to toggle flag of cell when game status is not Running');
  }
  if (gameState.remainingFlags === 0) {
    throw new UserError('tried to toggle flag when no flags remaining');
  }

  const board = setToggledCellFlagStatus(gameState.board, action.coordinate);
  return { ...gameState, board, remainingFlags: countRemainingFlags(board) };
};

/** Load the previous state before the game has lost. */
export const undoLoosingMoveUpdater = (gameState: GameState): GameState => {
  if (gameState.status !== GameStatus.Loss) {
    throw new IllegalStateError('incorrect state of GameStatus, GameStatus must be Loss');
  }
  const board = setGridFromSavedGridState(gameState.board);
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
export const tickTimerUpdater = (gameState: GameState) => {
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
const startTimer = (callback?: TimerCallback): TimerStopper | undefined => {
  if (!callback) {
    return undefined;
  }
  const timer = setInterval(() => {
    callback();
  }, 1000);
  const timerStopper = () => {
    console.log('timer stopped.');
    clearInterval(timer);
  };
  return timerStopper;
};
