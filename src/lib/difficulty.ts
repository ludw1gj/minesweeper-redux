import { DifficultyLevel } from './types';

// TODO: add checks
export const createDifficulty = (
  height: number,
  width: number,
  numMines: number
): DifficultyLevel => ({ height, width, numMines });
