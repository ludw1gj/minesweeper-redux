import { IMinesweeper, TimerCallback } from "../core";
import { ICoordinate } from "../core/coordinate";
import { IDifficulty } from "../core/difficulty";
import { GameType } from "./types";

export interface StartGameActionOptions {
  difficulty: IDifficulty;
  randSeed: number;
  timerCallback?: TimerCallback;
}

export interface StartGameAction extends StartGameActionOptions {
  type: GameType.START_GAME;
}

export interface LoadGameActionOptions {
  gameState: IMinesweeper;
  timerCallback?: TimerCallback;
}

export interface LoadGameAction extends LoadGameActionOptions {
  type: GameType.LOAD_GAME;
}

export interface RevealCellActionOptions {
  coordinate: ICoordinate;
}

export interface RevealCellAction extends RevealCellActionOptions {
  type: GameType.REVEAL_CELL;
}

export interface ToggleFlagActionOptions {
  coordinate: ICoordinate;
}

export interface ToggleFlagAction extends ToggleFlagActionOptions {
  type: GameType.TOGGLE_FLAG;
}

export interface UndoLoosingMoveAction {
  type: GameType.UNDO_LOOSING_MOVE;
}

export interface TickTimerAction {
  type: GameType.TICK_TIMER;
}

/** Create a minesweeper game. */
export const startGame = (options: StartGameActionOptions): StartGameAction => ({
  type: GameType.START_GAME,
  ...options,
});

/** Load a game from given game state. */
export const loadGame = (options: LoadGameActionOptions): LoadGameAction => ({
  type: GameType.LOAD_GAME,
  ...options,
});

/** Make cell revealed at the given coordinate. */
export const revealCell = (options: RevealCellActionOptions): RevealCellAction => ({
  type: GameType.REVEAL_CELL,
  ...options,
});

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (options: ToggleFlagActionOptions): ToggleFlagAction => ({
  type: GameType.TOGGLE_FLAG,
  ...options,
});

/** Load the previous state before the game was lost. */
export const undoLoosingMove = (): UndoLoosingMoveAction => ({
  type: GameType.UNDO_LOOSING_MOVE,
});

/** Tick the game timer. Add 1 (seconds) to elapsed time. */
export const tickTimer = (): TickTimerAction => ({
  type: GameType.TICK_TIMER,
});

export type GameActions =
  | StartGameAction
  | LoadGameAction
  | ToggleFlagAction
  | RevealCellAction
  | UndoLoosingMoveAction
  | TickTimerAction;
