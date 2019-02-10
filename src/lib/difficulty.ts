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
  if (!isAllPositiveIntegers(height, width, numMines)) {
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

const isPositiveInteger = (n: number) => n > 0 && n % 1 === 0;

const isAllPositiveIntegers = (...n: number[]) =>
  n.filter(num => !isPositiveInteger(num)).length === 0;
