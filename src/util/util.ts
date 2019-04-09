import { Board } from "../core/board";
import { CellStatus } from "../core/cell";
import { Coordinate } from "../core/coordinate";
import { Difficulty } from "../core/difficulty";
import { GameStatus, IMinesweeper } from "../core/game";

/** Default difficulty levels. */
export const difficulties = Difficulty.default;

/** Create a difficulty level for a minesweeper game. */
export const createDifficultyLevel = Difficulty.create;

/** Create a coordinate. */
export const createCoordinate = Coordinate.create;

/** Get game state that is loadable. */
export const getLoadableGameState = (game: IMinesweeper): IMinesweeper => ({
  ...game,
  timerCallback: undefined,
  timerStopper: undefined,
});

/** Create a string representation of the board. */
export const getStringifiedBoard = (game: IMinesweeper, showAllCells: boolean): string =>
  Board.toString(game.board, showAllCells);

/** Check if the game is running. */
export const isGameRunning = (game: IMinesweeper): boolean => game.status === GameStatus.Running;

/** Check if the game has been lost . */
export const isGameLost = (game: IMinesweeper): boolean => game.status === GameStatus.Loss;

/** Check if the game has been either won or lost . */
export const isGameEnded = (game: IMinesweeper): boolean =>
  game.status === GameStatus.Loss || game.status === GameStatus.Win;

/** Count amount of revealed and detonated cells. */
export const countVisibleCells = (game: IMinesweeper): number =>
  game.board.grid.cells
    .map(
      row =>
        row.filter(
          cell => cell.status === CellStatus.Revealed || cell.status === CellStatus.Detonated,
        ).length,
    )
    .reduce((n, acc) => n + acc);
