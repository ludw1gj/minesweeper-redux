import { GameActions } from '../actions/actions';
import { GameType } from '../actions/types';
import { createCoordinate } from '../core';
import { createWaterCell } from '../core/cell';
import { GameState, GameStatus } from './gameState';
import {
  loadGameUpdater,
  revealCellUpdater,
  startGameUpdater,
  tickTimerUpdater,
  toggleFlagUpdater,
  undoLoosingMoveUpdater,
} from './updaters';

// REDUCER
const initialState: GameState = {
  board: {
    difficulty: { height: 1, width: 1, numMines: 0 },
    numCells: 1,
    grid: [[createWaterCell(createCoordinate(0, 0), false, false, 0)]],
    numFlagged: 0,
  },
  status: GameStatus.Waiting,
  remainingFlags: 0,
  elapsedTime: 0,
  randSeed: 1,
};

export const gameReducer = (state: GameState = initialState, action: GameActions): GameState => {
  switch (action.type) {
    case GameType.START_GAME:
      return startGameUpdater(action);

    case GameType.LOAD_GAME:
      return loadGameUpdater(action);

    case GameType.REVEAL_CELL:
      return revealCellUpdater(state, action);

    case GameType.TOGGLE_FLAG:
      return toggleFlagUpdater(state, action);

    case GameType.TICK_TIMER:
      return tickTimerUpdater(state);

    case GameType.UNDO_LOOSING_MOVE:
      return undoLoosingMoveUpdater(state);

    default:
      return state;
  }
};
