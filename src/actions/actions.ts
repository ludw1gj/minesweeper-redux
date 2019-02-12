import { Coordinate } from '../core/coordinate';
import { DifficultyLevel } from '../core/difficulty';
import { GameState } from '../index';
import { TimerCallback } from '../reducers/updaters';
import { GameType } from './types';

export interface StartGameActionOptions {
  difficulty: DifficultyLevel;
  randSeed: number;
  timerCallback?: TimerCallback;
}

export interface StartGameAction extends StartGameActionOptions {
  type: GameType.START_GAME;
}

export interface RevealCellActionOptions {
  coordinate: Coordinate;
}

export interface RevealCellAction extends RevealCellActionOptions {
  type: GameType.REVEAL_CELL;
}

export interface ToggleFlagActionOptions {
  coordinate: Coordinate;
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

export interface LoadGameActionOptions {
  gameState: GameState;
  timerCallback?: TimerCallback;
}

export interface LoadGameAction extends LoadGameActionOptions {
  type: GameType.LOAD_GAME;
}

/** Create a minesweeper game. */
export const startGame = (options: StartGameActionOptions): StartGameAction => ({
  type: GameType.START_GAME,
  ...options,
});

/** Make cell visible at the given coordinate. */
export const revealCell = (options: RevealCellActionOptions): RevealCellAction => ({
  type: GameType.REVEAL_CELL,
  ...options,
});

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (options: ToggleFlagActionOptions): ToggleFlagAction => ({
  type: GameType.TOGGLE_FLAG,
  ...options,
});

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (): UndoLoosingMoveAction => ({
  type: GameType.UNDO_LOOSING_MOVE,
});

/** Tick the game timer. Add 1 (seconds) to elapsed time. */
export const tickTimer = (): TickTimerAction => ({
  type: GameType.TICK_TIMER,
});

export const loadGame = (options: LoadGameActionOptions): LoadGameAction => ({
  type: GameType.LOAD_GAME,
  ...options,
});

export type GameActions =
  | StartGameAction
  | ToggleFlagAction
  | RevealCellAction
  | UndoLoosingMoveAction
  | TickTimerAction
  | LoadGameAction;
