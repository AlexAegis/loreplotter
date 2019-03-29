export function normalize(value: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
	return ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}
