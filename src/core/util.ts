/** Check if number is a non negative whole number. */
const isPositiveInteger = (n: number): boolean => n >= 0 && n % 1 === 0;

/** Check if numbers are non negative whole numbers. */
export const arePositiveIntegers = (...n: number[]): boolean =>
  n.find(num => !isPositiveInteger(num)) === undefined;

/** Create a 2D array. */
export const create2DArray = <T>(rows: number, columns: number): T[][] =>
  Array(rows)
    .fill(undefined)
    .map(() => Array(columns).fill(undefined));
