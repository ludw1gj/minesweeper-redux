import {
  createMinesweeperBoard,
  toggleCellFlagStatus,
  setCellVisibleAtCoordinate,
  boardToString,
  loadPreviousSavedState,
  countRemainingFlags,
  MinesweeperBoard,
  genLoseState,
  genWinState,
  checkWinningBoard,
  genFilledBoard,
} from './lib/minesweeperBoard';
import { createDifficulty, DifficultyLevel } from './lib/difficulty';
import { Cell } from './lib/cells';
import { Coordinate } from './lib/coordinate';

export interface Minesweeper {
  readonly board: MinesweeperBoard;
  readonly status: GameStatus;
  readonly remainingFlags: number;
  readonly elapsedTime: number;
  readonly timer: number;
}

export enum GameStatus {
  /** Game is waiting to start. */
  Waiting,
  Running,
  Loss,
  Win,
}

export let State: Minesweeper;

const getState = (): Minesweeper => {
  return State;
};

const updateState = (newState: Partial<Minesweeper>): void => {
  // Note: in spread collision the right-most (last) object's value wins out.
  State = { ...State, ...newState };
};

export const createCustomDifficulty = createDifficulty;

export const difficulties: { [key: string]: DifficultyLevel } = {
  easy: createDifficulty(9, 9, 10),
  medium: createDifficulty(16, 16, 40),
  hard: createDifficulty(30, 16, 99),
};

export const createMinesweeperGame = (difficulty: DifficultyLevel, cells?: Cell[][], elapsedTime?: number): void => {
  if (cells && !elapsedTime) {
    console.warn('tried to create minesweeper game with cells but no elapsed time');
  }
  const board = !cells
    ? createMinesweeperBoard(difficulty.height, difficulty.width, difficulty.numMines)
    : createMinesweeperBoard(difficulty.height, difficulty.width, difficulty.numMines, cells);
  const _elapsedTime = !elapsedTime ? 0 : elapsedTime;

  updateState({
    board,
    status: GameStatus.Waiting,
    elapsedTime: _elapsedTime,
    remainingFlags: countRemainingFlags(board),
  });
};

/** Toggle the flag value of cell at the given coordinate. */
export const toggleFlag = (atCoordinate: Coordinate): void => {
  const state = getState();
  if (state.status !== GameStatus.Running) {
    console.warn('tried to toggle flag of cell when game status is not Running');
    return;
  }
  const board = toggleCellFlagStatus(state.board, atCoordinate);
  const remainingFlags = countRemainingFlags(board);
  if (checkWinningBoard(board)) {
    const newBoard = genWinState(state.board);
    console.log('You have won the game.');
    updateState({ ...state, board: newBoard, status: GameStatus.Win, remainingFlags: 0 });
  } else {
    updateState({ board, remainingFlags });
  }
};

/** Make cell visible at the given coordinate. */
export const revealCell = (coordinate: Coordinate, timerCallback?: TimerCallback): void => {
  const state = getState();
  if (state.status === GameStatus.Waiting) {
    const board = genFilledBoard(state.board, coordinate);

    // Note: timer starts here and when game status changes from Running it will stop.
    startTimer(timerCallback);
    updateState({ board, status: GameStatus.Running });
    return;
  }

  const { board, isMine } = setCellVisibleAtCoordinate(state.board, coordinate);
  if (!board) {
    return;
  }
  const remainingFlags = countRemainingFlags(board);

  if (isMine) {
    const newBoard = genLoseState(board, coordinate);
    if (!newBoard) {
      console.warn('bad coordinate given');
      return;
    }
    console.log('You have lost the game.');
    updateState({ ...state, remainingFlags, board: newBoard, status: GameStatus.Loss });
    return;
  }
  if (checkWinningBoard(board)) {
    const newBoard = genWinState(state.board);
    console.log('You have won the game.');
    updateState({ ...state, board: newBoard, status: GameStatus.Win, remainingFlags: 0 });
  } else {
    updateState({ board, remainingFlags });
  }
};

/** Load the previous state before the game has lost. */
export const undoLoosingMove = (timerCallback?: TimerCallback): void => {
  const state = getState();
  if (state.status !== GameStatus.Loss) {
    console.warn('incorrect state of GameStatus');
    return;
  }
  const board = loadPreviousSavedState(state.board);
  const remainingFlags = countRemainingFlags(board);
  updateState({ board, status: GameStatus.Running, remainingFlags });
  startTimer(timerCallback);
};

/** Create a string representation of the board. */
export const printBoard = (): void => console.log(boardToString(getState().board.cells));

export const isGameRunning = (): boolean => getState().status === GameStatus.Running;

export const isGameLost = (): boolean => getState().status === GameStatus.Loss;

export const isGameEnded = (): boolean => getState().status === GameStatus.Loss || getState().status === GameStatus.Win;

export type TimerCallback = (gameTime: number) => {};

const startTimer = (callback?: TimerCallback): void => {
  const tick = () => updateState({ elapsedTime: getState().elapsedTime + 1 });

  const timer = setInterval(() => {
    const state = getState();
    if (state.status !== GameStatus.Running) {
      clearInterval(timer);
      return;
    }
    tick();
    if (callback) {
      callback(state.elapsedTime);
    }
  }, 1000);
  updateState({ timer });
};
