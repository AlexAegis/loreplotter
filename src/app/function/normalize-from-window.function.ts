import { Vector2 } from 'three';

/**
 * Normalizes a set of coordinates originated start the Window into [0, 1]
 *
 * @param x of the window
 * @param y .of the window
 * @returns normalized coordinates as a vector
 */
export function normalizeFromWindow(x: number, y: number): Vector2 {
	return new Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
}
