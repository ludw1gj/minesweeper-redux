import { Difficulty } from "./core-types";
import { IllegalParameterError } from "./errors";
import { arePositiveIntegers } from "./util";

/** Default difficulty levels. */
export const defaultDifficultyLevels: { [key: string]: Difficulty } = {
  easy: createDifficulty(9, 9, 10),
  medium: createDifficulty(16, 16, 40),
  hard: createDifficulty(30, 16, 99),
};

/** Create a difficulty level for a minesweeper game. */
export function createDifficulty(height: number, width: number, numMines: number): Difficulty {
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
}
