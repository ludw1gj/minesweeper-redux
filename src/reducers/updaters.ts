import { IllegalStateError } from '../core/errors';
import { GameState, GameStatus, TimerCallback, TimerStopper } from '../core/gameState';
import {
  countRemainingFlags,
  createMinesweeperBoard,
  isWinningBoard,
  setFilledBoard,
  setGridFromSavedGridState,
  setLoseState,
  setToggledCellFlagStatus,
  setWaterCellVisibleOnBoard,
  setWinState,
} from '../core/minesweeperBoard';
import { RAND_NUM_GEN } from '../core/random';

import {
  LoadGameAction,
  RevealCellAction,
  StartGameAction,
  ToggleFlagAction,
} from '../actions/actions';
import { getCell } from '../core/grid';

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

    const _cell = getCell(filledBoard.grid, action.coordinate);
    if (_cell.isMine) {
      throw new IllegalStateError('cell should not be a mine cell');
    }

    // Note: timer starts here and when game status changes from Running it will stop.
    return {
      ...gameState,
      board: setWaterCellVisibleOnBoard(filledBoard, _cell),
      status: GameStatus.Running,
      timerStopper: startTimer(gameState.timerCallback),
    };
  }
  if (gameState.status !== GameStatus.Running) {
    throw new IllegalStateError('tried to reveal cell when game status is not Running');
  }

  const cell = getCell(gameState.board.grid, action.coordinate);
  if (cell.isVisible) {
    return gameState;
  }
  if (cell.isMine) {
    if (gameState.timerStopper) {
      gameState.timerStopper();
    }
    return {
      ...gameState,
      board: setLoseState(gameState.board, cell),
      remainingFlags: 0,
      status: GameStatus.Loss,
    };
  }

  const board = setWaterCellVisibleOnBoard(gameState.board, cell);
  if (isWinningBoard(board)) {
    if (gameState.timerStopper) {
      gameState.timerStopper();
    }
    return {
      ...gameState,
      board: setWinState(gameState.board),
      status: GameStatus.Win,
      remainingFlags: 0,
    };
  }

  return { ...gameState, board, remainingFlags: countRemainingFlags(board) };
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlagUpdater = (gameState: GameState, action: ToggleFlagAction): GameState => {
  if (gameState.status !== GameStatus.Running) {
    throw new IllegalStateError('tried to toggle flag of cell when game status is not Running');
  }

  const cell = getCell(gameState.board.grid, action.coordinate);
  if (cell.isVisible) {
    return gameState;
  }
  if (gameState.remainingFlags === 0 && !cell.isFlagged) {
    return gameState;
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
    clearInterval(timer);
  };
  return timerStopper;
};
