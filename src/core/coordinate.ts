import { Coordinate } from './types'

/** Check if given coordinates are equal. */
export function areCoordinatesEqual(coordinateA: Coordinate, coordinateB: Coordinate): boolean {
  return coordinateA.y === coordinateB.y && coordinateA.x === coordinateB.x
}

/** Find the distance (the amount of steps) between two coordinates. */
export function findCoordinateDistance(coordinateA: Coordinate, coordinateB: Coordinate): number {
  const distanceX = Math.abs(coordinateB.x - coordinateA.x)
  const distanceY = Math.abs(coordinateB.y - coordinateA.y)
  const min = Math.min(distanceX, distanceY)
  const max = Math.max(distanceX, distanceY)
  const diagonalSteps = min
  const straightSteps = max - min
  return Math.sqrt(2) * diagonalSteps + straightSteps
}
