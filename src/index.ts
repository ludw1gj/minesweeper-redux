import { revealCell, startGame, tickTimer, toggleFlag, undoLoosingMove } from './actions/actions';
import { createCoordinate } from './core/coordinate';
import { createDifficultyLevel } from './core/difficulty';
import { boardToString } from './core/minesweeperBoard';
import { gameReducer, GameState, GameStatus } from './reducers/gameReducer';

// UTIL

/** Get game state that is loadable. */
export const getLoadableGameState = (game: GameState): GameState => ({
  ...game,
  timerCallback: undefined,
  timerStopper: undefined,
});

/** Create a string representation of the board. */
export const getStringifiedBoard = (game: GameState, showAllCells: boolean): string =>
  boardToString(game.board, showAllCells);

/** Check if the game is running. */
export const isGameRunning = (game: GameState): boolean => game.status === GameStatus.Running;

/** Check if the game has been lost . */
export const isGameLost = (game: GameState): boolean => game.status === GameStatus.Loss;

/** Check if the game has been either won or lost . */
export const isGameEnded = (game: GameState): boolean =>
  game.status === GameStatus.Loss || game.status === GameStatus.Win;

// EXPORTS

export {
  startGame,
  toggleFlag,
  revealCell,
  undoLoosingMove,
  tickTimer,
  gameReducer,
  createDifficultyLevel,
  createCoordinate,
  GameState,
  GameStatus,
};

export default {
  getStringifiedBoard,
  isGameRunning,
  isGameLost,
  isGameEnded,
  startGame,
  toggleFlag,
  revealCell,
  undoLoosingMove,
  tickTimer,
  gameReducer,
  createDifficultyLevel,
  createCoordinate,
};
