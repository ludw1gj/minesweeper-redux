import {
  Coordinate,
  isValidCoordinateWithinGrid,
  createCoordinate,
  genRandomCoordinate
} from './coordinate';
import {
  Cell,
  createWaterCell,
  WaterCell,
  createVisibleCell,
  createMineCell,
  createDetonatedMineCell,
  MineCell,
  createUnflaggedCell,
  createFlaggedCell
} from './cell';
import { create2DArray } from './util';
import * as _ from 'lodash';

/** The change to a coordinate to adjacent cells. */
const DIRECTIONS: ReadonlyArray<{
  x: number;
  y: number;
}> = [
  { x: 0, y: -1 }, // NORTH
  { x: 1, y: 0 }, // EAST
  { x: 0, y: 1 }, // SOUTH
  { x: -1, y: 0 }, // WEST
  { x: 1, y: -1 }, // NORTH/EAST
  { x: -1, y: -1 }, // NORTH/WEST
  { x: 1, y: 1 }, // SOUTH/EAST
  { x: -1, y: 1 } // SOUTH/WEST
];

export type MinesweeperBoard = Readonly<{
  height: number;
  width: number;
  numCells: number;
  cells: Cell[][];
  previousCellsState: Cell[][] | null;

  numMines: number;
  numFlagged: number;
}>;

export const createMinesweeperBoard = (
  height: number,
  width: number,
  numMines: number,
  cells?: Cell[][]
): MinesweeperBoard => {
  const numCells = height * width;
  const _cells = cells
    ? cells
    : create2DArray(height, width).map((row, y) =>
        row.map((_, x) =>
          createWaterCell(createCoordinate(y, x), false, false, 0)
        )
      );

  return {
    height,
    width,
    numCells,
    cells: _cells,
    previousCellsState: null,
    numMines,
    numFlagged: countFlaggedCells(_cells)
  };
};

/** Calculate the distance (the amount of steps) between two coordinates. */
export const calcDistanceOfTwoCoordinates = (
  corA: Coordinate,
  corB: Coordinate
): number => {
  const dx = Math.abs(corB.x - corA.x);
  const dy = Math.abs(corB.y - corA.y);

  const min = Math.min(dx, dy);
  const max = Math.max(dx, dy);

  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
};

/** Get cell in matrix. */
export const getCell = (
  board: MinesweeperBoard,
  coor: Coordinate
): Cell | null => {
  if (!isValidCoordinateWithinGrid(coor, board.height, board.width)) {
    console.warn('tried to get cell at invalid coordinate');
    return null;
  }
  return board.cells[coor.y][coor.x];
};

/** Set cell in matrix. */
export const setCell = (
  board: MinesweeperBoard,
  coor: Coordinate,
  newCell: Cell
): MinesweeperBoard => {
  // TODO: only needs cells not the whole matrix. Also return just cells
  if (!isValidCoordinateWithinGrid(coor, board.height, board.width)) {
    console.warn('tried to set cell at invalid coordinate');
    return board;
  }
  const cells = board.cells.map((row, yIndex) => {
    return row.map((cell, xIndex) => {
      if (yIndex === coor.y && xIndex === coor.x) {
        return newCell;
      }
      return { ...cell };
    });
  });

  return { ...board, cells };
};

/** Save the current state of the matrix's cells. */
export const saveState = (board: MinesweeperBoard): MinesweeperBoard => {
  const previousCellsState = board.cells.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, previousCellsState };
};

/** Load the previous saved state of the matrix's cells. */
export const loadPreviousSavedState = (
  board: MinesweeperBoard
): MinesweeperBoard => {
  if (!board.previousCellsState) {
    console.warn('tried to load previous state of null');
    return board;
  }
  const cells = board.previousCellsState.map(row => {
    return row.map(cell => {
      return { ...cell };
    });
  });

  return { ...board, cells };
};

/** Make adjacent cells with a zero mine count visible at the given coordinate. Recursive. */
const revealEmptyAdjacentCells = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): void => {
  // TODO: return matrix
  DIRECTIONS.forEach(dir => {
    const xCor = coordinate.x + dir.x;
    const yCor = coordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const dirCor = createCoordinate(xCor, yCor);

    const adjacentCell = getCell(board, dirCor);
    if (!adjacentCell) {
      return;
    }
    if (!adjacentCell.isVisible) {
      revealCell(board, adjacentCell);
    }
    if (
      !adjacentCell.isMine &&
      (<WaterCell>adjacentCell).mineCount === 0 &&
      !adjacentCell.isVisible
    ) {
      // TODO: use map and return an array of coordinates for adjacent cells
      revealEmptyAdjacentCells(board, adjacentCell.coordinate);
    }
  });
};

/** Make cell visible. */
const revealCell = (board: MinesweeperBoard, cell: Cell): MinesweeperBoard => {
  if (cell.isVisible) {
    console.warn('tried to make already visible cell visible');
    return board;
  }
  return setCell(board, cell.coordinate, createVisibleCell(cell));
};

/** Make all cells visible. */
const revealAllCells = (board: MinesweeperBoard): MinesweeperBoard => {
  // TODO: can return only cells
  const cells = board.cells.map(row => {
    return row.map(cell => {
      if (!cell.isVisible) {
        return createVisibleCell(cell);
      } else {
        return cell;
      }
    });
  });
  return { ...board, cells };
};

/** Place mines in matrix. */
const placeMine = (
  board: MinesweeperBoard,
  seedCoordinate: Coordinate
): MinesweeperBoard => {
  let randCor = genRandomCoordinate(board.height, board.width);
  while (
    calcDistanceOfTwoCoordinates(seedCoordinate, randCor) < 2 ||
    isCoordinateMine(board, randCor)
  ) {
    randCor = genRandomCoordinate(board.height, board.width);
  }
  const newMineCell = createMineCell(randCor, false, false, false);
  return setCell(board, randCor, newMineCell);
};

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export const gameLoseState = (
  board: MinesweeperBoard,
  atCoordinate: Coordinate
): MinesweeperBoard | null => {
  const cell = getCell(board, atCoordinate);
  if (!cell || !cell.isMine) {
    console.warn('incorrect cell type. Coordinate must be of MineCell');
    return null;
  }
  board = saveState(board);
  board = setCell(
    board,
    cell.coordinate,
    createDetonatedMineCell(<MineCell>cell)
  );
  return revealAllCells(board);
};

/** Convert the board to a win state. Reveals all cells. */
export const gameWinState = (board: MinesweeperBoard): MinesweeperBoard => {
  return revealAllCells(board);
};

/** Make the cell visible. If cell is a mine cell, returns true otherwise returns false. */
export const makeCellVisible = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): boolean => {
  const cell = getCell(board, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return false;
  }
  if (cell.isVisible) {
    console.warn('cell at coordinate given is already visible');
    return false;
  }
  if (!cell.isMine) {
    revealCell(board, cell);
    if ((<WaterCell>cell).mineCount === 0) {
      revealEmptyAdjacentCells(board, coordinate);
    }
    return false;
  } else {
    return true;
  }
};

// export const createMinesweeperBoard = (
//   height: number,
//   width: number,
//   numMines: number,
//   cells?: Cell[][]
// ) => {
//   const validateNumMines = (numMines: number, err: string) => {
//     if (numMines <= height * width) {
//       return numMines;
//     }
//     console.warn(err);
//     return height * width;
//   };
//   const _numMines = validateNumMines(
//     numMines,
//     'tried to create minesweeper board where mine amount is greater than the product of ' +
//       'the width and height'
//   );

//   if (!cells) {
//     return {
//       board: createEmptyCellMatrix(height, width),
//       numMines: _numMines,
//       numFlagged: 0
//     };
//   }
//   const matrix = createMatrix(height, width, cells);
//   return {
//     matrix,
//     numMines: _numMines,
//     numFlagged: countFlaggedAndVisibleCells(matrix).flagged
//   };
// };

/** Fill the matrix with mine cells and water cells. */
export const initMatrixCells = (
  board: MinesweeperBoard,
  seedCoordinate: Coordinate
): void => {
  _.times(board.numMines, () => placeMine(board, seedCoordinate));

  const m = board.cells.map((row, y) => {
    row.map((_, x) => {
      const coordinate = createCoordinate(x, y);
      // TODO: get mine coordinates - array of coordinates, if matched place mine
      if (board.cells[y][x].isMine) {
        return createMineCell(coordinate, false, false, false);
      }
      const mineCount = countSurroundingMines(board, coordinate);
      const newWaterCell = createWaterCell(coordinate, false, false, mineCount);
      // TODO: much more efficient to remove setCell
      // setCell(board, coordinate, newWaterCell);
      return createMineCell(coordinate, false, false, false);
    });
  });
};

export const toggleCellFlagStatus = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): MinesweeperBoard => {
  const cell = getCell(board, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return board;
  }
  if (cell.isVisible) {
    return board;
  }
  if (cell.isFlagged) {
    const newBoard = setCell(board, coordinate, createUnflaggedCell(cell));
    return { ...newBoard, numFlagged: board.numFlagged - 1 };
  } else {
    const newBoard = setCell(board, coordinate, createFlaggedCell(cell));
    return { ...newBoard, numFlagged: board.numFlagged + 1 };
  }
};

// TODO: funcs bellow don't change state of Matrix itself

/** Count the amount of adjacent mines. */
const countSurroundingMines = (
  board: MinesweeperBoard,
  atCoordinate: Coordinate
): number => {
  let counter = 0;
  DIRECTIONS.forEach(dir => {
    const xCor = atCoordinate.x + dir.x;
    const yCor = atCoordinate.y + dir.y;
    if (xCor < 0 || yCor < 0) {
      return;
    }
    const directionCor = createCoordinate(xCor, yCor);
    if (isCoordinateMine(board, directionCor)) {
      counter++;
    }
  });
  return counter;
};

// TODO: this func is a test
const countFlaggedCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isFlagged)).length;

const countVisibleCells = (cells: Cell[][]): number =>
  cells.map(row => row.filter(cell => cell.isVisible)).length;

/** Find if the cell of a given co-ordinate is a mine cell. */
const isCoordinateMine = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): boolean => {
  const cell = getCell(board, coordinate);
  if (!cell) {
    return false;
  }
  return cell.isMine;
};

/** Output a string representation of the matrix. */
export const boardToString = (cells: Cell[][]): string => {
  const generateLine = () => '---'.repeat(cells.length);

  const boardStr = cells
    .map(row => {
      const rowStr = row.map((cell, index) => {
        if (index === 0) {
          return cell.isMine ? `${(<WaterCell>cell).mineCount}` : 'X';
        } else {
          return cell.isMine ? `, ${(<WaterCell>cell).mineCount}` : ', X';
        }
      });
      return '|' + rowStr.join('') + '|\n';
    })
    .join('');

  return generateLine() + boardStr + generateLine();
};
