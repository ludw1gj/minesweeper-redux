import { GameActions } from '..'
import {
  loadGame,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
  undoLoosingMove,
} from '../core/game'
import { countFlagged } from '../core/grid'
import { Minesweeper } from '../core/types'

const initialState: Minesweeper = {
  difficulty: { height: 0, width: 0, numMines: 0 },
  numCells: 0,
  grid: [[]],
  numFlagged: 0,
  status: 'waiting',
  remainingFlags: 0,
  elapsedTime: 0,
  randSeed: 1,
}

const reducer = (state: Minesweeper, action: GameActions): Minesweeper => {
  switch (action.type) {
    case 'START_GAME':
      return startGame(action.randSeed, action.difficulty, action.timerCallback)
    case 'LOAD_GAME':
      return loadGame(action.gameState, action.timerCallback)
    case 'REVEAL_CELL':
      return revealCell(state, action.coordinate)
    case 'TOGGLE_FLAG':
      return toggleFlag(state, action.coordinate)
    case 'TICK_TIMER':
      return tickTimer(state)
    case 'UNDO_LOOSING_MOVE':
      return undoLoosingMove(state)
    default:
      return state
  }
}

export const gameReducer = (
  state: Minesweeper = initialState,
  action: GameActions
): Minesweeper => {
  const nextState = reducer(state, action)
  if (nextState.grid !== state.grid) {
    const { numFlagged, remainingFlags } = countFlagged(nextState.grid)
    return {
      ...nextState,
      remainingFlags:
        nextState.status === 'win' || nextState.status === 'loss' ? 0 : remainingFlags,
      numFlagged,
    }
  }
  return nextState
}
