import { IllegalParameterError } from '../util/errors';
import { Coordinate } from './coordinate';

/** An abstract cell for water and mine cells. */
interface ICell {
  /** The coordinated of the cell in the grid. */
  readonly coordinate: Coordinate;
  /** Whether the cell is visible on the board. */
  readonly isVisible: boolean;
  /** Whether the cell is flagged on the board. */
  readonly isFlagged: boolean;
  /** Whether the cell is a mine. */
  readonly isMine: boolean;

  /** Create a new visible instance of the cell. */
  createVisible: () => ICell;

  /** Create a new flagged instance of the cell. */
  createFlagged: () => ICell;

  /** Create a new unflagged instance of the cell. */
  createUnflagged: () => ICell;
}

/** A water cell. */
export class WaterCell implements ICell {
  public readonly coordinate: Coordinate;
  public readonly isVisible: boolean;
  public readonly isFlagged: boolean;
  public readonly isMine: false = false;

  /** The amount of adjacent mines surrounding the cell. */
  public readonly mineCount: number;

  constructor(coordinate: Coordinate, isVisible: boolean, isFlagged: boolean, mineCount: number) {
    this.coordinate = coordinate;
    this.isVisible = isVisible;
    this.isFlagged = isFlagged;
    this.mineCount = mineCount;
  }

  public createVisible = (): WaterCell => {
    if (this.isVisible) {
      throw new IllegalParameterError(`tried to make visible an already visible cell`);
    }
    return new WaterCell(this.coordinate, true, false, this.mineCount);
  };

  public createFlagged = (): WaterCell => {
    if (this.isFlagged) {
      throw new IllegalParameterError(`tried to flag an already flagged cell`);
    }
    return new WaterCell(this.coordinate, false, true, this.mineCount);
  };

  public createUnflagged = (): WaterCell => {
    if (!this.isFlagged) {
      throw new IllegalParameterError(`tried to unflag an already unflagged cell`);
    }
    return new WaterCell(this.coordinate, false, false, this.mineCount);
  };
}

/** A mine cell. */
export class MineCell implements ICell {
  public readonly coordinate: Coordinate;
  public readonly isVisible: boolean;
  public readonly isFlagged: boolean;
  public readonly isMine: true = true;

  /** The amount of adjacent mines surrounding the cell. */
  public readonly isDetonated: boolean;

  constructor(
    coordinate: Coordinate,
    isVisible: boolean,
    isFlagged: boolean,
    isDetonated: boolean,
  ) {
    this.coordinate = coordinate;
    this.isVisible = isVisible;
    this.isFlagged = isFlagged;
    this.isDetonated = isDetonated;
  }

  public createVisible = (): MineCell => {
    if (this.isVisible) {
      throw new IllegalParameterError(`tried to make visible an already visible cell`);
    }
    return new MineCell(this.coordinate, true, false, false);
  };

  public createFlagged = (): MineCell => {
    if (this.isFlagged) {
      throw new IllegalParameterError(`tried to flag an already flagged cell`);
    }
    return new MineCell(this.coordinate, false, true, false);
  };

  public createUnflagged = (): MineCell => {
    if (!this.isFlagged) {
      throw new IllegalParameterError(`tried to unflag an already unflagged cell`);
    }
    return new MineCell(this.coordinate, false, false, false);
  };

  /** Create a new detonated instance of the mine cell. */
  public createDetonated = (): MineCell => {
    if (this.isDetonated) {
      throw new IllegalParameterError(`tried to detonate an already detonated cell`);
    }
    return new MineCell(this.coordinate, true, false, true);
  };
}

export type Cell = WaterCell | MineCell;
