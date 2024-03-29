# Minesweeper Redux

A JavaScript minesweeper game engine implementation supporting the use of redux via the provided
actions and reducer. It is written in TypeScript in an immutable approach.

## Example Usage

- [minesweeper-redux-example](https://github.com/ludw1gj/minesweeper-redux-example)

## Basic Usage

Here are the basics of importing and using minesweeper-redux in your app.

### 1. Import minesweeper-redux gameReducer into your reducer.

```js
import { createStore, combineReducers } from 'redux'
import { gameReducer } from 'minesweeper-redux'

const reducers = combineReducers({
  minesweeper: gameReducer,
})

const store = createStore(reducers)

export default store
```

### 2. Dispatching actions to the reducer.

Create a component, create the mapStateToProps and mapDispatchToProps functions and connect the
component to the store.

```js
import {
  createDifficultyLevel,
  getLoadableGameState,
  createCoordinate,
  startGame,
  loadGame,
  revealCell,
  toggleFlag,
  undoLoosingMove,
  tickTimer,
  difficulties,
} from 'minesweeper-redux'
import { connect } from 'react-redux'

function MyComponent(props) {
  return (
    <div>
      <h1>My Component</h1>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    minesweeper: state.minesweeper,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    startGame: (options) => dispatch(startGame(options)),
    loadGame: (options) => dispatch(loadGame(options)),
    revealCell: (options) => dispatch(revealCell(options)),
    toggleFlag: (options) => dispatch(toggleFlag(options)),
    undoLoosingMove: () => dispatch(undoLoosingMove()),
    tickTimer: () => dispatch(tickTimer()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MyComponent)
```

#### Using startGame action

```js
// function that will be called every second. In this case we want to call tickTimer().
const timerCallback = () => {
  props.tickTimer()
}
// value to seed the random number generator.
const myRandSeed = Math.random()
const myDifficulty = difficulties.easy // .easy .medium .hard
// OR
const myDifficulty = createDifficultyLevel(4, 4, 2) // custom difficulty

props.startGame({
  timerCallback: timerCallback, // is optional
  randSeed: myRandSeed,
  difficulty: myDifficulty,
})
```

#### Using loadGame action

```js
// function that will be called every second. In this case we want to call tickTimer().
const myTimerCallback = () => {
  props.tickTimer()
}
// serialize a loadable game state from the current game state.
const loadableGameState = getLoadableGameState(props.minesweeper)

props.loadGame({
  timerCallback: myTimerCallback, // is optional
  gameState: loadableGameState,
})
```

#### Using revealCell action

```js
const myCoordinate = createCoordinate(2, 1)
props.revealCell({ coordinate: myCoordinate })
```

#### Using toggleCell action

```js
const myCoordinate = createCoordinate(2, 1)
props.toggleCell({ coordinate: myCoordinate })
```

#### Using undoLoosingMove action.

```js
props.undoLoosingMove()
```

## The Game State and Types

```ts
/** Contains the necessary values for a minesweeper game. */
export type Minesweeper = Readonly<{
  /** The difficulty of the game. */
  difficulty: Difficulty
  /** The current status of the game. */
  status: GameStatus
  /** The number of cells on the grid. */
  numCells: number
  /** The game grid. */
  grid: Grid
  /** The previously saved grid state. */
  savedGridState?: Grid
  /** The number of flagged cells. */
  numFlagged: number
  /** The remaining flags. */
  remainingFlags: number
  /** The number to seed RandomNumberGenerator */
  randSeed: number
  /** The amount of time in ms since the game began.  */
  elapsedTime: number
  /** Function that is called once every second. */
  timerCallback?: TimerCallback
  /** Stops the timer. The property is set when timer has been started. */
  timerStopper?: TimerStopper
}>

/** The status of a cell. */
export type CellStatus = 'hidden' | 'flagged' | 'revealed' | 'detonated'

/** A cell of a minesweeper game. */
export type Cell = Readonly<{
  /** The status of the cell. */
  status: CellStatus
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  mineCount: number
}>

/** A coordinate of a grid. */
export type Coordinate = Readonly<{
  x: number
  y: number
}>

/** The minesweeper game's difficulty level. */
export type Difficulty = Readonly<{
  height: number
  width: number
  numMines: number
}>

/** The current status of the game. */
export type GameStatus = 'waiting' | 'ready' | 'running' | 'loss' | 'win'

/** A callback for the game timer. */
export type TimerCallback = () => void

/** Stops a timer. It is the function returned when timer is started. */
export type TimerStopper = () => void

/** A grid made up of cells. */
export type Grid = ReadonlyArray<ReadonlyArray<Cell>>

/** Generates a random number from a seed number. */
export type RandomNumberGenerator = (max?: number, min?: number) => number
```

## Actions

```ts
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

/** Tick the game timer. Add 1 (seconds) to elapsed time. */
export const tickTimer = (): TickTimerAction => ({
  type: 'TICK_TIMER',
})
```

## Action Options

```ts
// startGame
interface StartGameActionOptions {
  difficulty: IDifficulty
  randSeed: number
  timerCallback?: TimerCallback
}

// loadGame
interface LoadGameActionOptions {
  gameState: IMinesweeper
  timerCallback?: TimerCallback
}

// revealCell
interface RevealCellActionOptions {
  coordinate: Coordinate
}

// toggleFlag
interface ToggleFlagActionOptions {
  coordinate: Coordinate
}

// both undoLoosingMove & tickTimer have no parameters
```
