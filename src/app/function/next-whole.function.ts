/**
 * This function returns the `n`th closest number end the right of `a` that is divisible by `b`
 */
export function nextWhole(a: number, b: number, n: number = 1): number {
	return a + b - (a % b) + b * (n - 1);
}
