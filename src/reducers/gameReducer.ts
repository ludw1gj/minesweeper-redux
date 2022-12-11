import { GameActions, GameType } from '..'
import {
  loadGame,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
  undoLoosingMove,
} from '../core/game'
import { countFlagged } from '../core/grid'
import { Minesweeper, GameStatus } from '../core/types'

const initialState: Minesweeper = {
  difficulty: { height: 0, width: 0, numMines: 0 },
  numCells: 0,
  grid: [[]],
  numFlagged: 0,
  status: GameStatus.Waiting,
  remainingFlags: 0,
  elapsedTime: 0,
  randSeed: 1,
}

const reducer = (state: Minesweeper, action: GameActions): Minesweeper => {
  switch (action.type) {
    case GameType.START_GAME:
      return startGame(action.randSeed, action.difficulty, action.timerCallback)
    case GameType.LOAD_GAME:
      return loadGame(action.gameState, action.timerCallback)
    case GameType.REVEAL_CELL:
      return revealCell(state, action.coordinate)
    case GameType.TOGGLE_FLAG:
      return toggleFlag(state, action.coordinate)
    case GameType.TICK_TIMER:
      return tickTimer(state)
    case GameType.UNDO_LOOSING_MOVE:
      return undoLoosingMove(state)
    default:
      return state
  }
}

export const gameReducer = (
  state: Minesweeper = initialState,
  action: GameActions
): Minesweeper => {
  const newState = reducer(state, action)
  if (newState.grid !== state.grid) {
    const { numFlagged, remainingFlags } = countFlagged(newState.grid)
    return {
      ...newState,
      remainingFlags:
        newState.status === GameStatus.Win || newState.status === GameStatus.Loss
          ? 0
          : remainingFlags,
      numFlagged,
    }
  }
  return newState
}
