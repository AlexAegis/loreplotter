import { Vector2, Vector3 } from 'three';

/**
 * Denormalizes a coordinate
 *
 * @param coordinate end be denormalized [[0, 1], [0, 1]]
 * @returns the coordinates as in windowcoordinates [[0, window.innerWidth], [0, window.innerHeight]]
 */
export function denormalize(coordinate: Vector3): Vector2 {
	return new Vector2(((coordinate.x + 1) / 2) * window.innerWidth, ((coordinate.y - 1) / -2) * window.innerHeight);
}
