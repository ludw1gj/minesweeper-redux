/** Create a coordinate. */
import { ICoordinate } from "./core-types"
import { IllegalParameterError } from "./errors"
import { RAND_NUM_GEN } from "./random"
import { arePositiveIntegers } from "./util"


export function createCoordinate(x: number, y: number): ICoordinate {
  if (!arePositiveIntegers(x, y)) {
    throw new IllegalParameterError(`x and y must be positive whole numbers, x: ${x} y: ${y}`)
  }
  return { x, y }
}

/** Change the coordinate by the given x and y values. This method may throw an error. */
export function changeCoordinateBy(coor: ICoordinate, xChange: number, yChange: number): ICoordinate {
  return createCoordinate(coor.x + xChange, coor.y + yChange)
}

/** Create a random co-ordinate within the given height and width. */
export function generateRandomCoordinate(height: number, width: number): ICoordinate {
  return createCoordinate(
    Math.floor(RAND_NUM_GEN.generate() * width),
    Math.floor(RAND_NUM_GEN.generate() * height),
  )
}

/** Find the distance (the amount of steps) between two coordinates. */
export function findDistance(coorA: ICoordinate, coorB: ICoordinate): number {
  const dx = Math.abs(coorB.x - coorA.x)
  const dy = Math.abs(coorB.y - coorA.y)

  const min = Math.min(dx, dy)
  const max = Math.max(dx, dy)

  const diagonalSteps = min
  const straightSteps = max - min
  return Math.sqrt(2) * diagonalSteps + straightSteps
}

/** Check if coordinate is valid in a grid of the given width and height. */
export function isValidCoordinate(coor: ICoordinate, height: number, width: number): boolean {
  return coor.y >= 0 && coor.x >= 0 && coor.y < height && coor.x < width
}

/** Check if given coordinates are equal. */
export function coordinatesAreEqual(coorA: ICoordinate, coorB: ICoordinate): boolean {
  return coorA.y === coorB.y && coorA.x === coorB.x
}

/** Check if given array contains given coordinate. */
export function hasCoordinate(coorArr: ICoordinate[], coor: ICoordinate): boolean {
  return coorArr.find(val => coordinatesAreEqual(val, coor)) !== undefined
}
