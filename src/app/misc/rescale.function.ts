export function rescale(value: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
	if (oldMax - oldMin + newMin === 0) {
		return 0;
	}
	const res = ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
	// console.log(`Normalizing: ${value} from: [${oldMin}, ${oldMax}] to:[${newMin}, ${newMax}] is: ${res}`);
	return res === NaN ? value : res;
}
