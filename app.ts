import { createMinesweeperGame, printBoard, revealCell, State, difficulties, undoLoosingMove } from './src/minesweeper';
import { createCoordinate } from './src/lib/coordinate';

const app = async () => {
  console.log('game start');
  createMinesweeperGame(difficulties.easy);
  revealCell(createCoordinate(3, 3));
  undoLoosingMove();

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  await delay(3000);
  printBoard();
  console.log(State.elapsedTime);

  await delay(2000);
  clearInterval(State.timer);
  console.log(State.elapsedTime);
};

app();
