import { MineCell, WaterCell } from '../core/cell';
import { createCoordinate } from '../core/coordinate';
import { createDifficultyLevel } from '../core/difficulty';
import { IllegalStateError, UserError } from '../core/errors';
import { createInitialGrid } from '../core/grid';
import { countVisibleCells } from '../core/minesweeperBoard';

import {
  loadGame,
  revealCell,
  startGame,
  tickTimer,
  toggleFlag,
  undoLoosingMove,
} from '../actions/actions';
import { getLoadableGameState } from '../index';
import { gameReducer, GameState, GameStatus } from '../reducers/gameReducer';

/** Reveal coordinate (0, 2) to win. Flag coordinate (2, 2) to loose. */
const finalWaterCellGameState = (): GameState => {
  const height = 3;
  const width = 3;
  const numMines = 3;
  return {
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
            isVisible: true,
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
            isFlagged: true,
            isVisible: false,
            isDetonated: false,
          },
        ],
        // REVEAL THIS CELL
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
          {
            coordinate: createCoordinate(2, 2),
            isMine: true,
            isFlagged: false,
            isVisible: false,
            isDetonated: false,
          },
        ],
      ] as MineCell[][] | WaterCell[][],
      numFlagged: 2,
    },
    status: GameStatus.Running,
    elapsedTime: 40,
    remainingFlags: numMines - 2,
    randSeed: 6,
  };
};

describe('create a game', () => {
  test('should start correctly', () => {
    const state = gameReducer(
      undefined,
      startGame({
        difficulty: createDifficultyLevel(3, 3, 3),
        randSeed: 6,
      }),
    );

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
    expect(state).toMatchObject(desiredState);
  });

  test('should have same mine cell coordinates if given same seed', () => {
    const startGameConfig = {
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

  test('should successfully resume game from given game state', () => {
    const previousGame = finalWaterCellGameState();
    const loadableState = getLoadableGameState(previousGame);
    const state = gameReducer(
      undefined,
      loadGame({
        gameState: loadableState,
      }),
    );
    expect(state).toMatchObject(previousGame);
  });
});

describe('reveal cell', () => {
  const initialState = gameReducer(
    undefined,
    startGame({
      difficulty: createDifficultyLevel(3, 3, 3),
      randSeed: 6,
    }),
  );
  const firstMoveState = gameReducer(
    initialState,
    revealCell({ coordinate: createCoordinate(0, 0) }),
  );

  test('should reveal cell and empty adjacent cells', () => {
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
        ] as MineCell[][] | WaterCell[][],
        numFlagged: 0,
      },
      status: GameStatus.Running,
      elapsedTime: 0,
      remainingFlags: numMines,
      randSeed: 6,
    };
    expect(firstMoveState).toMatchObject(desiredState);
  });

  test('should fail if given coordinate of visible cell', () => {
    const revealCellSameCoordinate = () => {
      gameReducer(firstMoveState, revealCell({ coordinate: createCoordinate(0, 0) }));
    };
    expect(revealCellSameCoordinate).toThrow(UserError);
  });
});

describe('game is won', () => {
  const state = gameReducer(
    finalWaterCellGameState(),
    revealCell({ coordinate: createCoordinate(0, 2) }),
  );

  test('when all water cells are visible', () => {
    const state = gameReducer(
      finalWaterCellGameState(),
      revealCell({ coordinate: createCoordinate(0, 2) }),
    );
    expect(state.status).toBe(GameStatus.Win);
  });

  test('status should be "Won"', () => {
    expect(state.status).toBe(GameStatus.Win);
  });

  test('remaining flags should be 0', () => {
    expect(state.remainingFlags).toBe(0);
  });

  test('all cells should be visible', () => {
    expect(countVisibleCells(state.board.grid) === state.board.numCells).toBe(true);
  });
});

describe('game is lost', () => {
  const previousState = finalWaterCellGameState();
  const state = gameReducer(previousState, revealCell({ coordinate: createCoordinate(2, 2) }));

  test('status should be "Loss"', () => {
    expect(state.status).toBe(GameStatus.Loss);
  });

  test('remaining flags should be 0', () => {
    expect(state.remainingFlags).toBe(0);
  });

  test('all cells should be visible', () => {
    expect(countVisibleCells(state.board.grid) === state.board.numCells).toBe(true);
  });

  test('should save grid state', () => {
    expect(state.board.savedGridState).toMatchObject(previousState.board.grid);
  });
});

test('should load previous grid successfully', () => {
  const previousState = finalWaterCellGameState();

  let state = gameReducer(previousState, revealCell({ coordinate: createCoordinate(2, 2) }));
  state = gameReducer(state, undoLoosingMove());

  expect(state.status).toBe(GameStatus.Running);
  expect(state.remainingFlags).toBe(previousState.remainingFlags);
  expect(state.board.grid).toMatchObject(previousState.board.grid);
});

describe('toggle flag', () => {
  const initialState = gameReducer(
    undefined,
    startGame({
      difficulty: createDifficultyLevel(3, 3, 3),
      randSeed: 6,
    }),
  );
  const firstMoveState = gameReducer(
    initialState,
    revealCell({ coordinate: createCoordinate(0, 0) }),
  );
  const toggledFlagState = gameReducer(
    firstMoveState,
    toggleFlag({ coordinate: createCoordinate(2, 2) }),
  );

  test('cell should be flagged correctly', () => {
    expect(toggledFlagState.board.grid[2][2].isFlagged).toBe(true);
    expect(toggledFlagState.remainingFlags).toBe(2);
    expect(toggledFlagState.board.numFlagged).toBe(1);
  });

  test('cell should be unflagged correctly', () => {
    const state = gameReducer(toggledFlagState, toggleFlag({ coordinate: createCoordinate(2, 2) }));
    expect(state.board.grid[2][2].isFlagged).toBe(false);
    expect(state.remainingFlags).toBe(3);
    expect(state.board.numFlagged).toBe(0);
  });

  test('toggleFlag should fail if given coordinate of visible cell', () => {
    const toggleFlagSameCoordinate = () => {
      gameReducer(firstMoveState, toggleFlag({ coordinate: createCoordinate(0, 0) }));
    };
    expect(toggleFlagSameCoordinate).toThrow(UserError);
  });

  test('toggleFlag should fail if game is not running', () => {
    const toggleFlagGameStatusWaiting = () => {
      gameReducer(initialState, toggleFlag({ coordinate: createCoordinate(1, 1) }));
    };
    expect(toggleFlagGameStatusWaiting).toThrow(IllegalStateError);
  });

  test('toggleFlag should fail if game no remaining flags', () => {
    const toggleFlagGameStatusWaiting = () => {
      gameReducer(
        { ...firstMoveState, remainingFlags: 0 },
        toggleFlag({ coordinate: createCoordinate(1, 1) }),
      );
    };
    expect(toggleFlagGameStatusWaiting).toThrow(UserError);
  });
});

describe('timer', () => {
  test('should tick', () => {
    const stateTickOnce = gameReducer(undefined, tickTimer());
    expect(stateTickOnce.elapsedTime).toBe(1);

    const stateTickAgain = gameReducer(stateTickOnce, tickTimer());
    expect(stateTickAgain.elapsedTime).toBe(2);
  });
});

test.todo('should fail if stateGame given invalid game state');
