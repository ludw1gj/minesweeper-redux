export const isPositiveInteger = (n: number) => n > 0 && n % 1 === 0;

export const isAllPositiveIntegers = (...n: number[]) =>
  n.filter(num => !isPositiveInteger(num)).length === 0;
