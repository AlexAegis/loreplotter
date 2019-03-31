export function normalize(value: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
	const res = ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
	// console.log(`Normalizing: ${value} from: [${oldMin}, ${oldMax}] to:[${newMin}, ${newMax}] is: ${res}`);
	return res;
}
