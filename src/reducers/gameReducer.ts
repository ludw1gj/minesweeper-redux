import { GameActions } from '../actions/actions';
import { GameType } from '../actions/types';
import { IMinesweeperBoard } from '../core/minesweeperBoard';
import {
  revealCellHelper,
  startGameHelper,
  tickTimerHelper,
  toggleFlagHelper,
  undoLoosingMoveHelper,
} from './helpers';

// TYPES

/** Contains the necessary values for a minesweeper game. */
export interface GameState {
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
  Waiting = 'WAITING',
  /** Game is running. */
  Running = 'RUNNING',
  /** Game has been lost. */
  Loss = 'LOSS',
  /** Game has been won. */
  Win = 'WIN',
}

// REDUCER
const initialState: GameState = {
  board: {
    difficulty: { height: 0, width: 0, numMines: 0 },
    numCells: 25,
    grid: [[]],
    numFlagged: 0,
  },
  status: GameStatus.Waiting,
  elapsedTime: 0,
  remainingFlags: 0,
  timer: 0,
};

export const gameReducer = (state: GameState = initialState, action: GameActions): GameState => {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case GameType.START_GAME:
      return startGameHelper(action);

    case GameType.TOGGLE_FLAG:
      return toggleFlagHelper(state, action);

    case GameType.REVEAL_CELL:
      return revealCellHelper(state, action);

    case GameType.TICK_TIMER:
      return tickTimerHelper(state);

    case GameType.UNDO_LOOSING_MOVE:
      return undoLoosingMoveHelper(state, action);

    default:
      return state;
  }
};
