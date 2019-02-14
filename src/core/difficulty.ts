import { IllegalParameterError } from './errors';
import { arePositiveIntegers } from './util';

/** The minesweeper game's difficulty level. */
export interface DifficultyLevel {
  height: number;
  width: number;
  numMines: number;
}

/** Create a difficulty level for a minesweeper game. */
export const createDifficultyLevel = (
  height: number,
  width: number,
  numMines: number,
): DifficultyLevel => {
  if (!arePositiveIntegers(height, width, numMines)) {
    throw new IllegalParameterError(
      `height, width, and numMines must be positive whole numbers, height: ${height}, width: 
      ${width}, numMines: ${numMines}`,
    );
  }
  return {
    height,
    width,
    numMines,
  };
};

export const difficulties: { [key: string]: DifficultyLevel } = {
  easy: {
    height: 9,
    width: 9,
    numMines: 10,
  },
  medium: {
    height: 16,
    width: 16,
    numMines: 40,
  },
  hard: {
    height: 30,
    width: 16,
    numMines: 99,
  },
};
