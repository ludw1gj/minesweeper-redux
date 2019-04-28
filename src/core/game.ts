import { Board, IBoard } from "./board";
import { Cell, CellStatus, ICell } from "./cell";
import { Coordinate, ICoordinate } from "./coordinate";
import { IDifficulty } from "./difficulty";
import { IllegalStateError } from "./errors";
import { Grid } from "./grid";
import { RAND_NUM_GEN } from "./random";

/** Contains the necessary values for a minesweeper game. */
export interface IMinesweeper {
  /** The board which holds values concerning the game grid. */
  readonly board: IBoard;
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
  Waiting = "waiting",
  /** Game is ready. */
  Ready = "ready",
  /** Game is running. */
  Running = "running",
  /** Game has been lost. */
  Loss = "loss",
  /** Game has been won. */
  Win = "win",
}

/** A callback for the game timer. */
export type TimerCallback = () => void;

/** Stops a timer. It is the function returned when timer is started. */
export type TimerStopper = () => void;

export class Minesweeper {
  private constructor() {}

  /** Create a minesweeper game. */
  public static startGame(
    randSeed: number,
    difficulty: IDifficulty,
    timerCallback?: TimerCallback,
  ): IMinesweeper {
    RAND_NUM_GEN.setSeed(randSeed);

    return {
      board: Board.create(difficulty),
      status: GameStatus.Ready,
      remainingFlags: difficulty.numMines,
      elapsedTime: 0,
      randSeed,
      timerCallback,
    };
  }

  /** Load a game state. */
  public static loadGame(game: IMinesweeper, timerCallback?: TimerCallback): IMinesweeper {
    const state = {
      ...game,
      timerCallback,
      timerStopper: undefined,
    };

    if (game.status === GameStatus.Running) {
      const timerStopper = Minesweeper.startTimer(timerCallback);
      return { ...state, timerStopper };
    }
    return state;
  }

  /** Make cell revealed at the given coordinate. */
  public static revealCell(game: IMinesweeper, coordinate: ICoordinate): IMinesweeper {
    if (game.status === GameStatus.Ready) {
      // Note: timer starts here and when game status changes from Running it will stop.
      return {
        ...game,
        board: Board.fill(game.board, coordinate),
        status: GameStatus.Running,
        timerStopper: Minesweeper.startTimer(game.timerCallback),
      };
    }
    if (game.status !== GameStatus.Running) {
      return game;
    }

    const cell = Grid.getCell(game.board.grid, coordinate);
    if (cell.status === CellStatus.Revealed) {
      return game;
    }

    if (cell.isMine) {
      if (game.timerStopper) {
        game.timerStopper();
      }
      return {
        ...game,
        board: Board.setLoseState(game.board, cell),
        status: GameStatus.Loss,
        remainingFlags: 0,
      };
    }

    const board = Board.setCell(game.board, Cell.changeStatus(cell, CellStatus.Revealed));
    if (Board.isWin(board)) {
      if (game.timerStopper) {
        game.timerStopper();
      }
      return {
        ...game,
        board: Board.setWinState(game.board),
        status: GameStatus.Win,
        remainingFlags: 0,
      };
    }
    return { ...game, board, remainingFlags: Board.countRemainingFlags(board) };
  }

  /** Toggle the flag value of cell at the given coordinate. */
  public static toggleFlag(game: IMinesweeper, coordinate: ICoordinate): IMinesweeper {
    if (game.status !== GameStatus.Running) {
      return game;
    }
    const cell = Grid.getCell(game.board.grid, coordinate);
    if (cell.status !== CellStatus.Hidden && cell.status !== CellStatus.Flagged) {
      return game;
    }

    const toggleCellFlagStatus = (c: ICell): ICell =>
      c.status === CellStatus.Flagged
        ? Cell.changeStatus(c, CellStatus.Hidden)
        : Cell.changeStatus(c, CellStatus.Flagged);

    const grid = Grid.setCells(
      game.board.grid,
      game.board.grid.cells.map(row =>
        row.map(c => (Coordinate.areEqual(c.coordinate, coordinate) ? toggleCellFlagStatus(c) : c)),
      ),
    );
    const numFlagged =
      cell.status === CellStatus.Flagged ? game.board.numFlagged - 1 : game.board.numFlagged + 1;
    const board = { ...game.board, grid, numFlagged };

    return { ...game, board, remainingFlags: Board.countRemainingFlags(board) };
  }

  /** Increment elapsed time by 1. */
  public static tickTimer(game: IMinesweeper): IMinesweeper {
    // NOTE: Ready is allowed as timerCallback could run before state is updated with Running.
    if (game.status !== GameStatus.Ready && game.status !== GameStatus.Running) {
      throw new IllegalStateError(
        `tried to tick timer when game status is not ${GameStatus.Ready} or 
      ${GameStatus.Running}. Current status: ${game.status}`,
      );
    }
    return {
      ...game,
      elapsedTime: game.elapsedTime + 1,
    };
  }

  /** Load the previous state before the game had been lost. */
  public static undoLoosingMove(game: IMinesweeper): IMinesweeper {
    if (game.status !== GameStatus.Loss) {
      throw new IllegalStateError(
        `incorrect state of GameStatus: ${game.status}, GameStatus must be ${GameStatus.Loss}`,
      );
    }
    if (!game.board.savedGridState) {
      throw new IllegalStateError("tried to load uninitialized previous state");
    }

    const grid = Grid.setCells(
      game.board.grid,
      game.board.savedGridState.cells.map(row => row.map(cell => cell)),
    );
    const board = { ...game.board, grid };
    const remainingFlags = Board.countRemainingFlags(board);
    const timerStopper = Minesweeper.startTimer(game.timerCallback);

    return {
      ...game,
      timerStopper,
      board,
      status: GameStatus.Running,
      remainingFlags,
    };
  }

  /** Start the game timer. */
  private static startTimer(callback?: TimerCallback): TimerStopper | undefined {
    if (!callback) {
      return undefined;
    }
    const timer = setInterval(() => {
      callback();
    }, 1000);
    const timerStopper = (): void => {
      clearInterval(timer);
    };
    return timerStopper;
  }
}
