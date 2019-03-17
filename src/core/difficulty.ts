import { IllegalParameterError } from '../util/errors';
import { arePositiveIntegers } from './util';

/** The minesweeper game's difficulty level. */
export class DifficultyLevel {
  public static default = {
    easy: new DifficultyLevel(9, 9, 10),
    medium: new DifficultyLevel(16, 16, 40),
    hard: new DifficultyLevel(30, 16, 99),
  };

  public height: number;
  public width: number;
  public numMines: number;

  constructor(height: number, width: number, numMines: number) {
    if (!arePositiveIntegers(height, width, numMines)) {
      throw new IllegalParameterError(
        `height, width, and numMines must be positive whole numbers, height: ${height}, width: 
        ${width}, numMines: ${numMines}`,
      );
    }
    this.height = height;
    this.width = width;
    this.numMines = numMines;
  }
}
