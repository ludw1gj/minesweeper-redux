import { ToggleFlagActionOptions } from '../actions/actions';
import { IMineCell, IWaterCell } from '../core/cell';
import { IllegalStateError, UserError } from '../core/errors';
import { createInitialGrid } from '../core/grid';

import { RevealCellActionOptions, StartGameActionOptions } from '../actions/actions';
import { ICoordinate } from '../core/coordinate';
import {
  createCoordinate,
  createDifficultyLevel,
  gameReducer,
  GameState,
  GameStatus,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
} from '../index';

export const startGameTestSetup = (): GameState => {
  const startGameConfig: StartGameActionOptions = {
    difficulty: createDifficultyLevel(3, 3, 3),
    randSeed: 6,
  };
  return gameReducer(undefined, startGame(startGameConfig));
};

export const revealCellTestSetup = (store: GameState, coordinate: ICoordinate) => {
  const revealCellConfig: RevealCellActionOptions = {
    coordinate,
    timerCallback: () => {},
  };
  return gameReducer(store, revealCell(revealCellConfig));
};

test('start minesweeper game successfully', () => {
  const store = startGameTestSetup();

  const height = 3;
  const width = 3;
  const numMines = 3;
  const desiredState: GameState = {
    board: {
      difficulty: createDifficultyLevel(height, width, numMines),
      numCells: height * width,
      grid: createInitialGrid(3, 3),
      numFlagged: 0,
    },
    status: GameStatus.Waiting,
    elapsedTime: 0,
    remainingFlags: numMines,
    timer: 0,
  };
  expect(store).toMatchObject(desiredState);
});

test('should reveal cell and empty adjacent cells', () => {
  let store: GameState;

  store = startGameTestSetup();
  store = revealCellTestSetup(store, createCoordinate(0, 0));

  const height = 3;
  const width = 3;
  const numMines = 3;
  const desiredState: GameState = {
    board: {
      difficulty: createDifficultyLevel(height, width, numMines),
      numCells: height * width,
      grid: [
        [
          {
            coordinate: createCoordinate(0, 0),
            isMine: false,
            isFlagged: false,
            isVisible: true,
            mineCount: 0,
          },
          {
            coordinate: createCoordinate(1, 0),
            isMine: false,
            isFlagged: false,
            isVisible: true,
            mineCount: 1,
          },
          {
            coordinate: createCoordinate(2, 0),
            isMine: false,
            isFlagged: false,
            isVisible: false,
            mineCount: 1,
          },
        ],
        [
          {
            coordinate: createCoordinate(0, 1),
            isMine: false,
            isFlagged: false,
            isVisible: true,
            mineCount: 1,
          },
          {
            coordinate: createCoordinate(1, 1),
            isMine: false,
            isFlagged: false,
            isVisible: true,
            mineCount: 3,
          },
          {
            coordinate: createCoordinate(2, 1),
            isMine: true,
            isFlagged: false,
            isVisible: false,
            isDetonated: false,
          },
        ],
        [
          {
            coordinate: createCoordinate(0, 2),
            isMine: false,
            isFlagged: false,
            isVisible: false,
            mineCount: 1,
          },
          {
            coordinate: createCoordinate(1, 2),
            isMine: true,
            isFlagged: false,
            isVisible: false,
            isDetonated: false,
          },
          {
            coordinate: createCoordinate(2, 2),
            isMine: true,
            isFlagged: false,
            isVisible: false,
            isDetonated: false,
          },
        ],
      ] as IMineCell[][] | IWaterCell[][],
      numFlagged: 0,
    },
    status: GameStatus.Running,
    elapsedTime: 0,
    remainingFlags: numMines,
    timer: 0,
  };
  expect(store).toMatchObject(desiredState);
});

test('revealCell should fail if given coordinate of visible cell', () => {
  let store: GameState;

  store = startGameTestSetup();
  store = revealCellTestSetup(store, createCoordinate(0, 0));

  const revealCellSameCoordinate = () => {
    // pass same coordinate value
    revealCellTestSetup(store, createCoordinate(0, 0));
  };
  expect(revealCellSameCoordinate).toThrow(UserError);
});

test('timer should tick', () => {
  let store: GameState;

  store = gameReducer(undefined, tickTimer());
  expect(store.elapsedTime).toBe(1);

  store = gameReducer(store, tickTimer());
  expect(store.elapsedTime).toBe(2);
});

test('flag should toggle', () => {
  let store: GameState;

  store = startGameTestSetup();
  store = revealCellTestSetup(store, createCoordinate(0, 0));

  const toggleFlagConfig: ToggleFlagActionOptions = {
    coordinate: createCoordinate(2, 2),
  };
  store = gameReducer(store, toggleFlag(toggleFlagConfig));
  expect(store.board.grid[2][2].isFlagged).toBe(true);

  store = gameReducer(store, toggleFlag(toggleFlagConfig));
  expect(store.board.grid[2][2].isFlagged).toBe(false);
});

test('toggleFlag should fail if given coordinate of visible cell', () => {
  let store: GameState;

  store = startGameTestSetup();
  store = revealCellTestSetup(store, createCoordinate(0, 0));

  const toggleFlagSameCoordinate = () => {
    // pass same coordinate value
    gameReducer(store, toggleFlag({ coordinate: createCoordinate(0, 0) }));
  };
  expect(toggleFlagSameCoordinate).toThrow(UserError);
});

test('toggleFlag should fail if game is not running', () => {
  let store: GameState;

  store = startGameTestSetup();

  const toggleFlagGameStatusWaiting = () => {
    // pass same coordinate value
    gameReducer(store, toggleFlag({ coordinate: createCoordinate(1, 1) }));
  };
  expect(toggleFlagGameStatusWaiting).toThrow(IllegalStateError);
});
