import { Vector3 } from 'three';

/**
 * Normalizes a set of coordinates originated from the Window into [0, 1]
 *
 * @param x of the window
 * @param y .of the window
 * @returns normalized coordinates as a vector
 */
export function normalize(x: number, y: number): Vector3 {
	return new Vector3((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
}
