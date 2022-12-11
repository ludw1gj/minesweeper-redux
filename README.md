# Minesweeper Redux

A JavaScript minesweeper game engine implementation supporting the use of redux via the provided
actions and reducer. It is written in TypeScript in an immutable approach.

## Environment

Node v10 or above.

## Install Minesweeper Redux

Install node (`> 10`), and npm or yarn. Then install the package.

```bash
npm install --save minesweeper-redux
// or
yarn add minesweeper-redux
```

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
interface IMinesweeper {
  /** The board which holds values concerning the game grid. */
  readonly board: IBoard
  /** The current status of the game. */
  readonly status: GameStatus
  /** The remaining flags. */
  readonly remainingFlags: number
  /** The amount of time in ms since the game began.  */
  readonly elapsedTime: number
  /** The number to seed RandomNumberGenerator */
  readonly randSeed: number
  /** Function that is called once every second. */
  readonly timerCallback?: TimerCallback
  /** Stops the timer. The property is set when timer has been started. */
  readonly timerStopper?: TimerStopper
}

/** The current status of the game. */
enum GameStatus {
  /** Game is waiting to start. */
  Waiting = 'waiting',
  /** Game is ready. */
  Ready = 'ready',
  /** Game is running. */
  Running = 'running',
  /** Game has been lost. */
  Loss = 'loss',
  /** Game has been won. */
  Win = 'win',
}

/** A callback for the game timer. */
type TimerCallback = () => void

/** Stops a timer. It is the function returned when timer is started. */
type TimerStopper = () => void

/** A minesweeper game board. */
interface IBoard {
  /** The difficulty of the game. */
  readonly difficulty: IDifficulty
  /** The number of cells on the grid. */
  readonly numCells: number
  /** The number of flagged cells. */
  readonly numFlagged: number
  /** The game grid. */
  readonly grid: IGrid
  /** The previously saved grid state. */
  readonly savedGridState?: IGrid
}

/** The minesweeper game"s difficulty level. */
interface IDifficulty {
  height: number
  width: number
  numMines: number
}

/** A grid made up of cells. */
interface IGrid {
  readonly width: number
  readonly height: number
  readonly cells: ReadonlyArray<ReadonlyArray<ICell>>
}

/** A cell of a minesweeper game. */
export interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate
  /** The status of the cell. */
  readonly status: CellStatus
  /** Whether the cell is a mine. */
  readonly isMine: boolean
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  readonly mineCount: number
}

/** The status of a cell. */
export enum CellStatus {
  Hidden = 'hidden',
  Flagged = 'flagged',
  Revealed = 'revealed',
  Detonated = 'detonated',
}
```

## Actions

```ts
/** Create a minesweeper game. */
const startGame = (options: StartGameActionOptions): StartGameAction => ({
  type: GameType.START_GAME,
  ...options,
})

/** Load a game from given game state. */
const loadGame = (options: LoadGameActionOptions): LoadGameAction => ({
  type: GameType.LOAD_GAME,
  ...options,
})

/** Make cell revealed at the given coordinate. */
const revealCell = (options: RevealCellActionOptions): RevealCellAction => ({
  type: GameType.REVEAL_CELL,
  ...options,
})

/** Toggle the flagged state of cell at the given coordinate. */
const toggleFlag = (options: ToggleFlagActionOptions): ToggleFlagAction => ({
  type: GameType.TOGGLE_FLAG,
  ...options,
})

/** Load the previous state before the game was lost. */
const undoLoosingMove = (): UndoLoosingMoveAction => ({
  type: GameType.UNDO_LOOSING_MOVE,
})

/** Tick the game timer. Add 1 (seconds) to elapsed time. */
const tickTimer = (): TickTimerAction => ({
  type: GameType.TICK_TIMER,
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
