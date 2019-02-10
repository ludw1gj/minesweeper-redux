import { createDifficultyLevel } from '../core/difficulty';
import { createMinesweeperGame } from '../index';

test('Create Minesweeper Game ', () => {
  createMinesweeperGame(createDifficultyLevel(5, 5, 5));

  expect('placeholder').toBe('placeholder');
});
