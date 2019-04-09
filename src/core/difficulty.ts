import { IllegalParameterError } from "./errors";
import { arePositiveIntegers } from "./util";

/** The minesweeper game's difficulty level. */
export interface IDifficulty {
  height: number;
  width: number;
  numMines: number;
}

export class Difficulty {
  /** Default difficulty levels. */
  public static default: { [key: string]: IDifficulty } = {
    easy: Difficulty.create(9, 9, 10),
    medium: Difficulty.create(16, 16, 40),
    hard: Difficulty.create(30, 16, 99),
  };

  private constructor() {}

  /** Create a difficulty level for a minesweeper game. */
  public static create(height: number, width: number, numMines: number): IDifficulty {
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
}
