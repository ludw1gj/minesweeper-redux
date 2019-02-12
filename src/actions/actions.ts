import { ICoordinate } from '../core/coordinate';
import { IDifficultyLevel } from '../core/difficulty';
import { GameState } from '../index';
import { TimerCallback } from '../reducers/helpers';
import { GameType } from './types';

export interface StartGameActionOptions {
  difficulty: IDifficultyLevel;
  randSeed: number;
  gameState?: GameState;
}

export interface IStartGameAction extends StartGameActionOptions {
  type: GameType.START_GAME;
}

export interface RevealCellActionOptions {
  coordinate: ICoordinate;
  timerCallback: TimerCallback;
}

export interface IRevealCellAction extends RevealCellActionOptions {
  type: GameType.REVEAL_CELL;
}

export interface ToggleFlagActionOptions {
  coordinate: ICoordinate;
}

export interface IToggleFlagAction extends ToggleFlagActionOptions {
  type: GameType.TOGGLE_FLAG;
}

export interface UndoLoosingMoveActionOptions {
  timerCallback: TimerCallback;
}

export interface IUndoLoosingMoveAction extends UndoLoosingMoveActionOptions {
  type: GameType.UNDO_LOOSING_MOVE;
}

export interface ITickTimerAction {
  type: GameType.TICK_TIMER;
}

/** Create a minesweeper game. */
export const startGame = (options: StartGameActionOptions): IStartGameAction => ({
  type: GameType.START_GAME,
  ...options,
});

/** Make cell visible at the given coordinate. */
export const revealCell = (options: RevealCellActionOptions): IRevealCellAction => ({
  type: GameType.REVEAL_CELL,
  ...options,
});

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (options: ToggleFlagActionOptions): IToggleFlagAction => ({
  type: GameType.TOGGLE_FLAG,
  ...options,
});

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (options: UndoLoosingMoveActionOptions): IUndoLoosingMoveAction => ({
  type: GameType.UNDO_LOOSING_MOVE,
  ...options,
});

/** Tick the game timer. Add 1 (seconds) to elapsed time. */
export const tickTimer = (): ITickTimerAction => ({
  type: GameType.TICK_TIMER,
});

export type GameActions =
  | IStartGameAction
  | IToggleFlagAction
  | IRevealCellAction
  | IUndoLoosingMoveAction
  | ITickTimerAction;
