import {
  createMinesweeperBoard,
  gameLoseState,
  gameWinState,
  toggleCellFlagStatus,
  makeCellVisible,
  boardToString,
  initBoard,
  loadPreviousSavedState,
  countVisibleCells,
  countFlaggedCells
} from './lib/minesweeperBoard';
import { MinesweeperBoard, Cell, Coordinate } from './lib/types';

type TimerCallback = (gameTime: number) => {};

export enum GameStatus {
  /** Game is waiting to start. */
  Waiting,
  Running,
  Loss,
  Win
}

export interface Minesweeper {
  readonly board: MinesweeperBoard;
  readonly status: GameStatus;
  readonly elapsedTime: number;
}

let state: Minesweeper;

const updateState = (newState: Minesweeper): void => {
  state = newState;
};

export const getState = (): Minesweeper => {
  return state;
};

export const createMinesweeperGame = (
  height: number,
  width: number,
  numMines: number,
  cells?: Cell[][],
  elapsedTime?: number
): Minesweeper => {
  if (cells && !elapsedTime) {
    console.warn(
      'tried to create minesweeper game with cells but no elapsed time'
    );
  }

  const board = !cells
    ? createMinesweeperBoard(height, width, numMines)
    : createMinesweeperBoard(height, width, numMines, cells);
  const _elapsedTime = !elapsedTime ? 0 : elapsedTime;
  return {
    board,
    status: GameStatus.Waiting,
    elapsedTime: _elapsedTime
  };
};

/** Reveals all cells. */
const playerHasLost = (
  game: Minesweeper,
  atCoordinate: Coordinate
): Minesweeper => {
  const board = gameLoseState(game.board, atCoordinate);
  if (!board) {
    return game;
  }
  console.log('You have lost the game.');
  return { ...game, board, status: GameStatus.Loss };
};

/** Player has won the game due to all mines being flagged and non-mine cells being revealed. */
const playerHasWon = (game: Minesweeper): Minesweeper => {
  const board = gameWinState(game.board);
  if (!board) {
    return game;
  }
  console.log('You have won the game.');
  return { ...game, board, status: GameStatus.Win };
};

/** Check if the game has been won. */
const hasPlayerWon = (board: MinesweeperBoard): boolean => {
  const waterCellsAmt = board.height * board.width - board.numMines;
  const visible = countVisibleCells(board.cells);
  const flagged = countFlaggedCells(board.cells);

  const onlyOneFlagRemaining =
    visible === waterCellsAmt && flagged === board.numMines - 1;
  const allMinesFlaggedAndAllWaterCellsVisible =
    visible === waterCellsAmt && flagged === board.numMines;
  if (onlyOneFlagRemaining || allMinesFlaggedAndAllWaterCellsVisible) {
    return true;
  }
  return false;
};

// const startTimer = (
//   game: Minesweeper,
//   callback: TimerCallback
// ): Minesweeper => {
//   const timer = setInterval(() => {
//     if (game.status !== GameStatus.Running) {
//       clearInterval(timer);
//       return;
//     }
//     game.elapsedTime++;
//     callback(game.elapsedTime);
//   }, 1000);
// };

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (
  game: Minesweeper,
  atCoordinate: Coordinate
): Minesweeper => {
  if (game.status !== GameStatus.Running) {
    console.warn(
      'tried to toggle flag of cell when game status is not Running'
    );
    return game;
  }
  const board = toggleCellFlagStatus(game.board, atCoordinate);
  const _game = { ...game, board };
  if (hasPlayerWon(_game.board)) {
    return playerHasWon(_game);
  }
  return _game;
};

/** Make cell visible at the given coordinate. */
export const revealCell = (
  game: Minesweeper,
  coordinate: Coordinate,
  timerCallback: TimerCallback
): Minesweeper => {
  if (game.status === GameStatus.Waiting) {
    const board = initBoard(game.board, coordinate);
    // TODO: enable timer
    // Note: timer starts here and when game status changes from Running it will stop.
    // startTimer(game, timerCallback);
    return { ...game, board, status: GameStatus.Running };
  }

  const { board, isMine } = makeCellVisible(game.board, coordinate);
  if (isMine) {
    return playerHasLost(game, coordinate);
  }
  if (!board) {
    return game;
  }
  const _game = { ...game, board };
  if (hasPlayerWon(_game.board)) {
    return playerHasWon(_game);
  }
  return _game;
};

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (
  game: Minesweeper,
  timerCallback: TimerCallback
): Minesweeper => {
  if (game.status !== GameStatus.Loss) {
    console.warn('incorrect state of GameStatus');
    return game;
  }
  const board = loadPreviousSavedState(game.board);
  return { ...game, board, status: GameStatus.Running };
  // TODO: enable timer
  // startTimer(game, timerCallback);
};

export const countRemainingFlags = (board: MinesweeperBoard): number =>
  board.numMines - board.numFlagged;

export const isGameRunning = (game: Minesweeper): boolean =>
  game.status === GameStatus.Running;

export const isGameLost = (game: Minesweeper): boolean =>
  game.status === GameStatus.Loss;

export const isGameEnded = (game: Minesweeper): boolean =>
  game.status === GameStatus.Loss || game.status === GameStatus.Win;

/** Create a string representation of the board. */
export const printBoard = (game: Minesweeper): void =>
  console.log(boardToString(game.board.cells));
