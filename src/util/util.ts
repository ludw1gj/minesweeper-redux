import { CellStatus, GameState, GameStatus } from "../core";
import { boardToString } from "../core/minesweeperBoard";

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

/** Count amount of revealed and detonated cells. */
export const countVisibleCells = (game: GameState): number =>
  game.board.grid.cells
    .map(
      row =>
        row.filter(
          cell => cell.status === CellStatus.Revealed || cell.status === CellStatus.Detonated,
        ).length,
    )
    .reduce((n, acc) => n + acc);
