import produce from 'immer';

import {
  LoadGameAction,
  RevealCellAction,
  StartGameAction,
  ToggleFlagAction,
} from '../actions/actions';
import {
  countRemainingFlags,
  createMinesweeperBoard,
  isWinningBoard,
  makeBoardWithCellVisible,
  makeBoardWithLoseState,
  makeBoardWithToggledFlag,
  makeBoardWithWinState,
  makeFilledBoard,
  restoreBoardFromSavedGridState,
} from '../core/minesweeperBoard';
import { IllegalStateError } from '../util/errors';
import { RAND_NUM_GEN } from '../util/random';
import { GameState, GameStatus, TimerCallback, TimerStopper } from './gameState';

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
  const newGameSate = produce(action.gameState, draft => {
    draft.timerCallback = action.timerCallback;
    draft.timerStopper = undefined;

    if (action.gameState.status === GameStatus.Running) {
      draft.timerStopper = startTimer(action.timerCallback);
    }
  });
  return newGameSate;
};

/** Make cell visible at the given coordinate. */
export const revealCellUpdater = (gameState: GameState, action: RevealCellAction): GameState => {
  const newGameState = produce(gameState, draft => {
    if (gameState.status === GameStatus.Waiting) {
      draft.board = makeFilledBoard(gameState.board, action.coordinate);
      draft.status = GameStatus.Running;
      // Note: timer starts here and when game status changes from Running it will stop.
      draft.timerStopper = startTimer(gameState.timerCallback);
      return;
    }

    const cell = draft.board.grid.cells[action.coordinate.y][action.coordinate.x];
    if (cell.isVisible) {
      return;
    }
    if (cell.isMine) {
      if (gameState.timerStopper) {
        gameState.timerStopper();
      }
      draft.board = makeBoardWithLoseState(gameState.board, cell);
      draft.remainingFlags = 0;
      draft.status = GameStatus.Loss;
      return;
    }

    draft.board = makeBoardWithCellVisible(gameState.board, cell);
    if (isWinningBoard(draft.board)) {
      if (gameState.timerStopper) {
        gameState.timerStopper();
      }
      draft.board = makeBoardWithWinState(gameState.board);
      draft.status = GameStatus.Win;
      draft.remainingFlags = 0;
    } else {
      draft.remainingFlags = countRemainingFlags(draft.board);
    }
  });
  return newGameState;
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlagUpdater = (gameState: GameState, action: ToggleFlagAction): GameState => {
  const newGameState = produce(gameState, draft => {
    const cell = draft.board.grid.cells[action.coordinate.y][action.coordinate.x];
    if (cell.isVisible) {
      return;
    }
    draft.board = makeBoardWithToggledFlag(gameState.board, action.coordinate);
    draft.remainingFlags = countRemainingFlags(draft.board);
  });
  return newGameState;
};

/** Load the previous state before the game has lost. */
export const undoLoosingMoveUpdater = (gameState: GameState): GameState => {
  if (gameState.status !== GameStatus.Loss) {
    throw new IllegalStateError('incorrect state of GameStatus, GameStatus must be Loss');
  }

  const newGameState = produce(gameState, draft => {
    draft.board = restoreBoardFromSavedGridState(gameState.board);
    draft.remainingFlags = countRemainingFlags(draft.board);
    draft.timerStopper = startTimer(gameState.timerCallback);
    draft.status = GameStatus.Running;
  });
  return newGameState;
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
