import { createMinesweeperGame, printBoard, revealCell, State, difficulties } from './src/minesweeper';
import { Coordinate } from './src/lib/coordinate';

const app = async () => {
  console.log('game start');
  createMinesweeperGame(difficulties.easy);
  revealCell(new Coordinate(3, 3));

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  await delay(3000);
  printBoard();
  console.log(State.elapsedTime);

  await delay(2000);
  clearInterval(State.timer);
  console.log(State.elapsedTime);
};

app();
