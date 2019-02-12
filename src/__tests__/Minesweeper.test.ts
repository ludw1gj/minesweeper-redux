import { ToggleFlagActionOptions } from '../actions/actions';
import { IMineCell, IWaterCell } from '../core/cell';
import { IllegalStateError, UserError } from '../core/errors';
import { createInitialGrid } from '../core/grid';

import { RevealCellActionOptions, StartGameActionOptions } from '../actions/actions';
import { ICoordinate } from '../core/coordinate';
import { countVisibleCells } from '../core/minesweeperBoard';
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
  undoLoosingMove,
} from '../index';

const setupStartGameGameState = (): GameState => {
  const startGameConfig: StartGameActionOptions = {
    difficulty: createDifficultyLevel(3, 3, 3),
    randSeed: 6,
  };
  return gameReducer(undefined, startGame(startGameConfig));
};

const setupRevealCellGameState = (store: GameState, coordinate: ICoordinate) => {
  const revealCellConfig: RevealCellActionOptions = {
    coordinate,
  };
  return gameReducer(store, revealCell(revealCellConfig));
};

/** Win the game if coordinate (2, 2) is flagged. */
const setupFinalFlagGameState = (): GameState => {
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
            isVisible: false,
            mineCount: 0,
          },
          {
            coordinate: createCoordinate(1, 0),
            isMine: false,
            isFlagged: false,
            isVisible: false,
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
            isVisible: false,
            mineCount: 1,
          },
          {
            coordinate: createCoordinate(1, 1),
            isMine: false,
            isFlagged: false,
            isVisible: false,
            mineCount: 3,
          },
          {
            coordinate: createCoordinate(2, 1),
            isMine: true,
            isFlagged: true,
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
            isFlagged: true,
            isVisible: false,
            isDetonated: false,
          },
          // FLAG THIS CELL
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
    elapsedTime: 40,
    remainingFlags: numMines,
    randSeed: 6,
  };

  const startGameConfig: StartGameActionOptions = {
    difficulty: desiredState.board.difficulty,
    randSeed: 6,
    gameState: desiredState,
  };
  return gameReducer(undefined, startGame(startGameConfig));
};

test('start minesweeper game successfully', () => {
  const store = setupStartGameGameState();

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
    randSeed: 6,
  };
  expect(store).toMatchObject(desiredState);
});

test('should reveal cell and empty adjacent cells', () => {
  let store: GameState;

  store = setupStartGameGameState();
  store = setupRevealCellGameState(store, createCoordinate(0, 0));

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
    randSeed: 6,
  };
  expect(store).toMatchObject(desiredState);
});

test('revealCell should fail if given coordinate of visible cell', () => {
  let store: GameState;
  store = setupStartGameGameState();
  store = setupRevealCellGameState(store, createCoordinate(0, 0));

  const revealCellSameCoordinate = () => {
    // pass same coordinate value
    setupRevealCellGameState(store, createCoordinate(0, 0));
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
  store = setupStartGameGameState();
  store = setupRevealCellGameState(store, createCoordinate(0, 0));

  const toggleFlagConfig: ToggleFlagActionOptions = {
    coordinate: createCoordinate(2, 2),
  };
  store = gameReducer(store, toggleFlag(toggleFlagConfig));
  expect(store.board.grid[2][2].isFlagged).toBe(true);
  expect(store.remainingFlags).toBe(2);
  expect(store.board.numFlagged).toBe(1);

  store = gameReducer(store, toggleFlag(toggleFlagConfig));
  expect(store.board.grid[2][2].isFlagged).toBe(false);
  expect(store.remainingFlags).toBe(3);
  expect(store.board.numFlagged).toBe(0);
});

test('toggleFlag should fail if given coordinate of visible cell', () => {
  let store: GameState;
  store = setupStartGameGameState();
  store = setupRevealCellGameState(store, createCoordinate(0, 0));

  const toggleFlagSameCoordinate = () => {
    // pass same coordinate value
    gameReducer(store, toggleFlag({ coordinate: createCoordinate(0, 0) }));
  };
  expect(toggleFlagSameCoordinate).toThrow(UserError);
});

test('toggleFlag should fail if game is not running', () => {
  const store = setupStartGameGameState();

  const toggleFlagGameStatusWaiting = () => {
    // pass same coordinate value
    gameReducer(store, toggleFlag({ coordinate: createCoordinate(1, 1) }));
  };
  expect(toggleFlagGameStatusWaiting).toThrow(IllegalStateError);
});

test('player should win when all mines are flagged', () => {
  let store = setupFinalFlagGameState();
  store = gameReducer(store, toggleFlag({ coordinate: createCoordinate(2, 2) }));

  expect(store.status).toBe(GameStatus.Win);
});

test('all cells should be visible  when game is won', () => {
  let store = setupFinalFlagGameState();
  store = gameReducer(store, toggleFlag({ coordinate: createCoordinate(2, 2) }));

  expect(store.status).toBe(GameStatus.Win);
  expect(countVisibleCells(store.board.grid) === store.board.numCells).toBe(true);
});

test('all cells should be visible when game is lost', () => {
  let store = setupFinalFlagGameState();

  // As coordinate (2, 2) is a mine, detonate it.
  store = gameReducer(store, revealCell({ coordinate: createCoordinate(2, 2) }));

  expect(store.status).toBe(GameStatus.Loss);
  expect(countVisibleCells(store.board.grid) === store.board.numCells).toBe(true);
});

test('should save grid state on game loss', () => {
  const previousStore = setupFinalFlagGameState();

  // As coordinate (2, 2) is a mine, detonate it.
  const store = gameReducer(previousStore, revealCell({ coordinate: createCoordinate(2, 2) }));

  expect(store.board.savedGridState).toMatchObject(previousStore.board.grid);
});

test('should load previous grid', () => {
  const previousStore = setupFinalFlagGameState();

  // As coordinate (2, 2) is a mine, detonate it.
  let store = gameReducer(previousStore, revealCell({ coordinate: createCoordinate(2, 2) }));
  store = gameReducer(store, undoLoosingMove());

  expect(store.board.grid).toMatchObject(previousStore.board.grid);
});

test('should have same mine cell coordinates if given same seed', () => {
  const startGameConfig: StartGameActionOptions = {
    difficulty: createDifficultyLevel(3, 3, 3),
    randSeed: 6,
  };
  const state1 = gameReducer(undefined, startGame(startGameConfig));
  const state2 = gameReducer(undefined, startGame(startGameConfig));
  const state3 = gameReducer(undefined, startGame(startGameConfig));

  expect(state1).toMatchObject(state2);
  expect(state1).toMatchObject(state3);
});

test('should have different mine cell coordinates if given different seeds', () => {
  const difficulty = createDifficultyLevel(3, 3, 3);
  const state1 = gameReducer(
    undefined,
    startGame({
      randSeed: 6,
      difficulty,
    }),
  );
  const state2 = gameReducer(
    undefined,
    startGame({
      randSeed: 7,
      difficulty,
    }),
  );
  const state3 = gameReducer(
    undefined,
    startGame({
      randSeed: 8,
      difficulty,
    }),
  );

  expect(state1).not.toMatchObject(state2);
  expect(state1).not.toMatchObject(state3);
  expect(state2).not.toMatchObject(state3);
});

test.todo('should successfully resume game from given game state');

test.todo('should fail if stateGame given invalid game state');
