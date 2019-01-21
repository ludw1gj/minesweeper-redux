import {
  Matrix,
  createMatrix,
  setCell,
  getCell,
  calcDistanceOfTwoCoordinates,
  saveState
} from './matrix';
import {
  Cell,
  WaterCell,
  MineCell,
  createWaterCell,
  createVisibleCell,
  createMineCell,
  createUnflaggedCell,
  createFlaggedCell,
  createDetonatedMineCell
} from './cell';
import {
  Coordinate,
  createCoordinate,
  genRandomCoordinate
} from './coordinate';

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

export interface MinesweeperBoard {
  readonly matrix: Matrix<Cell>;
  readonly numMines: number;
  numFlagged: number;
}

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
//       matrix: createEmptyCellMatrix(height, width),
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

// TODO: this func is a test
const countFlags = (matrix: Matrix<Cell>) => {
  return matrix.cells.map(row => {
    return row.filter(cell => cell.isFlagged);
  }).length;
};

/** Fill the matrix with mine cells and water cells. */
export const initMatrixCells = (
  board: MinesweeperBoard,
  seedCoordinate: Coordinate
): void => {
  for (let i = 0; i < board.numMines; i++) {
    placeMine(board.matrix, seedCoordinate);
  }

  const m = board.matrix.cells.map((row, y) => {
    row.map((_, x) => {
      const coordinate = createCoordinate(x, y);
      // TODO: get mine coordinates - array of coordinates, if matched place mine
      if (board.matrix.cells[y][x].isMine) {
        return createMineCell(coordinate, false, false, false);
      }
      const mineCount = countSurroundingMines(board.matrix, coordinate);
      const newWaterCell = createWaterCell(coordinate, false, false, mineCount);
      // TODO: much more efficient to remove setCell
      // setCell(board.matrix, coordinate, newWaterCell);
      return createMineCell(coordinate, false, false, false);
    });
  });
};

export const toggleCellFlagStatus = (
  board: MinesweeperBoard,
  coordinate: Coordinate
): MinesweeperBoard => {
  const cell = getCell(board.matrix, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return board;
  }
  if (cell.isVisible) {
    return board;
  }
  if (cell.isFlagged) {
    const matrix = setCell(board.matrix, coordinate, createUnflaggedCell(cell));
    return { ...board, matrix, numFlagged: board.numFlagged-- };
  } else {
    const matrix = setCell(board.matrix, coordinate, createFlaggedCell(cell));
    return { ...board, matrix, numFlagged: board.numFlagged++ };
  }
};

/** Count the amount of adjacent mines. */
const countSurroundingMines = (
  matrix: Matrix<Cell>,
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
    if (isCoordinateMine(matrix, directionCor)) {
      counter++;
    }
  });
  return counter;
};

/** Find if the cell of a given co-ordinate is a mine cell. */
const isCoordinateMine = (
  matrix: Matrix<Cell>,
  coordinate: Coordinate
): boolean => {
  const cell = getCell(matrix, coordinate);
  if (!cell) {
    return false;
  }
  return cell.isMine;
};

/** Make adjacent cells with a zero mine count visible at the given coordinate. Recursive. */
const revealEmptyAdjacentCells = (
  matrix: Matrix<Cell>,
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

    const adjacentCell = getCell(matrix, dirCor);
    if (!adjacentCell) {
      return;
    }
    if (!adjacentCell.isVisible) {
      revealCell(matrix, adjacentCell);
    }
    if (
      !adjacentCell.isMine &&
      (<WaterCell>adjacentCell).mineCount === 0 &&
      !adjacentCell.isVisible
    ) {
      revealEmptyAdjacentCells(matrix, adjacentCell.coordinate);
    }
  });
};

/** Make cell visible. */
const revealCell = (matrix: Matrix<Cell>, cell: Cell): Matrix<Cell> => {
  if (cell.isVisible) {
    console.warn('tried to make already visible cell visible');
    return matrix;
  }
  return setCell(matrix, cell.coordinate, createVisibleCell(cell));
};

/** Make all cells visible. */
const revealAllCells = (matrix: Matrix<Cell>): Matrix<Cell> => {
  // TODO: can return only cells
  const cells = matrix.cells.map(row => {
    return row.map(cell => {
      if (!cell.isVisible) {
        return createVisibleCell(cell);
      } else {
        return cell;
      }
    });
  });
  return { ...matrix, cells };
};

/** Place mines in matrix. */
const placeMine = (
  matrix: Matrix<Cell>,
  seedCoordinate: Coordinate
): Matrix<Cell> => {
  let randCor = genRandomCoordinate(matrix.height, matrix.width);
  while (
    calcDistanceOfTwoCoordinates(seedCoordinate, randCor) < 2 ||
    isCoordinateMine(matrix, randCor)
  ) {
    randCor = genRandomCoordinate(matrix.height, matrix.width);
  }
  const newMineCell = createMineCell(randCor, false, false, false);
  return setCell(matrix, randCor, newMineCell);
};

/** Count the number of cells that are flagged. */
export const countFlaggedAndVisibleCells = (
  matrix: Matrix<Cell>
): { visible: number; flagged: number } => {
  let visible = 0;
  let flagged = 0;
  for (let y = 0; y < matrix.height; y++) {
    for (let x = 0; x < matrix.width; x++) {
      const cell = matrix.cells[y][x];
      if (cell.isVisible) {
        visible++;
      }
      if (cell.isFlagged) {
        flagged++;
      }
    }
  }
  return { visible, flagged };
};

/** Make the cell visible. If cell is a mine cell, returns true otherwise returns false. */
export const makeCellVisible = (
  matrix: Matrix<Cell>,
  coordinate: Coordinate
): boolean => {
  const cell = getCell(matrix, coordinate);
  if (!cell) {
    console.warn('incorrect coordinate given');
    return false;
  }
  if (cell.isVisible) {
    console.warn('cell at coordinate given is already visible');
    return false;
  }
  if (!cell.isMine) {
    revealCell(matrix, cell);
    if ((<WaterCell>cell).mineCount === 0) {
      revealEmptyAdjacentCells(matrix, coordinate);
    }
    return false;
  } else {
    return true;
  }
};

/**
 * Convert the board to a lose state. Saves the current state, detonates the mine, and reveals
 * all cells.
 */
export const gameLoseState = (
  matrix: Matrix<Cell>,
  atCoordinate: Coordinate
): void => {
  const cell = getCell(matrix, atCoordinate);
  if (!cell || !cell.isMine) {
    console.warn('incorrect cell type. Coordinate must be of MineCell');
    return;
  }
  matrix = saveState(matrix);
  matrix = setCell(
    matrix,
    cell.coordinate,
    createDetonatedMineCell(<MineCell>cell)
  );
  revealAllCells(matrix);
};

/** Convert the board to a win state. Reveals all cells. */
export const gameWinState = (matrix: Matrix<Cell>): void => {
  revealAllCells(matrix);
};

/** Output a string representation of the matrix. */
export const boardToString = (matrix: Matrix<Cell>): string => {
  const generateLine = (width: number) => {
    let line = '';
    for (let i = 0; i < width; i++) {
      line += '---';
    }
    return `${line}\n`;
  };

  let output = generateLine(matrix.width);
  for (let y = 0; y < matrix.height; y++) {
    output += '|';
    for (let x = 0; x < matrix.width; x++) {
      const cell = matrix.cells[y][x];
      if (x === 0) {
        output += cell.isMine ? `${(<WaterCell>cell).mineCount}` : 'X';
      } else {
        output += cell.isMine ? `, ${(<WaterCell>cell).mineCount}` : ', X';
      }
    }
    output += '|\n';
  }
  output += generateLine(matrix.width);
  return output;
};
