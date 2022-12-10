import { Difficulty } from './types'

/** Default difficulty levels. */
export const defaultDificulties: { [key: string]: Difficulty } = {
  easy: { height: 9, width: 9, numMines: 10 },
  medium: { height: 16, width: 16, numMines: 40 },
  hard: { height: 30, width: 16, numMines: 99 },
}
