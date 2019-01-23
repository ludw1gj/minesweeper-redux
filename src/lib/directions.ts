/** The change to a coordinate to adjacent cells. */
export const DIRECTIONS: ReadonlyArray<{
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
