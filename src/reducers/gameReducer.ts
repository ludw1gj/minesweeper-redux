import { GameActions, GameType } from '../actions'
import { countFlagged } from '../core/board'
import {
  loadGame,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
  undoLoosingMove,
} from '../core/game'
import { IMinesweeper, GameStatus } from '../core/types'

const initialState: IMinesweeper = {
  difficulty: { height: 0, width: 0, numMines: 0 },
  numCells: 0,
  grid: [[]],
  numFlagged: 0,
  status: GameStatus.Waiting,
  remainingFlags: 0,
  elapsedTime: 0,
  randSeed: 1,
  randomNumberGenerator: () => 0,
}

const reducer = (state: IMinesweeper = initialState, action: GameActions): IMinesweeper => {
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

export const gameReducer = (state: IMinesweeper, action: GameActions): IMinesweeper => {
  const newState = reducer(state, action)
  if (newState.grid !== state.grid) {
    const { numFlagged, remainingFlags } = countFlagged(newState.grid)
    return { ...newState, remainingFlags, numFlagged }
  }
  return newState
}
