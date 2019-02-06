import { Vector3 } from 'three';

/**
 * Denormalizes a coordinate
 *
 * @param coordinate to be denormalized
 * @returns the coordinates as in windowcoordinates
 */
export function denormalize(coordinate: Vector3): Vector3 {
	return new Vector3(((coordinate.x + 1) / 2) * window.innerWidth, ((coordinate.y - 1) / -2) * window.innerHeight);
}
