/** Check if number is a non negative whole number. */
function isPositiveInteger(n: number): boolean {
  return n >= 0 && n % 1 === 0;
}

/** Check if numbers are non negative whole numbers. */
export function arePositiveIntegers(...n: number[]): boolean {
  return n.find(num => !isPositiveInteger(num)) === undefined;
}

/** Create a 2D array. */
export function create2DArray<T>(rows: number, columns: number): T[][] {
  return Array(rows)
    .fill(undefined)
    .map(() => Array(columns).fill(undefined));
}
