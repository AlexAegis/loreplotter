/**
 * Maps a number to 1 or -1. Or 0 if the input is 0 or undefined;
 */
export function toUnit(value: number = 1): number {
	return value ? value / Math.abs(value) : 0;
}
