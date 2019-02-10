/** Check if number is a non negative whole number. */
export const isPositiveInteger = (n: number) => n >= 0 && n % 1 === 0;

/** Check if numbers are non negative whole numbers. */
export const arePositiveIntegers = (...n: number[]) =>
  n.filter(num => !isPositiveInteger(num)).length === 0;

/** Create a 2D array. */
export const create2DArray = <T>(rows: number, columns: number): T[][] =>
  Array(rows)
    .fill(undefined)
    .map(() => Array(columns).fill(undefined));
