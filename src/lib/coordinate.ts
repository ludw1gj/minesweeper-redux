class CreateCoordinateError extends Error {}

export interface Coordinate {
  readonly x: number;
  readonly y: number;
}

export const createCoordinate = (x: number, y: number) => {
  if (x % 1 !== 0 || y % 1 !== 0) {
    console.warn(
      new CreateCoordinateError(
        `x and/or y is not a whole number, x: ${x} y: ${y}`
      )
    );
  }
  if (x < 0 || y < 0) {
    console.warn(
      new CreateCoordinateError(
        `x and/or y cannot be a negative number, x: ${x} y: ${y}`
      )
    );
  }
  return { x, y };
};

/** Check if coordinate of a grid of width and height. */
export const isValidCoordinateWithinGrid = (
  coordinate: Coordinate,
  height: number,
  width: number
): boolean => {
  if (
    coordinate.y < 0 ||
    coordinate.x < 0 ||
    coordinate.y >= height ||
    coordinate.x >= width
  ) {
    return false;
  }
  return true;
};

/** Generate a random co-ordinate within the given height and width. */
export const genRandomCoordinate = (
  height: number,
  width: number
): Coordinate => {
  return createCoordinate(
    Math.floor(Math.random() * width),
    Math.floor(Math.random() * height)
  );
};
