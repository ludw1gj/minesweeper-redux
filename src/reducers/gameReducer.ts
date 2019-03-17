import { GameActions } from '../actions/actions';
import { GameType } from '../actions/types';
import { DifficultyLevel } from '../core';
import { MinesweeperBoard } from '../core/minesweeperBoard';
import { GameState, GameStatus } from './gameState';
import {
  loadGameUpdater,
  revealCellUpdater,
  startGameUpdater,
  tickTimerUpdater,
  toggleFlagUpdater,
  undoLoosingMoveUpdater,
} from './updaters';

const initialState: GameState = {
  board: new MinesweeperBoard(new DifficultyLevel(0, 0, 0)),
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
