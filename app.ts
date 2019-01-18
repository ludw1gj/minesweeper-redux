import { MinesweeperBoard } from './src/lib/minesweeperBoard';
import { createMinesweeperGame, printBoard } from './src/minesweeper';

const app = () => {
  const game = createMinesweeperGame(9, 9, 10);
  printBoard(game);
};

app();
