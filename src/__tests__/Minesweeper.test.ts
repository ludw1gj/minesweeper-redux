import { createDifficultyLevel, gameReducer, startGame } from '../index';
import { GameState } from '../reducers/gameReducer';

let store: GameState;

beforeEach(() => {});

test('Create Minesweeper Game ', () => {
  const config = {
    difficulty: createDifficultyLevel(5, 5, 5),
    randSeed: 6,
  };
  store = gameReducer(store, startGame(config));

  console.log(store);
  expect('placeholder').toBe('placeholder');
});
