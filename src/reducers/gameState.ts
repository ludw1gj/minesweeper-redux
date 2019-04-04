import { MinesweeperBoard } from '../core/minesweeperBoard';

/** Contains the necessary values for a minesweeper game. */
export interface GameState {
  /** The board which holds values concerning the game grid. */
  readonly board: MinesweeperBoard;
  /** The current status of the game. */
  readonly status: GameStatus;
  /** The remaining flags. */
  readonly remainingFlags: number;
  /** The amount of time in ms since the game began.  */
  readonly elapsedTime: number;
  /** The number to seed RandomNumberGenerator */
  readonly randSeed: number;
  /** Function that is called once every second. */
  readonly timerCallback?: TimerCallback;
  /** Stops the timer. The property is set when timer has been started. */
  readonly timerStopper?: TimerStopper;
}

/** The current status of the game. */
export enum GameStatus {
  /** Game is waiting to start. */
  Waiting = 'WAITING',
  /** Game is ready. */
  Ready = 'READY',
  /** Game is running. */
  Running = 'RUNNING',
  /** Game has been lost. */
  Loss = 'LOSS',
  /** Game has been won. */
  Win = 'WIN',
}

/** A callback for the game timer. */
export type TimerCallback = () => void;

/** Stops a timer. It is the function returned when timer is started. */
export type TimerStopper = () => void;
