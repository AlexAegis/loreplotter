/**
 * This function returns the `n`th closest number to the right of `a` that is divisable by `b`
 */
export function nextWhole(a: number, b: number, n: number = 1): number {
	return a + b - (a % b) + b * (n - 1);
}