/**
 * Clamping function, restricts a number between two others
 *
 * @param value to be clamped
 * @param min lower boundary
 * @param max upper boundary
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
