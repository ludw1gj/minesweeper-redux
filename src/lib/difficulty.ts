import { arePositiveIntegers } from './util';

export interface DifficultyLevel {
  height: number;
  width: number;
  numMines: number;
}

export const createDifficultyLevel = (
  height: number,
  width: number,
  numMines: number
): DifficultyLevel => {
  if (!arePositiveIntegers(height, width, numMines)) {
    throw new Error(
      `height, width, and numMines must be positive whole numbers, height: ${height}, width: 
      ${width}, numMines: ${numMines}`
    );
  }

  return {
    height,
    width,
    numMines,
  };
};
