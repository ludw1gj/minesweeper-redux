import { Coordinate, Minesweeper, GameStatus, MinesweeperBoard } from './types';

import {
  gameLoseState,
  gameWinState,
  countVisibleCells,
  countFlaggedCells
} from './minesweeperBoard';

/** Reveals all cells. */
export const playerHasLost = (
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
//TODO: remove export
export const playerHasWon = (game: Minesweeper): Minesweeper => {
  const board = gameWinState(game.board);
  if (!board) {
    return game;
  }
  console.log('You have won the game.');
  return { ...game, board, status: GameStatus.Win, remainingFlags: 0 };
};

/** Check if the game has been won. */
export const hasPlayerWon = (board: MinesweeperBoard): boolean => {
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
