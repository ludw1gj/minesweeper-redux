/** Create a 2D array. */
export const create2DArray = <T>(rows: number, columns: number): T[][] =>
  Array(rows)
    .fill(undefined)
    .map(() => Array(columns).fill(undefined));
