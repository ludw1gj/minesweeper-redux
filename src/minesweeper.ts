import { Cell } from './lib/cell';
import { Coordinate } from './lib/coordinate';
import {
  MinesweeperBoard,
  createMinesweeperBoard,
  countFlaggedAndVisibleCells,
  gameLoseState,
  gameWinState,
  toggleCellFlagStatus,
  initMatrix,
  makeCellVisible,
  boardToString
} from './lib/minesweeperBoard';
import { loadPreviousSavedState } from './lib/minesweeperBoard';

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
  status: GameStatus;
  elapsedTime: number;
}

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
const playerHasLost = (game: Minesweeper, atCoordinate: Coordinate): void => {
  gameLoseState(game.board.matrix, atCoordinate);

  game.status = GameStatus.Loss;
  console.log('You have lost the game.');
};

/** Player has won the game due to all mines being flagged and non-mine cells being revealed. */
const playerHasWon = (game: Minesweeper): void => {
  gameWinState(game.board.matrix);

  game.status = GameStatus.Win;
  console.log('You have won the game.');
};

/** Check if the game has been won. */
const hasPlayerWon = (board: MinesweeperBoard): boolean => {
  const waterCellsAmt =
    board.matrix.height * board.matrix.width - board.numMines;
  const { visible, flagged } = countFlaggedAndVisibleCells(board.matrix);

  const onlyOneFlagRemaining =
    visible === waterCellsAmt && flagged === board.numMines - 1;
  const allMinesFlaggedAndAllWaterCellsVisible =
    visible === waterCellsAmt && flagged === board.numMines;
  if (onlyOneFlagRemaining || allMinesFlaggedAndAllWaterCellsVisible) {
    return true;
  }
  return false;
};

const startTimer = (game: Minesweeper, callback: TimerCallback): void => {
  const timer = setInterval(() => {
    if (game.status !== GameStatus.Running) {
      clearInterval(timer);
      return;
    }
    game.elapsedTime++;
    callback(game.elapsedTime);
  }, 1000);
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (
  game: Minesweeper,
  atCoordinate: Coordinate
): void => {
  if (game.status !== GameStatus.Running) {
    console.warn(
      'tried to toggle flag of cell when game status is not Running'
    );
    return;
  }
  toggleCellFlagStatus(game.board, atCoordinate);
  if (hasPlayerWon(game.board)) {
    playerHasWon(game);
  }
};

/** Make cell visible at the given coordinate. */
export const revealCell = (
  game: Minesweeper,
  coordinate: Coordinate,
  timerCallback: TimerCallback
): void => {
  if (game.status === GameStatus.Waiting) {
    initMatrix(game.board, coordinate);
    // Note: timer starts here and when game status changes from Running it will stop.
    startTimer(game, timerCallback);
    game.status = GameStatus.Running;
  }

  const isMine = makeCellVisible(game.board.matrix, coordinate);
  if (isMine) {
    playerHasLost(game, coordinate);
    return;
  }
  if (hasPlayerWon(game.board)) {
    playerHasWon(game);
  }
};

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (
  game: Minesweeper,
  timerCallback: TimerCallback
): void => {
  if (game.status !== GameStatus.Loss) {
    console.warn('incorrect state of GameStatus');
    return;
  }
  loadPreviousSavedState(game.board.matrix);
  game.status = GameStatus.Running;
  startTimer(game, timerCallback);
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
  console.log(boardToString(game.board.matrix));
