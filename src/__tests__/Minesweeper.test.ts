import { test, describe, expect } from 'vitest'
import {
  countVisibleCells,
  createCoordinate,
  createDifficultyLevel,
  gameReducer,
  getLoadableGameState,
  loadGame,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
  undoLoosingMove,
} from '../'
import { Minesweeper, CellStatus, GameStatus } from '../core/types'

/** Reveal coordinate (0, 2) to win. Flag coordinate (2, 2) to loose. */
const finalWaterCellGameState = (): Minesweeper => {
  const height = 3
  const width = 3
  const numMines = 3
  return {
    difficulty: createDifficultyLevel(height, width, numMines),
    numCells: height * width,
    grid: [
      [
        {
          status: CellStatus.Revealed,
          mineCount: 0,
        },
        {
          status: CellStatus.Revealed,
          mineCount: 1,
        },
        {
          status: CellStatus.Revealed,
          mineCount: 1,
        },
      ],
      [
        {
          status: CellStatus.Revealed,
          mineCount: 1,
        },
        {
          status: CellStatus.Revealed,
          mineCount: 3,
        },
        {
          status: CellStatus.Flagged,
          mineCount: -1,
        },
      ],
      // REVEAL THIS CELL
      [
        {
          status: CellStatus.Hidden,
          mineCount: 1,
        },
        {
          status: CellStatus.Flagged,
          mineCount: -1,
        },
        {
          status: CellStatus.Hidden,
          mineCount: -1,
        },
      ],
    ],
    numFlagged: 2,
    status: GameStatus.Running,
    elapsedTime: 40,
    remainingFlags: numMines - 2,
    randSeed: 6,
  }
}

describe('create a game', () => {
  test('should start correctly', () => {
    const state = gameReducer(
      undefined,
      startGame({
        difficulty: createDifficultyLevel(2, 2, 1),
        randSeed: 6,
      })
    )

    const height = 2
    const width = 2
    const numMines = 1
    const desiredState: Minesweeper = {
      difficulty: createDifficultyLevel(height, width, numMines),
      numCells: height * width,
      grid: [
        [
          {
            status: CellStatus.Hidden,
            mineCount: 0,
          },
          {
            status: CellStatus.Hidden,
            mineCount: 0,
          },
        ],
        [
          {
            status: CellStatus.Hidden,
            mineCount: 0,
          },
          {
            status: CellStatus.Hidden,
            mineCount: 0,
          },
        ],
      ],
      numFlagged: 0,
      status: GameStatus.Ready,
      elapsedTime: 0,
      remainingFlags: 0,
      randSeed: 6,
    }

    expect(state).toMatchObject(desiredState)
  })

  test('should have same mine cell coordinates if given same seed', () => {
    const startGameConfig = {
      difficulty: createDifficultyLevel(3, 3, 3),
      randSeed: 6,
    }
    const state1 = gameReducer(undefined, startGame(startGameConfig))
    const state2 = gameReducer(undefined, startGame(startGameConfig))
    const state3 = gameReducer(undefined, startGame(startGameConfig))

    expect(state1).toMatchObject(state2)
    expect(state1).toMatchObject(state3)
  })

  test('should have different mine cell coordinates if given different seeds', () => {
    const difficulty = createDifficultyLevel(3, 3, 3)
    const state1 = gameReducer(
      undefined,
      startGame({
        randSeed: 6,
        difficulty,
      })
    )
    const state2 = gameReducer(
      undefined,
      startGame({
        randSeed: 7,
        difficulty,
      })
    )
    const state3 = gameReducer(
      undefined,
      startGame({
        randSeed: 8,
        difficulty,
      })
    )

    expect(state1).not.toMatchObject(state2)
    expect(state1).not.toMatchObject(state3)
    expect(state2).not.toMatchObject(state3)
  })

  test('should successfully resume game from given game state', () => {
    const previousGame = finalWaterCellGameState()
    const loadableState = getLoadableGameState(previousGame)
    const state = gameReducer(
      undefined,
      loadGame({
        gameState: loadableState,
      })
    )
    expect(state).toMatchObject(previousGame)
  })
})

describe('reveal cell', () => {
  const initialState = gameReducer(
    undefined,
    startGame({
      difficulty: createDifficultyLevel(3, 3, 3),
      randSeed: 6,
    })
  )

  const firstMoveState = gameReducer(
    initialState,
    revealCell({ coordinate: createCoordinate(0, 0) })
  )

  test('should reveal cell and empty adjacent cells', () => {
    const height = 4
    const width = 4
    const numMines = 2
    const desiredState: Minesweeper = {
      difficulty: createDifficultyLevel(height, width, numMines),
      numCells: height * width,
      grid: [
        [
          {
            status: CellStatus.Hidden,
            mineCount: 1,
          },
          {
            status: CellStatus.Hidden,
            mineCount: -1,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 1,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 0,
          },
        ],
        [
          {
            status: CellStatus.Hidden,
            mineCount: 2,
          },
          {
            status: CellStatus.Hidden,
            mineCount: 2,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 2,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 0,
          },
        ],
        [
          {
            status: CellStatus.Hidden,
            mineCount: 1,
          },
          {
            status: CellStatus.Hidden,
            mineCount: -1,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 1,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 0,
          },
        ],
        [
          {
            status: CellStatus.Hidden,
            mineCount: 1,
          },
          {
            status: CellStatus.Hidden,
            mineCount: 1,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 1,
          },
          {
            status: CellStatus.Revealed,
            mineCount: 0,
          },
        ],
      ],
      numFlagged: 0,
      status: GameStatus.Running,
      elapsedTime: 0,
      remainingFlags: numMines,
      randSeed: 6,
    }
    const startState = gameReducer(
      undefined,
      startGame({ difficulty: createDifficultyLevel(height, width, numMines), randSeed: 6 })
    )
    const state = gameReducer(startState, revealCell({ coordinate: createCoordinate(3, 0) }))

    expect(state).toMatchObject(desiredState)
  })

  test('new grid object created', () => {
    const state = gameReducer(firstMoveState, revealCell({ coordinate: createCoordinate(2, 2) }))
    expect(state.grid).not.toBe(firstMoveState.grid)
  })

  test('no change to state if given coordinate of revealed cell', () => {
    const state = gameReducer(firstMoveState, revealCell({ coordinate: createCoordinate(0, 0) }))

    expect(state).toBe(firstMoveState)
  })
  test('remaining flag count should be correct when revealing a flagged cell', () => {
    const coordinate = createCoordinate(0, 2)
    const cellIsFlaggedState = gameReducer(firstMoveState, toggleFlag({ coordinate }))
    const cellIsRevealedState = gameReducer(cellIsFlaggedState, revealCell({ coordinate }))
    const cell = cellIsFlaggedState.grid[2][0]

    expect(cell.mineCount === -1).toBe(false)
    expect(firstMoveState.remainingFlags).toBe(3)
    expect(cellIsFlaggedState.remainingFlags).toBe(2)
    expect(cellIsRevealedState.remainingFlags).toBe(3)
  })
})

describe('game is won', () => {
  const state = gameReducer(
    finalWaterCellGameState(),
    revealCell({ coordinate: createCoordinate(0, 2) })
  )

  test('when all water cells are revealed', () => {
    expect(state.status).toBe(GameStatus.Win)
  })

  test('status should be "Won"', () => {
    expect(state.status).toBe(GameStatus.Win)
  })

  test('remaining flags should be 0', () => {
    expect(state.remainingFlags).toBe(0)
  })

  test('all cells should be revealed', () => {
    expect(countVisibleCells(state) === state.numCells).toBe(true)
  })
})

describe('game is lost', () => {
  const previousState = finalWaterCellGameState()
  const state = gameReducer(previousState, revealCell({ coordinate: createCoordinate(2, 2) }))

  test('status should be "Loss"', () => {
    expect(state.status).toBe(GameStatus.Loss)
  })

  test('remaining flags should be 0', () => {
    expect(state.remainingFlags).toBe(0)
  })

  test('all cells should be revealed', () => {
    expect(countVisibleCells(state) === state.numCells).toBe(true)
  })

  test('should save grid state', () => {
    expect(state.savedGridState).toMatchObject(previousState.grid)
  })
})

describe('toggle flag', () => {
  const initialState = gameReducer(
    undefined,
    startGame({
      difficulty: createDifficultyLevel(3, 3, 3),
      randSeed: 6,
    })
  )
  const firstMoveState = gameReducer(
    initialState,
    revealCell({ coordinate: createCoordinate(0, 0) })
  )
  const toggledFlagState = gameReducer(
    firstMoveState,
    toggleFlag({ coordinate: createCoordinate(2, 2) })
  )

  test('cell should be flagged correctly', () => {
    expect(toggledFlagState.grid).not.toBe(firstMoveState.grid)
    expect(toggledFlagState.grid[2][2].status).toBe(CellStatus.Flagged)
    expect(toggledFlagState.remainingFlags).toBe(2)
    expect(toggledFlagState.numFlagged).toBe(1)
  })

  test('cell should be unflagged correctly', () => {
    const state = gameReducer(toggledFlagState, toggleFlag({ coordinate: createCoordinate(2, 2) }))

    expect(state.grid).not.toBe(toggledFlagState.grid)
    expect(state.grid[2][2].status).toBe(CellStatus.Hidden)
    expect(state.remainingFlags).toBe(3)
    expect(state.numFlagged).toBe(0)
  })

  test('no change to state if given coordinate of revealed cell', () => {
    const state = gameReducer(firstMoveState, toggleFlag({ coordinate: createCoordinate(0, 0) }))

    expect(state).toBe(firstMoveState)
  })

  test('no change to state if game has no remaining flags', () => {
    const originalState = { ...firstMoveState, remainingFlags: 0 }
    const state = gameReducer(originalState, toggleFlag({ coordinate: createCoordinate(1, 1) }))

    expect(state).toBe(originalState)
  })
})

describe('timer', () => {
  test('should tick', () => {
    const initialState = gameReducer(
      undefined,
      startGame({
        difficulty: createDifficultyLevel(3, 3, 3),
        randSeed: 6,
      })
    )
    const stateTickOnce = gameReducer(initialState, tickTimer())
    expect(stateTickOnce.elapsedTime).toBe(1)

    const stateTickAgain = gameReducer(stateTickOnce, tickTimer())
    expect(stateTickAgain.elapsedTime).toBe(2)
  })
})

test('should load previous grid successfully', () => {
  const previousState = finalWaterCellGameState()

  const lossState = gameReducer(previousState, revealCell({ coordinate: createCoordinate(2, 2) }))
  const state = gameReducer(lossState, undoLoosingMove())

  expect(state.status).toBe(GameStatus.Running)
  expect(state.remainingFlags).toBe(previousState.remainingFlags)
  expect(state.grid).not.toBe(previousState.grid)
  expect(state.grid).toMatchObject(previousState.grid)
})
