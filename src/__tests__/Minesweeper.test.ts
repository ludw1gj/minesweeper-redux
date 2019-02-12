import { createInitialGrid } from '../core/grid';
import { createDifficultyLevel, gameReducer, startGame } from '../index';
import { GameState, GameStatus } from '../reducers/gameReducer';

let store: GameState;

test('start minesweeper game successfully', () => {
  const config = {
    difficulty: createDifficultyLevel(3, 3, 3),
    randSeed: 6,
  };
  store = gameReducer(store, startGame(config));

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
