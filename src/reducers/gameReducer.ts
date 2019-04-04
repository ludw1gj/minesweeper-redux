import { GameActions, GameType } from '../actions';
import {
  GameState,
  GameStatus,
  loadGame,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
  undoLoosingMove,
} from '../core';

const initialState: GameState = {
  board: {
    difficulty: { height: 0, width: 0, numMines: 0 },
    numCells: 0,
    grid: { height: 0, width: 0, cells: [[]] },
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
      return startGame(action.randSeed, action.difficulty, action.timerCallback);

    case GameType.LOAD_GAME:
      return loadGame(action.gameState, action.timerCallback);

    case GameType.REVEAL_CELL:
      return revealCell(state, action.coordinate);

    case GameType.TOGGLE_FLAG:
      return toggleFlag(state, action.coordinate);

    case GameType.TICK_TIMER:
      return tickTimer(state);

    case GameType.UNDO_LOOSING_MOVE:
      return undoLoosingMove(state);

    default:
      return state;
  }
};
