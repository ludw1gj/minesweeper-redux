import { arePositiveIntegers } from './util';

/** The minesweeper game's difficulty level. */
export interface IDifficultyLevel {
  height: number;
  width: number;
  numMines: number;
}

/** Create a difficulty level for a minesweeper game. */
export const createDifficultyLevel = (
  height: number,
  width: number,
  numMines: number,
): IDifficultyLevel => {
  if (!arePositiveIntegers(height, width, numMines)) {
    throw new Error(
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
