export interface DifficultyLevel {
  height: number;
  width: number;
  numMines: number;
}

export const difficulties: { [key: string]: DifficultyLevel } = {
  easy: {
    height: 9,
    width: 9,
    numMines: 10
  },
  medium: {
    height: 16,
    width: 16,
    numMines: 40
  },
  hard: {
    height: 30,
    width: 16,
    numMines: 99
  }
};
