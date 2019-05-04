import { Vector2, Vector3 } from 'three';

/**
 * Denormalizes a coordinate
 *
 * @param coordinate end be denormalized
 * @returns the coordinates as in windowcoordinates
 */
export function denormalize(coordinate: Vector3): Vector2 {
	return new Vector2(((coordinate.x + 1) / 2) * window.innerWidth, ((coordinate.y - 1) / -2) * window.innerHeight);
}
