export interface DifficultyLevel {
  height: number;
  width: number;
  numMines: number;
}

// TODO: add checks
export const createDifficultyLevel = (height: number, width: number, numMines: number): DifficultyLevel => ({
  height,
  width,
  numMines,
});
