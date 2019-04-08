import { GameActions, GameType } from "../actions";
import { GameStatus, IMinesweeper, Minesweeper } from "../core";

const initialState: IMinesweeper = {
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

export const gameReducer = (
  state: IMinesweeper = initialState,
  action: GameActions,
): IMinesweeper => {
  switch (action.type) {
    case GameType.START_GAME:
      return Minesweeper.startGame(action.randSeed, action.difficulty, action.timerCallback);

    case GameType.LOAD_GAME:
      return Minesweeper.loadGame(action.gameState, action.timerCallback);

    case GameType.REVEAL_CELL:
      return Minesweeper.revealCell(state, action.coordinate);

    case GameType.TOGGLE_FLAG:
      return Minesweeper.toggleFlag(state, action.coordinate);

    case GameType.TICK_TIMER:
      return Minesweeper.tickTimer(state);

    case GameType.UNDO_LOOSING_MOVE:
      return Minesweeper.undoLoosingMove(state);

    default:
      return state;
  }
};
