import { Difficulty, Minesweeper, Coordinate } from '../core/types'

export interface StartGameActionOptions {
  difficulty: Difficulty
  randSeed: number
}

export interface StartGameAction extends StartGameActionOptions {
  type: 'START_GAME'
}

export interface LoadGameActionOptions {
  gameState: Minesweeper
}

export interface LoadGameAction extends LoadGameActionOptions {
  type: 'LOAD_GAME'
}

export interface RevealCellActionOptions {
  coordinate: Coordinate
}

export interface RevealCellAction extends RevealCellActionOptions {
  type: 'REVEAL_CELL'
}

export interface ToggleFlagActionOptions {
  coordinate: Coordinate
}

export interface ToggleFlagAction extends ToggleFlagActionOptions {
  type: 'TOGGLE_FLAG'
}

export interface UndoLoosingMoveAction {
  type: 'UNDO_LOOSING_MOVE'
}

/** Create a minesweeper game. */
export const startGame = (options: StartGameActionOptions): StartGameAction => ({
  type: 'START_GAME',
  ...options,
})

/** Load a game from given game state. */
export const loadGame = (options: LoadGameActionOptions): LoadGameAction => ({
  type: 'LOAD_GAME',
  ...options,
})

/** Make cell revealed at the given coordinate. */
export const revealCell = (options: RevealCellActionOptions): RevealCellAction => ({
  type: 'REVEAL_CELL',
  ...options,
})

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (options: ToggleFlagActionOptions): ToggleFlagAction => ({
  type: 'TOGGLE_FLAG',
  ...options,
})

/** Load the previous state before the game was lost. */
export const undoLoosingMove = (): UndoLoosingMoveAction => ({
  type: 'UNDO_LOOSING_MOVE',
})

export type GameActions =
  | StartGameAction
  | LoadGameAction
  | ToggleFlagAction
  | RevealCellAction
  | UndoLoosingMoveAction
