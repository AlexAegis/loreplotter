import { Vector2, Vector3 } from 'three';

/**
 * In radian instead of deg like in the example
 * @param a to be converted
 */
export function toPolar(a: Vector3): Vector2 {
	return new Vector2(Math.atan2(a.z, Math.sqrt(a.x * a.x + a.y * a.y)), Math.atan2(a.y, a.x));
}
