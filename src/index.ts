import { revealCell, startGame, tickTimer, toggleFlag, undoLoosingMove } from './actions/actions';
import { createCoordinate } from './core/coordinate';
import { createDifficultyLevel } from './core/difficulty';
import { boardToString } from './core/minesweeperBoard';
import { gameReducer, GameState, GameStatus } from './reducers/gameReducer';

// UTIL

/** Create a string representation of the board. */
const getStringifiedBoard = (game: GameState, showAllCells: boolean): string =>
  boardToString(game.board, showAllCells);

/** Check if the game is running. */
const isGameRunning = (game: GameState): boolean => game.status === GameStatus.Running;

/** Check if the game has been lost . */
const isGameLost = (game: GameState): boolean => game.status === GameStatus.Loss;

/** Check if the game has been either won or lost . */
const isGameEnded = (game: GameState): boolean =>
  game.status === GameStatus.Loss || game.status === GameStatus.Win;

// EXPORTS

export {
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
