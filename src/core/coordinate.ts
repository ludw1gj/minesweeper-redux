import { Coordinate } from "./core-types"
import { DIRECTIONS } from "./directions"
import { IllegalParameterError } from "./errors"
import { RAND_NUM_GEN } from "./random"
import { arePositiveIntegers } from "./util"


/** Create a coordinate. */
export function createCoordinate(x: number, y: number): Coordinate {
  if (!arePositiveIntegers(x, y)) {
    throw new IllegalParameterError(`x and y must be positive whole numbers, x: ${x} y: ${y}`)
  }
  return { x, y }
}

/** Change the coordinate by the given x and y values. This method may throw an error. */
export function changeCoordinateBy(coor: Coordinate, xChange: number, yChange: number): Coordinate {
  return createCoordinate(coor.x + xChange, coor.y + yChange)
}

/** Create a random co-ordinate within the given height and width. */
export function generateRandomCoordinate(height: number, width: number): Coordinate {
  return createCoordinate(
    Math.floor(RAND_NUM_GEN.generate() * width),
    Math.floor(RAND_NUM_GEN.generate() * height),
  )
}

/** Find the distance (the amount of steps) between two coordinates. */
export function findDistance(coorA: Coordinate, coorB: Coordinate): number {
  const dx = Math.abs(coorB.x - coorA.x)
  const dy = Math.abs(coorB.y - coorA.y)

  const min = Math.min(dx, dy)
  const max = Math.max(dx, dy)

  const diagonalSteps = min
  const straightSteps = max - min
  return Math.sqrt(2) * diagonalSteps + straightSteps
}

/** Check if coordinate is valid in a grid of the given width and height. */
export function isValidCoordinate(coor: Coordinate, height: number, width: number): boolean {
  return coor.y >= 0 && coor.x >= 0 && coor.y < height && coor.x < width
}

/** Check if given coordinates are equal. */
export function coordinatesAreEqual(coorA: Coordinate, coorB: Coordinate): boolean {
  return coorA.y === coorB.y && coorA.x === coorB.x
}

/** Check if given array contains given coordinate. */
export function hasCoordinate(coorArr: Coordinate[], coor: Coordinate): boolean {
  return coorArr.find(val => coordinatesAreEqual(val, coor)) !== undefined
}

/** Count the amount of adjacent mines. */
export function countAdjacents(
  mineCoors: Coordinate[],
  atCoordinate: Coordinate,
): number {
  const minesAmt = DIRECTIONS.filter(dir => {
    const xCor = atCoordinate.x + dir.x
    const yCor = atCoordinate.y + dir.y
    if (xCor < 0 || yCor < 0) {
      return false
    }
    const directionCor = createCoordinate(xCor, yCor)
    return hasCoordinate(mineCoors, directionCor)
  }).length
  return minesAmt
}