# Minesweeper Redux

A minesweeper game implementation written in a functional style supporting the use of redux via the
provided actions and reducer. This package consists of a reducer and actions to dispatch to the
reducer.

## Environment

Node v10 or above.

## Install Minesweeper Redux

Install node (> 10), yarn or npm.

```bash
npm install --save minesweeper-redux
// or
yarn add minesweeper-redux
```

## Example Usage

- [minesweeper-redux-example](https://github.com/ludw1gj/minesweeper-redux-example)

## Actions

```ts
/** Create a minesweeper game. */
const startGame = (options: StartGameActionOptions): StartGameAction => ({
  type: GameType.START_GAME,
  ...options,
});

/** Load a game from given game state. */
const loadGame = (options: LoadGameActionOptions): LoadGameAction => ({
  type: GameType.LOAD_GAME,
  ...options,
});

/** Make cell visible at the given coordinate. */
const revealCell = (options: RevealCellActionOptions): RevealCellAction => ({
  type: GameType.REVEAL_CELL,
  ...options,
});

/** Toggle the flag value of cell at the given coordinate. */
const toggleFlag = (options: ToggleFlagActionOptions): ToggleFlagAction => ({
  type: GameType.TOGGLE_FLAG,
  ...options,
});

/** Load the previous state before the game was lost. */
const undoLoosingMove = (): UndoLoosingMoveAction => ({
  type: GameType.UNDO_LOOSING_MOVE,
});

/** Tick the game timer. Add 1 (seconds) to elapsed time. */
const tickTimer = (): TickTimerAction => ({
  type: GameType.TICK_TIMER,
});
```

## Action Options

```ts
// startGame
export interface StartGameActionOptions {
  difficulty: DifficultyLevel;
  randSeed: number;
  timerCallback?: TimerCallback;
}

// loadGame
export interface LoadGameActionOptions {
  gameState: GameState;
  timerCallback?: TimerCallback;
}

// revealCell
export interface RevealCellActionOptions {
  coordinate: Coordinate;
}

// toggleFlag
export interface ToggleFlagActionOptions {
  coordinate: Coordinate;
}

// both undoLoosingMove & tickTimer have no parameters
```

## Basic Usage

Here are the basics of importing and using minesweeper-redux in your app.

### 1. Import minesweeper-redux gameReducer into your reducer.

```js
import { createStore, combineReducers } from 'redux';
import { gameReducer } from 'minesweeper-redux';

const reducers = combineReducers({
  minesweeper: gameReducer,
});

const store = createStore(reducers);

export default store;
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
} from 'minesweeper-redux';
import { connect } from 'react-redux';

function ActionsExamples(props) {}

const mapStateToProps = state => {
  return {
    minesweeper: state.minesweeper,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    startGame: options => dispatch(startGame(options)),
    loadGame: options => dispatch(loadGame(options)),
    revealCell: options => dispatch(revealCell(options)),
    toggleFlag: options => dispatch(toggleFlag(options)),
    undoLoosingMove: () => dispatch(undoLoosingMove()),
    tickTimer: () => dispatch(tickTimer()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ActionsExamples);
```

#### Using startGame action

```js
// function that will be called every second. In this case we want to call tickTimer().
const timerCallback = () => {
  props.tickTimer();
};
const myRandSeed = Math.random(); // value which seeds the random number generator.
const myDifficulty = difficulties.easy; // .easy .medium .hard
// OR
const myDifficulty = createDifficultyLevel(4, 4, 2); // custom difficulty

props.startGame({
  timerCallback: timerCallback, // is optional
  randSeed: myRandSeed,
  difficulty: myDifficulty,
});
```

#### Using loadGame action

```js
// function that will be called every second. In this case we want to call tickTimer().
const myTimerCallback = () => {
  props.tickTimer();
};
// serialize a loadable game state from the current game state.
const loadableGameState = getLoadableGameState(props.minesweeper);

props.loadGame({
  timerCallback: myTimerCallback, // is optional
  gameState: loadableGameState,
});
```

#### Using revealCell action

```js
const myCoordinate = createCoordinate(2, 1);
props.revealCell({ coordinate: myCoordinate });
```

#### Using toggleCell action

```js
const myCoordinate = createCoordinate(2, 1);
props.toggleCell({ coordinate: myCoordinate });
```

- Using undoLoosingMove action.

```js
props.undoLoosingMove();
```
