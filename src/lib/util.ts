/** Create a 2D array. */
export const create2DArray = <T>(rows: number, columns: number): T[][] => {
  const arr = new Array(rows);
  for (let y = 0; y < rows; y++) {
    const row = new Array(columns);
    arr[y] = row;
  }
  return arr;
};
